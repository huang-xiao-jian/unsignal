# @unsignal/vue

## Business Objective

Provide [mobx-vue-lite](https://github.com/mobxjs/mobx-vue-lite/tree/master)-style `@preact/signals-core` reactive bridging capabilities

## Business Requirements

- Support `Vue 3`, **explicitly incompatible with lower versions!!!**
- Support `SSR` mode
- Complete `TypeScript` type declarations

## Business Design

### Design Principles

- Bridge `@preact/signals-core`'s `Signal` into a `ShallowRef` recognizable by the `Vue 3` reactive system, enabling seamless usage of `Signal` in templates, `watch`, `computed`, and other scenarios
- Focused complementary functionality, without duplicating `@preact/signals-core`'s existing primitives (`signal` / `computed` / `effect`); `APIs` are not re-exported
- Only use `@preact/signals-core` public APIs (`signal` / `computed` / `effect` / `batch` / `untracked` / `peek`), **usage of the non-public `subscribe()` method is strictly prohibited**
- Use `effect()` to implement Signal → Vue reactive system bridging: read `signal.value` inside the `effect` callback to establish dependency tracking; when the signal changes, `effect` automatically re-executes and syncs the new value to `shallowRef`
- All `signal` subscriptions are automatically managed, cleaned up via the `dispose` function returned by `effect()` through `onScopeDispose`, preventing memory leaks

### API Reference

#### `useSignalValue`

Bridges `Signal<T>` into a `Readonly ShallowRef<T>`. Automatically tracks `signal` changes and syncs them to the `Vue` reactive system

```ts
import type { ShallowRef } from 'vue';
import type { ReadonlySignal } from '@preact/signals-core';

function useSignalValue<T>(source: ReadonlySignal<T>): Readonly<ShallowRef<T>>;
```

**Usage Example:**

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

#### `useSignalState`

Bridges a writable `Signal<T>` into a `Vue` readonly `ShallowRef<T>`, providing read-write capabilities. Internally integrates `immer` to support mutable-style updates; `immer` is a required `peerDependency`

```ts
import type { ShallowRef } from 'vue';
import type { Signal } from '@preact/signals-core';

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

**Objects / arrays — use mutable style (`void`):**

```vue
<script setup lang="ts">
import { signal } from '@preact/signals-core';
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

#### `SignalPlugin`

Implements a `Vue` plugin. After global registration, the `Observer` component is available globally without per-file imports

```ts
import type { Plugin as VuePlugin } from 'vue';

export const SignalPlugin: VuePlugin;
```

#### `Observer`

Renderless `Vue` component that wraps the default slot into a reactive rendering fragment. When `signal` reads inside the slot change, only that fragment re-renders, without affecting the parent component

**Usage Example:**

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

**Global plugin registration:**

```ts
import { createApp } from 'vue';
import { SignalPlugin } from '@unsignal/vue';
import App from './App.vue';

const app = createApp(App);

app.use(SignalPlugin);
app.mount('#app');
```

### Vue Reactive System Integration

The `ShallowRef` returned by `useSignalValue` integrates seamlessly with the `Vue` ecosystem:

```ts
import { watch, computed as vueComputed } from 'vue';
import { signal } from '@preact/signals-core';
import { useSignalValue } from '@unsignal/vue';

const count = signal(0);

const value = useSignalValue(count);

watch(value, (newVal) => {
  console.log('count changed:', newVal);
});

const label = vueComputed(() => `Count is ${value.value}`);
```
