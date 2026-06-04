import { type Signal } from '@preact/signals-core';
import { produce } from 'immer';
import { useCallback } from 'react';
import { useSignalValue } from './useSignalValue';

export type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

export function useSignalState<T>(source: Signal<T>): [T, Mutator<T>] {
  const value = useSignalValue(source);

  const mutate: Mutator<T> = useCallback(
    (updater) => {
      if (typeof updater === 'function') {
        source.value = produce(source.peek(), updater as (draft: T) => T | void);
      } else {
        source.value = updater;
      }
    },
    [source]
  );

  return [value, mutate];
}
