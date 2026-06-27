# @unsignal/vue

> Signal binding for Vue 3, powered by [`@unsignal/baseline`](https://github.com/preactjs/signals/tree/main/packages/core).

Provides `mobx-vue-lite`-style reactive bridging between `@unsignal/baseline` and Vue 3's reactivity system.

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
- `@unsignal/baseline >= 1.14`
- `immer >= 11` for `useSignalState`

## Installation

```bash
pnpm add @unsignal/baseline @unsignal/vue immer
```

## API

### `useSignalValue`

Bridges a `Signal<T>` into a `Readonly<ShallowRef<T>>`.

```ts
import type { ReadonlySignal } from '@unsignal/baseline';
import type { Readonly, ShallowRef } from 'vue';

function useSignalValue<T>(source: ReadonlySignal<T>): Readonly<ShallowRef<T>>;
```

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

Bridges a writable `Signal<T>` into a readonly `ShallowRef<T>` plus a mutator.

```ts
import type { Signal } from '@unsignal/baseline';
import type { Readonly, ShallowRef } from 'vue';

type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

function useSignalState<T>(source: Signal<T>): [Readonly<ShallowRef<T>>, Mutator<T>];
```

**Primitive types:**

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

**Objects / arrays with immer:**

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

A renderless component that tracks signal reads in its default slot.

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

Registers `Observer` globally for app-wide usage.

```ts
import { createApp } from 'vue';
import { SignalPlugin } from '@unsignal/vue';
import App from './App.vue';

const app = createApp(App);

app.use(SignalPlugin);
app.mount('#app');
```

## Vue Reactivity Integration

The `ShallowRef` returned by `useSignalValue` works with `watch`, `computed`, and templates.

```ts
import { watch, computed as vueComputed } from 'vue';
import { signal } from '@unsignal/baseline';
import { useSignalValue } from '@unsignal/vue';

const count = signal(0);

// Use in setup
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
