# @unsignal/rxjs

Framework-agnostic RxJS interoperability for [`@unsignal/baseline`](../baseline/README.md).

## Installation

```bash
pnpm add @unsignal/baseline @unsignal/rxjs rxjs
```

> `@unsignal/baseline` provides the signal primitive runtime. `rxjs` remains an explicit consumer dependency.

## API

### `toObservable(source)`

Expose a baseline readonly signal as an `RxJS` `Observable`.

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

Expose the latest value from an `RxJS` `Observable` through a readonly signal-backed controller.

```ts
import type { ReadonlySignal } from '@unsignal/baseline';
import type { Observable } from 'rxjs';

interface ToSignalOptions<T> {
  initialValue?: T;
}

interface SignalSubscription<TValue> {
  readonly value: ReadonlySignal<TValue>;
  dispose(): void;
}

function toSignal<T>(
  source$: Observable<T>,
  options: ToSignalOptions<T> & { initialValue: T }
): SignalSubscription<T>;

function toSignal<T>(
  source$: Observable<T>,
  options?: ToSignalOptions<T>
): SignalSubscription<T | undefined>;
```

- Subscribes eagerly when `toSignal(...)` is called
- Returns the latest reflected value only
- Uses `initialValue` when provided, otherwise exposes `undefined` before the first emission
- Retains the latest reflected value after source error or completion
- Requires explicit `dispose()` ownership

```ts
import { Subject } from 'rxjs';
import { toSignal } from '@unsignal/rxjs';

const source$ = new Subject<number>();
const view = toSignal(source$, { initialValue: 0 });

console.log(view.value.value); // 0

source$.next(2);
console.log(view.value.value); // 2

view.dispose();
```

## Lifecycle Ownership

- `toObservable(source)` creates subscription-scoped signal tracking. Each `Observable` subscriber owns its own `unsubscribe()`.
- `toSignal(source$)` creates an eager `Observable` subscription immediately. The caller owns `dispose()`.
- If the source observable errors or completes, the latest reflected signal value is retained and no further updates are applied.

## License

MIT
