import { effect, type EffectOptions } from '@preact/signals-core';
import { useEffect, useRef } from 'react';

export function useSignalEffect(
  callback: () => void | (() => void),
  options?: EffectOptions
): void {
  const callbackRef = useRef(callback);
  const optionsRef = useRef(options);

  callbackRef.current = callback;
  optionsRef.current = options;

  useEffect(() => effect(() => callbackRef.current(), optionsRef.current), []);
}
