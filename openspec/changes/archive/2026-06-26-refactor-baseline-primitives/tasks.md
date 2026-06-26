## 1. Remove model-layer API from baseline

- [x] 1.1 Remove `createModel` and all model-related exported types from `packages/baseline/src/index.ts`
- [x] 1.2 Delete model-only runtime machinery such as captured effect ownership and recursive model action wrapping
- [x] 1.3 Simplify `untracked()` and related inline documentation so they describe primitive dependency suppression only

## 2. Reorganize baseline test coverage

- [x] 2.1 Classify existing `packages/baseline/src/index.test.ts` cases into primitive coverage to keep, indirect primitive coverage to rewrite, and model-only coverage to delete
- [x] 2.2 Split retained baseline tests into semantically named suites for primitive features and a small integration suite where necessary
- [x] 2.3 Remove model-construction, model-disposal, nested model, and model-typing tests that are no longer part of the baseline contract

## 3. Align package surface and documentation

- [x] 3.1 Update baseline package documentation and comments to reflect the primitive-only API surface
- [x] 3.2 Verify the baseline package exports and test layout match the new `baseline-primitives` OpenSpec requirements
