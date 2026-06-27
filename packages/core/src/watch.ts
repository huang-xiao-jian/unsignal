import { type Disposable, type ReadonlySignal, untracked } from '@unsignal/baseline';
import { type OnCleanup } from './clean';
import { watchEffect } from './watchEffect';

export type WatchCallback<T> = (value: T, oldValue: T, onCleanup: OnCleanup) => void;

export interface WatchOptions {
  immediate?: boolean;
}

export function watch<T>(
  source: ReadonlySignal<T>,
  callback: WatchCallback<T>,
  options?: WatchOptions
): Disposable;
export function watch<T>(
  source: () => T,
  callback: WatchCallback<T>,
  options?: WatchOptions
): Disposable;
export function watch<T>(
  source: ReadonlySignal<T> | (() => T),
  callback: WatchCallback<T>,
  options?: WatchOptions
): Disposable {
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
