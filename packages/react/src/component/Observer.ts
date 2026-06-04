import type { FunctionComponent, ReactNode } from 'react';
import { observer } from '../hoc/observer';

interface ObserverProps {
  children: () => ReactNode;
}

const ObserverInner: FunctionComponent<ObserverProps> = observer(function ObserverInner({
  children,
}: ObserverProps) {
  return children();
});

export const Observer: FunctionComponent<ObserverProps> = ObserverInner;
