import { signal } from '@preact/signals-core';
import { describe, expect, it, vi } from 'vitest';
import { reaction } from './reaction.js';

describe('reaction', () => {
  it('should execute fn immediately on creation', () => {
    const fn = vi.fn();
    reaction(fn, () => {});
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should track signal dependencies in fn', () => {
    const count = signal(0);
    const values: number[] = [];

    reaction(
      () => {
        values.push(count.value);
      },
      () => {}
    );

    count.value = 1;
    expect(values).toEqual([0, 1]);
  });

  it('should NOT call callback on first execution', () => {
    const count = signal(0);
    const callback = vi.fn();

    reaction(() => {
      void count.value;
    }, callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should call callback when dependency changes', () => {
    const count = signal(0);
    const callback = vi.fn();

    reaction(() => {
      void count.value;
    }, callback);

    count.value = 1;
    expect(callback).toHaveBeenCalledTimes(1);

    count.value = 2;
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should NOT track dependencies read inside callback', () => {
    const tracked = signal(0);
    const untracked = signal(0);
    const callback = vi.fn();

    reaction(
      () => {
        void tracked.value;
      },
      () => {
        void untracked.value;
        callback();
      }
    );

    // Changing untracked signal should NOT trigger re-run
    untracked.value = 1;
    expect(callback).not.toHaveBeenCalled();

    // Changing tracked signal should trigger callback
    tracked.value = 1;
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should stop tracking after dispose is called', () => {
    const count = signal(0);
    const fn = vi.fn();
    const callback = vi.fn();

    const dispose = reaction(() => {
      void count.value;
      fn();
    }, callback);

    expect(fn).toHaveBeenCalledTimes(1);

    dispose();

    count.value = 1;
    // fn should NOT be called again after dispose
    expect(fn).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should be idempotent when dispose is called multiple times', () => {
    const count = signal(0);
    const dispose = reaction(
      () => {
        void count.value;
      },
      () => {}
    );

    expect(() => {
      dispose();
      dispose();
      dispose();
    }).not.toThrow();

    count.value = 1;
    // No errors, no unexpected behavior
  });

  describe('when fn throws on first execution', () => {
    it('should propagate the error thrown by fn', () => {
      const error = new Error('fn error');

      expect(() => {
        reaction(
          () => {
            throw error;
          },
          () => {}
        );
      }).toThrow('fn error');
    });

    it('should NOT call callback when fn throws on first execution', () => {
      const callback = vi.fn();

      try {
        reaction(() => {
          throw new Error('fn error');
        }, callback);
      } catch {
        // expected
      }

      expect(callback).not.toHaveBeenCalled();
    });

    it('should NOT re-execute fn when signal changes after first-execution error', () => {
      const count = signal(0);
      const fn = vi.fn(() => {
        void count.value;
        throw new Error('fn error');
      });

      try {
        reaction(fn, () => {});
      } catch {
        // expected
      }

      expect(fn).toHaveBeenCalledTimes(1);

      // Effect is internally disposed — signal change should NOT trigger re-run
      count.value = 1;
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
