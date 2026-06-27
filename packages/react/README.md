# @unsignal/react

> Signal binding for React 19, powered by [`@unsignal/baseline`](https://github.com/preactjs/signals/tree/main/packages/core).

Provides `mobx-react-lite`-style reactive bridging between `@unsignal/baseline` and React's rendering system.

## Features

- Automatic signal dependency tracking via `observer`
- Fine-grained reactivity with `Observer`, `Show`, `For`, and `Switch`
- Signal reading with `useSignalValue`
- Read-write state with `useSignalState`
- React 19 concurrent-safe rendering via `useSyncExternalStore`
- SSR compatible
- TypeScript first-class

## Requirements

- **React >= 19**
- `@unsignal/baseline >= 1.14`
- `immer >= 11` for `useSignalState`

## Installation

```bash
pnpm add @unsignal/baseline @unsignal/react immer
```

## API

### `observer`

Wraps a function component into a reactive component. Signal reads inside the component are automatically tracked and any tracked signal change triggers a re-render.

```ts
import type { FunctionComponent } from 'react';

interface ObserverOptions {
  displayName?: string;
}

function observer<P extends object>(
  component: FunctionComponent<P>,
  options?: ObserverOptions
): FunctionComponent<P>;
```

```tsx
import { signal } from '@unsignal/baseline';
import { observer } from '@unsignal/react';

const count = signal(0);

const Counter = observer(function Counter() {
  return <p>Count: {count.value}</p>;
});
```

### `Observer`

A render-prop component for inline reactive fragments.

```ts
import type { FunctionComponent, ReactNode } from 'react';

interface ObserverProps {
  children: () => ReactNode;
}

const Observer: FunctionComponent<ObserverProps>;
```

```tsx
import { signal } from '@unsignal/baseline';
import { Observer } from '@unsignal/react';

const count = signal(0);

function App() {
  return (
    <div>
      <h1>Static Header</h1>
      <Observer>{() => <p>Count: {count.value}</p>}</Observer>
    </div>
  );
}
```

### `Show`

Conditionally renders `when` or `fallback` with reactive signal tracking.

```ts
import type { ReactNode } from 'react';
import type { ReadonlySignal } from '@unsignal/baseline';

interface ShowProps<T> {
  when: ReadonlySignal<T> | T;
  fallback?: ReactNode;
  children: (value: T) => ReactNode;
}

function Show<T>(props: ShowProps<T>): ReactNode;
```

```tsx
import { signal } from '@unsignal/baseline';
import { Show } from '@unsignal/react';

const visible = signal(false);

function App() {
  return (
    <Show when={visible} fallback={<p>Hidden!</p>}>
      {() => <p>Visible!</p>}
    </Show>
  );
}
```

### `For`

Renders a reactive list from a signal-backed collection with keyed item tracking.

```ts
import type { ReactNode } from 'react';
import type { ReadonlySignal } from '@unsignal/baseline';

interface ForProps<T> {
  each: ReadonlySignal<readonly T[]> | readonly T[];
  by?: (item: T, index: number) => React.Key;
  fallback?: ReactNode;
  children: (item: T, index: number) => ReactNode;
}

function For<T>(props: ForProps<T>): ReactNode;
```

```tsx
import { signal } from '@unsignal/baseline';
import { For } from '@unsignal/react';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const todos = signal<Todo[]>([]);

function TodoList() {
  return (
    <ul>
      <For each={todos} by={(todo) => todo.id} fallback={<li>No todos yet.</li>}>
        {(todo) => (
          <li>
            {todo.text} {todo.done ? '⚡️' : '📦️'}
          </li>
        )}
      </For>
    </ul>
  );
}
```

### `Switch`

Matches reactive cases and renders the first matching branch.

```ts
import type { ReactNode } from 'react';
import type { ReadonlySignal } from '@unsignal/baseline';

interface CaseProps<T> {
  when: ReadonlySignal<T> | T;
  children: ReactNode | ((value: T) => ReactNode);
}

interface DefaultProps {
  children: ReactNode;
}

interface SwitchProps<T> {
  children: ReactNode;
}

function Switch<T>(props: SwitchProps<T>): ReactNode;
```

**Static children:**

```tsx
import { signal } from '@unsignal/baseline';
import { Switch } from '@unsignal/react';

type Status = 'loading' | 'success' | 'error';

const status = signal<Status>('loading');

function DataView() {
  return (
    <Switch when={status}>
      <Switch.Case is="loading">
        <p>Loading…</p>
      </Switch.Case>
      <Switch.Case is="success">
        <p>Data loaded!</p>
      </Switch.Case>
      <Switch.Case is="error">
        <p>Something went wrong.</p>
      </Switch.Case>
      <Switch.Default>
        <p>Unknown status</p>
      </Switch.Default>
    </Switch>
  );
}
```

**Render props:**

```tsx
import { signal } from '@unsignal/baseline';
import { Switch } from '@unsignal/react';

type Status = 'loading' | 'success' | 'error';

const status = signal<Status>('loading');

function DataView() {
  return (
    <Switch when={status}>
      <Switch.Case is="loading">{() => <p>Loading…</p>}</Switch.Case>
      <Switch.Case is="success">{(value) => <p>Data loaded: {value}</p>}</Switch.Case>
      <Switch.Case is="error">{() => <p>Something went wrong.</p>}</Switch.Case>
      <Switch.Default>{(value) => <p>Unknown status: {String(value)}</p>}</Switch.Default>
    </Switch>
  );
}
```

**Custom equality:**

```tsx
import { signal } from '@unsignal/baseline';
import { Switch } from '@unsignal/react';

interface User {
  id: number;
  role: string;
}

const currentUser = signal<User>({ id: 1, role: 'admin' });

function RoleBadge() {
  return (
    <Switch when={currentUser} equal={(a, b) => a.role === b.role}>
      <Switch.Case is={{ id: 0, role: 'admin' }}>
        {(user) => <span>Admin badge — {user.id}</span>}
      </Switch.Case>
      <Switch.Case is={{ id: 0, role: 'editor' }}>
        {(user) => <span>Editor badge — {user.id}</span>}
      </Switch.Case>
    </Switch>
  );
}
```

### `useSignalValue`

Reads the current value from a signal and subscribes to changes.

```ts
import type { ReadonlySignal } from '@unsignal/baseline';

function useSignalValue<T>(source: ReadonlySignal<T>): T;
```

```tsx
import { signal, computed } from '@unsignal/baseline';
import { useSignalValue } from '@unsignal/react';

const count = signal(0);
const doubled = computed(() => count.value * 2);

function Counter() {
  const value = useSignalValue(count);
  const doubledValue = useSignalValue(doubled);
  return (
    <p>
      {value} x 2 = {doubledValue}
    </p>
  );
}
```

### `useSignalState`

Read-write hook for writable signals with immer-powered mutation support.

```ts
import type { Signal } from '@unsignal/baseline';

type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

function useSignalState<T>(signal: Signal<T>): [T, Mutator<T>];
```

- For primitives, pass a new value or `(prev) => next`
- For objects and arrays, pass an immer producer

**Primitive types:**

```tsx
import { signal } from '@unsignal/baseline';
import { useSignalState } from '@unsignal/react';

const count = signal(0);

function Counter() {
  const [value, mutate] = useSignalState(count);
  return (
    <div>
      <p>{value}</p>
      <button onClick={() => mutate((v) => v + 1)}>+1</button>
    </div>
  );
}
```

**Objects / arrays with immer:**

```tsx
import { signal } from '@unsignal/baseline';
import { useSignalState } from '@unsignal/react';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const todos = signal<Todo[]>([]);

function TodoList() {
  const [items, mutate] = useSignalState(todos);

  const onToggle = (id: number) => {
    mutate((draft) => {
      const todo = draft.find((t) => t.id === id);
      if (todo) todo.done = !todo.done;
    });
  };

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id} onClick={() => onToggle(item.id)}>
          {item.text} {item.done ? '⚡️' : '📦️'}
        </li>
      ))}
    </ul>
  );
}
```

### `useSignalEffect`

Runs a side effect that automatically tracks signal dependencies and supports cleanup.

```ts
import type { EffectOptions } from '@unsignal/baseline';

function useSignalEffect(callback: () => void | (() => void), options?: EffectOptions): void;
```

```tsx
import { signal } from '@unsignal/baseline';
import { useSignalEffect } from '@unsignal/react';

const count = signal(0);

function Logger() {
  useSignalEffect(
    () => {
      console.log('count changed to:', count.value);
    },
    { name: 'count logger' }
  );
  return null;
}
```

### `useLiveSignal`

Bridges a React-owned value into a readonly signal.

```ts
import type { ReadonlySignal } from '@unsignal/baseline';

interface UseLiveSignalOptions<T> {
  equals?: (previous: T, next: T) => boolean;
}

function useLiveSignal<T>(value: T, options?: UseLiveSignalOptions<T>): ReadonlySignal<T>;
```

```tsx
import { useLiveSignal } from '@unsignal/react';
import { computed } from '@unsignal/baseline';

interface CounterProps {
  initialCount: number;
}

function Counter({ initialCount }: CounterProps) {
  const countSig = useLiveSignal(initialCount);
  const doubled = computed(() => countSig.value * 2);

  return <p>{doubled.value}</p>;
}
```

**Custom equality:**

```tsx
import { useLiveSignal } from '@unsignal/react';

interface User {
  id: number;
  name: string;
}

function UserView({ user }: { user: User }) {
  const userSig = useLiveSignal(user, {
    equals: (previous, next) => previous.id === next.id,
  });

  return <p>{userSig.value.name}</p>;
}
```

## License

MIT
