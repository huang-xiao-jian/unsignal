## ADDED Requirements

### Requirement: Core utilities target baseline primitives

`@unsignal/core` SHALL define its public signal utility APIs against `@unsignal/baseline` primitives instead of `@preact/signals-core`.

#### Scenario: Core APIs accept writable and readonly baseline signals

- **WHEN** a consumer calls `readonly`, `watch`, `watchEffect`, `reaction`, or `resource`
- **THEN** the documented types, examples, and supported runtime behavior MUST target `Signal`, `ReadonlySignal`, `effect`, `computed`, `batch`, and `untracked` from `@unsignal/baseline`

#### Scenario: Core documentation describes baseline as the primitive dependency

- **WHEN** a consumer reads the package documentation or installation guidance for `@unsignal/core`
- **THEN** the package MUST describe `@unsignal/baseline` as the supported primitive dependency and MUST NOT instruct consumers to install or import `@preact/signals-core`

## REMOVED Requirements

### Requirement: Core exposes createReadonlyModel

**Reason**: `@unsignal/baseline` intentionally omits `createModel` and related model-construction APIs, so `@unsignal/core` cannot keep a wrapper that depends on them.
**Migration**: Replace `createReadonlyModel` usage with explicit classes, factory functions, or plain objects built from baseline `signal`, `computed`, and `readonly` primitives. Consumers that need readonly exposure MUST compose readonly signals directly instead of relying on model wrappers.

#### Scenario: Model helpers are no longer part of the core contract

- **WHEN** a consumer imports from `@unsignal/core`
- **THEN** the package MUST NOT export `createReadonlyModel`, `ReadonlyModel`, or model-constructor types that depend on `createModel`
