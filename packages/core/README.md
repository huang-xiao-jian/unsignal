# @unsignal/core

Framework-agnostic reactive utilities which extend [`@preact/signals-core`](https://github.com/preactjs/signals/tree/main/packages/core).

## Installation

```bash
pnpm add @unsignal/core
```

> `@preact/signals-core` is required as a peer dependency.

## API

### `reaction(fn, callback)`

```ts
/**
 * Track signal dependencies in `fn` and invoke `callback` when they change.
 *
 * - `fn` behaves identically to `effect(fn)`: executes immediately, auto-tracks
 *   signal deps, and re-executes when those deps change.
 * - `callback` is invoked only on dependency changes — skipped on the first run.
 *   Runs untracked, so reads inside it do NOT create dependencies.
 *
 * @param fn - Tracking function executed immediately and on each dep change.
 * @param callback - Callback invoked on dep changes (not on first run), untracked.
 * @returns A `DisposerFn` to stop tracking and clean up the effect.
 */
function reaction(fn: () => void, callback: () => void): DisposerFn;
```

#### Example

```ts
import { signal } from '@preact/signals-core';
import { reaction } from '@unsignal/core';

const count = signal(0);

const dispose = reaction(
  () => console.log('count:', count.value),
  () => console.log('changed!')
);
// logs: "count: 0" (callback NOT invoked)

count.value = 1;
// logs: "count: 1", "changed!"

dispose();
count.value = 2; // no output
```

## License

MIT
