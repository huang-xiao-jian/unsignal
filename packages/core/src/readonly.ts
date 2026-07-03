import { computed, isSignal, type ReadonlySignal, type Signal } from '@unsignal/baseline';

export interface AsReadonlyOptions {
  deep?: boolean;
}

type AnyFunction = (...args: never[]) => unknown;
type AnySignal<T = unknown> = Signal<T> | ReadonlySignal<T>;

type ToReadonlySignal<T> = T extends AnySignal<infer TValue> ? ReadonlySignal<TValue> : T;

export type ShallowReadonlySignals<T> = T extends AnyFunction
  ? T
  : T extends object
    ? T extends AnySignal
      ? ToReadonlySignal<T>
      : { [K in keyof T]: ToReadonlySignal<T[K]> }
    : T;

export type DeepReadonlySignals<T> = T extends AnyFunction
  ? T
  : T extends object
    ? T extends AnySignal
      ? ToReadonlySignal<T>
      : { [K in keyof T]: DeepReadonlySignals<T[K]> }
    : T;

export function readonly<T>(source: Signal<T>): ReadonlySignal<T>;
export function readonly<T>(source: ReadonlySignal<T>): ReadonlySignal<T>;
export function readonly<T>(source: Signal<T> | ReadonlySignal<T>): ReadonlySignal<T> {
  if (isSignal(source)) {
    return computed(() => source.value);
  }

  return source;
}

export function asReadonly<T>(value: T): ShallowReadonlySignals<T>;
export function asReadonly<T>(value: T, options: { deep: true }): DeepReadonlySignals<T>;
/**
 * Type-only readonly projection that preserves runtime identity.
 */
export function asReadonly<T>(
  value: T,
  _options?: AsReadonlyOptions
): ShallowReadonlySignals<T> | DeepReadonlySignals<T> {
  return value as ShallowReadonlySignals<T> | DeepReadonlySignals<T>;
}
