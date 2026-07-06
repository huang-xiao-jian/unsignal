# @unsignal/vue

Signal bindings for Vue 3 with built-in **Signal Primitivies**

## Requirements

- `vue >= 3.5`
- `immer >= 11`
- `@unsignal/baseline`

## Installation

```bash
pnpm add @unsignal/baseline @unsignal/vue vue immer
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
import { computed, signal } from '@unsignal/baseline';
import { useSignalValue } from '@unsignal/vue';

const count = signal(0);
const doubled = computed(() => count.value * 2);

const value = useSignalValue(count);
const doubledValue = useSignalValue(doubled);
</script>

<template>
  <p>{{ value }} x 2 = {{ doubledValue }}</p>
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

### `Observer`

Renderless component that tracks signal reads in its default slot.

```vue
<script setup lang="ts">
import { signal } from '@unsignal/baseline';
import { Observer } from '@unsignal/vue';

const count = signal(0);
</script>

<template>
  <Observer>
    <p>Count: {{ count.value }}</p>
  </Observer>
</template>
```

### `SignalPlugin`

Vue plugin that registers `Observer` globally.

```ts
import { createApp } from 'vue';
import { SignalPlugin } from '@unsignal/vue';
import App from './App.vue';

const app = createApp(App);

app.use(SignalPlugin);
app.mount('#app');
```

## Vue Integration

The `ShallowRef` returned by `useSignalValue()` works with `templates`, `watch`,
and Vue `computed`.

```ts
import { computed as vueComputed, watch } from 'vue';
import { signal } from '@unsignal/baseline';
import { useSignalValue } from '@unsignal/vue';

const count = signal(0);
const value = useSignalValue(count);

watch(value, (newValue) => {
  console.log('count changed:', newValue);
});

const label = vueComputed(() => `Count is ${value.value}`);
```

## License

MIT
