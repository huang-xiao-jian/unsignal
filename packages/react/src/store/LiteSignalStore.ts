import { reaction } from '@unsignal/core';

import { AtomicTimerScheduler } from './AtomicTimerScheduler';
import type { DisposerFn, SignalStore, StoreChangeCallback } from './types';

/**
 * A lite implementation of SignalStore.
 *
 * It only notifies subscribers when the signal value changes, not for signal snapshots.
 * It isolates signal tracking effects from framework-level subscriptions.
 *
 * Lifecycle responsibilities:
 * - `track(fn)` is called during React render to establish signal dependencies.
 *   It disposes previous tracking effects but NEVER touches subscribers —
 *   subscriber lifecycle is managed exclusively by subscribe/unsubscribe.
 * - `release()` schedules deferred disposal of tracking effects via the deferrer.
 * - `restore()` cancels a pending deferred disposal (e.g. for React StrictMode remounts).
 */
export class LiteSignalStore implements SignalStore<Symbol> {
  private value: Symbol = Symbol();
  private subscribers = new Set<StoreChangeCallback>();
  private disposers = new Set<DisposerFn>();
  private deferrer = new AtomicTimerScheduler();

  /**
   * Tracks signal dependencies accessed inside `fn`.
   *
   * Disposes previous tracking effects immediately before creating a new one.
   * Does NOT modify subscribers — subscriber lifecycle is independent.
   */
  track(fn: () => void): void {
    this.disposers.forEach((dispose) => dispose());
    this.disposers.clear();

    const dispose = reaction(fn, () => {
      this.value = Symbol();
      this.subscribers.forEach((cb) => cb());
    });

    this.disposers.add(dispose);
  }

  /**
   * Schedules deferred disposal of all signal tracking effects.
   */
  release(): void {
    this.deferrer.schedule(() => {
      this.disposers.forEach((dispose) => dispose());
      this.disposers.clear();
    });
  }

  /**
   * Cancels a pending deferred disposal scheduled by `release()`.
   *
   * If no disposal is pending, this is a no-op.
   * Typically called during React StrictMode's simulated remount to
   * restore the store's tracking effects before they are torn down.
   */
  restore(): void {
    this.deferrer.cancel();
  }

  subscribe = (onStoreChange: StoreChangeCallback) => {
    this.subscribers.add(onStoreChange);

    return () => {
      this.subscribers.delete(onStoreChange);
    };
  };

  getSnapshot = () => {
    return this.value;
  };

  getServerSnapshot = () => {
    return this.value;
  };
}
