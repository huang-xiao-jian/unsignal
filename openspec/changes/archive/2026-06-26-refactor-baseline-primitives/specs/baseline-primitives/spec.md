## ADDED Requirements

### Requirement: Baseline exports only primitive reactive APIs

`@unsignal/baseline` MUST expose only primitive reactive runtime APIs and types. The package MUST NOT export model-construction APIs or model-specific helper types.

#### Scenario: Model APIs are removed from the baseline surface

- **WHEN** a consumer imports from `@unsignal/baseline`
- **THEN** the package export surface MUST include primitive APIs such as `signal`, `computed`, `effect`, `batch`, `action`, `untracked`, and primitive signal/effect types
- **AND** the package export surface MUST NOT include `createModel`, `Model`, `ModelFactory`, or `ModelConstructor`

### Requirement: Primitive runtime semantics are independent of model ownership

The baseline runtime MUST implement primitive dependency tracking and scheduling without model-specific effect ownership state. `untracked()` MUST suppress dependency collection only and MUST NOT alter model-capture behavior because no model-capture mechanism exists in the runtime.

#### Scenario: Untracked access does not create dependencies

- **WHEN** code reads a signal inside `untracked()`
- **THEN** that read MUST NOT subscribe the surrounding computed or effect to the signal

#### Scenario: Effect lifecycle does not depend on model capture

- **WHEN** an effect is created in the baseline runtime
- **THEN** its execution and disposal behavior MUST be determined by primitive effect semantics only
- **AND** the runtime MUST NOT rely on ambient model-owned effect capture state

### Requirement: Baseline tests are organized by semantic behavior

Baseline tests MUST be split into smaller suites grouped by primitive behavior so that primitive contracts can be located and maintained independently of unrelated features.

#### Scenario: Primitive features have dedicated test suites

- **WHEN** the baseline test suite is organized
- **THEN** signal, computed, effect, batch, action, and untracked behavior MUST be covered in semantically named test files or sections
- **AND** cross-primitive behavior that does not belong to one primitive MAY live in a dedicated integration-oriented suite

#### Scenario: Model-only test cases are removed or rewritten

- **WHEN** an existing baseline test validates `createModel`, model disposal, nested model composition, or model-specific typing
- **THEN** that test MUST be removed
- **AND** any retained behavioral coverage MUST be rewritten to assert primitive contracts directly rather than through model factories
