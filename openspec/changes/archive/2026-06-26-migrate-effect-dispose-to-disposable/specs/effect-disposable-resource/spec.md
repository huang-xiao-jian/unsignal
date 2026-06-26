## ADDED Requirements

### Requirement: Effect handles SHALL expose resource-oriented disposal semantics

The system SHALL provide a resource-oriented handle type for baseline effects that can be managed as a first-class teardown resource instead of a callable function. The handle SHALL expose both `dispose()` and `unsubscribe()`, SHALL support symbol-based disposal, and SHALL represent unsubscribable lifecycle ownership for effect instances.

#### Scenario: Effect handle is stored as a managed resource

- **WHEN** a caller stores the value returned from `effect()` for later teardown
- **THEN** the returned value SHALL be an object resource rather than a callable function

#### Scenario: Effect handle supports symbol-based disposal

- **WHEN** a caller invokes the handle through `Symbol.dispose`
- **THEN** the effect SHALL stop tracking, run pending cleanup exactly once, and release its subscriptions

#### Scenario: Effect handle represents unsubscribable ownership

- **WHEN** a caller manages the returned handle alongside other unsubscribable resources
- **THEN** the effect handle SHALL expose teardown semantics that are equivalent to unsubscribing the effect from future updates

#### Scenario: Named teardown methods are equivalent

- **WHEN** a caller invokes `dispose()` or `unsubscribe()` on the returned handle
- **THEN** both methods SHALL perform the same underlying teardown behavior as `Symbol.dispose`
