## Context

`@unsignal/baseline` is positioned as the built-in primitive runtime for the `unsignal` ecosystem, but its current implementation still exposes `Symbol.for('preact-signals')` as the shared runtime brand and still describes itself as a replacement for `@preact/signals-core`. That mismatch makes the package look like a forked compatibility layer instead of a first-party baseline runtime.

The current implementation also exports writable `Signal`, derived `Computed`, and `ReadonlySignal` types without a supported runtime guard API. Callers that need branching behavior based on signal shape would currently have to depend on `instanceof`, direct brand inspection, or ad hoc property checks. That is fragile for a package that already intends to use a cross-version brand symbol, and it becomes more confusing if `isSignal` is defined as a writable-only alias instead of the broadest predicate.

This change is cross-cutting inside the baseline package because it touches runtime branding, public exports, package documentation, and the behavior contract in the baseline spec. It also needs to preserve the current mental model where computed signals are read-only while writable signals expose a setter.

## Goals / Non-Goals

**Goals:**

- Rebrand the baseline package's public signal marker so it uses an `unsignal` runtime identity rather than a `preact`-named symbol.
- Add stable `isSignal`, `isReadonlySignal`, and `isWritableSignal` guard functions to the baseline public API.
- Define clear runtime semantics for the three guards across generic baseline signals, writable signals, and computed/read-only signals.
- Update documentation and tests so the new brand and guard surface are part of the supported baseline contract.

**Non-Goals:**

- Rename the package itself or rewrite every repository reference to `@preact/signals-core` outside the baseline package.
- Change baseline reactivity semantics such as batching, tracking, disposal, or computed laziness.
- Add a broader reflection API beyond the three requested guard functions.
- Remove existing exported classes or force consumers to stop using `instanceof` where that remains valid.

## Decisions

### Adopt an `unsignal`-owned shared brand symbol

The baseline runtime will replace `Symbol.for('preact-signals')` with an `unsignal`-specific symbol key, exposed through the existing `brand` property on signal instances. This keeps the current cross-realm and cross-version detection strategy while aligning the public identity with the package owner.

Alternative considered: keep the old symbol for compatibility and only change documentation text. Rejected because the user explicitly wants a new brand, and leaving the `preact` symbol in place would preserve the core identity mismatch this change is meant to remove.

### Define a three-level guard lattice in terms of the supported public brand plus value shape

`isSignal` should be the broadest predicate. It should return `true` for any baseline-branded signal primitive, including writable signals from `signal()` and read-only signals from `computed()`. `isWritableSignal` should narrow that set to writable baseline signals that expose an assignable `value`. `isReadonlySignal` should narrow to read-only baseline signals that are recognized baseline signals but are not writable.

This avoids tying the guards exclusively to `instanceof`, which is less resilient if the package later evolves its internal class structure while preserving a shared brand contract. It also aligns the names with their conceptual roles: `isSignal` answers "is this any baseline signal?", while the other two answer "which kind?".

Alternative considered: keep only two guards and make `isSignal` mean writable-only. Rejected because it makes the most general name carry the narrower meaning, which is counterintuitive and leaves no obvious predicate for "any baseline signal". Alternative considered: implement all guards with `instanceof Signal` and `instanceof Computed`. Rejected because the package already uses branding for cross-version detection, and `instanceof` alone is a weaker public contract for mixed-version or cross-bundle scenarios.

### Keep guard semantics baseline-specific rather than generic

The new guard functions will only recognize baseline-branded primitives. They will not promise interoperability with third-party signal implementations or raw `@preact/signals-core` instances that lack the new brand.

Alternative considered: detect any object with a `value` property and `peek()` method. Rejected because that would produce false positives and would weaken the meaning of the guard APIs into a generic duck-typing helper instead of a baseline contract.

### Document the relationship between generic, writable, and read-only detection explicitly

The baseline README and delta spec should make the three-way relationship explicit:

- `isSignal(value)` answers whether `value` is any baseline signal.
- `isWritableSignal(value)` answers whether `value` is a writable baseline signal produced by `signal()`.
- `isReadonlySignal(value)` answers whether `value` is a read-only baseline signal such as one produced by `computed()`.

This gives downstream code a stable progression from coarse detection to variant detection.

Alternative considered: ship the guards without documentation because the names are self-explanatory. Rejected because the difference between "a signal" and "a read-only signal" is a contract question, and the behavior needs to be unambiguous before implementation work begins.

## Risks / Trade-offs

- [Brand symbol change breaks direct symbol equality checks] -> Update baseline tests and documentation together, and treat symbol comparisons against the old `preact` key as an intentional breaking behavior inside the WIP package.
- [Guard logic could misclassify generic, writable, and read-only values] -> Base detection on the branded public surface and add focused tests for writable signals, computed signals, the broad `isSignal` case, and non-signal lookalikes.
- [Future internal refactors could drift from the documented guard contract] -> Specify the guard behavior in the baseline delta spec and keep tests at the API level rather than relying on internal field knowledge.
- [Downstream packages may later want cross-runtime interoperability] -> Keep the scope narrow for now and revisit generic interop only if there is a concrete requirement across `@unsignal/core`, `@unsignal/react`, or `@unsignal/vue`.

## Migration Plan

1. Replace the baseline brand symbol constant and update any package metadata or README wording that still presents the runtime as `preact`-branded.
2. Export `isSignal`, `isReadonlySignal`, and `isWritableSignal` from `packages/baseline/src/index.ts` with behavior aligned to the baseline-owned brand.
3. Add or update tests that cover brand identity, broad signal detection, writable signal detection, computed/read-only signal detection, and false cases.
4. Verify the baseline package test suite passes and confirm the new documentation/examples match the shipped API.

Rollback is straightforward because the change is isolated to the WIP baseline package: restoring the previous brand key and removing the guard exports would revert the behavior if needed.

## Open Questions

- Should the new symbol key be `unsignal-signals` for parity with the old naming pattern, or something more package-specific such as `@unsignal/baseline`?
- Should `isReadonlySignal` remain an exclusive runtime predicate for non-writable signals even though `Signal<T>` is structurally assignable to `ReadonlySignal<T>` at the type level? This change assumes runtime exclusivity because it produces the most useful guard split alongside `isWritableSignal`.
