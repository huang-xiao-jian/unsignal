# @unsignal/baseline

## Business Objective

Implement a builtin `Signal Primitive` package that can take the place of `@preact/signals-core` for the `unsignal` ecosystem.

## Business Requirements

- Framework-agnostic reactive primitives
- Complete `TypeScript` type declarations
- Compatible primitive API surface for downstream packages such as `@unsignal/core`, `@unsignal/react`, and `@unsignal/vue`
- No framework-specific bindings or model-construction helpers

## Business Design

### Design Principles

- `@unsignal/baseline` provides only primitive reactive capabilities
- The package exposes the same core mental model as `@preact/signals-core`: writable signals, derived signals, side effects, batching, and tracking control
- `computed` is read-only and lazily evaluated
- `batch` groups multiple writes into one visible update cycle
- `untracked` allows reading signals without collecting dependencies
- `action` is the mutation-oriented helper built on top of `batch` and `untracked`
- The package does not provide `createModel` or other higher-level abstractions

## Requirements

### Requirement: Baseline primitives use explicit class implementations

The `@unsignal/baseline` runtime SHALL implement its writable signal and derived signal primitives as explicit ECMAScript classes instead of constructor-function and prototype-composition patterns. The class-based implementation SHALL preserve the documented public behavior of `signal()`, `computed()`, and related reactive lifecycle hooks while making inheritance and instance responsibilities explicit in the runtime.

#### Scenario: Writable signal instances are backed by a concrete class

- **WHEN** `signal()` creates a writable signal instance
- **THEN** the returned object MUST be an instance of a concrete writable signal class that owns its state, subscription links, and lifecycle methods directly through class construction

#### Scenario: Computed instances extend the signal base class explicitly

- **WHEN** `computed()` creates a derived signal instance
- **THEN** the returned object MUST be backed by an explicit class that extends the writable signal base class or a shared signal base class without relying on prototype reassignment after declaration

#### Scenario: Public primitive behavior remains compatible through the refactor

- **WHEN** callers use the documented baseline APIs for reading, writing, subscribing, batching, and effect tracking
- **THEN** the refactored class-based runtime MUST preserve the observable behavior and compatibility guarantees documented by the baseline capability

### Requirement: Baseline signals use unsignal-owned runtime branding

The `@unsignal/baseline` package SHALL use unsignal-owned runtime branding for its signal primitives instead of `preact`-named shared symbols. Writable signals and read-only computed signals MAY use distinct internal brand symbols so long as the supported runtime guard APIs continue to distinguish them correctly.

#### Scenario: Writable signals use an unsignal-owned writable brand

- **WHEN** a caller creates a writable signal with `signal()`
- **THEN** the returned signal MUST carry an unsignal-owned writable runtime brand

#### Scenario: Computed signals use an unsignal-owned readonly brand

- **WHEN** a caller creates a derived signal with `computed()`
- **THEN** the returned read-only signal MUST carry an unsignal-owned readonly runtime brand distinct from the writable signal brand

### Requirement: Baseline provides runtime signal guard APIs

The `@unsignal/baseline` package SHALL export `isSignal`, `isReadonlySignal`, and `isWritableSignal` as supported runtime guard functions for baseline primitives. These guard APIs are defined against baseline runtime instances and may rely on `instanceof Signal` semantics.

#### Scenario: Generic baseline signals are recognized by isSignal

- **WHEN** a caller passes a writable baseline signal created by `signal()` or a read-only baseline signal created by `computed()` to `isSignal`
- **THEN** `isSignal` MUST return `true`

#### Scenario: Writable signals are recognized by isWritableSignal

- **WHEN** a caller passes a writable baseline signal created by `signal()` to `isWritableSignal`
- **THEN** `isWritableSignal` MUST return `true`

#### Scenario: Computed signals are not recognized as writable signals

- **WHEN** a caller passes a read-only baseline signal created by `computed()` to `isWritableSignal`
- **THEN** `isWritableSignal` MUST return `false`

#### Scenario: Read-only baseline signals are recognized by isReadonlySignal

- **WHEN** a caller passes a read-only baseline signal created by `computed()` to `isReadonlySignal`
- **THEN** `isReadonlySignal` MUST return `true`

#### Scenario: Writable signals are not recognized as read-only-only signals

- **WHEN** a caller passes a writable baseline signal created by `signal()` to `isReadonlySignal`
- **THEN** `isReadonlySignal` MUST return `false`

#### Scenario: Non-signal values are rejected by all guards

- **WHEN** a caller passes a non-signal value or an object that only partially resembles the signal API to `isSignal`, `isReadonlySignal`, or `isWritableSignal`
- **THEN** each guard MUST return `false`

### Requirement: Baseline effects expose resource-oriented disposal semantics

The `@unsignal/baseline` package SHALL return a resource-oriented handle from `effect()` so effect teardown can be managed consistently with other disposable and unsubscribable resources. The returned handle SHALL expose `dispose()`, `unsubscribe()`, and `Symbol.dispose`, and each entry point SHALL perform the same underlying teardown behavior.

