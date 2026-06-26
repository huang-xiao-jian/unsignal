## Context

`@unsignal/baseline` currently models effect teardown as a callable `DisposeFn` returned from `effect()`. The implementation binds `effect._dispose` and brands the returned function with `Symbol.dispose`, which preserves disposal behavior but does not expose a resource object that can be stored, coordinated, or normalized alongside other teardown-capable resources.

This change is intentionally scoped to the baseline package API surface, but it is cross-cutting within that package because it affects runtime behavior, exported types, tests, documentation examples, and compatibility expectations for downstream packages. The design must preserve the existing disposal semantics, including cleanup execution and symbol-based resource disposal, while replacing call syntax with an explicit object contract.

## Goals / Non-Goals

**Goals:**

- Return a first-class `Disposable` object from `effect()` instead of a callable function.
- Preserve `Symbol.dispose` support so effect handles continue to work with symbol-based resource management.
- Give the returned handle explicit `Unsubscribable` semantics so it can be managed consistently with other teardown-oriented resources.
- Expose both `dispose()` and `unsubscribe()` on the returned handle and require them to share the same teardown behavior.
- Keep effect lifecycle behavior unchanged apart from the shape of the returned handle.
- Make migration straightforward by converging on one explicit disposal method.

**Non-Goals:**

- Rework the internal effect scheduling, dependency tracking, or cleanup timing semantics.
- Introduce framework-specific helpers or higher-level resource composition APIs.
- Preserve backward compatibility for direct function invocation of the effect handle.
- Change the symbol branding used to identify signal primitives.

## Decisions

### Return an object-based handle with explicit disposal methods

`effect()` will return an object that owns disposal methods rather than a bound function. The handle will expose both `dispose()` and `unsubscribe()` for developer-facing teardown, and the same implementation will also be reachable through `Symbol.dispose`.

Rationale:

- An object expresses lifecycle ownership more clearly than a function alias.
- The shape can align with both `Disposable` and `Unsubscribable` semantics without overloading call syntax.
- Object identity is easier to extend later if baseline needs metadata or additional resource semantics.
- Providing both method names lets the API match the intended semantics directly instead of forcing consumers to adapt one vocabulary to the other.

Alternatives considered:

- Keep `DisposeFn` and only document it as disposable. Rejected because the function shape still obscures the resource contract and keeps the API inconsistent with other object-based teardown resources.
- Return a hybrid callable object. Rejected because it preserves the ambiguity of "function or resource" and complicates typing and implementation.

### Preserve one canonical disposal path internally

The returned handle methods will delegate to the existing effect instance disposal path, so cleanup ordering, idempotency, and post-disposal state transitions remain anchored to the current `Effect._dispose()` behavior.

Rationale:

- The effect internals already enforce disposal semantics that should not be duplicated.
- A single underlying implementation minimizes regression risk during a breaking API migration.

Alternatives considered:

- Introduce a second disposal code path on the handle itself. Rejected because it would duplicate state transitions and increase the chance of divergence.

### Represent unsubscribe semantics through the same handle

The returned object will be documented and typed as a resource that can be consumed as both `Disposable` and `Unsubscribable`, with `dispose()`, `unsubscribe()`, and `Symbol.dispose` delegating to the same disposal logic.

Rationale:

- The user intent is to manage signal effects the same way as other resources.
- Shared teardown semantics reduce adapter code in consumer applications.

Alternatives considered:

- Keep baseline-specific naming only. Rejected because it limits interoperability and misses the semantic improvement motivating the change.

## Risks / Trade-offs

- [Breaking consumer code that calls the returned disposer as a function] → Mitigation: mark the API change as breaking in the proposal, add migration guidance in specs and tasks, and update examples to the object-based pattern.
- [Naming ambiguity between `dispose()` and `unsubscribe()`] → Mitigation: define one underlying teardown behavior and document both entry points as equivalent resource-management operations if both are exposed.
- [Future divergence between symbol disposal and named teardown methods] → Mitigation: require all public teardown methods to delegate to the same underlying effect disposal implementation.

## Migration Plan

1. Introduce the new `Disposable`/`Unsubscribable` handle type in `@unsignal/baseline` and update `effect()` to return it with both `dispose()` and `unsubscribe()`.
2. Update tests to validate method-based teardown, symbol-based teardown, idempotency, and effect cleanup behavior.
3. Update package documentation and spec references to replace `dispose()` call-function examples with handle-object examples.
4. Provide a short migration note describing the replacement of `dispose()` function invocation with `handle.dispose()` or `handle.unsubscribe()`.

Rollback strategy:

- Revert the API contract to `DisposeFn` and restore the callable return value if the break proves unacceptable before release.

## Open Questions

- Should the handle type be exported under a baseline-specific name, or should the package reuse a more general shared resource contract name from the outset?
