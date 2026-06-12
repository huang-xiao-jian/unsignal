# @unsignal/react

## Business Objective

Provide [mobx-react-lite](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react-lite)-style `@preact/signals-core` reactive bridging capabilities

## Business Requirements

- Support `React 19+`, **explicitly incompatible with lower versions!!!**
- Support `SSR` mode (must be explicitly enabled by consumers)
- Support `Function Component`, explicitly does not support `Class Component`
- Does not support deprecated features, including: `forwardRef` / `contextTypes`
- Complete `TypeScript` type declarations

## Business Design

### Design Principles

- Assume Signal management **stay outside of components**, the `@unsignal/react` provides only the **consumption** bridge — developers can use this package without any dependency on or knowledge of `@preact/signals-react`
- Only use `@preact/signals-core` public APIs (`signal` / `computed` / `effect` / `batch` / `untracked` / `peek`), **usage of non-public methods is strictly prohibited!**
- `observer` implementation is based on `React.useSyncExternalStore` + `effect()` dependency tracking: uses `useSyncExternalStore` to subscribe to external signal changes, `effect()` automatically tracks `signal` dependencies read by the component during the render phase, and signal changes trigger re-renders
- Control-flow components (`Show` / `For` / `Switch`) have **built-in fine-grained reactivity**: each item / branch is independently tracked so that only the affected DOM nodes re-render

### API Reference

#### `observer`

Wraps a `Function Component` into a reactive component. Automatically tracks `signal` reads within the component during rendering; any `signal` change triggers a re-render

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

**Behavior:**

- Tracks `signal` reads during render; re-renders on change
- Internally uses `useSyncExternalStore` for concurrent-safe subscription
- Equivalent to `React.memo` by default

**Usage Example:**

```tsx
import { signal } from '@preact/signals-core';
import { observer } from '@unsignal/react';

const count = signal(0);

const Counter = observer(function Counter() {
  return <p>Count: {count.value}</p>;
});
```

#### `Observer`

`Render prop` component for inline reactive rendering fragments within the component tree. Suitable for scenarios where `signal` needs to be used locally in a non-`observer wrapped` component

```ts
import type { FunctionComponent, ReactNode } from 'react';

interface ObserverProps {
  children: () => ReactNode;
}

const Observer: FunctionComponent<ObserverProps>;
```

**Usage Example:**

```tsx
import { signal } from '@preact/signals-core';
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

#### `useSignalValue`

Reads the current value from an external `Signal` and subscribes to changes. No `observer` wrapping needed — reactive re-rendering works standalone

```ts
import type { ReadonlySignal } from '@preact/signals-core';

function useSignalValue<T>(signal: ReadonlySignal<T>): T;
```

**Behavior:**

- Supports `ReadonlySignal` (including `computed` return values)

**Usage Example:**

```tsx
import { signal, computed } from '@preact/signals-core';
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

#### `useSignalState`

Reads and writes an external writable `Signal`, with an API style similar to `useState`. Internally integrates `immer` to support mutable-style updates, simplifying complex state updates. `immer` is a required `peerDependency`.

```ts
import type { Signal } from '@preact/signals-core';
import type { Draft } from 'immer';

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

type Mutator<T> = T extends Primitive
  ? (updater: T | ((prev: T) => T)) => void
  : (updater: (draft: Draft<T>) => void) => void;

function useSignalState<T>(signal: Signal<T>): [T, Mutator<T>];
```

**Behavior:**

- Only supports writable `Signal`, not `ReadonlySignal`
- `immer` is a required `peerDependency`; `Mutator` supports:
  - primitive values: assign a plain value, or pass `(prev: T) => T`
  - objects / arrays: pass an immer producer `(draft: Draft<T>) => void`

**Usage Example:**

**Primitive types — must explicitly return a new value:**

```tsx
import { signal } from '@preact/signals-core';
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

**Objects / arrays — use mutable style (`void`):**

```tsx
import { signal } from '@preact/signals-core';
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
    // immer producer: mutable style, internally generates immutable values automatically
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

#### `useSignalEffect`

Runs a side-effect that automatically tracks signal dependencies. Re-runs whenever any tracked signal changes. Cleans up automatically on unmount.

```ts
import type { EffectOptions } from '@preact/signals-core';

function useSignalEffect(callback: () => void | (() => void), options?: EffectOptions): void;
```

**Behavior:**

- Auto-tracks any `signal.value` read inside `callback`; re-runs on change
- Supports an optional cleanup function; disposed on unmount
- Passes `options` to the underlying `effect()` when the inner signal effect is created
- React re-renders, including options object identity changes, do not recreate the inner signal effect

**Usage Example:**

