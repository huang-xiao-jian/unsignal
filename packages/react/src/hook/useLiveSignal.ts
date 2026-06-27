import { signal, type ReadonlySignal, type Signal } from '@unsignal/baseline';
import { useRef } from 'react';

export interface UseLiveSignalOptions<T> {
  equals?: (previous: T, next: T) => boolean;
}

export function useLiveSignal<T>(value: T, options?: UseLiveSignalOptions<T>): ReadonlySignal<T> {
  const sourceRef = useRef<Signal<T> | null>(null);
  const equals = options?.equals ?? Object.is;

  if (sourceRef.current === null) {
    sourceRef.current = signal(value);
  } else if (!equals(sourceRef.current.peek(), value)) {
    sourceRef.current.value = value;
  }

  return sourceRef.current;
}
