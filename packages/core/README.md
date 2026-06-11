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

count.value = 1;

dispose();
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

  fetch(`/api/users/${userId.value}`, { signal: controller.signal });

  onCleanup(() => controller.abort());
});

dispose();
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

count.value = 1;
dispose();
```

## License

MIT
