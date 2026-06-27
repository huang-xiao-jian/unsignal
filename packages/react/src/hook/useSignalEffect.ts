import { effect, type EffectOptions } from '@unsignal/baseline';
import { useEffect, useRef } from 'react';

export function useSignalEffect(
  callback: () => void | (() => void),
  options?: EffectOptions
): void {
  const callbackRef = useRef(callback);
  const optionsRef = useRef(options);

  callbackRef.current = callback;
  optionsRef.current = options;

  useEffect(() => {
    const disposable = effect(() => callbackRef.current(), optionsRef.current);

    return () => {
      disposable.dispose();
    };
  }, []);
}