#### Scenario: Effect handle is stored as a managed resource

- **WHEN** a caller stores the value returned from `effect()` for later teardown
- **THEN** the returned value MUST be an object resource rather than a callable teardown function

#### Scenario: Effect handle supports symbol-based disposal

- **WHEN** a caller invokes the returned handle through `Symbol.dispose`
- **THEN** the effect MUST stop tracking, run pending cleanup exactly once, and release its subscriptions

#### Scenario: Effect handle represents unsubscribable ownership

- **WHEN** a caller manages the returned handle alongside other unsubscribable resources
- **THEN** the effect handle MUST expose teardown semantics equivalent to unsubscribing the effect from future updates

#### Scenario: Named teardown methods are equivalent

- **WHEN** a caller invokes `dispose()` or `unsubscribe()` on the returned handle
- **THEN** each method MUST perform the same teardown behavior as `Symbol.dispose`

### Exported Types

#### `SignalOptions`

```ts
interface SignalOptions<T = any> {
  watched?: (this: Signal<T>) => void;
  unwatched?: (this: Signal<T>) => void;
  name?: string;
}
```

**Behavior:**

- `watched` runs when the signal gains its first subscriber
- `unwatched` runs when the signal loses its last subscriber
- `name` is available for debugging-oriented usage

#### `ReadonlySignal`

```ts
interface ReadonlySignal<T = any> {
  readonly value: T;
  readonly peek(): T;
}
```

#### `Signal Guards`

```ts
function isSignal<T = unknown>(value: unknown): value is Signal<T> | ReadonlySignal<T>;
function isReadonlySignal<T = unknown>(value: unknown): value is ReadonlySignal<T>;
function isWritableSignal<T = unknown>(value: unknown): value is Signal<T>;
```

#### `EffectOptions`

```ts
interface EffectOptions {
  name?: string;
}
```

#### `Disposable`

```ts
interface Disposable {
  dispose(): void;
  unsubscribe(): void;
  [Symbol.dispose](): void;
}
```

### API Reference

#### `signal`

Creates a writable signal.

```ts
function signal<T>(value: T, options?: SignalOptions<T>): Signal<T>;
function signal<T = undefined>(): Signal<T | undefined>;
```

**Behavior:**

- stores mutable reactive state
- reading `.value` participates in dependency tracking
- writing `.value` notifies dependents when the value changes
- `peek()` reads the current value without subscribing the surrounding reactive context
- `subscribe()` immediately emits the current value, then emits again on later changes
  **Usage Example:**

```ts
import { signal } from '@unsignal/baseline';

const count = signal(0);

count.value += 1;
console.log(count.value); // 1
```

#### `computed`

Creates a read-only derived signal.

```ts
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

#### `isSignal`

Detects whether a value is any baseline signal.

```ts
function isSignal<T = unknown>(value: unknown): value is Signal<T> | ReadonlySignal<T>;
```

**Behavior:**

- returns `true` for writable baseline signals created by `signal()`
- returns `true` for read-only baseline signals created by `computed()`
- returns `false` for non-signal values or partial lookalikes

#### `isReadonlySignal`

Detects whether a value is a read-only baseline signal.

```ts
function isReadonlySignal<T = unknown>(value: unknown): value is ReadonlySignal<T>;
```

**Behavior:**

- returns `true` for read-only baseline signals such as `computed()` results
- returns `false` for writable baseline signals
- returns `false` for non-signal values or partial lookalikes

#### `isWritableSignal`

Detects whether a value is a writable baseline signal.

```ts
function isWritableSignal<T = unknown>(value: unknown): value is Signal<T>;
```

**Behavior:**

- returns `true` for writable baseline signals created by `signal()`
- returns `false` for read-only baseline signals such as `computed()` results
- returns `false` for non-signal values or partial lookalikes

#### `effect`

Creates a reactive side effect.

```ts
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
- exposes equivalent `dispose()`, `unsubscribe()`, and `Symbol.dispose` teardown entry points

**Usage Example:**

```ts
import { effect, signal } from '@unsignal/baseline';

const count = signal(0);

const disposable = effect(() => {
  console.log(count.value);
});

disposable.dispose();
```

#### `batch`

Groups multiple writes into one update cycle.

```ts
function batch<T>(fn: () => T): T;
```

**Behavior:**

- batches multiple signal writes
- nested batches are supported
- reactive effects flush after the outermost batch completes
- reads inside the batch see the latest written values

#### `untracked`

Runs logic without dependency collection.

```ts
function untracked<T>(fn: () => T): T;
```

**Behavior:**

- signal reads inside the callback do not subscribe the surrounding `effect` or `computed`
- useful for incidental reads that should not affect reactivity

#### `action`

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

### Scope Constraints

- No framework bindings
- No model-construction APIs
- No higher-level state abstraction beyond primitive reactivity
