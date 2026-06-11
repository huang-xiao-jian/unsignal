import type { ReadonlySignal } from '@preact/signals-core';
import type { ReactNode } from 'react';
import { observer } from '../hoc/observer';
import { useSignalValue } from '../hook/useSignalValue';

export interface ShowProps {
  when: ReadonlySignal<boolean>;
  fallback?: ReactNode;
  children: ReactNode | (() => ReactNode);
}

function renderNode(node: ReactNode | (() => ReactNode)): ReactNode {
  return typeof node === 'function' ? node() : node;
}

const ShowBranch = observer(function ShowBranch({ children }: Pick<ShowProps, 'children'>) {
  return renderNode(children);
});

export function Show({ when, fallback = null, children }: ShowProps): ReactNode {
  const visible = useSignalValue(when);

  return visible ? <ShowBranch>{children}</ShowBranch> : fallback;
}
