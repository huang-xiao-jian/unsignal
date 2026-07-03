import { computed, isSignal, type ReadonlySignal, type Signal } from '@unsignal/baseline';

export function readonly<T>(source: Signal<T>): ReadonlySignal<T>;
export function readonly<T>(source: ReadonlySignal<T>): ReadonlySignal<T>;
export function readonly<T>(source: Signal<T> | ReadonlySignal<T>): ReadonlySignal<T> {
  if (isSignal(source)) {
    return computed(() => source.value);
  }

  return source;
}
