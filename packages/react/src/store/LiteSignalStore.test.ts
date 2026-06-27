import { signal } from '@unsignal/baseline';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LiteSignalStore } from './LiteSignalStore';

describe('LiteSignalStore', () => {
  let store: LiteSignalStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new LiteSignalStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('track', () => {
    it('should execute fn immediately', () => {
      const fn = vi.fn();
      store.track(fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should track signal dependencies and notify subscriber on change', () => {
      const count = signal(0);
      const subscriber = vi.fn();

      store.track(() => {
        void count.value;
      });
      store.subscribe(subscriber);

      count.value = 1;
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should NOT notify subscriber on first execution', () => {
      const count = signal(0);
      const subscriber = vi.fn();

      store.subscribe(subscriber);
      store.track(() => {
        void count.value;
      });

      // First execution: no subscriber notification
      expect(subscriber).not.toHaveBeenCalled();
    });

    it('should dispose previous tracking when track is called again', () => {
      const oldSignal = signal(0);
      const newSignal = signal(0);
      const subscriber = vi.fn();

      store.track(() => {
        void oldSignal.value;
      });

      // Re-track with a new signal
      store.track(() => {
        void newSignal.value;
      });

      store.subscribe(subscriber);

      // Old signal change should NOT trigger notification
      oldSignal.value = 1;
      expect(subscriber).not.toHaveBeenCalled();

      // New signal change should trigger notification
      newSignal.value = 1;
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should update snapshot when dependency changes', () => {
      const count = signal(0);
      const snapshotBefore = store.getSnapshot();

      store.track(() => {
        void count.value;
      });

      count.value = 1;
      const snapshotAfter = store.getSnapshot();

      expect(snapshotBefore).not.toBe(snapshotAfter);
    });
  });

  describe('release', () => {
    it('should stop responding to dependency changes after release', () => {
      const count = signal(0);
      const subscriber = vi.fn();

      store.track(() => {
        void count.value;
      });
      store.subscribe(subscriber);

      // Schedule release
      store.release();

      // Flush the deferred disposal
      vi.runAllTimers();

      count.value = 1;
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should cancel pending release and keep tracking active', () => {
      const count = signal(0);
      const subscriber = vi.fn();

      store.track(() => {
        void count.value;
      });
      store.subscribe(subscriber);

      // Schedule release then immediately restore (simulates StrictMode)
      store.release();
      store.restore();

      // Flush any pending timers — restore should have cleared them
      vi.runAllTimers();

      count.value = 1;
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });
});
