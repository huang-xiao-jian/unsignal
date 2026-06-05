import type { FunctionComponent, ReactNode } from 'react';
import { memo, useSyncExternalStore } from 'react';
import { useLiteSignalStore } from '../store/useLiteSignalStore';

export interface ObserverOptions {
  displayName?: string;
}

function useObserver<P extends object>(component: FunctionComponent<P>, props: P): ReactNode {
  const store = useLiteSignalStore();

  // Render the original component inside track() so that signal reads
  // are automatically captured as dependencies by effect().
  let renderResult;
  let exception;

  // useSyncExternalStore bridges signal changes to React's render cycle.
  // subscribe: registers framework-level subscriber (layout effect phase)
  // getSnapshot: returns snapshot token that invalidates when signals change
  // getServerSnapshot: returns snapshot for SSR (no subscriptions)
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  // track() creates an effect() that:
  //   1. Runs fn() → component renders → signal.value reads are tracked
  //   2. On subsequent signal changes: mutates snapshot + notifies subscribers
  //
  // Note: track() disposes previous effects but never touches subscribers.
  // Subscriber lifecycle is managed by useSyncExternalStore's subscribe/unsubscribe.
  // After React StrictMode's simulated unmount (subscribe cleanup removes subscriber),
  // useSyncExternalStore re-subscribes on simulated remount, restoring the chain.
  store.track(() => {
    try {
      renderResult = component(props);
    } catch (e) {
      exception = e;
    }
  });

  // re-throw any exceptions caught during rendering
  if (exception) {
    throw exception;
  }

  return renderResult;
}

const MEMO_TYPE = Symbol.for('react.memo');

function isMemoComponent(component: unknown): boolean {
  return (
    typeof component === 'object' &&
    component !== null &&
    (component as { $$typeof?: symbol }).$$typeof === MEMO_TYPE
  );
}

export function observer<P extends object>(
  component: FunctionComponent<P>,
  options?: ObserverOptions
): FunctionComponent<P> {
  // If the input is already a memo component, unwrap to avoid double-memo overhead
  const baseComponent = isMemoComponent(component)
    ? (component as unknown as { type: FunctionComponent<P> }).type
    : component;

  const wrapped: FunctionComponent<P> = (props) => {
    return useObserver(baseComponent, props);
  };
  const memoized = memo(wrapped);
  const displayName =
    options?.displayName ?? baseComponent.displayName ?? baseComponent.name ?? 'ObserverComponent';

  memoized.displayName = displayName;

  return memoized;
}
