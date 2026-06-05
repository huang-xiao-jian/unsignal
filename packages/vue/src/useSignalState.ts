import { type Signal } from '@preact/signals-core';
import { type Draft, produce } from 'immer';
import { type ShallowRef } from 'vue';
import { useSignalValue } from './useSignalValue';

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

export type Mutator<T> = T extends Primitive
  ? (updater: T | ((prev: T) => T)) => void
  : (updater: (draft: Draft<T>) => void) => void;

export function useSignalState<T>(source: Signal<T>): [Readonly<ShallowRef<T>>, Mutator<T>] {
  const ref = useSignalValue(source);

  const mutate: Mutator<T> = ((updater: any) => {
    if (typeof updater === 'function') {
      source.value = produce(source.peek(), updater);
    } else {
      source.value = updater;
    }
  }) as Mutator<T>;

  return [ref, mutate];
}
