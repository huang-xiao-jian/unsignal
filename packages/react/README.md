# @unsignal/react

> Signal binding for React 19, powered by [@preact/signals-core](https://github.com/preactjs/signals/tree/main/packages/core).

Provides [mobx-react-lite](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react-lite) style reactive bridging between `@preact/signals-core` and React's rendering system.

## Features

- Automatic signal dependency tracking via `observer` HOC
- Fine-grained reactivity with `Observer` render-prop component
- Seamless signal reading with `useSignalValue` hook
- Immer-powered state updates with `useSignalState` hook
- Built on `useSyncExternalStore` — full Concurrent Mode support
- SSR compatible (with `getServerSnapshot`)
- TypeScript first-class

## Requirements

- **React >= 19** (not compatible with earlier versions)
- `@preact/signals-core >= 1.14`
- `immer >= 11` (required peer dependency for `useSignalState`)

## Installation

```bash
pnpm add @preact/signals-core @unsignal/react immer
```

## API

### `observer`

Wraps a function component to make it reactive. Signal reads inside the component are automatically tracked; any tracked signal change triggers a re-render.

```ts
function observer<P extends object>(
  component: FunctionComponent<P>,
  options?: { displayName?: string }
): FunctionComponent<P>;
```

- Automatically collects signal dependencies read during render
- Uses `useSyncExternalStore` internally — full Concurrent Mode support
- Applies `React.memo` by default for performance

```tsx
import { signal } from '@preact/signals-core';
import { observer } from '@unsignal/react';

const count = signal(0);

const Counter = observer(function Counter() {
  return <p>Count: {count.value}</p>;
});
```

### `Observer`

A render-prop component for inline reactive fragments. Useful when you need signal reactivity inside a non-observer component.

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

### `useSignalValue`

Reads a signal's current value and subscribes to changes. No `observer` wrapper needed — triggers re-render on its own.

```ts
function useSignalValue<T>(source: ReadonlySignal<T>): T;
```

- Accepts `ReadonlySignal` (including `computed` results)

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

### `useSignalState`

Read-write hook for writable signals, styled like `useState`. Integrates `immer` for ergonomic mutable-style updates on complex state.

```ts
type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

function useSignalState<T>(signal: Signal<T>): [T, Mutator<T>];
```

- Only accepts writable `Signal` (not `ReadonlySignal` / `computed`)
- `Mutator` supports two styles:
  - `(draft: T) => void` — mutable style for objects/arrays (powered by immer)
  - `(draft: T) => T` — return new value, for primitives

**Primitives — must return a new value:**

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

**Objects / arrays — mutable style (immer):**

```tsx
import { signal } from '@preact/signals-core';
import { useSignalState } from '@unsignal/react';

const todos = signal<{ id: number; text: string; done: boolean }[]>([]);

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
          {item.text}
        </li>
      ))}
    </ul>
  );
}
```

## License

MIT
