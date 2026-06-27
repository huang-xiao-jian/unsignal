import { effect, type ReadonlySignal } from '@unsignal/baseline';
import { getCurrentScope, onScopeDispose, shallowRef, type ShallowRef } from 'vue';

export function useSignalValue<T>(source: ReadonlySignal<T>): Readonly<ShallowRef<T>> {
  const ref = shallowRef<T>(source.peek());

  const disposable = effect(() => {
    ref.value = source.value;
  });

  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposable.dispose();
    });
  }

  return ref as Readonly<ShallowRef<T>>;
}
