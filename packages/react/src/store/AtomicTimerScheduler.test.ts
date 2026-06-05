import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AtomicTimerScheduler } from './AtomicTimerScheduler';

describe('AtomicTimerScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('schedule', () => {
    it('should execute callback after timeout expires', () => {
      const scheduler = new AtomicTimerScheduler(100);
      const fn = vi.fn();

      scheduler.schedule(fn);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should batch execute all callbacks registered within the same time window', () => {
      const scheduler = new AtomicTimerScheduler(100);
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const fn3 = vi.fn();

      scheduler.schedule(fn1);
      vi.advanceTimersByTime(30);
      scheduler.schedule(fn2);
      vi.advanceTimersByTime(30);
      scheduler.schedule(fn3);

      // 60ms elapsed, timer not yet fired
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).not.toHaveBeenCalled();

      vi.advanceTimersByTime(40); // 100ms total — timer fires
      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).toHaveBeenCalledOnce();
      expect(fn3).toHaveBeenCalledOnce();
    });

    it('should NOT reset timer when schedule is called in pending state', () => {
      const scheduler = new AtomicTimerScheduler(100);
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      scheduler.schedule(fn1);
      vi.advanceTimersByTime(80);
      scheduler.schedule(fn2); // should NOT restart timer

      vi.advanceTimersByTime(20); // 100ms total — timer fires
      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).toHaveBeenCalledOnce();
    });

    it('should allow new scheduling cycle after previous batch completes', () => {
      const scheduler = new AtomicTimerScheduler(100);
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      scheduler.schedule(fn1);
      vi.advanceTimersByTime(100);
      expect(fn1).toHaveBeenCalledOnce();

      // second cycle — scheduler is back to idle
      scheduler.schedule(fn2);
      vi.advanceTimersByTime(100);
      expect(fn2).toHaveBeenCalledOnce();
    });

    it('should continue executing remaining callbacks when one throws', () => {
      const scheduler = new AtomicTimerScheduler(100);
      const throwing = vi.fn(() => {
        throw new Error('boom');
      });
      const fn2 = vi.fn();

      scheduler.schedule(throwing);
      scheduler.schedule(fn2);

      vi.advanceTimersByTime(100);
      expect(throwing).toHaveBeenCalledOnce();
      expect(fn2).toHaveBeenCalledOnce();
    });
  });

  describe('cancel', () => {
    it('should discard all pending callbacks and clear timer', () => {
      const scheduler = new AtomicTimerScheduler(100);
      const fn = vi.fn();

      scheduler.schedule(fn);
      scheduler.cancel();

      vi.advanceTimersByTime(200);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should be no-op when called in idle state', () => {
      const scheduler = new AtomicTimerScheduler(100);

      // cancel on a fresh (idle) scheduler — should not throw
      expect(() => scheduler.cancel()).not.toThrow();
    });

    it('should allow scheduling again after cancel', () => {
      const scheduler = new AtomicTimerScheduler(100);
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      scheduler.schedule(fn1);
      scheduler.cancel();

      scheduler.schedule(fn2);
      vi.advanceTimersByTime(100);
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledOnce();
    });
  });

  describe('default timeout', () => {
    it('should use 0ms as default timeout', () => {
      const scheduler = new AtomicTimerScheduler();
      const fn = vi.fn();

      scheduler.schedule(fn);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(0);
      expect(fn).toHaveBeenCalledOnce();
    });
  });
});
