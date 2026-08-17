# @unsignal/vue

## Goal

Provide [mobx-vue-lite](https://github.com/mobxjs/mobx-vue-lite/tree/master) style reactive bridging capabilities

## Principles

- Convenient lifecycle and teardown management for preventing memory leaks

## Compatibility

- Support `Vue 3`, **explicitly incompatible with lower versions!!!**

## API Reference

### `useSignalValue`

Bridges `Signal<T>` into a `Readonly ShallowRef<T>`. Automatically tracks `Signal` changes and syncs them to the `Vue` reactive system

```ts
import type { ShallowRef } from 'vue';
import type { ReadonlySignal } from '@unsignal/baseline';

function useSignalValue<T>(source: ReadonlySignal<T>): Readonly<ShallowRef<T>>;
```

**Usage Example:**

```vue
<script setup lang="ts">
import { signal, computed } from '@unsignal/baseline';
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

Bridges a writable `Signal<T>` into a `Vue` readonly `ShallowRef<T>`, providing read-write capabilities. Internally integrates `immer` to support mutable-style updates

```ts
import type { ShallowRef } from 'vue';
import type { Signal } from '@unsignal/baseline';

type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

function useSignalState<T>(source: Signal<T>): [Readonly<ShallowRef<T>>, Mutator<T>];
```

**Behavior:**

- `Mutator` supports two styles:
  - `(draft: T) => void`: mutable style, suitable for objects / arrays, internally generates immutable values automatically
  - `(draft: T) => T`: returns a new value, suitable for primitive types (`number` / `string` / `boolean`, etc.)
- Automatically cleans up `signal` subscriptions when the component is unmounted

**Usage Example:**

**Primitive types — must explicitly return a new value:**

```vue
<script setup lang="ts">
import { signal } from '@unsignal/baseline';
import { useSignalState } from '@unsignal/vue';

const count = signal(0);
const [value, mutate] = useSignalState(count);
</script>

<template>
  <p>{{ value }}</p>
  <button @click="mutate((v) => v + 1)">+1</button>
</template>
```

**Objects / arrays — use mutable style (`void`):**

```vue
<script setup lang="ts">
import { signal } from '@unsignal/baseline';
import { useSignalState } from '@unsignal/vue';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const todos = signal<Todo[]>([]);
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
      {{ item.text }} {{ item.done ? '⚡️' : '📦️' }}
    </li>
  </ul>
</template>
```

### `Observer`

Renderless `Vue` component that wraps the default slot into a reactive rendering fragment. When `Signal` reads inside the slot change, only that fragment re-renders, without affecting the parent component

**Usage Example:**

**Local registration:**

```vue
<script setup lang="ts">
import { signal } from '@unsignal/baseline';
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

Implements a `Vue` plugin. After global registration, the `Observer` component is available globally without per-file imports

```ts
import type { Plugin as VuePlugin } from 'vue';

export const SignalPlugin: VuePlugin;
```

**Global plugin registration:**

```ts
import { createApp } from 'vue';
import { SignalPlugin } from '@unsignal/vue';
import App from './App.vue';

const app = createApp(App);

app.use(SignalPlugin);
app.mount('#app');
```

## Vue Reactive System Integration

The `ShallowRef` returned by `useXXX` integrates seamlessly with the `Vue` ecosystem:

```ts
import { watch, computed as vueComputed } from 'vue';
import { signal } from '@unsignal/baseline';
import { useSignalValue } from '@unsignal/vue';

const count = signal(0);

const value = useSignalValue(count);

watch(value, (newVal) => {
  console.log('count changed:', newVal);
});

const label = vueComputed(() => `Count is ${value.value}`);
```
