// TODO: change to zustand once react supports es modules
import { createStore } from "zustand";
import { subscribeWithSelector} from "zustand/middleware";

import { share } from "../src";

class ComplexCounter {
    constructor(
        public readonly count: number,
    ) {}

    public increment() {
        return new ComplexCounter(this.count + 1);
    }

    public toString() {
        return `Complex count: ${this.count}`
    }
}

interface CountStore {
    count: number;
    nested: { count: number };
    complexCount: ComplexCounter;
    inc: (i?: number) => void;
    dec: (i?: number) => void;
    incNested: (i?: number) => void;
    decNested: (i?: number) => void;
    incComplex: () => void;
}
const UseCount = createStore<CountStore>()(subscribeWithSelector((set) => ({
    count: 0,
    nested: { count: 0 },
    complexCount: new ComplexCounter(0),
    inc: (i = 1) => set(({ count }) => ({ count: count + i })),
    dec: (i = 1) => set(({ count }) => ({ count: count - i })),
    incNested: (i = 1) => set(({ nested: { count } }) => ({ nested: { count: count + i } })),
    decNested: (i = 1) => set(({ nested: { count } }) => ({ nested: { count: count - i } })),
    incComplex: () => set(({ complexCount }) => ({ complexCount: complexCount.increment() })),
})));

share("count", UseCount);
// The "nested" prop is synced on startup
share("nested", UseCount, { initialize: true });
share("complexCount", UseCount, {
    serialize: (value) => `${value.count}`,
    unserialize: (serialized) => new ComplexCounter(parseInt(serialized, 10)),
});

UseCount.subscribe(
    (count) => {
        (document.body.innerText = `Count: ${count.count}`);
    }
);

UseCount.subscribe(
    (count) => {
        console.log("Count: " + count.count);
        console.log("Nested count: " + count.nested.count);
        console.log(count.complexCount.toString());
    }
);
declare global {
    interface Window { 
        inc: CountStore["inc"];
        dec: CountStore["dec"];
        incNested: CountStore["incNested"];
        decNested: CountStore["incNested"];
        incComplex: CountStore["incComplex"];
    }
}
window.inc = UseCount.getState().inc;
window.dec = UseCount.getState().dec;
window.incNested = UseCount.getState().incNested;
window.decNested = UseCount.getState().decNested;
window.incComplex = UseCount.getState().incComplex;

console.log(`Open the console in two tabs side by side and experiment what happens if you call:
    inc(i);
    dec(i);
    incNested(i);
    decNested(i);
    incComplex();
`);
