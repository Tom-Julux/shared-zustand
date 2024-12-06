# sharedzustand

-   :octopus: **<1.5kB** cross-tab state sharing for [zustand](https://github.com/react-spring/zustand)
-   **solid reliability** in 1 writing and n reading tab-scenarios (with changing writing tab)
-   **Fire and forget** approach of always using the latest state. Perfect for single user systems

```sh
npm install shared-zustand
```

or

```sh
yarn add shared-zustand
```

## Usage (as of zustand version 4)

```js
import { createStore } from "zustand";
import { subscribeWithSelector} from "zustand/middleware";
import { share, isSupported } from "shared-zustand";

// Create any zustand store
const useStore = createStore(subscribeWithSelector((set) => ({ count: 1 })));

// progressive enhancement check.
if ("BroadcastChannel" in globalThis /* || isSupported() */) {
    // share the property "count" of the state with other tabs
    share("count", useStore);
}

// ...

// somewhere in an event handler
useStore.setState((count) => ({ count: count + 1 }));
```

Note that I was not able to figure out what the new type of the store is, so I removed the typing from the parameters to the `share` function. Feel free to make a PR if you do.

## Dealing the the deprecation warning in zustand version 3

In [new versions of zustand](https://github.com/pmndrs/zustand/pull/603) the old selector API is deprecated. Sadly this API is fundamental for this package, as it allows for syncing acros tabs to only occur when a synced property of the store changes.

Luckily [zustand ships with a new middleware](https://github.com/pmndrs/zustand#using-subscribe-with-selector) to restore the selector functionality.

```js
import { create } from "zustand/vanilla";
import { subscribeWithSelector } from 'zustand/middleware'
import { share, isSupported } from "shared-zustand";

const useStore = create(subscribeWithSelector((set) => ({ count: 1 })));
```

In the future, it may be reasonable to change the behavior of this package to not sync only some properties, but all properties of a given store. This however would, unfortunately, be fully not backward compatible and force users to restructure their data storage models.

## Original usage (as of zustand versions 1-2)

```js
import { create } from "zustand/vanilla";
import { share, isSupported } from "shared-zustand";

// Create any zustand store
const useStore = create((set) => ({ count: 1 }));

// progressive enhancement check.
if ("BroadcastChannel" in globalThis /* || isSupported() */) {
    // share the property "count" of the state with other tabs
    share("count", useStore);
}
```


## API

```js
share("count", useStore, {
    // if set to true this tab trys to immediately recover the shared state from another tab.
    initialize: true,
    /*
        Each shared property is shared over a specific channel with an name that has to be unique.
        By default the name of the property is used. So if you want to share properties from different
        stores with the same name, set this to something unique.
    */
    ref: "shared-store",
    /*
        BroadcastChannel uses structured cloning to communicate values.
        This works great for most JS value, not for complex objects (such as instances of classes) however.
        The serialize & unserialize functions allow you to define a serialized representation for a complex object
        and restore it later from the serialized value.
    */
    serialize: (value) => JSON.stringify(value),
    unserialize: (serialized) => JSON.parse(serialized),
});
```

## Limitations

- Only JSON-serilizable objects can be shared
