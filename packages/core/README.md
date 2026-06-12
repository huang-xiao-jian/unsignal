# @unsignal/core

Framework-agnostic reactive utilities that extend [`@preact/signals-core`](https://github.com/preactjs/signals/tree/main/packages/core).

## Installation

```bash
pnpm add @unsignal/core
```

> `@preact/signals-core` is required as a peer dependency.

## API

### `reaction(fn, callback)`

Track signal dependencies in `fn` and invoke `callback` when they change.

```ts
import type { DisposerFn } from '@unsignal/core';

function reaction(fn: () => void, callback: () => void): DisposerFn;
```

- `fn` behaves like `effect(fn)`: it executes immediately, auto-tracks signal dependencies, and re-executes when those dependencies change
- `callback` runs only on dependency changes, not on the initial execution
- `callback` runs untracked, so reads inside it do not create dependencies

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

// Initial execution: only outputs "count is: 0", callback not triggered
count.value = 1;
// Outputs "count is: 1"
// Outputs "count changed!"

count.value = 2;
// Outputs "count is: 2"
// Outputs "count changed!"

dispose();
count.value = 3;
// No output, tracking has been stopped
```

### `watchEffect(fn)`

Run a side effect that tracks signal dependencies and supports cleanup.

```ts
import type { DisposerFn, OnCleanup } from '@unsignal/core';

function watchEffect(fn: (onCleanup: OnCleanup) => void): DisposerFn;
```

- Executes immediately
- Re-runs when tracked dependencies change
- Calls cleanup before the next run and on disposal

```ts
import { signal } from '@preact/signals-core';
import { watchEffect } from '@unsignal/core';

const userId = signal(1);

const dispose = watchEffect((onCleanup) => {
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

dispose();
// Current request is aborted
```

### `watch(source, callback, options?)`

Watch a signal or getter and run a callback when the value changes.

```ts
import type { ReadonlySignal } from '@preact/signals-core';
import type { DisposerFn, OnCleanup } from '@unsignal/core';

type WatchCallback<T> = (value: T, oldValue: T, onCleanup: OnCleanup) => void;

interface WatchOptions {
  immediate?: boolean;
}

function watch<T>(
  source: ReadonlySignal<T> | (() => T),
  callback: WatchCallback<T>,
  options?: WatchOptions
): DisposerFn;
```

- Supports both `ReadonlySignal<T>` and getter sources
- Lazy by default
- Supports `immediate: true`
- Uses `Object.is` for change detection

```ts
import { signal } from '@preact/signals-core';
import { watch } from '@unsignal/core';

const count = signal(0);

const dispose = watch(
  () => count.value,
  (value, oldValue) => {
    console.log(`${oldValue} -> ${value}`);
  }
);

// No output on creation (lazy by default)
count.value = 1;
// Outputs "0 -> 1"

count.value = 2;
// Outputs "1 -> 2"

dispose();
count.value = 3;
// No output, tracking has been stopped
```

**Watching a `ReadonlySignal`:**

```ts
import { signal, computed } from '@preact/signals-core';
import { watch } from '@unsignal/core';

const count = signal(0);
const doubled = computed(() => count.value * 2);

const dispose = watch(doubled, (value, oldValue) => {
  console.log(`doubled: ${oldValue} -> ${value}`);
});

count.value = 1;
// Outputs "doubled: 0 -> 2"

count.value = 2;
// Outputs "doubled: 2 -> 4"

dispose();
```

**Async task cleanup with `watch`:**

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
        // Handle data
      });

    onCleanup(() => controller.abort());
  }
);

userId.value = 2;
// Previous request is aborted, new request is initiated

dispose();
// Current request is aborted
```

**Using the `immediate` option:**

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
// Immediately outputs "count: undefined -> 0"

count.value = 1;
// Outputs "count: 0 -> 1"

dispose();
```

## License

MIT
