## ADDED Requirements

### Requirement: Baseline signals use an unsignal-owned runtime brand

The `@unsignal/baseline` package SHALL expose a baseline-owned runtime brand for its signal primitives instead of a `preact`-named shared symbol. Writable signals and read-only computed signals SHALL expose the same baseline-owned brand through their public `brand` property.

#### Scenario: Writable signals expose the baseline-owned brand

- **WHEN** a caller creates a writable signal with `signal()`
- **THEN** the returned signal MUST expose a `brand` property equal to the baseline-owned shared symbol

#### Scenario: Computed signals expose the baseline-owned brand

- **WHEN** a caller creates a derived signal with `computed()`
- **THEN** the returned read-only signal MUST expose the same baseline-owned shared symbol through its `brand` property

### Requirement: Baseline provides runtime signal guard APIs

The `@unsignal/baseline` package SHALL export `isSignal`, `isReadonlySignal`, and `isWritableSignal` as supported runtime guard functions for baseline primitives.

#### Scenario: Generic baseline signals are recognized by isSignal

- **WHEN** a caller passes a writable baseline signal created by `signal()` or a read-only baseline signal created by `computed()` to `isSignal`
- **THEN** `isSignal` MUST return `true`

#### Scenario: Writable signals are recognized by isWritableSignal

- **WHEN** a caller passes a writable baseline signal created by `signal()` to `isWritableSignal`
- **THEN** `isWritableSignal` MUST return `true`

#### Scenario: Computed signals are not recognized as writable signals

- **WHEN** a caller passes a read-only baseline signal created by `computed()` to `isWritableSignal`
- **THEN** `isWritableSignal` MUST return `false`

#### Scenario: Read-only baseline signals are recognized by isReadonlySignal

- **WHEN** a caller passes a read-only baseline signal created by `computed()` to `isReadonlySignal`
- **THEN** `isReadonlySignal` MUST return `true`

#### Scenario: Writable signals are not recognized as read-only-only signals

- **WHEN** a caller passes a writable baseline signal created by `signal()` to `isReadonlySignal`
- **THEN** `isReadonlySignal` MUST return `false`

#### Scenario: Non-signal values are rejected by all guards

- **WHEN** a caller passes a non-signal value or an object that only partially resembles the signal API to `isSignal`, `isReadonlySignal`, or `isWritableSignal`
- **THEN** each guard MUST return `false`
