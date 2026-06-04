import { effect, type ReadonlySignal } from '@preact/signals-core';
import { useCallback, useSyncExternalStore } from 'react';

export function useSignalValue<T>(source: ReadonlySignal<T>): T {
  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      effect(() => {
        void source.value;
        onStoreChange();
      }),
    [source]
  );
  const getSnapshot = useCallback(() => source.value, [source]);
  const getServerSnapshot = useCallback(() => source.peek(), [source]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
