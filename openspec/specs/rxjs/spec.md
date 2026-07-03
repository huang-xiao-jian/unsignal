# @unsignal/rxjs

## Business Objective

Provide framework-agnostic `RxJS` interoperability that composes with `@unsignal/baseline`.

## Business Requirements

- Framework-agnostic bridge utilities for `RxJS` observables
- Complete `TypeScript` type declarations
- Explicit lifecycle and teardown ownership for observable-backed subscriptions

## Business Design

### Design Principles

- `@unsignal/rxjs` complements `@unsignal/baseline` without expanding baseline primitive responsibilities
- `@unsignal/rxjs` MAY depend on `@unsignal/core` when shared utilities improve consistency, but `RxJS`-specific APIs MUST remain in this package
- `toSignal` and `toObservable` use explicit ownership semantics and MUST NOT hide lifecycle behavior behind framework-managed contexts

## Requirements

### Requirement: RxJS interop ships as a separate optional package

The project SHALL provide `RxJS` interoperability through a dedicated `@unsignal/rxjs` package and SHALL keep the `rxjs` dependency boundary out of `@unsignal/core` and `@unsignal/baseline`.

#### Scenario: Consumer installs only the interop package when needed

- **WHEN** a consumer wants to bridge baseline signals with `RxJS`
- **THEN** the documented public entrypoint MUST be `@unsignal/rxjs`

#### Scenario: Core package remains free of RxJS-specific APIs

- **WHEN** a consumer imports from `@unsignal/core`
- **THEN** the package MUST NOT expose `RxJS` bridge APIs such as `toObservable` or `toSignal`

### Requirement: RxJS interop defines a clear public API surface

The `@unsignal/rxjs` package SHALL document and implement the following initial public API definitions:

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

function toObservable<T>(source: ReadonlySignal<T>): Observable<T>;
function toSignal<T>(
  source$: Observable<T>,
  options: ToSignalOptions<T> & { initialValue: T }
): SignalSubscription<T>;
function toSignal<T>(
  source$: Observable<T>,
  options?: ToSignalOptions<T>
): SignalSubscription<T | undefined>;
```

#### Scenario: Consumers can rely on a stable initial API shape

- **WHEN** a consumer reads the package README or TypeScript declarations
- **THEN** the initial interop surface MUST include `toObservable`, `toSignal`, `ToSignalOptions`, and `SignalSubscription`

#### Scenario: `toSignal` narrows the value type when `initialValue` is provided

- **WHEN** a consumer calls `toSignal(source$, { initialValue })`
- **THEN** the returned controller MUST expose `value` as `ReadonlySignal<T>` rather than `ReadonlySignal<T | undefined>`

### Requirement: `toObservable` exposes a baseline signal as an RxJS observable

The `@unsignal/rxjs` package SHALL provide a `toObservable` API that converts a baseline `ReadonlySignal<T>` into an `Observable<T>`.

#### Scenario: Subscription receives the current signal value immediately

- **WHEN** a consumer subscribes to the observable returned by `toObservable`
- **THEN** the subscriber MUST receive the signal's current value before later change notifications

#### Scenario: Subscriber receives later signal updates

- **WHEN** the source signal value changes after subscription
- **THEN** the observable returned by `toObservable` MUST emit the updated value to that subscriber

#### Scenario: Unsubscribing stops signal tracking for that subscription

- **WHEN** the consumer unsubscribes from the observable returned by `toObservable`
- **THEN** the bridge MUST release the reactive tracking and stop emitting further signal updates to that subscription

### Requirement: `toSignal` exposes an observable through an explicitly managed signal controller

The `@unsignal/rxjs` package SHALL provide a `toSignal` API that subscribes to an `Observable<T>` and exposes only its latest value through a readonly signal-backed controller with explicit teardown semantics.

#### Scenario: Initial value is available before the first observable emission

- **WHEN** a consumer calls `toSignal` with an `initialValue` option
- **THEN** the returned controller MUST expose that initial value through its readonly signal before the observable emits

#### Scenario: Signal stays simple before the first emission when no initial value is provided

- **WHEN** a consumer calls `toSignal` without an `initialValue` option and the observable has not emitted yet
- **THEN** the readonly signal exposed by the controller MUST read as `undefined`

#### Scenario: `toSignal` returns a resource-oriented controller

- **WHEN** a consumer calls `toSignal`
- **THEN** the return value MUST expose the latest value through `value: ReadonlySignal<...>` according to the documented overloads and teardown as `dispose(): void`

#### Scenario: `toSignal` subscribes eagerly at creation time

- **WHEN** a consumer calls `toSignal`
- **THEN** the bridge MUST subscribe to the source observable immediately without waiting for the returned signal to be read or observed

#### Scenario: Observable emissions update the latest signal value

- **WHEN** the source observable emits a new value
- **THEN** the readonly signal exposed by the `toSignal` controller MUST update to that latest value

#### Scenario: Observable error retains the latest reflected value

- **WHEN** the source observable errors after one or more values have been reflected
- **THEN** the controller MUST stop receiving future updates and MUST retain the latest reflected value

#### Scenario: Observable completion retains the latest reflected value

- **WHEN** the source observable completes after one or more values have been reflected
- **THEN** the controller MUST stop receiving future updates and MUST retain the latest reflected value

#### Scenario: Controller does not expose separate signal-backed terminal state

- **WHEN** a consumer uses the controller returned by `toSignal`
- **THEN** the initial contract MUST focus on latest-value reflection and MUST NOT require separate signal-backed error or completion state

#### Scenario: Dispose tears down the underlying observable subscription

- **WHEN** the consumer calls `dispose()` on the controller returned by `toSignal`
- **THEN** the bridge MUST unsubscribe from the source observable and stop updating the exposed signal

### Requirement: `toObservable` remains subscription-driven and non-terminating by default

The `@unsignal/rxjs` package SHALL treat `toObservable(source)` as a subscription-scoped bridge over the current and future values of the source signal and SHALL NOT complete or error unless the subscriber unsubscribes.

#### Scenario: `toObservable` does not complete on its own

- **WHEN** a consumer subscribes to the observable returned by `toObservable`
- **THEN** the bridge MUST remain active until that subscription is unsubscribed

### Requirement: RxJS interop documents lifecycle and ownership semantics

The `@unsignal/rxjs` package SHALL document that `toObservable` uses subscription-scoped tracking and that `toSignal` requires explicit teardown ownership outside framework-managed lifecycles.

#### Scenario: Documentation explains teardown responsibility

- **WHEN** a consumer reads the `@unsignal/rxjs` package README
- **THEN** the examples and guidance MUST show who owns `dispose()` for `toSignal` and `unsubscribe()` for `toObservable`
