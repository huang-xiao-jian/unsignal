## 1. Rebrand Baseline Runtime Identity

- [x] 1.1 Replace the baseline package's current `preact`-named brand symbol with an `unsignal`-owned shared symbol and update the exported type surface that references `brand`.
- [x] 1.2 Update baseline package metadata and README language so the package presents itself as an `unsignal` primitive runtime rather than a `preact`-branded replacement.

## 2. Add Signal Guard APIs

- [x] 2.1 Refine `isSignal` so it is the broad baseline-signal detector rather than a writable-only predicate.
- [x] 2.2 Implement `isWritableSignal` for writable baseline signal detection using the supported baseline runtime contract instead of internal-only assumptions.
- [x] 2.3 Refine `isReadonlySignal` for read-only baseline signal detection and ensure computed signals are classified correctly relative to the broader `isSignal` predicate.
- [x] 2.4 Export the three guard functions with appropriate TypeScript type predicates or narrowing-friendly signatures.

## 3. Verify Baseline API Behavior

- [x] 3.1 Add or update baseline tests for the new brand symbol, `isSignal`, `isReadonlySignal`, `isWritableSignal`, writable signal positives, computed signal positives, and non-signal false cases.
- [x] 3.2 Run the baseline package test suite and fix any regressions caused by the refined guard APIs.
