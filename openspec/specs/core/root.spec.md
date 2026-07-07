# @unsignal/core

## Goal

`@unsignal/core` defines the framework-agnostic reactive utility layer for the `unsignal` ecosystem, which provide clear, typed, lifecycle-aware utilities for common reactive patterns

## Principles

- Prefer explicit lifecycle handles over hidden global behavior.
- Prefer explicit cleanup, cancellation, and disposal without deep thinking.
- Prefer framework bindings agnostic and prohibit depending on browser or framework-specific behavior.

## API Reference

### `Disposable`

The uniform resource-oriented handler across tge `unsignal` family to stop reactive tracking and cleans up side effects

```ts
import type { Disposable } from '@unsignal/baseline';
```

### `OnCleanup`

Utility type for registering cleanup functions, used for cleaning up side effects such as async tasks

```ts
type OnCleanup = (cleanupFn: () => void) => void;
```

### `reaction`

```ts
function reaction(fn: () => void, callback: () => void): Disposable;
```

**Behavior:**

- The `fn` parameter behaves exactly the same as `effect(fn)`: executes immediately, automatically tracks `signal` dependencies read inside, and re-executes when dependencies change
- The `callback` parameter: only called when `fn` re-executes due to dependency changes, **not triggered on initial execution**, and **the callback function does not trigger dependency tracking**

**Usage Example:**

```ts
import { signal } from '@unsignal/baseline';
import { reaction } from '@unsignal/core';

const count = signal(0);

const disposable = reaction(
  () => {
    console.log('count is:', count.value);
  },
  () => {
    console.log('count changed!');
  }
);

// Initial execution: only outputs "count is: 0", callback not triggered
count.value = 1;
// Outputs "total changed to: 1"

count.value = 2;
// Outputs "total changed to: 2"

// explicitly abort the reaction
disposable.dispose();

count.value = 3;
// No output, tracking has been stopped
```

### `readonly`

```ts
function readonly<T>(source: Signal<T>): ReadonlySignal<T>;
function readonly<T>(source: ReadonlySignal<T>): ReadonlySignal<T>;
```

**Behavior:**

- The `source` parameter: a `Signal<T>` or `ReadonlySignal<T>` instance
- When `source` is already a `ReadonlySignal<T>`, return the original instance
- When `source` is not a `ReadonlySignal<T>`, returns a new `ReadonlySignal<T>` created via reactive derivation from `source.value`

**Usage Example:**

```ts
import { signal } from '@unsignal/baseline';
import { readonly } from '@unsignal/core';

const count = signal(0);
const ro = readonly(count);

console.log(ro.value); // 0

count.value = 1;
console.log(ro.value); // 1

// ro.value = 2; // Type error: cannot assign to a readonly signal
```

**Usage Example:**

```ts
import { signal, computed } from '@unsignal/baseline';
import { readonly } from '@unsignal/core';

const count = signal(0);
const doubled = computed(() => count.value * 2);

// ro1 !== count
const ro1 = readonly(count);
// ro2 === doubled
const ro2 = readonly(doubled);
```

### `asReadonly`

```ts
function asReadonly<T>(value: T): ShallowReadonlySignals<T>;
function asReadonly<T>(value: T, options: { deep: true }): DeepReadonlySignals<T>;
```

**Behavior:**

- The `value` parameter may be a `Signal<T>`, `ReadonlySignal<T>`, `Object Literal`, or `Class Instance`
- Uses shallow projection by default, supports deep projection when `options.deep` is `true`
- Narrows signal-valued members to `ReadonlySignal` at the type level only, it doesn't create derived signal wrappers, freeze objects, or clone object graphs, it just returns the same runtime value that was passed in

**Usage Example:**

Expose a signal through a readonly type without wrapping

```ts
import { signal } from '@unsignal/baseline';
import { asReadonly } from '@unsignal/core';

const count = signal(0);
const ro = asReadonly(count);

console.log(ro === count); // true
console.log(ro.value); // 0
```

**Usage Example:**

Narrow signal-bearing members on an object

```ts
import { signal } from '@unsignal/baseline';
import { asReadonly } from '@unsignal/core';

const counter = {
  count: signal(0),
  nested: {
    total: signal(1),
  },
};

const shallowCounter = asReadonly(counter);
const deepCounter = asReadonly(counter, { deep: true });

// shallowCounter.count is readonly, nested.total keeps its original type
// deepCounter.nested.total is also readonly
```

### `watchEffect`

```ts
function watchEffect(fn: (onCleanup: OnCleanup) => void): Disposable;
```

**Behavior:**

- The `fn` parameter: executes immediately, automatically tracks `signal` dependencies read inside, and re-executes when dependencies change
- The `onCleanup` parameter: registers a cleanup function that is called **before the next fn re-execution** or **when the reaction is disposed**, used for canceling stale async tasks and other side effects

**Usage Example:**

```ts
import { signal } from '@unsignal/baseline';
import { watchEffect } from '@unsignal/core';

const userId = signal(1);

const disposable = watchEffect((onCleanup) => {
  const controller = new AbortController();

  fetch(`/api/users/${userId.value}`, { signal: controller.signal })
    .then((res) => res.json())
    .then((data) => {
      // Handle data
    });

  // Register cleanup: cancel request before next re-execution or on dispose
  onCleanup(() => controller.abort());
});

userId.value = 2;
// Previous request is aborted, new request is initiated

disposable.dispose();
// Current request is aborted
```

### `watch`

```ts
function watch<T>(
  source: ReadonlySignal<T> | (() => T),
  callback: WatchCallback<T>,
  options?: WatchOptions
): Disposable;

type WatchCallback<T> = (value: T, oldValue: T, onCleanup: OnCleanup) => void;

interface WatchOptions {
  immediate?: boolean;
}
```

**Behavior:**

- The `source` parameter: the watch source, can be a `ReadonlySignal<T>` or a `getter` function returning `T`
- The `callback` parameter: called when the return value of `source` changes, receiving the new value `value`, old value `oldValue`, and the `onCleanup` registration function
- The `onCleanup` parameter: registers a cleanup function that is called **before the next fn re-execution** or **when the reaction is disposed**, used for canceling stale async tasks and other side effects
- Lazy execution by default: does not immediately call `callback` upon creation, only triggers after `source` changes
- Option `immediate: true`: immediately calls `callback` once with the current value as `value` upon creation, with `oldValue` as `undefined`
- Change detection is based on `Object.is` semantic comparison of `source` return values

**Usage Example:**

```ts
import { signal } from '@unsignal/baseline';
import { watch } from '@unsignal/core';

const count = signal(0);

const disposable = watch(
  () => count.value,
  (value, oldValue) => {
    console.log(`count: ${oldValue} -> ${value}`);
  }
);

// Initial execution: no output (lazy)
count.value = 1;
// Outputs "count: 0 -> 1"

count.value = 2;
// Outputs "count: 1 -> 2"

disposable.dispose();
// Dispose the watch reaction

count.value = 3;
// No extra output!
```
