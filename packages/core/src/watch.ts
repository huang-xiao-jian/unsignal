import { type ReadonlySignal, untracked } from '@preact/signals-core';
import type { DisposerFn } from './reaction.js';
import { type OnCleanup, watchEffect } from './watchEffect.js';

export type WatchCallback<T> = (value: T, oldValue: T, onCleanup: OnCleanup) => void;

export interface WatchOptions {
  immediate?: boolean;
}

export function watch<T>(
  source: ReadonlySignal<T>,
  callback: WatchCallback<T>,
  options?: WatchOptions
): DisposerFn;
export function watch<T>(
  source: () => T,
  callback: WatchCallback<T>,
  options?: WatchOptions
): DisposerFn;
export function watch<T>(
  source: ReadonlySignal<T> | (() => T),
  callback: WatchCallback<T>,
  options?: WatchOptions
): DisposerFn {
  const getter = typeof source === 'function' ? source : () => source.value;

  let isFirst = true;
  let prevValue: T | undefined;

  return watchEffect((onCleanup) => {
    const value = getter();

    if (isFirst) {
      isFirst = false;
      if (options?.immediate) {
        untracked(() => callback(value, prevValue as T, onCleanup));
      }
      prevValue = value;
      return;
    }

    if (!Object.is(value, prevValue)) {
      untracked(() => callback(value, prevValue as T, onCleanup));
      prevValue = value;
    }
  });
}
