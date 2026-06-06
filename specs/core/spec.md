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
