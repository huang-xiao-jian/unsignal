## 1. Baseline API redesign

- [x] 1.1 Replace the `DisposeFn` return contract in `@unsignal/baseline` with a `Disposable` resource object type that preserves `Symbol.dispose`.
- [x] 1.2 Implement the returned handle with both `dispose()` and `unsubscribe()` so they delegate to the existing effect disposal path and share the same teardown behavior as `Symbol.dispose`.
- [x] 1.3 Update exported type declarations and effect-related examples in the baseline package to reflect object-based disposal instead of function invocation.

## 2. Verification and compatibility

- [x] 2.1 Add or update baseline tests to cover returned handle shape, `dispose()`, `unsubscribe()`, symbol-based disposal, cleanup execution, and idempotent repeated teardown.
- [x] 2.2 Document the breaking migration from `dispose()` function calls to handle-based teardown in the relevant baseline package documentation or change notes.
