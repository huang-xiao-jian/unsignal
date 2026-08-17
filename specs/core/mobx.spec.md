# @unsignal/core/mobx

The `@unsignal/core/mobx` entrypoint provides MobX-flavored class decorator conveniences for **Signal Primitives**

```ts
import { action, computed, observable } from '@unsignal/core/mobx';
```

## `observable`

**Behavior:**

- `observable` is a class `accessor` decorator for instance state
- Each decorated accessor owns a per-instance `Signal<TValue>` backing source
- `get` returns the current signal value and participates in reactive tracking
- `set` writes through the backing signal so downstream observers react to updates
- `init` seeds the backing signal with the accessor's initial value
- If an instance is read before initialization completes, the decorator lazily creates its backing signal from the original accessor getter

**Usage Example:**

```ts
import { observable } from '@unsignal/core/mobx';

class CounterStore {
  @observable accessor count = 0;
}

const store = new CounterStore();

console.log(store.count); // 0

store.count = 1;
console.log(store.count); // 1
```

## `computed`

**Behavior:**

- `computed` is a class `getter` decorator for derived values
- Each decorated getter owns a per-instance cached `ReadonlySignal<TValue>`
- The computed source is created lazily on first read and then reused for that instance
- Reads inside the decorated getter are tracked reactively, and the cached value updates when those dependencies change

**Usage Example:**

```ts
import { computed, observable } from '@unsignal/core/mobx';

class CounterStore {
  @observable accessor count = 1;

  @computed
  get doubled() {
    return this.count * 2;
  }
}

const store = new CounterStore();

console.log(store.doubled); // 2

store.count = 2;
console.log(store.doubled); // 4
```

## `action`

**Behavior:**

- `action` is a class method decorator that wraps the method with `@unsignal/baseline` action semantics
- The wrapped method executes in a batched, untracked action scope
- `action.bound` provides the same action semantics and also binds the method to the instance during class initialization
- `action.bound` throws a `TypeError` when applied to a private method

**Usage Example:**

```ts
import { action, observable } from '@unsignal/core/mobx';

class CounterStore {
  @observable accessor count = 0;

  @action
  increment() {
    this.count += 1;
  }

  @action.bound
  incrementLater() {
    this.count += 1;
  }
}

const store = new CounterStore();
const incrementLater = store.incrementLater;

store.increment();
incrementLater();

console.log(store.count); // 2
```
