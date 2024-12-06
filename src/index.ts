import { StoreApi, StoreMutators } from "zustand";
// NOTE: imports the typing for SubscribeWithSelector
import "zustand/middleware";

export function isSupported() {
    return "BroadcastChannel" in globalThis;
}

type SubscribeWithSelector<S> = StoreMutators<S, unknown>["zustand/subscribeWithSelector"];

interface EventData {
    timestamp: number;
    state: string;
}
interface Options<TValue> {
    ref: string;
    initialize: boolean;
    serialize: (value: TValue) => any;
    unserialize: (serialized: any) => TValue;
}
export function share<TState, K extends keyof TState>(
    key: K,
    api: SubscribeWithSelector<StoreApi<TState>>,
    {
        ref = "shared-",
        initialize = false,
        serialize = (v) => v,
        unserialize = (v) => v,
    }: Partial<Options<TState[K]>> = {}
): [() => void, () => void] {
    const channelName = ref + "-" + key.toString();

    let channel = new BroadcastChannel(channelName);
    let externalUpdate = false;
    let timestamp = 0;

    let cleanup = api.subscribe(
        (state) => state[key],
        (state) => {
            if (!externalUpdate) {
                timestamp = Date.now();
                channel.postMessage({ timestamp, state: serialize(state) });
            }
            externalUpdate = false;
        }
    );
    channel.onmessage = (evt: MessageEvent<EventData>) => {
        if (evt.data === undefined) {
            channel.postMessage({ timestamp: timestamp, state: serialize(api.getState()[key]) });
            return;
        }
        if (evt.data.timestamp <= timestamp) {
            return;
        }
        externalUpdate = true;
        timestamp = evt.data.timestamp;
        api.setState({ [key]: unserialize(evt.data.state) } as unknown as Partial<TState>);
    };

    const sync = () => channel.postMessage(undefined);
    const unshare = () => {
        channel.close();
        cleanup();
    };

    // fetches any available state
    if (initialize) {
        sync();
    }
    return [sync, unshare];
}
