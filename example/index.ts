// TODO: change to zustand once react supports es modules
import create from "https://cdn.pika.dev/zustand@^2.2.2";

import { share } from "../src";

interface CountStore {
    count: number;
    complex: { count: number };
}

const [_, countApi] = create<CountStore>((set) => ({
    count: 0,
    complex: { count: 0 },
    inc: (i = 1) => set(({ count }) => ({ count: count + i })),
    dec: (i = 1) => set(({ count }) => ({ count: count - i })),
    incComplex: (i = 1) => set(({ complex: { count } }) => ({ complex: { count: count + i } })),
    decComplex: (i = 1) => set(({ complex: { count } }) => ({ complex: { count: count - i } })),
}));

// The generics are not needed, if zustand is imported locally.
share<CountStore, "count">("count", countApi);
share<CountStore, "complex">("complex", countApi);

countApi.subscribe(
    (count) => (document.body.innerText = count),
    (state) => state.count
);

countApi.subscribe(
    (complex) => console.log("complex count changed " + complex.count),
    (state) => state.complex
);

window.inc = countApi.getState().inc;
window.dec = countApi.getState().dec;
window.incComplex = countApi.getState().incComplex;
window.decComplex = countApi.getState().decComplex;

console.log(`Open the console in two tabs side by side and experiment what happens if you call:
    inc(i);
    dec(i);
    incComplex(i);
    decComplex(i);   
`);
