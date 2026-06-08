import { computed, signal } from '@preact/signals-core';
import { describe, expect, it, vi } from 'vitest';
import { watch } from './watch.js';

describe('watch', () => {
  describe('lazy execution', () => {
    it('should NOT call callback on creation', () => {
      const count = signal(0);
      const callback = vi.fn();

      watch(() => count.value, callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should call callback when source changes', () => {
      const count = signal(0);
      const callback = vi.fn();

      watch(() => count.value, callback);

      count.value = 1;
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function));
    });

    it('should pass oldValue and value correctly across multiple changes', () => {
      const count = signal(0);
      const calls: Array<[number, number]> = [];

      watch(
        () => count.value,
        (value, oldValue) => {
          calls.push([oldValue, value]);
        }
      );

      count.value = 1;
      count.value = 2;
      expect(calls).toEqual([
        [0, 1],
        [1, 2],
      ]);
    });
  });

  describe('source types', () => {
    it('should support ReadonlySignal as source', () => {
      const count = signal(0);
      const doubled = computed(() => count.value * 2);
      const calls: Array<[number, number]> = [];

      watch(doubled, (value, oldValue) => {
        calls.push([oldValue, value]);
      });

      count.value = 1;
      expect(calls).toEqual([[0, 2]]);

      count.value = 2;
      expect(calls).toEqual([
        [0, 2],
        [2, 4],
      ]);
    });

    it('should support getter function as source', () => {
      const a = signal(1);
      const b = signal(2);
      const calls: Array<[number, number]> = [];

      watch(
        () => a.value + b.value,
        (value, oldValue) => {
          calls.push([oldValue, value]);
        }
      );

      a.value = 10;
      expect(calls).toEqual([[3, 12]]);
    });
  });

  describe('change detection', () => {
    it('should use Object.is for change detection', () => {
      const obj = { x: 1 };
      const source = signal(obj);
      const callback = vi.fn();

      watch(() => source.value, callback);

      // Same reference - no change
      source.value = obj;
      expect(callback).not.toHaveBeenCalled();

      // Different reference - change detected
      const newObj = { x: 2 };
      source.value = newObj;
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should NOT fire callback when getter returns same value', () => {
      const count = signal(0);
      const callback = vi.fn();

      watch(() => Math.floor(count.value / 10), callback);

      count.value = 1; // Math.floor(1/10) === Math.floor(0/10) === 0
      expect(callback).not.toHaveBeenCalled();

      count.value = 10; // Math.floor(10/10) === 1, changed
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispose', () => {
    it('should stop tracking after dispose', () => {
      const count = signal(0);
      const callback = vi.fn();

      const dispose = watch(() => count.value, callback);

      count.value = 1;
      expect(callback).toHaveBeenCalledTimes(1);

      dispose();

      count.value = 2;
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should be idempotent when dispose is called multiple times', () => {
      const count = signal(0);
      const dispose = watch(
        () => count.value,
        () => {}
      );

      expect(() => {
        dispose();
        dispose();
        dispose();
      }).not.toThrow();
    });
  });

  describe('onCleanup', () => {
    it('should pass onCleanup as third argument', () => {
      const count = signal(0);

      watch(
        () => count.value,
        (_value, _oldValue, onCleanup) => {
          expect(typeof onCleanup).toBe('function');
        }
      );

      count.value = 1;
    });

    it('should call cleanup before callback re-runs', () => {
      const count = signal(0);
      const calls: string[] = [];

      watch(
        () => count.value,
        (value, _oldValue, onCleanup) => {
          calls.push(`callback:${value}`);
          onCleanup(() => calls.push('cleanup'));
        }
      );

      count.value = 1;
      expect(calls).toEqual(['callback:1']);

      count.value = 2;
      expect(calls).toEqual(['callback:1', 'cleanup', 'callback:2']);
    });

    it('should call cleanup on dispose', () => {
      const count = signal(0);
      const cleanup = vi.fn();

      const dispose = watch(
        () => count.value,
        (_value, _oldValue, onCleanup) => {
          onCleanup(cleanup);
        }
      );

      count.value = 1;
      expect(cleanup).not.toHaveBeenCalled();

      dispose();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe('immediate option', () => {
    it('should call callback immediately with current value and undefined oldValue', () => {
      const count = signal(5);
      const callback = vi.fn();

      watch(() => count.value, callback, { immediate: true });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(5, undefined, expect.any(Function));
    });

    it('should continue to track changes after immediate call', () => {
      const count = signal(0);
      const calls: Array<[number | undefined, number]> = [];

      watch(
        () => count.value,
        (value, oldValue) => {
          calls.push([oldValue, value]);
        },
        { immediate: true }
      );

      expect(calls).toEqual([[undefined, 0]]);

      count.value = 1;
      expect(calls).toEqual([
        [undefined, 0],
        [0, 1],
      ]);
    });

    it('should call cleanup on dispose when using immediate', () => {
      const count = signal(0);
      const cleanup = vi.fn();

      const dispose = watch(
        () => count.value,
        (_value, _oldValue, onCleanup) => {
          onCleanup(cleanup);
        },
        { immediate: true }
      );

      expect(cleanup).not.toHaveBeenCalled();

      dispose();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });
});
