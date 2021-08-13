# sharedzustand

-   :octopus: **<500B** cross-tab state sharing for [zustand](https://github.com/react-spring/zustand)
-   **solid reliability** in for 1 writing and n reading tab-scenarios (with changing writing tab)
-   **Fire and forget** approach of always using the latest state. Perfect for single user systems

```sh
npm install shared-zustand
```

or

```sh
yarn add shared-zustand
```

## Usage

```js
import { create } from "zustand";
import { share, isSupported } from "shared-zustand";

// Create any zustand store
const useStore = create((set) => ({ count: 1 }));

// progressive enhancement check.
if ("BroadcastChannel" in window /* || isSupported() */) {
    // share the property "count" of the state with other tabs
    share("count", useStore);
}

// ...

// somewhere in an event handler
useStore.setState((count) => ({ count: count + 1 }));
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
});
```

## Limitations

- Only JSON-serilizable objects can be shared
