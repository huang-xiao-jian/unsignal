import { type Signal } from '@unsignal/baseline';
import { type Draft, produce } from 'immer';
import { useCallback } from 'react';
import { useSignalValue } from './useSignalValue';

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

export type Mutator<T> = T extends Primitive
  ? (updater: T | ((prev: T) => T)) => void
  : (updater: (draft: Draft<T>) => void) => void;

export function useSignalState<T>(source: Signal<T>): [T, Mutator<T>] {
  const value = useSignalValue(source);

  const mutate: Mutator<T> = useCallback(
    (updater: any) => {
      if (typeof updater === 'function') {
        source.value = produce(source.peek(), updater);
      } else {
        source.value = updater;
      }
    },
    [source]
  ) as Mutator<T>;

  return [value, mutate];
}
