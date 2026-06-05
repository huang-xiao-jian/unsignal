import { effect } from '@preact/signals-core';

import type { DisposerFn, SignalStore, StoreChangeCallback } from './types';

/**
 * A lite implementation of SignalStore.
 *
 * It only notifies subscribers when the signal value changes, not for signal snapshots.
 * It isolates the signal subscriptions from framework-level subscriptions.
 */
export class LiteSignalStore implements SignalStore<Symbol> {
  // the immutibility tracker
  private value: Symbol = Symbol();

  // the framework-level subscribers
  private subscribers = new Set<StoreChangeCallback>();

  // in memory disposers for signal subscriptions
  private disposers = new Set<DisposerFn>();

  // flag to mark the initial run or consequent run of the effect
  private initial = true;

  track(fn: () => void) {
    // reset initial flag
    this.initial = true;

    // release previous subscriptions
    this.disposers.forEach((dispose) => dispose());
    this.disposers.clear();

    this.disposers.add(
      effect(() => {
        // Tracking invocation: establishes signal subscriptions
        fn();

        if (this.initial) {
          this.initial = false;
        } else {
          // mutate the symbol value
          this.value = Symbol();
          // Effect invocation: run the subscribers for notification
          this.subscribers.forEach((cb) => cb());
        }
      })
    );
  }

  dispose() {
    this.disposers.forEach((dispose) => dispose());
    this.disposers.clear();
    this.subscribers.clear();
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
