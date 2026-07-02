## ADDED Requirements

### Requirement: Vue bridge targets baseline primitives

`@unsignal/vue` SHALL provide its Vue bridge APIs for signals created by `@unsignal/baseline` instead of `@preact/signals-core`.

#### Scenario: Vue hooks and components accept baseline signals

- **WHEN** a consumer passes a writable or readonly signal created by `@unsignal/baseline` into `useSignalValue`, `useSignalState`, `Observer`, or `SignalPlugin`-registered flows
- **THEN** the documented and supported behavior MUST operate on baseline signal primitives without requiring `@preact/signals-core`

#### Scenario: Vue package guidance points to baseline

- **WHEN** a consumer reads the package README, API examples, or installation instructions
- **THEN** the package MUST instruct consumers to install and import `@unsignal/baseline` as the primitive provider

### Requirement: Vue bridge preserves non-model behavior during the migration

Replacing the primitive provider SHALL NOT change the documented Vue bridge semantics beyond the package and type source they target.

#### Scenario: Existing Vue bridge semantics stay intact

- **WHEN** a consumer uses the existing `@unsignal/vue` APIs with baseline signals
- **THEN** signal-to-`ShallowRef` synchronization, component-scope cleanup, and mutable helper behavior MUST remain compatible with the current documented Vue bridge behavior
