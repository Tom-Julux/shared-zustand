import type { StoreApi, PartialState, State } from "zustand";

declare global {
    interface globalThis {
        __SHARED_ZUSTAND_USED_CHANNELS__: Set<string>;
    }
}

export function isSupported() {
    return "BroadcastChannel" in globalThis;
}

export function share<T extends State, K extends keyof T>(
    key: K,
    api: StoreApi<T>,
    { ref = "shared-", initialize = false } = {}
): [() => void, () => void] {
    const channelName = ref + "-" + key.toString();
    if (process.env.NODE_ENV != "production") {
        if (!globalThis.__SHARED_ZUSTAND_USED_CHANNELS__) {
            globalThis.__SHARED_ZUSTAND_USED_CHANNELS__ = new Set();
        }
        if (globalThis.__SHARED_ZUSTAND_USED_CHANNELS__.has(channelName)) {
            console.warn(
                `Two shared properties are using the channel "${channelName}". If you want to reuse a channel name make shure to free the channel by calling unshare() first.`
            );
            return;
        }
        globalThis.__SHARED_ZUSTAND_USED_CHANNELS__.add(channelName);
    }

    let channel = new BroadcastChannel(channelName);
    let externalUpdate = false;
    let timestamp = 0;

    let cleanup = api.subscribe(
        (state) => state[key],
        (state) => {
            if (!externalUpdate) {
                timestamp = Date.now();
                channel.postMessage({ timestamp, state });
            }
            externalUpdate = false;
        }
    );
    channel.onmessage = (evt) => {
        if (evt.data === undefined) {
            channel.postMessage({ timestamp: timestamp, state: api.getState()[key] });
            return;
        }
        if (evt.data.timestamp <= timestamp) {
            return;
        }
        externalUpdate = true;
        timestamp = evt.data.timestamp;
        api.setState({ [key]: evt.data.state } as PartialState<T>);
    };

    const sync = () => channel.postMessage(undefined);
    const unshare = () => {
        channel.close();
        cleanup();
        if (process.env.NODE_ENV != "production") {
            globalThis.__SHARED_ZUSTAND_USED_CHANNELS__.delete(channelName);
        }
    };

    // fetches any available state
    if (initialize) {
        sync();
    }
    return [sync, unshare];
}
