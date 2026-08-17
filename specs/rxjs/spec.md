# @unsignal/rxjs

## Goal

Provide framework-agnostic `RxJS` interoperability between **Signal Primitive** and **Observable**.

## Principles

- Explicit lifecycle and teardown ownership for observable-backed subscriptions
- Strictly Framework-agnostic bridge utilities

## API References

### `toObservable`

```ts
import type { Observable } from 'rxjs';

function toObservable<T>(source: ReadonlySignal<T>): Observable<T>;
```

**Behavior:**

- The `Observable` only connect deeper `Signal` when subscribed

**Usage Example:**

```ts
import { signal } from '@unsignal/baseline';
import { toObservable } from '@unsignal/rxjs';

const counter = signal(0);
const counter$ = toObservable(counter);

const subscription = counter$.subscribe((value) => {
  console.log('counter:', value);
});

counter.value = 1;
counter.value = 2;

subscription.unsubscribe();
```

### `toSignal`

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

**Behavior:**

- Subscribe `Observable` eagerly at creation time
- Upstream Observable's error / complete never bother downstream `Signal`, which retains the latest reflected value
- Downstream `Signal` remains readable even the subscription ends

**Usage Example:**

```ts
import { interval, map } from 'rxjs';
import { toSignal } from '@unsignal/rxjs';

const controller = new AbortController();
const count$ = interval(1000).pipe(map((value) => value + 1));
const tick = toSignal(count$, {
  initialValue: 0,
  signal: controller.signal,
});

console.log(tick.value); // 0

setTimeout(() => {
  controller.abort();
  console.log(tick.value); // latest emitted value
}, 3500);
```
