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

Expose the latest observable value through a disposable readonly signal-like
facade.

```ts
import type { Disposable } from '@unsignal/baseline';
import type { Observable } from 'rxjs';

interface ToSignalOptions<T> {
  initialValue?: T;
}

interface ReadonlySignalLike<TValue> {
  readonly value: TValue;
  peek(): TValue;
}

interface ObservableSignal<TValue> extends ReadonlySignalLike<TValue>, Disposable {}

function toSignal<T>(
  source$: Observable<T>,
  options: ToSignalOptions<T> & { initialValue: T }
): ObservableSignal<T>;

function toSignal<T>(
  source$: Observable<T>,
  options?: ToSignalOptions<T>
): ObservableSignal<T | undefined>;
```

- Subscribes eagerly when `toSignal(...)` is called
- Uses `initialValue` when provided
- Exposes `undefined` before the first emission when no `initialValue` is given
- Retains the latest reflected value after source error or completion
- Exposes `value`, `peek()`, and `dispose()` only

```ts
import { Subject } from 'rxjs';
import { toSignal } from '@unsignal/rxjs';

const source$ = new Subject<number>();
const view = toSignal(source$, { initialValue: 0 });

console.log(view.value); // 0
console.log(view.peek()); // 0

source$.next(2);
console.log(view.value); // 2

view.dispose();
```

## Lifecycle Ownership

- `toObservable(source)` creates subscription-scoped signal tracking. Each `Observable` subscriber owns its own `unsubscribe()`.
- `toSignal(source$)` creates an eager `Observable` subscription immediately. The caller owns `dispose()`.
- If the source observable errors or completes, the latest reflected signal value is retained and no further updates are applied.

## License

MIT
