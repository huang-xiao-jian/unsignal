## 1. Dependency And Export Migration

- [x] 1.1 Drop `@preact/signals-core` and add `@unsignal/baseline` in the package manifests for `@unsignal/core`, `@unsignal/react`, and `@unsignal/vue`
- [x] 1.2 Update downstream source files to import signal primitives and types from `@unsignal/baseline`
- [x] 1.3 Remove `createReadonlyModel`, `ReadonlyModel`, and related model-constructor exports from `@unsignal/core`

## 2. Test And Documentation Alignment

- [x] 2.1 Update or remove tests so `core`, `react`, and `vue` verify their remaining APIs against baseline primitives
- [x] 2.2 Remove `createModel` and `createReadonlyModel` guidance from `@unsignal/core` documentation and replace it with baseline-native usage guidance
- [x] 2.3 Update `@unsignal/react` and `@unsignal/vue` README installation snippets, imports, and examples to use `@unsignal/baseline`

## 3. Verification

- [x] 3.1 Run targeted test suites for `@unsignal/core`, `@unsignal/react`, and `@unsignal/vue`
- [x] 3.2 Run the relevant package build or typecheck commands to confirm the downstream migration is clean
