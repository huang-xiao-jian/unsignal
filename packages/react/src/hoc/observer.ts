import { effect } from '@preact/signals-core';
import type { FunctionComponent, ReactNode } from 'react';
import { memo, useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

export interface ObserverOptions {
  displayName?: string;
}

const STATIC_VERSION = {};

function useObserver<P extends object>(component: FunctionComponent<P>, props: P): ReactNode {
  const versionRef = useRef<object>({});
  const onStoreChangeRef = useRef<() => void>(() => {});
  const resultRef = useRef<ReactNode>(null);

  // Phase 1: render the component (hooks work, signals are read)
  resultRef.current = component(props) as ReactNode;

  // Phase 2: useSyncExternalStore subscribes to version changes
  const subscribe = useCallback((onStoreChange: () => void) => {
    onStoreChangeRef.current = onStoreChange;
    return () => {
      onStoreChangeRef.current = () => {};
    };
  }, []);

  const getSnapshot = useCallback(() => versionRef.current, []);
  const getServerSnapshot = useCallback(() => STATIC_VERSION, []);

  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Phase 3: useEffect creates effect() to track signal dependencies
  // The effect invokes component(props) to establish the same signal reads
  // as the render phase. When any tracked signal changes, version is bumped
  // and onStoreChange triggers a React re-render.
  useEffect(() => {
    let isInitial = true;
    const dispose = effect(() => {
      // Tracking invocation: establishes signal subscriptions
      component(props);
      if (!isInitial) {
        versionRef.current = {};
        onStoreChangeRef.current();
      }
      isInitial = false;
    });
    return dispose;
  }); // no deps: re-track after every render to capture current dependency set

  return resultRef.current;
}

export function observer<P extends object>(
  component: FunctionComponent<P>,
  options?: ObserverOptions
): FunctionComponent<P> {
  const wrapped: FunctionComponent<P> = (props) => {
    return useObserver(component, props);
  };
  const memoized = memo(wrapped);
  const displayName =
    options?.displayName ?? component.displayName ?? component.name ?? 'ObserverComponent';

  memoized.displayName = displayName;

  return memoized;
}
