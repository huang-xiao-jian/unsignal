## Why

`@unsignal/baseline` still exposes parts of its replacement story through `preact`-branded runtime markers and documentation language, which conflicts with the package's role as a first-party `unsignal` primitive runtime. At the same time, consumers and downstream packages do not yet have a supported way to distinguish baseline signals at runtime with a consistent guard vocabulary.

## What Changes

- Replace the baseline package's public brand identity from the current `preact`-derived marker to an `unsignal`-owned brand that represents baseline primitives as first-party runtime objects.
- Add `isSignal`, `isReadonlySignal`, and `isWritableSignal` runtime guard APIs to `@unsignal/baseline` so callers can detect generic baseline signals first, then distinguish writable and read-only variants without relying on internal structure checks.
- Update baseline package documentation, tests, and exported type declarations to reflect the new brand identity and supported guard functions.
- Modify the baseline capability contract so brand compatibility and signal guard behavior are specified as part of the package surface rather than remaining implicit implementation details.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `baseline`: define the baseline-owned signal brand and add supported runtime guard APIs for generic, writable, and read-only signal detection.

## Impact

- Affected code: `packages/baseline/src/index.ts`, `packages/baseline/src/signal.test.ts`, `packages/baseline/README.md`, and any other baseline package tests or type assertions that reference the existing brand symbol or exported surface.
- Affected APIs: `@unsignal/baseline` will add `isSignal`, `isReadonlySignal`, and `isWritableSignal`, and the exposed `brand` symbol identity will change from the current `preact`-derived value to an `unsignal` value.
- Affected downstream systems: future consumers of `@unsignal/baseline`, plus any repository code or docs that compare the current brand symbol directly.
