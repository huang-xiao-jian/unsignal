# @unsignal/vue

> Signal binding for Vue 3, powered by [@preact/signals-core](https://github.com/preactjs/signals/tree/main/packages/core).

Provides [mobx-vue-lite](https://github.com/mobxjs/mobx-vue-lite/tree/master) style reactive bridging — converts `Signal` into Vue 3's `ShallowRef`, making signals work seamlessly in templates, `watch`, `computed`, and the entire Vue reactivity ecosystem.

## Features

- Transparent signal-to-`ShallowRef` bridging via `useSignalValue`
- Read-write state with immer-powered `useSignalState` hook
- Fine-grained reactivity with `Observer` renderless component
- Global registration via `SignalPlugin`
- Automatic subscription cleanup via `onScopeDispose`
- SSR compatible
- TypeScript first-class

## Requirements

- **Vue >= 3.5**
- `@preact/signals-core >= 1.14`
- `immer >= 11` (required peer dependency for `useSignalState`)

## Installation

```bash
pnpm add @preact/signals-core @unsignal/vue immer
```

## API

### `useSignalValue`

Bridges a `Signal<T>` into a `Readonly<ShallowRef<T>>`. Automatically tracks signal changes and syncs them into Vue's reactivity system.

```ts
function useSignalValue<T>(source: ReadonlySignal<T>): Readonly<ShallowRef<T>>;
```

- Accepts `ReadonlySignal` (including `computed` results)
- Works with Vue's `watch`, `computed`, and template bindings out of the box

```vue
<script setup lang="ts">
import { signal, computed } from '@preact/signals-core';
import { useSignalValue } from '@unsignal/vue';

const count = signal(0);
const doubled = computed(() => count.value * 2);

const value = useSignalValue(count);
const doubledValue = useSignalValue(doubled);
</script>

<template>
  <p>{{ value }} x 2 = {{ doubledValue }}</p>
  <button @click="count.value++">+1</button>
</template>
```

### `useSignalState`

Read-write hook for writable signals. Integrates `immer` for ergonomic mutable-style updates on complex state.

```ts
type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

function useSignalState<T>(source: Signal<T>): [Readonly<ShallowRef<T>>, Mutator<T>];
```

- `Mutator` supports two styles:
  - `(draft: T) => void` — mutable style for objects/arrays (powered by immer)
  - `(draft: T) => T` — return new value, for primitives
- Automatic subscription cleanup on component unmount

**Primitives — must return a new value:**

```vue
<script setup lang="ts">
import { signal } from '@preact/signals-core';
import { useSignalState } from '@unsignal/vue';

const count = signal(0);
const [value, mutate] = useSignalState(count);
</script>

<template>
  <p>{{ value }}</p>
  <button @click="mutate((v) => v + 1)">+1</button>
</template>
```

**Objects / arrays — mutable style (immer):**

```vue
<script setup lang="ts">
import { signal } from '@preact/signals-core';
import { useSignalState } from '@unsignal/vue';

const todos = signal<{ id: number; text: string; done: boolean }[]>([]);
const [items, mutate] = useSignalState(todos);

function onToggle(id: number) {
  mutate((draft) => {
    const todo = draft.find((t) => t.id === id);
    if (todo) todo.done = !todo.done;
  });
}
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id" @click="onToggle(item.id)">
      {{ item.text }} {{ item.done ? '✓' : '' }}
    </li>
  </ul>
</template>
```

### `Observer`

A renderless Vue component that wraps its default slot into a reactive render fragment. Signal reads inside the slot are automatically tracked — only the slot re-renders when signals change, not the parent component.

**Local registration:**

```vue
<script setup lang="ts">
import { signal } from '@preact/signals-core';
import { Observer } from '@unsignal/vue';

const count = signal(0);
</script>

<template>
  <div>
    <h1>Static Header</h1>
    <Observer>
      <p>Count: {{ count.value }}</p>
    </Observer>
    <button @click="count.value++">+1</button>
  </div>
</template>
```

### `SignalPlugin`

A Vue plugin that globally registers the `Observer` component, so you don't need to import it in every file.

```ts
import { createApp } from 'vue';
import { SignalPlugin } from '@unsignal/vue';
import App from './App.vue';

const app = createApp(App);
app.use(SignalPlugin);
app.mount('#app');
```

## Vue Reactivity Integration

The `ShallowRef` returned by `useSignalValue` integrates seamlessly with Vue's reactivity ecosystem:

```ts
import { watch, computed as vueComputed } from 'vue';
import { signal } from '@preact/signals-core';
import { useSignalValue } from '@unsignal/vue';

const count = signal(0);
const value = useSignalValue(count);

// Works with Vue watch
watch(value, (newVal) => {
  console.log('count changed:', newVal);
});

// Works with Vue computed
const label = vueComputed(() => `Count is ${value.value}`);
```

## License

MIT
