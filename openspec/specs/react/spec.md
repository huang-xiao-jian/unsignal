# @unsignal/react

## Business Objective

Provide [mobx-react-lite](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react-lite)-style `@unsignal/baseline` reactive bridging capabilities

## Business Requirements

- Support `React 19+`, **explicitly incompatible with lower versions!!!**
- Support `SSR` mode
- Support `Function Component`, explicitly does not support `Class Component`
- Does not support deprecated features, including: `forwardRef` / `contextTypes`
- Complete `TypeScript` type declarations

## Business Design

### Design Principles

- Assume Signal management **stay outside of components**, the `@unsignal/react` provides only the **consumption** bridge and explicitly depends on `@unsignal/baseline` as the signal primitive provider
- Only use `@unsignal/baseline` public APIs (`signal` / `computed` / `effect` / `batch` / `untracked` / `peek`), **usage of non-public methods is strictly prohibited!**
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
import { signal } from '@unsignal/baseline';
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

#### `Show`

Conditionally renders `children` when the reactive boolean signal is truthy; otherwise renders `fallback`

```ts
import type { ReadonlySignal } from '@unsignal/baseline';
import type { ReactNode } from 'react';

interface ShowProps {
  when: ReadonlySignal<boolean>;
  fallback?: ReactNode;
  children: ReactNode | (() => ReactNode);
}

function Show(props: ShowProps): ReactNode;
```

**Behavior:**

- Accepts only `ReadonlySignal<boolean>` as the condition source
- Supports either static `children` content or a zero-argument render function
- Tracks signal reads inside the active branch through an internal `observer` wrapper

#### `For`

Renders a reactive list from a signal-backed array

```ts
import type { ReadonlySignal, Signal } from '@unsignal/baseline';
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

- Accepts only signal-backed arrays, not plain arrays
- Uses `fallback` when the array is empty
- Tracks signal reads inside each rendered item through an internal `observer` wrapper

#### `Switch`

Matches the current value of a reactive source against `Case` entries and renders the first match, otherwise the `Default` entry when present

```ts
import type { ReadonlySignal } from '@unsignal/baseline';
import type { ReactNode } from 'react';

type Renderable<T> = ReactNode | ((value: T) => ReactNode);

interface SwitchProps<T> {
  when: ReadonlySignal<T>;
  equal?: (a: T, b: T) => boolean;
  children: ReactNode;
}

interface CaseProps<T> {
  is: T;
  children: Renderable<T>;
}

interface DefaultProps {
  children: Renderable<unknown>;
}

interface SwitchComponent {
  <T>(props: SwitchProps<T>): ReactNode;
  Case: <T>(props: CaseProps<T>) => ReactNode;
  Default: (props: DefaultProps) => ReactNode;
}

const Switch: SwitchComponent;
```

**Behavior:**

- Accepts only `ReadonlySignal<T>` as the source
- Uses `Object.is` matching by default
- Supports custom equality via `equal`
- Supports both static children and render functions in `Case` and `Default`
- Tracks signal reads inside the active branch through an internal `observer` wrapper

#### `useSignalValue`

Reads the current value from an external `Signal` and subscribes to changes. No `observer` wrapping needed — reactive re-rendering works standalone

```ts
import type { ReadonlySignal } from '@unsignal/baseline';

function useSignalValue<T>(signal: ReadonlySignal<T>): T;
```

**Behavior:**

- Supports `ReadonlySignal` (including `computed` return values)

**Usage Example:**

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

#### `useSignalState`

Reads and writes an external writable `Signal`, with an API style similar to `useState`. Internally integrates `immer` to support mutable-style updates, simplifying complex state updates. `immer` is a required `peerDependency`.

```ts
import type { Signal } from '@unsignal/baseline';
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

**Objects / arrays — use mutable style (`void`):**

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

#### `useSignalEffect`

Runs a side-effect that automatically tracks signal dependencies. Re-runs whenever any tracked signal changes. Cleans up automatically on unmount.

```ts
import type { EffectOptions } from '@unsignal/baseline';

function useSignalEffect(callback: () => void | (() => void), options?: EffectOptions): void;
```

**Behavior:**

- Auto-tracks any `signal.value` read inside `callback`; re-runs on change
- Supports an optional cleanup function; disposed on unmount
- Passes `options` to the underlying `effect()` when the inner signal effect is created
- Treats the underlying `effect()` return value as a disposable resource handle rather than a callable teardown function
- React re-renders, including options object identity changes, do not recreate the inner signal effect

**Usage Example:**

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

#### `useLiveSignal`

Bridges a normal React value (from props, `useState`, `useMemo`, etc.) into the signal world. Returns a `ReadonlySignal` that automatically stays in sync with the supplied value on every render. Useful for exposing React-owned state to signal-based consumers without manual synchronization.

```ts
import type { ReadonlySignal } from '@unsignal/baseline';

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

## Canonical Requirements

### Requirement: React bridge targets baseline primitives

`@unsignal/react` SHALL provide its React bridge APIs for signals created by `@unsignal/baseline` instead of `@preact/signals-core`.

#### Scenario: React hooks and components accept baseline signals

- **WHEN** a consumer passes a writable or readonly signal created by `@unsignal/baseline` into `observer`, `Observer`, `useSignalValue`, `useSignalState`, `useSignalEffect`, `Show`, `For`, `Switch`, or `useLiveSignal`-driven flows
- **THEN** the documented and supported behavior MUST operate on baseline signal primitives without requiring `@preact/signals-core`

#### Scenario: React package guidance points to baseline

- **WHEN** a consumer reads the package README, API examples, or installation instructions
- **THEN** the package MUST instruct consumers to install and import `@unsignal/baseline` as the primitive provider

### Requirement: React bridge preserves non-model behavior during the migration

Replacing the primitive provider SHALL NOT change the documented bridge semantics of the existing React APIs beyond the package and type source they target.

#### Scenario: Existing React bridge semantics stay intact

- **WHEN** a consumer uses the existing `@unsignal/react` APIs with baseline signals
- **THEN** render tracking, external store subscriptions, effect cleanup, and writable signal mutation behavior MUST remain compatible with the current documented React bridge behavior