```tsx
import { signal } from '@preact/signals-core';
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

#### `useLiveSignal`

Bridges a normal React value (from props, `useState`, `useMemo`, etc.) into the signal world. Returns a `ReadonlySignal` that automatically stays in sync with the supplied value on every render. Useful for exposing React-owned state to signal-based consumers without manual synchronization.

```ts
import type { ReadonlySignal } from '@preact/signals-core';

interface UseLiveSignalOptions<T> {
  equals?: (previous: T, next: T) => boolean;
}

function useLiveSignal<T>(value: T, options?: UseLiveSignalOptions<T>): ReadonlySignal<T>;
```

**Behavior:**

- Returns a stable `ReadonlySignal<T>` whose `.value` stays in sync with `value` on every render
- The returned signal identity is stable across renders — safe to pass to `computed`, `effect`, etc.
- Uses `Object.is` equality by default to avoid unnecessary signal writes
- Supports custom equality via `options.equals`; when `equals(previous, next)` returns `true`, the signal value is not updated

**Usage Example:**

```tsx
import { useLiveSignal } from '@unsignal/react';
import { computed } from '@preact/signals-core';

interface CounterProps {
  initialCount: number;
}

function Counter({ initialCount }: CounterProps) {
  // Bridge the React prop into a signal
  const countSig = useLiveSignal(initialCount);

  // Signal-based consumers can now react to prop changes
  const doubled = computed(() => countSig.value * 2);

  return <p>{doubled.value}</p>;
}
```

**Custom equality example:**

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

### Control Flow Components

All control-flow components are **observer-aware**: each child branch / item is independently tracked so that only the affected subtree re-renders when a signal changes, without re-rendering the parent or siblings.

#### `Show`

Conditionally renders children based on a signal-driven boolean expression. Only the active branch is mounted. `children` supports both a static node and a render prop for deferred evaluation.

```ts
import type { ReadonlySignal } from '@preact/signals-core';
import type { FunctionComponent, ReactNode } from 'react';

interface ShowProps {
  when: ReadonlySignal<boolean>;
  fallback?: ReactNode;
  children: ReactNode | (() => ReactNode);
}

const Show: FunctionComponent<ShowProps>;
```

**Usage Example:**

```tsx
import { signal } from '@preact/signals-core';
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

#### `For`

Efficiently renders a list from a signal-driven array. Each item is independently tracked — inserting, removing, or updating an item only re-renders the affected row, not the entire list.

```ts
import type { ReadonlySignal, Signal } from '@preact/signals-core';
import type { ReactNode } from 'react';

interface ForProps<T> {
  each: Signal<T[]> | ReadonlySignal<T[]>;
  by?: (item: T, index: number) => string | number;
  fallback?: ReactNode;
  children: (item: T, index: number) => ReactNode;
}

function For<T>(props: ForProps<T>): ReactNode;
```

**Behavior:**

- Accepts both writable `Signal<T[]>` and readonly `ReadonlySignal<T[]>`
- `by` extracts a unique key for keyed reconciliation, use `index` by default
- `fallback` is rendered when the array is empty
- Each row is independently tracked; only affected rows re-render

**Usage Example:**

```tsx
import { signal } from '@preact/signals-core';
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

#### `Switch`

Multi-branch conditional rendering driven by signal values. Uses a composition pattern: `Switch` holds the signal source, `Switch.Case` declares a plain value to compare against, and `Switch.Default` provides the fallback. Only the first matching branch is mounted. Comparison uses `Object.is` by default, with an optional custom equality function.

```ts
import type { ReadonlySignal } from '@preact/signals-core';
import type { ReactNode } from 'react';

interface SwitchProps<T> {
  when: ReadonlySignal<T>;
  equal?: (a: T, b: T) => boolean; // defaults to Object.is
  children: ReactNode; // Switch.Case / Switch.Default elements
}

interface CaseProps<T> {
  is: T;
  children: ReactNode | ((value: T) => ReactNode);
}

interface DefaultProps {
  children: ReactNode | ((value: unknown) => ReactNode);
}

function Switch<T>(props: SwitchProps<T>): ReactNode;
function Case<T>(props: CaseProps<T>): ReactNode;
function Default(props: DefaultProps): ReactNode;

Switch.Case = Case;
Switch.Default = Default;
```

**Behavior:**

- `Switch` reads the signal; each `Switch.Case` compares `is` against it using `equal` (`Object.is` by default)
- Only the first matching `Switch.Case` is rendered; otherwise `Switch.Default`

**Usage Example (static children):**

```tsx
import { signal } from '@preact/signals-core';
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

**Usage Example (render props):**

```tsx
import { signal } from '@preact/signals-core';
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

**Custom equality example:**

```tsx
import { signal } from '@preact/signals-core';
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
