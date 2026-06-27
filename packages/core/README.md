# @unsignal/core

Framework-agnostic reactive utilities that compose with [`@unsignal/baseline`](../baseline/README.md).

## Installation

```bash
pnpm add @unsignal/core
```

> `@unsignal/baseline` is required as a peer dependency.

## API

### `readonly(source)`

Create a derived read-only signal from a writable or read-only source signal.

```ts
import type { ReadonlySignal, Signal } from '@unsignal/baseline';

function readonly<T>(source: Signal<T>): ReadonlySignal<T>;
function readonly<T>(source: ReadonlySignal<T>): ReadonlySignal<T>;
```

- Always returns a new derived `ReadonlySignal<T>`
- Stays in sync with `source.value` through reactive tracking
- When the source is already a `ReadonlySignal<T>`, the result still mirrors it but is not the same instance

```ts
import { computed, signal } from '@unsignal/baseline';
import { readonly } from '@unsignal/core';

const count = signal(1);
const countView = readonly(count);

count.value = 2;
console.log(countView.value); // 2

const doubled = computed(() => count.value * 2);
const doubledView = readonly(doubled);

console.log(doubledView === doubled); // false
console.log(doubledView.value); // 4
```

### Baseline-native readonly composition

`@unsignal/core` no longer exports model-construction helpers. Compose writable and readonly state directly with baseline primitives and `readonly()`:

```ts
import { computed, signal } from '@unsignal/baseline';
import { readonly } from '@unsignal/core';

const count = signal(1);
const doubled = computed(() => count.value * 2);

const counter = {
  count: readonly(count),
  doubled,
  increment() {
    count.value += 1;
  },
};

counter.increment();
console.log(counter.count.value); // 2
console.log(counter.doubled.value); // 4
```

### `resource(options)`

Create a reactive async resource that loads whenever its params become defined and exposes signal-based request state.

```ts
import type { ReadonlySignal } from '@unsignal/baseline';

type ResourceStatus = 'idle' | 'loading' | 'reloading' | 'resolved' | 'error';

interface Aborter {
  readonly signal: AbortSignal;
  onAbort(cleanupFn: () => void): void;
}

interface ResourcePrevious {
  readonly status: ResourceStatus;
}

interface ResourceLoaderParams<TParams> {
  readonly params: TParams;
  readonly aborter: Aborter;
  readonly previous: ResourcePrevious;
}

type ResourceLoader<TParams, TValue> = (params: ResourceLoaderParams<TParams>) => Promise<TValue>;

type ResourceParams<TParams> = ReadonlySignal<TParams | undefined> | (() => TParams | undefined);

interface ResourceOptions<TParams, TValue> {
  params: ResourceParams<TParams>;
  loader: ResourceLoader<TParams, TValue>;
  defaultValue?: TValue;
}

interface Resource<T> {
  readonly value: ReadonlySignal<T>;
  readonly status: ReadonlySignal<ResourceStatus>;
  readonly error: ReadonlySignal<unknown | undefined>;
  readonly isLoading: ReadonlySignal<boolean>;
  hasValue(): boolean;
  reload(): boolean;
  destroy(): void;
}

function resource<TParams, TValue>(
  options: ResourceOptions<TParams, TValue> & { defaultValue: TValue }
): Resource<TValue>;

function resource<TParams, TValue>(
  options: ResourceOptions<TParams, TValue>
): Resource<TValue | undefined>;
```

- Starts in `idle` when `params` is `undefined`
- Starts loading immediately when `params` becomes defined
- Uses `loading` before the first value is available and `reloading` when a previous value is retained
- Clears `error` before each new run
- Ignores stale results from aborted runs
- Resets to `defaultValue` when `params` becomes `undefined`
- Supports manual `reload()` when params are currently defined
- Supports `destroy()` to stop tracking and abort the active run

```ts
import { signal } from '@unsignal/baseline';
import { resource } from '@unsignal/core';

const userId = signal<number | undefined>(1);

const userResource = resource({
  params: userId,
  defaultValue: { name: 'Guest' },
  loader: async ({ params, aborter, previous }) => {
    console.log(previous.status);

    const response = await fetch(`/api/users/${params}`, {
      signal: aborter.signal,
    });

    aborter.onAbort(() => {
      console.log(`request for user ${params} aborted`);
    });

    return response.json() as Promise<{ name: string }>;
  },
});

console.log(userResource.status.value); // loading
console.log(userResource.value.value); // { name: 'Guest' }

userId.value = 2;
console.log(userResource.status.value); // reloading

const refreshed = userResource.reload();
console.log(refreshed); // true

userResource.destroy();
```

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
import { signal } from '@unsignal/baseline';
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
import { signal } from '@unsignal/baseline';
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
import type { ReadonlySignal } from '@unsignal/baseline';
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
import { signal } from '@unsignal/baseline';
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
import { signal, computed } from '@unsignal/baseline';
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
import { signal } from '@unsignal/baseline';
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
import { signal } from '@unsignal/baseline';
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
