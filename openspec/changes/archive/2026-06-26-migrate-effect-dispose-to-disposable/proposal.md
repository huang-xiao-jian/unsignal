## Why

The baseline package currently returns a callable `DisposeFn` from `effect`, which is compact but does not model effect lifecycle management as a first-class resource. Migrating to a `Disposable` object makes effect teardown easier to compose with other managed resources while preserving the symbol-based disposal semantics already expected by consumers.

## What Changes

- **BREAKING** Change `@unsignal/baseline` `effect()` to return a `Disposable` object instead of a callable `DisposeFn`.
- Preserve the symbol-based disposal entry point so effect handles continue to participate in `Symbol.dispose`-driven resource management.
- Define the returned object with explicit semantic meaning of both `Disposable` and `Unsubscribable`, so developers can manage signal effects in the same shape as other teardown-capable resources.
- Update baseline package specifications, documentation examples, and downstream implementation expectations to use object-based disposal.

## Capabilities

### New Capabilities

- `effect-disposable-resource`: Define the resource-oriented disposal contract returned by baseline effects, including symbol-based disposal behavior.

### Modified Capabilities

- `baseline`: Change the `effect` API contract from a callable disposer to a `Disposable`/`Unsubscribable` object and preserve disposal behavior guarantees.

## Impact

- Affected package: `@unsignal/baseline`
- Affected API surface: `effect()`, exported effect-related types, documentation examples, and tests
- Potential downstream impact: packages or user code that invoke the returned disposer as a function will need to migrate to object-based disposal
- No external runtime dependencies are expected
