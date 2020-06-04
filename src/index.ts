import { StoreApi, PartialState } from "zustand";

declare global {
    interface Window {
        __SHARED_ZUSTAND_USED_CHANNELS__: Set<string>;
    }
}

export function isSupported() {
    return "BroadcastChannel" in window;
}

export function share<T, K extends keyof T>(
    key: K,
    api: StoreApi<T>,
    { ref = "shared-", initialize = false } = {}
): [() => void, () => void] {
    const channelName = ref + "-" + key.toString();
    if (process.env.NODE_ENV != "production") {
        if (!window.__SHARED_ZUSTAND_USED_CHANNELS__) {
            window.__SHARED_ZUSTAND_USED_CHANNELS__ = new Set();
        }
        if (window.__SHARED_ZUSTAND_USED_CHANNELS__.has(channelName)) {
            console.warn(
                `Two shared properties are using the channel "${channelName}". If you want to reuse a channel name make shure to free the channel by calling unshare() first.`
            );
            return;
        }
        window.__SHARED_ZUSTAND_USED_CHANNELS__.add(channelName);
    }

    let channel = new BroadcastChannel(channelName);
    let externalUpdate = false;
    let timestamp = 0;

    let cleanup = api.subscribe(
        (state) => {
            if (!externalUpdate) {
                timestamp = Date.now();
                channel.postMessage({ timestamp, state });
            }
            externalUpdate = false;
        },
        (state) => state[key]
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
            window.__SHARED_ZUSTAND_USED_CHANNELS__.delete(channelName);
        }
    };

    // fetches any available state
    if (initialize) {
        sync();
    }
    return [sync, unshare];
}
