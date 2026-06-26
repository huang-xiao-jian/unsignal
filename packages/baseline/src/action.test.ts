import { describe, expect, it, vi } from 'vitest';

import { action, effect, signal } from './index';

describe('action()', () => {
  it('should batch multiple signal writes into a single effect flush', () => {
    const primary = signal(0);
    const secondary = signal(0);
    const spy = vi.fn(() => {
      primary.value;
      secondary.value;
    });

    effect(spy);
    spy.mockClear();

    const incrementBoth = action(() => {
      primary.value += 1;
      secondary.value += 1;
    });

    incrementBoth();

    expect(spy).toHaveBeenCalledOnce();
    expect(primary.value).to.equal(1);
    expect(secondary.value).to.equal(1);
  });

  it('should preserve this binding for wrapped methods', () => {
    const counter = {
      count: signal(0),
      increment: action(function (this: { count: { value: number } }) {
        this.count.value += 1;
      }),
    };

    counter.increment();

    expect(counter.count.value).to.equal(1);
  });

  it('should forward arguments to the wrapped callback', () => {
    const count = signal(0);
    const add = action((value: number) => {
      count.value += value;
    });

    add(5);

    expect(count.value).to.equal(5);
  });

  it('should return the wrapped callback result', async () => {
    const count = signal(0);
    const incrementAsync = action(async () => {
      count.value += 1;
      return count.value;
    });

    await expect(incrementAsync()).resolves.to.equal(1);
    expect(count.value).to.equal(1);
  });
});
