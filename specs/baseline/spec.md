# @unsignal/baseline

## Goal

Implement a builtin `Signal Primitive` package for the `unsignal` ecosystem.

## Principles

- Provide framework-agnostic reactive primitives

## Constraints

- No framework bindings
- No model-construction APIs
- No higher-level state abstraction beyond primitive reactivity

## API Reference

### `signal`

Creates a writable signal.

```ts
interface SignalOptions<T = any> {
  watched?: (this: Signal<T>) => void;
  unwatched?: (this: Signal<T>) => void;
  name?: string;
}

function signal<T>(value: T, options?: SignalOptions<T>): Signal<T>;
function signal<T = undefined>(): Signal<T | undefined>;
```

**Options Behavior:**

- `watched` runs when the signal gains its first subscriber
- `unwatched` runs when the signal loses its last subscriber
- `name` is available for debugging-oriented usage

**Behavior:**

- stores mutable reactive state
- reading `.value` participates in dependency tracking
- writing `.value` notifies dependents when the value changes
- `peek()` reads the current value without subscribing the surrounding reactive context

**Usage Example:**

```ts
import { signal } from '@unsignal/baseline';

const count = signal(0);

count.value += 1;
console.log(count.value); // 1
```

### `computed`

Creates a read-only derived signal.

```ts
interface ReadonlySignal<T = any> {
  readonly value: T;
  readonly peek(): T;
}

function computed<T>(fn: () => T, options?: SignalOptions<T>): ReadonlySignal<T>;
```

**Behavior:**

- evaluates lazily when read
- automatically tracks signals read inside the callback
- re-computes when tracked dependencies change
- supports conditional dependency usage
- cannot be written to directly

**Usage Example:**

```ts
import { computed, signal } from '@unsignal/baseline';

const first = signal('Ada');
const last = signal('Lovelace');

const fullName = computed(() => `${first.value} ${last.value}`);

console.log(fullName.value); // Ada Lovelace
```

### `isSignal`

Detects whether a value is any baseline signal.

```ts
function isSignal<T = unknown>(value: unknown): value is Signal<T> | ReadonlySignal<T>;
```

**Behavior:**

- returns `true` for writable baseline signals created by `signal()`
- returns `true` for read-only baseline signals created by `computed()`
- returns `false` for non-signal values or partial lookalikes

### `isReadonlySignal`

Detects whether a value is a read-only baseline signal.

```ts
function isReadonlySignal<T = unknown>(value: unknown): value is ReadonlySignal<T>;
```

**Behavior:**

- returns `true` for read-only baseline signals such as `computed()` results
- returns `false` for writable baseline signals
- returns `false` for non-signal values or partial lookalikes

### `isWritableSignal`

Detects whether a value is a writable baseline signal.

```ts
function isWritableSignal<T = unknown>(value: unknown): value is Signal<T>;
```

**Behavior:**

- returns `true` for writable baseline signals created by `signal()`
- returns `false` for read-only baseline signals such as `computed()` results
- returns `false` for non-signal values or partial lookalikes

### `effect`

Creates a reactive side effect.

```ts
interface EffectOptions {
  name?: string;
}

interface Disposable {
  dispose(): void;
}

function effect(
  fn: (() => void | (() => void)) | ((this: { dispose: () => void }) => void | (() => void)),
  options?: EffectOptions
): Disposable;
```

**Behavior:**

- runs immediately
- tracks signals read during execution
- re-runs when tracked dependencies change
- may return a cleanup function
- returns an object resource handle that stops further tracking and cleanup
- exposes `dispose()` as its only direct teardown entry point

### `asSubscription`

Adapts a disposable resource to a subscription-shaped object.

```ts
interface Subscription {
  unsubscribe(): void;
}

function asSubscription(disposable: Disposable): Subscription;
```

**Behavior:**

- returns a `Subscription` object with `unsubscribe()`
- `unsubscribe()` performs the same teardown behavior as `dispose()`
- keeps subscription-shaped interoperability separate from direct disposable ownership

**Usage Example:**

```ts
import { asSubscription, effect, signal } from '@unsignal/baseline';

const count = signal(0);

const disposable = effect(() => {
  console.log(count.value);
});

disposable.dispose();

const subscription = asSubscription(
  effect(() => {
    console.log(count.value);
  })
);

subscription.unsubscribe();
```

### `batch`

Groups multiple writes into one update cycle.

```ts
function batch<T>(fn: () => T): T;
```

**Behavior:**

- batches multiple signal writes
- nested batches are supported
- reactive effects flush after the outermost batch completes
- reads inside the batch see the latest written values

### `untracked`

Runs logic without dependency collection.

```ts
function untracked<T>(fn: () => T): T;
```

**Behavior:**

- signal reads inside the callback do not subscribe the surrounding `effect` or `computed`
- useful for incidental reads that should not affect reactivity

### `action`

Wraps a function as an untracked batched mutation.

```ts
function action<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn;
```

**Behavior:**

- batches writes performed inside the wrapped function
- prevents accidental dependency collection during mutation logic
- preserves `this`, arguments, and return value

**Usage Example:**

```ts
import { action, signal } from '@unsignal/baseline';

const count = signal(0);

const increment = action(() => {
  count.value += 1;
});

increment();
```
