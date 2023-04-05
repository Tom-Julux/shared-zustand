export function isSupported() {
    return "BroadcastChannel" in globalThis;
}

export function share(
    key: string,
    api: any,
    { ref = "shared-", initialize = false } = {}
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
        api.setState({ [key]: evt.data.state });
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
