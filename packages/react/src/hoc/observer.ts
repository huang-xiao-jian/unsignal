import type { FunctionComponent, ReactNode } from 'react';
import { memo, useSyncExternalStore } from 'react';
import { useLiteSignalStore } from './store';

export interface ObserverOptions {
  displayName?: string;
}

function useObserver<P extends object>(component: FunctionComponent<P>, props: P): ReactNode {
  const store = useLiteSignalStore();

  // render the original component, but have the
  // reaction track the observables, so that rendering
  // can be invalidated (see above) once a dependency changes
  let renderResult;
  let exception;

  // only support client side
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  // tolerate exceptions in smooth way
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
