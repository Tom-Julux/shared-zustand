// TODO: change to zustand once react supports es modules
import create from "zustand/vanilla";

import { share } from "../src";

interface CountStore {
    count: number;
    complex: { count: number };
}

interface CountStoreAPI {
    inc: (i: number) => void;
    dec: (i: number) => void;
    incComplex: (i: number) => void;
    decComplex: (i: number) => void;
}

const UseCount = create<CountStore & CountStoreAPI>((set) => ({
    count: 0,
    complex: { count: 0 },
    inc: (i = 1) => set(({ count }) => ({ count: count + i })),
    dec: (i = 1) => set(({ count }) => ({ count: count - i })),
    incComplex: (i = 1) => set(({ complex: { count } }) => ({ complex: { count: count + i } })),
    decComplex: (i = 1) => set(({ complex: { count } }) => ({ complex: { count: count - i } })),
}));

// The generics are not needed, if zustand is imported locally.
share<CountStore & CountStoreAPI, "count">("count", UseCount);
// The "complex" prop is synced on startup
share<CountStore & CountStoreAPI, "complex">("complex", UseCount, { initialize: true });

UseCount.subscribe(
    (count) => (document.body.innerText = count as string),
    (state) => state.count
);

UseCount.subscribe(
    (complex: CountStore): void => console.log("complex count = " + complex.count),
    (state): any => state.complex
);

window.inc = UseCount.getState().inc;
window.dec = UseCount.getState().dec;
window.incComplex = UseCount.getState().incComplex;
window.decComplex = UseCount.getState().decComplex;

console.log(`Open the console in two tabs side by side and experiment what happens if you call:
    inc(i);
    dec(i);
    incComplex(i);
    decComplex(i);   
`);
