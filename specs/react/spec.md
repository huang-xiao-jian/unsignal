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

- Functionality complements `@preact/signals-react`, without duplicating its existing APIs (`useSignal` / `useComputed` / `useSignalEffect` / `useSignals`); APIs are not re-exported
- Only use `@preact/signals-core` public APIs (`signal` / `computed` / `effect` / `batch` / `untracked` / `peek`), **usage of non-public methods is strictly prohibited!**
- `observer` implementation is based on `React.useSyncExternalStore` + `effect()` dependency tracking: uses `useSyncExternalStore` to subscribe to external signal changes, `effect()` automatically tracks `signal` dependencies read by the component during the render phase, and signal changes trigger re-renders

### API Reference

#### `observer`

Wraps a `Function Component` into a reactive component. Automatically tracks `signal` reads within the component during rendering; any `signal` change triggers a re-render

```ts
interface ObserverOptions {
  displayName?: string;
}

function observer<P extends object>(
  component: FunctionComponent<P>,
  options?: ObserverOptions
): FunctionComponent<P>;
```

**Behavior:**

- Automatically collects `signal` dependencies read within the component function body during the render phase; tracks `signal` changes to trigger component re-renders
- Internally uses `useSyncExternalStore` to subscribe to signal changes, natively supports `React 19` concurrent mode (`Concurrent Mode`)
- Automatic `memoization` for performance; the default behavior of `observer`-wrapped components is equivalent to `React.memo`

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
type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

function useSignalState<T>(signal: Signal<T>): [T, Mutator<T>];
```

**Behavior:**

- External mutation via the `Mutator` function
- Only supports writable `Signal`, does not support `ReadonlySignal` (e.g., `computed` return values)
- `immer` is a required `peerDependency`; `Mutator` supports two styles:
  - `(draft: T) => void`: mutable style, suitable for objects / arrays, internally generates immutable values automatically
  - `(draft: T) => T`: returns a new value, suitable for primitive types (`number` / `string` / `boolean`, etc.)

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
