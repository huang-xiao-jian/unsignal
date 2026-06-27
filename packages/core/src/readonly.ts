import { computed, type ReadonlySignal, type Signal } from '@unsignal/baseline';

export function readonly<T>(source: Signal<T>): ReadonlySignal<T>;
export function readonly<T>(source: ReadonlySignal<T>): ReadonlySignal<T>;
export function readonly<T>(source: Signal<T> | ReadonlySignal<T>): ReadonlySignal<T> {
  return computed(() => source.value);
}
