# @unsignal/baseline

A builtin (WIP) signal primitive implementation intended to take the place of `@preact/signals-core`.

## API Surface

`@unsignal/baseline` currently focuses on primitive reactive APIs:

- `signal`
- `computed`
- `effect`
- `batch`
- `action`
- `untracked`

The package does not provide higher-level model construction helpers.

## Effect Handle Migration

`effect()` now returns a `Disposable` handle object instead of a callable disposer function.

```ts
import { effect, signal } from '@unsignal/baseline';

const count = signal(0);

const handle = effect(() => {
  console.log(count.value);
});

handle.dispose();
// or
handle.unsubscribe();
// or
handle[Symbol.dispose]();
```

If existing code used `const dispose = effect(...); dispose();`, migrate it to
`const handle = effect(...); handle.dispose();` or `handle.unsubscribe();`.
