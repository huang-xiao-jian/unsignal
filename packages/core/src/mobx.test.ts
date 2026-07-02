import { effect } from '@unsignal/baseline';
import { action, computed, observable } from '@unsignal/core/mobx';
import { describe, expect, it, vi } from 'vitest';

describe('mobx decorator flavor', () => {
  it('should expose decorators from the mobx subpath', () => {
    expect(observable).toBeTypeOf('function');
    expect(computed).toBeTypeOf('function');
    expect(action).toBeTypeOf('function');
    expect(action.bound).toBeTypeOf('function');
  });

  it('should expose observable accessors as plain reactive values', () => {
    class Counter {
      @observable accessor count = 0;
    }

    const first = new Counter();
    const second = new Counter();
    const spy = vi.fn();
    const disposable = effect(() => {
      spy(first.count);
    });

    expect(first.count).toBe(0);
    expect(first.count).not.toHaveProperty('value');
    expect(second.count).toBe(0);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(0);

    first.count = 1;

    expect(first.count).toBe(1);
    expect(second.count).toBe(0);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(1);

    disposable.dispose();
  });

  it('should expose computed getters as plain per-instance derived values', () => {
    class Counter {
      @observable accessor count = 1;

      @computed
      get doubled() {
        return this.count * 2;
      }
    }

    const first = new Counter();
    const second = new Counter();

    expect(first.doubled).toBe(2);
    expect(first.doubled).not.toHaveProperty('value');

    first.count = 3;
    second.count = 5;

    expect(first.doubled).toBe(6);
    expect(second.doubled).toBe(10);
  });

  it('should run action methods with receiver, arguments, return value, and batching', () => {
    class Counter {
      @observable accessor count = 0;

      @action
      incrementBy(first: number, second: number) {
        this.count += first;
        this.count += second;
        return this.count;
      }
    }

    const counter = new Counter();
    const spy = vi.fn();
    const disposable = effect(() => {
      spy(counter.count);
    });

    const result = counter.incrementBy(1, 2);

    expect(result).toBe(3);
    expect(counter.count).toBe(3);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(3);

    disposable.dispose();
  });

  it('should bind action.bound methods to their instance and batch writes', () => {
    class Counter {
      @observable accessor count = 0;

      @action.bound
      incrementTwice(step: number) {
        this.count += step;
        this.count += step;
        return this.count;
      }
    }

    const counter = new Counter();
    const spy = vi.fn();
    const disposable = effect(() => {
      spy(counter.count);
    });
    const incrementTwice = counter.incrementTwice;

    const result = incrementTwice(2);

    expect(result).toBe(4);
    expect(counter.count).toBe(4);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(4);

    disposable.dispose();
  });
});
