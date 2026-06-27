## Why

`@unsignal/baseline` is now ready to serve as the reactive primitive runtime for the `unsignal` ecosystem, but the downstream packages still depend on `@preact/signals-core` in both their contracts and implementation. This keeps the ecosystem split across two primitive providers and leaves `@unsignal/core` documenting and exporting model-related helpers that cannot be supported by baseline.

## What Changes

- Replace downstream package dependencies on `@preact/signals-core` with `@unsignal/baseline`.
- Update `@unsignal/core`, `@unsignal/react`, and `@unsignal/vue` contracts, docs, and examples to describe baseline-native signals and effect primitives.
- **BREAKING** Remove `createReadonlyModel` and related model-oriented types from `@unsignal/core` because `@unsignal/baseline` intentionally does not provide `createModel` or any related API.
- Keep the existing non-model downstream APIs working on top of baseline primitives, including readonly wrapping, watchers, resources, and framework bridge hooks/components.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `core`: Retarget the package from extending `@preact/signals-core` to extending `@unsignal/baseline`, and remove all model-construction helpers that depended on `createModel`.
- `react`: Retarget React bridge requirements, types, examples, and package dependencies to `@unsignal/baseline` primitives.
- `vue`: Retarget Vue bridge requirements, types, examples, and package dependencies to `@unsignal/baseline` primitives.

## Impact

- Affected code: `packages/core`, `packages/react`, `packages/vue`
- Affected APIs: `@unsignal/core` removes `createReadonlyModel`, `ReadonlyModel`, and related model-constructor types
- Affected dependencies: downstream packages stop depending on `@preact/signals-core` and depend on `@unsignal/baseline` instead
- Affected documentation and tests: all package docs, examples, and tests that import `@preact/signals-core` or rely on `createModel`-based behavior
