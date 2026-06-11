# @unsignal/vue

> Signal binding for Vue 3, powered by [`@preact/signals-core`](https://github.com/preactjs/signals/tree/main/packages/core).

Provides `mobx-vue-lite`-style reactive bridging between `@preact/signals-core` and Vue 3's reactivity system.

## Features

- Signal-to-`ShallowRef` bridging via `useSignalValue`
- Read-write state with `useSignalState`
- Renderless reactive `Observer`
- Global registration via `SignalPlugin`
- Automatic cleanup with `onScopeDispose`
- SSR compatible
- TypeScript first-class

## Requirements

- **Vue >= 3.5**
- `@preact/signals-core >= 1.14`
- `immer >= 11` for `useSignalState`

## Installation

```bash
pnpm add @preact/signals-core @unsignal/vue immer
```

## API

### `useSignalValue`

Bridges a `Signal<T>` into a `Readonly<ShallowRef<T>>`.

```ts
import type { ReadonlySignal } from '@preact/signals-core';
import type { Readonly, ShallowRef } from 'vue';

function useSignalValue<T>(source: ReadonlySignal<T>): Readonly<ShallowRef<T>>;
```

### `useSignalState`

Bridges a writable `Signal<T>` into a readonly `ShallowRef<T>` plus a mutator.

```ts
import type { Signal } from '@preact/signals-core';
import type { Readonly, ShallowRef } from 'vue';

type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

function useSignalState<T>(source: Signal<T>): [Readonly<ShallowRef<T>>, Mutator<T>];
```

### `Observer`

A renderless component that tracks signal reads in its default slot.

### `SignalPlugin`

Registers `Observer` globally for app-wide usage.

## Vue Reactivity Integration

The `ShallowRef` returned by `useSignalValue` works with `watch`, `computed`, and templates.

## License

MIT
