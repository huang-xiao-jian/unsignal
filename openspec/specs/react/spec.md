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
  const countSig = useLiveSignal(initialCount);
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
