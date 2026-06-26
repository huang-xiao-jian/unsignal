## 1. Runtime Refactor

- [x] 1.1 Replace the constructor-function and prototype-mutation implementation of baseline `Signal` with an explicit TypeScript class while preserving existing runtime semantics.
- [x] 1.2 Replace the current computed inheritance wiring with an explicit class-based derived signal implementation.
- [x] 1.3 Refactor any effect or shared lifecycle internals that depend on the old prototype-composition pattern so they work cleanly with the new class structure.

## 2. Compatibility Verification

- [x] 2.1 Add or update baseline tests that verify class identity, inheritance, and public API compatibility for `signal()` and `computed()`.
- [x] 2.2 Run the baseline package test suite and fix any regressions caused by the architectural refactor.

## 3. Documentation Alignment

- [x] 3.1 Update any baseline package documentation comments or README guidance that describe the internal implementation in a way that becomes inaccurate after the refactor.
