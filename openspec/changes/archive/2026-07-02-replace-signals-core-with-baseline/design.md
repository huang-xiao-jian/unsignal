## Context

The repository now contains `@unsignal/baseline` as the intended primitive runtime, but the downstream packages still compile, document, and test against `@preact/signals-core`. The most significant mismatch is in `@unsignal/core`, which currently exports `createReadonlyModel` and model-oriented types implemented on top of `createModel`, an API that baseline explicitly does not provide.

This migration crosses three published packages:

- `@unsignal/core` must replace its primitive imports with `@unsignal/baseline` and remove every model-related export, type, test, and documentation section.
- `@unsignal/react` must replace its primitive imports, package dependency declarations, and documentation examples while preserving the current bridge behavior.
- `@unsignal/vue` must do the same for its Vue bridge implementation and docs.

The change is breaking because consumers of `@unsignal/core` may currently rely on `createReadonlyModel` and its related types.

## Goals / Non-Goals

**Goals:**

- Make `@unsignal/core`, `@unsignal/react`, and `@unsignal/vue` depend on `@unsignal/baseline` instead of `@preact/signals-core`.
- Remove `createReadonlyModel` and any model-related surface that depends on `createModel`.
- Preserve the documented runtime behavior of the remaining downstream APIs after the primitive swap.
- Align package manifests, source code, tests, and README content with the new primitive source.

**Non-Goals:**

- Reintroduce model-construction helpers inside `@unsignal/baseline` or any downstream package.
- Redesign existing watcher, resource, React bridge, or Vue bridge behavior beyond what is required for the dependency swap.
- Add new capabilities to `@unsignal/baseline`; this change only adopts its existing contract.

## Decisions

### Use baseline as the only downstream primitive runtime

`core`, `react`, and `vue` will import runtime functions and signal types from `@unsignal/baseline` directly. This removes the split-brain dependency between the unsignal ecosystem and preact-owned primitives.

Alternative considered:

- Keep `@preact/signals-core` in downstream packages and treat baseline as optional. Rejected because it leaves the ecosystem inconsistent and defeats the purpose of shipping a baseline replacement package.

### Remove model-related APIs instead of emulating them

`createReadonlyModel`, `ReadonlyModel`, and model-constructor helper types will be removed from `@unsignal/core` exports, source files, tests, and docs. No compatibility shim will be introduced.

Alternative considered:

- Emulate `createModel` in `@unsignal/core` or baseline. Rejected because baseline explicitly excludes model-construction APIs, and adding a partial recreation here would reintroduce a higher-level abstraction the package family is trying to retire.

### Treat the migration as a contract-preserving swap for non-model APIs

The implementation should change imports, package manifests, and docs, but it should keep the behavior of `readonly`, `reaction`, `watchEffect`, `watch`, `resource`, `observer`, `Observer`, `useSignalValue`, `useSignalState`, `useSignalEffect`, `useLiveSignal`, and Vue bridge APIs intact.

Alternative considered:

- Fold broader refactors into the migration. Rejected because that would make regressions harder to localize and expand the breaking surface beyond the model API removal.

### Update tests to prove the primitive swap

Existing tests that only need signal primitives should be updated to import from baseline. Tests that assert `createReadonlyModel` behavior should be removed or replaced with tests covering the remaining `readonly` contract and any changed export surface.

Alternative considered:

- Leave stale tests in place and rely on type errors to guide cleanup. Rejected because it creates noisy failure modes and does not verify that the migrated packages still work on baseline.

## Risks / Trade-offs

- [Breaking downstream consumers that import model helpers] → Mitigation: document the removal clearly in the proposal/specs, remove the exports decisively, and update package READMEs to point users toward explicit baseline signal composition.
- [Subtle runtime differences between preact signals and baseline] → Mitigation: keep behavior-focused tests for watcher, resource, React bridge, and Vue bridge flows while swapping only the primitive import source.
- [Incomplete dependency cleanup leaving preact references in docs or package metadata] → Mitigation: update package manifests, source imports, tests, and README installation/examples in the same change.
- [Type-level regressions from swapping signal type imports] → Mitigation: run targeted package tests and TypeScript checks for `core`, `react`, and `vue` after the migration.

## Migration Plan

1. Update package manifests so `core`, `react`, and `vue` depend on `@unsignal/baseline` instead of `@preact/signals-core`.
2. Replace runtime and type imports in downstream source files and tests with baseline equivalents.
3. Remove the `createReadonlyModel` implementation, exports, tests, related `Model` types, and README/spec references from `@unsignal/core`.
4. Update README files and examples across all affected packages to use `@unsignal/baseline`.
5. Run targeted tests and package-level verification to confirm behavior remains intact for all non-model APIs.

## Open Questions

- None currently. The baseline contract and the user direction are explicit that model-related APIs must be removed rather than migrated.
