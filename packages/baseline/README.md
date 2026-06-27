# @unsignal/baseline

A built-in (WIP) primitive runtime for the `unsignal` ecosystem.

## API Surface

`@unsignal/baseline` currently focuses on primitive reactive APIs:

- `signal`
- `computed`
- `effect`
- `batch`
- `action`
- `isSignal`
- `isReadonlySignal`
- `isWritableSignal`
- `untracked`

The package does not provide higher-level model construction helpers.

## Runtime Guards

`isSignal()` detects any baseline signal. `isWritableSignal()` detects writable
baseline signals created by `signal()`. `isReadonlySignal()` detects read-only
baseline signals such as values returned by `computed()`.

```ts
import { computed, isReadonlySignal, isSignal, isWritableSignal, signal } from '@unsignal/baseline';

const count = signal(0);
const doubled = computed(() => count.value * 2);

isSignal(count); // true
isSignal(doubled); // true
isWritableSignal(count); // true
isWritableSignal(doubled); // false
isReadonlySignal(doubled); // true
isReadonlySignal(count); // false
```

## Effect Handle Migration

`effect()` now returns a `Disposable` handle object instead of a callable disposer function.

```ts
import { effect, signal } from '@unsignal/baseline';

const count = signal(0);

const disposable = effect(() => {
  console.log(count.value);
});

disposable.dispose();
// or
disposable.unsubscribe();
// or
disposable[Symbol.dispose]();
```

If existing code used `const dispose = effect(...); dispose();`, migrate it to
`const handle = effect(...); handle.dispose();` or `handle.unsubscribe();`.
