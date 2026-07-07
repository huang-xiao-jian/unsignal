# @unsignal/rxjs

RxJS interoperability for built-in **Signal Primitives**

## Installation

```bash
pnpm add @unsignal/baseline @unsignal/rxjs rxjs
```

## API

### `toObservable(source)`

Expose a baseline readonly signal as an `Observable`.

```ts
import type { ReadonlySignal } from '@unsignal/baseline';
import type { Observable } from 'rxjs';

function toObservable<T>(source: ReadonlySignal<T>): Observable<T>;
```

- Emits the current signal value immediately for each subscription
- Emits later signal updates to that subscriber
- Stops tracking when the subscriber unsubscribes
- Does not complete on its own

```ts
import { signal } from '@unsignal/baseline';
import { toObservable } from '@unsignal/rxjs';

const count = signal(1);
const count$ = toObservable(count);

const subscription = count$.subscribe((value) => {
  console.log(value);
});

count.value = 2;
count.value = 3;

subscription.unsubscribe();
```

### `toSignal(source$, options?)`

Expose the latest observable value through a readonly signal.

```ts
import type { ReadonlySignal } from '@unsignal/baseline';
import type { Observable } from 'rxjs';

interface ToSignalOptions<T> {
  initialValue?: T;
  signal?: AbortSignal;
}

function toSignal<T>(
  source$: Observable<T>,
  options: ToSignalOptions<T> & { initialValue: T }
): ReadonlySignal<T>;

function toSignal<T>(
  source$: Observable<T>,
  options?: ToSignalOptions<T>
): ReadonlySignal<T | undefined>;
```

- Subscribes eagerly when `toSignal(...)` is called
- Uses `initialValue` when provided
- Exposes `undefined` before the first emission when no `initialValue` is given
- Accepts an optional `AbortSignal` for subscription teardown ownership
- Retains the latest reflected value after source error or completion
- Remains readable after the upstream subscription ends

```ts
import { interval, map } from 'rxjs';
import { toSignal } from '@unsignal/rxjs';

const controller = new AbortController();
const source$ = interval(1000).pipe(map((value) => value + 1));
const tick = toSignal(source$, {
  initialValue: 0,
  signal: controller.signal,
});

console.log(tick.value); // 0

setTimeout(() => {
  controller.abort();
  console.log(tick.value); // latest emitted value
}, 3500);
```

## Lifecycle Ownership

- `toObservable(source)` creates subscription-scoped signal tracking. Each `Observable` subscriber owns its own `unsubscribe()`.
- `toSignal(source$)` creates an eager `Observable` subscription immediately. The caller may provide an `AbortSignal` to own teardown.
- If the source observable errors or completes, the latest reflected signal value is retained and no further updates are applied.

## License

MIT
