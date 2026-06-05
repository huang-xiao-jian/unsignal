import { effect, type ReadonlySignal } from '@preact/signals-core';
import { getCurrentScope, onScopeDispose, shallowRef, type ShallowRef } from 'vue';

export function useSignalValue<T>(source: ReadonlySignal<T>): Readonly<ShallowRef<T>> {
  const ref = shallowRef<T>(source.peek());

  const dispose = effect(() => {
    ref.value = source.value;
  });

  if (getCurrentScope()) {
    onScopeDispose(dispose);
  }

  return ref as Readonly<ShallowRef<T>>;
}
