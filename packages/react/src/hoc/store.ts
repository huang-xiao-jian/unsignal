import { effect } from '@preact/signals-core';
import { useId } from 'react';

export type StoreChangeCallback = () => void;

export interface SignalStore<Snapshot> {
  subscribe: (onStoreChange: StoreChangeCallback) => () => void;
  getSnapshot: () => Snapshot;
  getServerSnapshot?: () => Snapshot;
}

export type DisposerFn = () => void;

/**
 * A lite implementation of SignalStore.
 *
 * It only notifies subscribers when the signal value changes, not for signal snapshots.
 * It isolates the signal subscriptions from framework-level subscriptions.
 */
class LiteSignalStore implements SignalStore<Symbol> {
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

const LITE_SIGNAL_STORES = new Map<string, LiteSignalStore>();

/**
 * Instantiates a lite signal store with memory cache.
 */
export function useLiteSignalStore(): LiteSignalStore {
  // the component level unique and stable id
  const id = useId();

  if (!LITE_SIGNAL_STORES.has(id)) {
    LITE_SIGNAL_STORES.set(id, new LiteSignalStore());
  }

  return LITE_SIGNAL_STORES.get(id)!;
}
