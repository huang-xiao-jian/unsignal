# @unsignal/react

> Signal binding for React 19, powered by [`@preact/signals-core`](https://github.com/preactjs/signals/tree/main/packages/core).

Provides `mobx-react-lite`-style reactive bridging between `@preact/signals-core` and React's rendering system.

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
- `@preact/signals-core >= 1.14`
- `immer >= 11` for `useSignalState`

## Installation

```bash
pnpm add @preact/signals-core @unsignal/react immer
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

### `Observer`

A render-prop component for inline reactive fragments.

```ts
import type { FunctionComponent, ReactNode } from 'react';

interface ObserverProps {
  children: () => ReactNode;
}

const Observer: FunctionComponent<ObserverProps>;
```

### `Show`

Conditionally renders `when` or `fallback` with reactive signal tracking.

```ts
import type { ReactNode } from 'react';
import type { ReadonlySignal } from '@preact/signals-core';

interface ShowProps<T> {
  when: ReadonlySignal<T> | T;
  fallback?: ReactNode;
  children: (value: T) => ReactNode;
}

function Show<T>(props: ShowProps<T>): ReactNode;
```

### `For`

Renders a reactive list from a signal-backed collection with keyed item tracking.

```ts
import type { ReactNode } from 'react';
import type { ReadonlySignal } from '@preact/signals-core';

interface ForProps<T> {
  each: ReadonlySignal<readonly T[]> | readonly T[];
  by?: (item: T, index: number) => React.Key;
  fallback?: ReactNode;
  children: (item: T, index: number) => ReactNode;
}

function For<T>(props: ForProps<T>): ReactNode;
```

### `Switch`

Matches reactive cases and renders the first matching branch.

```ts
import type { ReactNode } from 'react';
import type { ReadonlySignal } from '@preact/signals-core';

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

### `useSignalValue`

Reads the current value from a signal and subscribes to changes.

```ts
import type { ReadonlySignal } from '@preact/signals-core';

function useSignalValue<T>(source: ReadonlySignal<T>): T;
```

### `useSignalState`

Read-write hook for writable signals with immer-powered mutation support.

```ts
import type { Signal } from '@preact/signals-core';

type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

function useSignalState<T>(signal: Signal<T>): [T, Mutator<T>];
```

- For primitives, pass a new value or `(prev) => next`
- For objects and arrays, pass an immer producer

### `useSignalEffect`

Runs a side effect that automatically tracks signal dependencies and supports cleanup.

```ts
import type { EffectOptions } from '@preact/signals-core';

function useSignalEffect(callback: () => void | (() => void), options?: EffectOptions): void;
```

### `useLiveSignal`

Bridges a React-owned value into a readonly signal.

```ts
import type { ReadonlySignal } from '@preact/signals-core';

interface UseLiveSignalOptions<T> {
  equals?: (previous: T, next: T) => boolean;
}

function useLiveSignal<T>(value: T, options?: UseLiveSignalOptions<T>): ReadonlySignal<T>;
```

## License

MIT
