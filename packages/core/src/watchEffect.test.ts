import { signal } from '@unsignal/baseline';
import { describe, expect, it, vi } from 'vitest';
import { watchEffect } from './watchEffect';

describe('watchEffect', () => {
  it('should execute fn immediately on creation', () => {
    const fn = vi.fn();
    watchEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should track signal dependencies and re-run on change', () => {
    const count = signal(0);
    const values: number[] = [];

    watchEffect(() => {
      values.push(count.value);
    });

    expect(values).toEqual([0]);

    count.value = 1;
    expect(values).toEqual([0, 1]);

    count.value = 2;
    expect(values).toEqual([0, 1, 2]);
  });

  it('should stop tracking after dispose', () => {
    const count = signal(0);
    const fn = vi.fn(() => void count.value);

    const disposable = watchEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    disposable.dispose();

    count.value = 1;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should be idempotent when dispose is called multiple times', () => {
    const disposable = watchEffect(() => {});

    expect(() => {
      disposable.dispose();
      disposable.dispose();
      disposable.dispose();
    }).not.toThrow();
  });

  describe('onCleanup', () => {
    it('should receive onCleanup as first argument', () => {
      watchEffect((onCleanup) => {
        expect(typeof onCleanup).toBe('function');
      });
    });

    it('should call cleanup before fn re-runs', () => {
      const count = signal(0);
      const calls: string[] = [];

      watchEffect((onCleanup) => {
        calls.push(`run:${count.value}`);
        onCleanup(() => calls.push('cleanup'));
      });

      expect(calls).toEqual(['run:0']);

      count.value = 1;
      expect(calls).toEqual(['run:0', 'cleanup', 'run:1']);

      count.value = 2;
      expect(calls).toEqual(['run:0', 'cleanup', 'run:1', 'cleanup', 'run:2']);
    });

    it('should call cleanup on dispose', () => {
      const count = signal(0);
      const cleanup = vi.fn();

      const disposable = watchEffect((onCleanup) => {
        void count.value;
        onCleanup(cleanup);
      });

      expect(cleanup).not.toHaveBeenCalled();

      disposable.dispose();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should replace previous cleanup on each run', () => {
      const count = signal(0);
      const cleanups: string[] = [];

      watchEffect((onCleanup) => {
        const id = count.value;
        onCleanup(() => cleanups.push(`cleanup:${id}`));
      });

      count.value = 1;
      // Only the cleanup from run 0 should have been called
      expect(cleanups).toEqual(['cleanup:0']);

      count.value = 2;
      // Cleanup from run 1 called, then cleanup from run 0 already done
      expect(cleanups).toEqual(['cleanup:0', 'cleanup:1']);
    });

    it('should call all registered cleanups on dispose', () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();

      const disposable = watchEffect((onCleanup) => {
        onCleanup(cleanup1);
        onCleanup(cleanup2);
      });

      disposable.dispose();
      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
    });
  });
});
