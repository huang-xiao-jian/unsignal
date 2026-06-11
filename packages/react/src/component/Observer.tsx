import type { ReactNode } from 'react';
import { observer } from '../hoc/observer';

export interface ObserverProps {
  children: () => ReactNode;
}

const ObservedObserver = observer(function ObserverInner({ children }: ObserverProps): ReactNode {
  return children();
});

export function Observer(props: ObserverProps): ReactNode {
  return <ObservedObserver {...props} />;
}
