import { effect, type ReadonlySignal } from '@unsignal/baseline';
import { useCallback, useSyncExternalStore } from 'react';

export function useSignalValue<T>(source: ReadonlySignal<T>): T {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const disposable = effect(() => {
        void source.value;
        onStoreChange();
      });

      return () => {
        disposable.dispose();
      };
    },
    [source]
  );
  const getSnapshot = useCallback(() => source.value, [source]);
  const getServerSnapshot = useCallback(() => source.peek(), [source]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
