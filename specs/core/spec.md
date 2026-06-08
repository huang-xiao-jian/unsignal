# @unsignal/core

## 业务目标

扩展 `@preact/signals-core` API

## 业务指标

- 框架无关，核心响应式工具函数
- 类型 `Typescript` 声明完备

## 业务设计

### 设计原则

- 功能作为 `@preact/signals-core` 补充，不重复其已有 API（`signal` / `effect` / `computed` 等）
- 仅使用 `@preact/signals-core` 公开 API（`signal` / `computed` / `effect` / `batch` / `untracked` / `peek`），**禁止使用未公开的方法！**

### Types

#### `DisposerFn`

停止响应式追踪并清理副作用的函数类型

```ts
type DisposerFn = () => void;
```

#### `OnCleanup`

注册清理函数的工具类型，用于异步任务等副作用的清理

```ts
type OnCleanup = (cleanupFn: () => void) => void;
```

### API Reference

#### `reaction`

```ts
function reaction(fn: () => void, callback: () => void): DisposerFn;
```

**行为说明：**

- 参数 `fn` 与 `effect(fn)` 行为完全一致：立即执行，自动追踪内部读取的 `signal` 依赖，依赖变化时重新执行
- 参数 `callback`：仅在 `fn` 因依赖变化而重新执行时调用，**首次执行不触发**，以及 **回调函数不触发依赖追踪**
- 返回 `DisposerFn`，语义见类型声明

**用法示例：追踪 `signal` 变化并执行回调**

```ts
import { signal } from '@preact/signals-core';
import { reaction } from '@unsignal/core';

const count = signal(0);

const dispose = reaction(
  () => {
    console.log('count is:', count.value);
  },
  () => {
    console.log('count changed!');
  }
);

// 首次执行：仅输出 "count is: 0"，不触发回调
count.value = 1;
// 输出 "count is: 1"
// 输出 "count changed!"

count.value = 2;
// 输出 "count is: 2"
// 输出 "count changed!"

dispose();
count.value = 3;
// 无输出，已停止追踪
```

#### `watchEffect`

```ts
function watchEffect(fn: (onCleanup: OnCleanup) => void): DisposerFn;
```

**行为说明：**

- 参数 `fn`：立即执行，自动追踪内部读取的 `signal` 依赖，依赖变化时重新执行
- 参数 `onCleanup`：注册清理函数，在 **下次 `fn` 重新执行前** 和 **`DisposerFn` 调用时** 被调用，用于取消过期的异步任务等副作用
- 返回 `DisposerFn`，语义见类型声明

**用法示例：异步任务清理**

```ts
import { signal } from '@preact/signals-core';
import { watchEffect } from '@unsignal/core';

const userId = signal(1);

const dispose = watchEffect((onCleanup) => {
  const controller = new AbortController();

  fetch(`/api/users/${userId.value}`, { signal: controller.signal })
    .then((res) => res.json())
    .then((data) => {
      // 处理数据
    });

  // 注册清理：下次重新执行前或 dispose 时取消请求
  onCleanup(() => controller.abort());
});

userId.value = 2;
// 上一次请求被 abort，发起新请求

dispose();
// 当前请求被 abort
```

#### `watch`

```ts
function watch<T>(
  source: ReadonlySignal<T> | (() => T),
  callback: WatchCallback<T>,
  options?: WatchOptions
): DisposerFn;

type WatchCallback<T> = (value: T, oldValue: T, onCleanup: OnCleanup) => void;

interface WatchOptions {
  immediate?: boolean;
}
```

**行为说明：**

- 参数 `source`：监听来源，可以是 `ReadonlySignal<T>` 或返回 `T` 的 `getter` 函数
- 参数 `callback`：当 `source` 的返回值发生变化时调用，接收新值 `value`、旧值 `oldValue` 与 `onCleanup` 注册函数
- 参数 `onCleanup`：注册清理函数，在 **下次 `callback` 重新执行前** 和 **`DisposerFn` 调用时** 被调用，用于取消过期的异步任务等副作用
- 默认惰性执行：创建时不立即调用 `callback`，仅在 `source` 变化后触发
- 选项 `immediate: true`：创建时立即以当前值作为 `value` 调用一次 `callback`，`oldValue` 为 `undefined`
- 变化检测基于 `Object.is` 语义比较 `source` 返回值
- 返回 `DisposerFn`，语义见类型声明

**用法示例：监听 getter 返回值变化**

```ts
import { signal } from '@preact/signals-core';
import { watch } from '@unsignal/core';

const count = signal(0);

const dispose = watch(
  () => count.value,
  (value, oldValue) => {
    console.log(`count: ${oldValue} -> ${value}`);
  }
);

// 首次执行：无输出（惰性）
count.value = 1;
// 输出 "count: 0 -> 1"

count.value = 2;
// 输出 "count: 1 -> 2"

dispose();
count.value = 3;
// 无输出，已停止追踪
```

**用法示例：监听 `ReadonlySignal` 变化**

```ts
import { signal, computed } from '@preact/signals-core';
import { watch } from '@unsignal/core';

const count = signal(0);
const doubled = computed(() => count.value * 2);

const dispose = watch(doubled, (value, oldValue) => {
  console.log(`doubled: ${oldValue} -> ${value}`);
});

count.value = 1;
// 输出 "doubled: 0 -> 2"

count.value = 2;
// 输出 "doubled: 2 -> 4"

dispose();
```

**用法示例：异步任务清理**

```ts
import { signal } from '@preact/signals-core';
import { watch } from '@unsignal/core';

const userId = signal(1);

const dispose = watch(
  () => userId.value,
  (id, _oldId, onCleanup) => {
    const controller = new AbortController();

    fetch(`/api/users/${id}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        // 处理数据
      });

    // 注册清理：下次回调执行前或 dispose 时取消请求
    onCleanup(() => controller.abort());
  }
);

userId.value = 2;
// 上一次请求被 abort，发起新请求

dispose();
// 当前请求被 abort
```

**用法示例：`immediate` 选项**

```ts
import { signal } from '@preact/signals-core';
import { watch } from '@unsignal/core';

const count = signal(0);

const dispose = watch(
  () => count.value,
  (value, oldValue) => {
    console.log(`count: ${oldValue} -> ${value}`);
  },
  { immediate: true }
);
// 立即输出 "count: undefined -> 0"

count.value = 1;
// 输出 "count: 0 -> 1"

dispose();
```
