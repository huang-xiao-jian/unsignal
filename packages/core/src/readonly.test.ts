import {
  computed,
  createModel,
  signal,
  type ReadonlySignal,
  type Signal,
} from '@preact/signals-core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { createReadonlyModel, readonly, type ReadonlyModel } from './index.js';

describe('readonly', () => {
  it('should mirror updates from a writable signal', () => {
    const count = signal(0);

    const view = readonly(count);

    expect(view.value).toBe(0);

    count.value = 1;
    expect(view.value).toBe(1);
  });

  it('should return the same instance for an existing readonly signal', () => {
    const count = signal(2);
    const doubled = computed(() => count.value * 2);

    const view = readonly(doubled);

    expect(view).not.toBe(doubled);
    expect(view.value).toBe(4);
  });

  it('should expose a readonly signal type for writable sources', () => {
    const count = signal(0);

    const view = readonly(count);

    expectTypeOf(view).toEqualTypeOf<ReadonlySignal<number>>();
  });
});

describe('createReadonlyModel', () => {
  it('should preserve model behavior while exposing readonly types', () => {
    const CounterModel = createReadonlyModel((initial = 0) => {
      const count = signal(initial);
      const doubled = computed(() => count.value * 2);

      return {
        count,
        doubled,
        increment() {
          count.value += 1;
        },
        reset() {
          count.value = initial;
        },
      };
    });

    const counter = new CounterModel(5);

    expect(counter.count.value).toBe(5);
    expect(counter.doubled.value).toBe(10);

    counter.increment();
    expect(counter.count.value).toBe(6);
    expect(counter.doubled.value).toBe(12);

    counter.reset();
    expect(counter.count.value).toBe(5);
  });

  it('should preserve readonly signal instances already returned by the model', () => {
    const CounterModel = createReadonlyModel(() => {
      const count = signal(1);
      const doubled = computed(() => count.value * 2);

      return {
        count,
        doubled,
      };
    });

    const counter = new CounterModel();

    expect(counter.doubled.value).toBe(2);
  });

  it('should preserve nested runtime objects', () => {
    const CounterModel = createReadonlyModel(() => {
      const count = signal(1);

      return {
        nested: {
          count,
        },
        increment() {
          count.value += 1;
        },
      };
    });

    const counter = new CounterModel();

    expect(counter.nested.count).toBeTypeOf('object');
    expect(counter.nested.count.value).toBe(1);

    counter.increment();
    expect(counter.nested.count.value).toBe(2);
  });

  it('should preserve the model dispose contract', () => {
    const CounterModel = createReadonlyModel(() => {
      const count = signal(0);

      return {
        count,
        increment() {
          count.value += 1;
        },
      };
    });

    const counter = new CounterModel();

    expect(typeof counter[Symbol.dispose]).toBe('function');
  });

  it('should produce the readonly model type recursively', () => {
    const CounterModel = createReadonlyModel(() => {
      const count = signal(0);
      const doubled = computed(() => count.value * 2);

      return {
        count,
        doubled,
        nested: {
          count,
        },
        increment() {
          count.value += 1;
        },
      };
    });

    const counter = new CounterModel();

    expectTypeOf(counter).toMatchTypeOf<
      ReadonlyModel<{
        count: Signal<number>;
        doubled: ReadonlySignal<number>;
        nested: {
          count: Signal<number>;
        };
        increment: () => void;
      }>
    >();
    expectTypeOf(counter.count).toMatchTypeOf<ReadonlySignal<number>>();
    expectTypeOf(counter.nested.count).toMatchTypeOf<ReadonlySignal<number>>();
  });

  it('should remain compatible with createModel factories', () => {
    const factory = (initial = 0) => {
      const count = signal(initial);

      return {
        count,
        increment() {
          count.value += 1;
        },
      };
    };

    const WritableCounterModel = createModel(factory);
    const ReadonlyCounterModel = createReadonlyModel(factory);

    const writableCounter = new WritableCounterModel(1);
    const readonlyCounter = new ReadonlyCounterModel(1);

    writableCounter.increment();
    readonlyCounter.increment();

    expect(writableCounter.count.value).toBe(2);
    expect(readonlyCounter.count.value).toBe(2);
  });

  it('should preserve writable this access inside model methods', () => {
    const CounterModel = createReadonlyModel(() => {
      const count = signal(1);

      return {
        count,
        increment() {
          this.count.value += 1;
        },
      };
    });

    const counter = new CounterModel();

    counter.increment();
    expect(counter.count.value).toBe(2);
  });

  it('should return the original runtime signals rather than wrapping them', () => {
    const count = signal(1);
    const CounterModel = createReadonlyModel(() => ({
      count,
    }));

    const counter = new CounterModel();

    expect(counter.count).toBe(count);
    expect(counter.count.value).toBe(1);
  });
});
