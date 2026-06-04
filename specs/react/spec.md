# @unsignal/react

## 业务目标

提供类似于 [mobx-react-lite](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react-lite) 风格的 `@preact/signals-core` 响应式桥接能力

## 业务指标

- 支持 `React 19+` 版本，**明确不兼容低版本!!!**
- 支持 `SSR` 模式（业务方需要主动开启）
- 支持 `Function Component`，明确不支持 `Class Component`
- 不支持废弃特性，包括：`forwardRef` / `contextTypes`
- 类型 `Typescript` 声明完备

## 业务设计

### 设计原则

- 功能与 `@preact/signals-react` 互补，不重复其已有 API（`useSignal` / `useComputed` / `useSignalEffect` / `useSignals`），API 不进行重导出
- 仅使用 `@preact/signals-core` 公开 API（`signal` / `computed` / `effect` / `batch` / `untracked` / `peek`），**禁止使用未公开的 `subscribe()` 方法**
- `observer` 实现基于 `React.useSyncExternalStore` + `effect()` 依赖追踪：使用 `useSyncExternalStore` 订阅外部信号变化，`effect()` 在渲染阶段自动追踪组件读取的 `signal` 依赖，信号变化时触发重渲染

### API Reference

#### `observer`

将 `Function Component` 包装为响应式组件。渲染时自动追踪组件内读取的 `signal`，任一 `signal` 变化触发重渲染

```ts
interface ObserverOptions {
  displayName?: string;
}

function observer<P extends object>(
  component: FunctionComponent<P>,
  options?: ObserverOptions
): FunctionComponent<P>;
```

**行为说明：**

- 渲染阶段自动收集组件函数体内读取的 `signal` 依赖，追踪 `signal` 变化时触发组件重渲染
- 内部使用 `useSyncExternalStore` 订阅信号变化，天然支持 `React 19` 并发模式（`Concurrent Mode`）
- 自动 `memoization` 用以提高性能，`observer` 包装后的组件默认行为等价于 `React.memo`

**用法示例：**

```tsx
import { signal } from '@preact/signals-core';
import { observer } from '@unsignal/react';

const count = signal(0);

const Counter = observer(function Counter() {
  return <p>Count: {count.value}</p>;
});
```

#### `Observer`

`Render prop` 组件，用于在组件树中内联响应式渲染片段，适用于需要在非 `observer wrapped` 组件中局部使用 `signal` 的场景

```ts
interface ObserverProps {
  children: () => ReactNode;
}

const Observer: FunctionComponent<ObserverProps>;
```

**用法示例：**

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

用于从外部 `Signal` 读取当前值并订阅变化。无需 `observer` 包装，单独使用即可实现响应式重渲染

```ts
import type { ReadonlySignal } from '@preact/signals-core';

function useSignalValue<T>(signal: ReadonlySignal<T>): T;
```

**行为说明：**

- 支持 `ReadonlySignal`（包括 `computed` 返回值）

**用法示例：**

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

用于读写外部可写 `Signal`，API 风格类似 `useState`。内部集成 `immer` 支持可变式更新，简化复杂状态的更新负担`immer` 为必选 `peerDependency`。

```ts
type Mutator<T> = (updater: T | ((draft: T) => T | void)) => void;

function useSignalState<T>(signal: Signal<T>): [T, Mutator<T>];
```

**行为说明：**

- 外部通过 `Mutator` 函数修改
- 仅支持可写 `Signal`，不支持 `ReadonlySignal`（如 `computed` 返回值）
- `immer` 为必选 `peerDependency`，`Mutator` 支持两种写法：
  - `(draft: T) => void`：可变式，适用于对象 / 数组，内部自动生成不可变值
  - `(draft: T) => T`：返回新值，适用于原始类型（`number` / `string` / `boolean` 等）

**用法示例：**

**原始类型，必须显式返回新值：**

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

**对象 / 数组，使用可变式写法（`void`）：**

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
    // immer producer：可变式写法，内部自动生成不可变值
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
