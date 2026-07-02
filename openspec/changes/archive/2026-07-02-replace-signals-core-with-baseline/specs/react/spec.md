## ADDED Requirements

### Requirement: React bridge targets baseline primitives

`@unsignal/react` SHALL provide its React bridge APIs for signals created by `@unsignal/baseline` instead of `@preact/signals-core`.

#### Scenario: React hooks and components accept baseline signals

- **WHEN** a consumer passes a writable or readonly signal created by `@unsignal/baseline` into `observer`, `Observer`, `useSignalValue`, `useSignalState`, `useSignalEffect`, `Show`, `For`, `Switch`, or `useLiveSignal`-driven flows
- **THEN** the documented and supported behavior MUST operate on baseline signal primitives without requiring `@preact/signals-core`

#### Scenario: React package guidance points to baseline

- **WHEN** a consumer reads the package README, API examples, or installation instructions
- **THEN** the package MUST instruct consumers to install and import `@unsignal/baseline` as the primitive provider

### Requirement: React bridge preserves non-model behavior during the migration

Replacing the primitive provider SHALL NOT change the documented bridge semantics of the existing React APIs beyond the package and type source they target.

#### Scenario: Existing React bridge semantics stay intact

- **WHEN** a consumer uses the existing `@unsignal/react` APIs with baseline signals
- **THEN** render tracking, external store subscriptions, effect cleanup, and writable signal mutation behavior MUST remain compatible with the current documented React bridge behavior
