## MODIFIED Requirements

### Requirement: Effect returns a disposable resource handle

The `@unsignal/baseline` package SHALL return a disposable resource object from `effect()` instead of a callable disposer function. The returned handle SHALL expose both `dispose()` and `unsubscribe()` methods, SHALL preserve immediate execution, dependency tracking, re-execution on dependency changes, cleanup support, and explicit teardown of future tracking.

#### Scenario: Creating an effect returns a disposable object

- **WHEN** a caller creates an effect
- **THEN** the callback SHALL run immediately
- **THEN** the returned value SHALL be an object handle that represents the effect lifecycle

#### Scenario: Disposing an effect handle stops future work

- **WHEN** a caller disposes or unsubscribes the returned effect handle
- **THEN** the effect SHALL stop tracking signal changes
- **THEN** the latest registered cleanup function SHALL run before subscriptions are released

#### Scenario: Disposing an effect handle is idempotent

- **WHEN** a caller disposes the same effect handle more than once
- **THEN** disposal SHALL not resubscribe the effect or re-run cleanup after the first completed disposal

#### Scenario: Effect callback disposal remains available inside execution context

- **WHEN** an effect callback uses its execution context to dispose itself
- **THEN** the effect SHALL dispose through the same underlying lifecycle behavior as the returned handle
