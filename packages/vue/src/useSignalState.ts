import { type Signal } from '@preact/signals-core';
import { produce } from 'immer';
import { type ShallowRef } from 'vue';
import { useSignalValue } from './useSignalValue';

export type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

export function useSignalState<T>(source: Signal<T>): [Readonly<ShallowRef<T>>, Mutator<T>] {
  const ref = useSignalValue(source);

  const mutate: Mutator<T> = (updater) => {
    if (typeof updater === 'function') {
      const recipe = updater as (draft: T) => T | void;
      source.value = produce(source.peek(), recipe);
    } else {
      source.value = updater;
    }
  };

  return [ref, mutate];
}
