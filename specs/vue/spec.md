# @unsignal/vue

## 业务目标

提供类似于 [mobx-vue-lite](https://github.com/mobxjs/mobx-vue-lite/tree/master) 风格的 `@preact/signals-core` 响应式桥接能力

## 业务指标

- 支持 `Vue 3` 版本，**明确不兼容低版本!!!**
- 支持 `SSR` 模式
- 类型 `Typescript` 声明完备

## 业务设计

### 设计原则

- 将 `@preact/signals-core` 的 `Signal` 桥接为 `Vue 3` 响应式系统可识别的 `ShallowRef`，使 `Signal` 在模板、`watch`、`computed` 等场景中无缝使用
- 功能聚焦互补，不重复 `@preact/signals-core` 已有的基础原语（`signal` / `computed` / `effect`），`API` 不进行重导出
- 仅使用 `@preact/signals-core` 公开 API（`signal` / `computed` / `effect` / `batch` / `untracked` / `peek`），**禁止使用未公开的 `subscribe()` 方法**
- 使用 `effect()` 实现 Signal → Vue 响应式系统的桥接：在 `effect` 回调中读取 `signal.value` 建立依赖追踪，信号变化时 `effect` 自动重新执行，将新值同步到 `shallowRef`
- 自动管理所有 `signal` 订阅，通过 `onScopeDispose` 调用 `effect()` 返回的 `dispose` 函数清理，避免内存泄漏

### API Reference

#### `useSignalValue`

将 `Signal<T>` 桥接为 `Readonly ShallowRef<T>`。自动追踪 `signal` 变化并同步到 `Vue` 响应式系统

```ts
import type { ShallowRef } from 'vue';
import type { ReadonlySignal } from '@preact/signals-core';

function useSignalValue<T>(source: ReadonlySignal<T>): Readonly<ShallowRef<T>>;
```

**用法示例：**

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

将可写 `Signal<T>` 桥接为 `Vue` 只读 `ShallowRef<T>`，提供读写能力。内部集成 `immer` 支持可变式更新，`immer` 为必选 `peerDependency`

```ts
import type { ShallowRef } from 'vue';
import type { Signal } from '@preact/signals-core';

type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

function useSignalState<T>(source: Signal<T>): [Readonly<ShallowRef<T>>, Mutator<T>];
```

**行为说明：**

- `Mutator` 支持两种写法：
  - `(draft: T) => void`：可变式，适用于对象 / 数组，内部自动生成不可变值
  - `(draft: T) => T`：返回新值，适用于原始类型（`number` / `string` / `boolean` 等）
- 组件卸载时自动清理 `signal` 订阅

**用法示例：**

**原始类型，必须显式返回新值：**

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

**对象 / 数组，使用可变式写法（`void`）：**

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

#### SignalPlugin

实现 `Vue` 插件，全局注册后 `Observer` 组件可全局使用，无需逐文件导入

```ts
import type { Plugin as VuePlugin } from 'vue';

export const SignalPlugin: VuePlugin;
```

#### `Observer`

无渲染 `Vue` 组件，将默认插槽包装为响应式渲染片段。插槽内读取的 `signal` 变化时仅触发该片段重渲染，不影响父组件

**用法示例：**

**局部注册：**

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

**全局插件注册：**

```ts
import { createApp } from 'vue';
import { SignalPlugin } from '@unsignal/vue';
import App from './App.vue';

const app = createApp(App);

app.use(SignalPlugin);
app.mount('#app');
```

### Vue 响应式系统集成

`useSignalValue` 返回的 `ShallowRef` 可与 `Vue` 生态无缝协作：

```ts
import { watch, computed as vueComputed } from 'vue';
import { signal } from '@preact/signals-core';
import { useSignalValue } from '@unsignal/vue';

const count = signal(0);

// 在 setup 中使用
const value = useSignalValue(count);

// 配合 Vue watch
watch(value, (newVal) => {
  console.log('count changed:', newVal);
});

// 配合 Vue computed
const label = vueComputed(() => `Count is ${value.value}`);
```
