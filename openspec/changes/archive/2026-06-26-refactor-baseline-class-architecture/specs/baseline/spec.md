## ADDED Requirements

### Requirement: Baseline primitives use explicit class implementations

The `@unsignal/baseline` runtime SHALL implement its writable signal and derived signal primitives as explicit ECMAScript classes instead of constructor-function and prototype-composition patterns. The class-based implementation SHALL preserve the documented public behavior of `signal()`, `computed()`, and related reactive lifecycle hooks while making inheritance and instance responsibilities explicit in the runtime.

#### Scenario: Writable signal instances are backed by a concrete class

- **WHEN** `signal()` creates a writable signal instance
- **THEN** the returned object MUST be an instance of a concrete writable signal class that owns its state, subscription links, and lifecycle methods directly through class construction

#### Scenario: Computed instances extend the signal base class explicitly

- **WHEN** `computed()` creates a derived signal instance
- **THEN** the returned object MUST be backed by an explicit class that extends the writable signal base class or a shared signal base class without relying on prototype reassignment after declaration

#### Scenario: Public primitive behavior remains compatible through the refactor

- **WHEN** callers use the documented baseline APIs for reading, writing, subscribing, batching, and effect tracking
- **THEN** the refactored class-based runtime MUST preserve the observable behavior and compatibility guarantees documented by the baseline capability
