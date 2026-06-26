## Why

`@unsignal/baseline` currently mixes TypeScript `declare class` declarations with ES5-style constructor functions and prototype mutation in the runtime implementation. That split makes the package harder to reason about, harder to extend safely, and harder to evolve while the package is still in WIP status.

## What Changes

- Refactor the baseline runtime to use explicit `class` implementations for core reactive primitives instead of interface plus function/prototype composition.
- Preserve the intended public primitive API surface for `signal`, `computed`, `effect`, `batch`, `untracked`, and `action` while changing the internal architecture within the WIP package.
- Define the baseline architectural requirement that writable and derived signals are implemented as first-class classes with well-defined inheritance and lifecycle responsibilities.
- Add verification coverage that protects runtime behavior, subclass relationships, and API compatibility during the refactor.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `baseline`: clarify that the baseline primitive runtime must be implemented with explicit class-based primitives while preserving the documented public behavior.

## Impact

- Affected code: `/packages/baseline/src/index.ts` and the baseline package test suite.
- Affected APIs: the baseline package keeps the same intended primitive API shape while its internal construction and inheritance strategy changes.
- Affected downstream systems: none currently; the package remains WIP and is not treated as a downstream compatibility constraint for this refactor.
