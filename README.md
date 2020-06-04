# sharedzustand

-   :octopus: **<500B** cross-tab state sharing for [zustand](https://github.com/react-spring/zustand)

```sh
npm install sharedzustand
```

or

```sh
yarn add sharedzustand
```

## Usage

```js
import { create } from "zustand";
import { share, isSupported } from "sharedzustand";

// Create any zustand store
const [useStore, Store] = create((set) => ({ count: 1 }));

// progressive enhancement check.
if ("BroadcastChannel" in window /* || isSupported() */) {
    // share the property "count" of the state with other tabs
    share("count", Store);
}

// ...

// somewhere in an event handler
Store.setState((count) => ({ count: count + 1 }));
```

## Api

```js
share("count", Store, {
    // if set to true this tab trys to immediately recover the shared state from another tab.
    initialize: true,
    /*
        Each shared property is shared over a specific channel with an name that has to be unique.
        By default the name of the property is used. So if you want to share properties from different stores with the same name set this to something unique.
    */
    ref: "shared-store",
});
```

## Limitations

Only JSON-Serilizable Objects can be shared.
