import type { ReadonlySignal, Signal } from '@preact/signals-core';
import type { ReactElement, ReactNode } from 'react';
import { Fragment } from 'react';
import { observer } from '../hoc/observer';
import { useSignalValue } from '../hook/useSignalValue';

export interface ForProps<T> {
  each: Signal<T[]> | ReadonlySignal<T[]>;
  by?: (item: T, index: number) => string | number;
  fallback?: ReactNode;
  children: (item: T, index: number) => ReactNode;
}

interface ForItemProps<T> {
  item: T;
  index: number;
  children: (item: T, index: number) => ReactNode;
}

type ForItemComponent = <T>(props: ForItemProps<T>) => ReactElement;

const ForItem = observer(function ForItem<T>({
  item,
  index,
  children,
}: ForItemProps<T>): ReactElement {
  return <>{children(item, index)}</>;
}) as ForItemComponent;

export function For<T>({ each, by, fallback = null, children }: ForProps<T>): ReactElement {
  const items = useSignalValue(each);

  if (items.length === 0) {
    return <>{fallback}</>;
  }

  return (
    <>
      {items.map((item, index) => (
        <Fragment key={by?.(item, index) ?? index}>
          <ForItem item={item} index={index} children={children} />
        </Fragment>
      ))}
    </>
  );
}
