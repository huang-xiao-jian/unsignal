## Why

The `@unsignal/baseline` package is intended to provide builtin signal primitives, but it currently includes a higher-level `createModel` API and its supporting lifecycle machinery. That extra abstraction blurs the package boundary, complicates the runtime semantics of `untracked()`, and inflates the baseline test suite far beyond the primitive behavior it should validate.

## What Changes

- **BREAKING** Remove the `createModel` API and all exported model-related types from `@unsignal/baseline`.
- Remove model-specific runtime machinery from the baseline implementation, including effect-capture behavior that exists only to support `createModel`.
- Narrow `untracked()` back to primitive dependency-tracking behavior rather than model ownership suppression.
- Split the monolithic baseline test file into smaller suites organized by primitive behavior and cross-primitive integration concerns.
- Preserve primitive runtime behavior for `signal`, `computed`, `effect`, `batch`, `action`, and `untracked` while rehoming or deleting tests that only validate model ergonomics.

## Capabilities

### New Capabilities

- Defines the supported primitive API surface and test organization rules for `@unsignal/baseline` after removing model-layer behavior.

### Modified Capabilities

## Impact

- Affected code: `packages/baseline/src/index.ts`, `packages/baseline/src/index.test.ts`, new split test files under `packages/baseline/src/`
- Affected API: removal of `createModel`, `Model`, `ModelFactory`, and `ModelConstructor` exports
- Affected behavior: `untracked()` no longer carries model-capture semantics
- Affected consumers: any code depending on model construction or model-owned effect disposal in `@unsignal/baseline`
