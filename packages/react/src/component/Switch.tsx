import type { ReadonlySignal } from '@preact/signals-core';
import type { ReactElement, ReactNode } from 'react';
import { Children, isValidElement, useMemo } from 'react';
import { observer } from '../hoc/observer';
import { useSignalValue } from '../hook/useSignalValue';

type Renderable<T> = ReactNode | ((value: T) => ReactNode);

export interface SwitchProps<T> {
  when: ReadonlySignal<T>;
  equal?: (a: T, b: T) => boolean;
  children: ReactNode;
}

export interface CaseProps<T> {
  is: T;
  children: Renderable<T>;
}

export interface DefaultProps {
  children: Renderable<unknown>;
}

interface SwitchComponent {
  <T>(props: SwitchProps<T>): ReactElement;
  Case: typeof Case;
  Default: typeof Default;
}

interface ParsedCase<T> {
  type: 'case';
  props: CaseProps<T>;
}

interface ParsedDefault {
  type: 'default';
  props: DefaultProps;
}

type ParsedChild<T> = ParsedCase<T> | ParsedDefault;

function renderNode<T>(node: Renderable<T>, value: T): ReactNode {
  return typeof node === 'function' ? node(value) : node;
}

export function Case<T>({ children }: CaseProps<T>): ReactNode {
  return children as ReactNode;
}

export function Default({ children }: DefaultProps): ReactNode {
  return children as ReactNode;
}

function parseChildren<T>(children: ReactNode): ParsedChild<T>[] {
  return Children.toArray(children).flatMap((child): ParsedChild<T>[] => {
    if (!isValidElement(child)) {
      return [];
    }

    if (child.type === Default) {
      return [{ type: 'default', props: child.props as DefaultProps }];
    }

    if (child.type === Case) {
      return [{ type: 'case', props: child.props as CaseProps<T> }];
    }

    return [];
  });
}

function findMatch<T>(
  parsedChildren: ParsedChild<T>[],
  value: T,
  equal: (a: T, b: T) => boolean
): CaseProps<T> | DefaultProps | undefined {
  let fallback: DefaultProps | undefined;

  for (const child of parsedChildren) {
    if (child.type === 'default') {
      fallback = child.props;
      continue;
    }

    if (equal(value, child.props.is)) {
      return child.props;
    }
  }

  return fallback;
}

const SwitchBranch = observer(function SwitchBranch<T>({
  branch,
  value,
}: {
  branch: CaseProps<T> | DefaultProps;
  value: T;
}): ReactElement {
  return <>{renderNode(branch.children as Renderable<T>, value)}</>;
}) as <T>(props: { branch: CaseProps<T> | DefaultProps; value: T }) => ReactElement;

function SwitchInner<T>({ when, equal = Object.is, children }: SwitchProps<T>): ReactElement {
  const value = useSignalValue(when);
  const parsedChildren = useMemo(() => parseChildren<T>(children), [children]);
  const branch = findMatch(parsedChildren, value, equal);

  return branch ? <SwitchBranch branch={branch} value={value} /> : <></>;
}

export const Switch = SwitchInner as SwitchComponent;

Switch.Case = Case;
Switch.Default = Default;
