## Context

`@unsignal/baseline` is the in-progress primitive reactive runtime for the `unsignal` ecosystem. The current implementation in `/packages/baseline/src/index.ts` exposes `Signal` and `Computed` as if they were classes, but the runtime is assembled with `declare class` stubs, constructor functions, prototype mutation, and manual inheritance wiring. That design works, but it increases cognitive load, obscures ownership of internal state, and makes further baseline evolution riskier because runtime behavior and type declarations are maintained through separate mechanisms.

Because the package remains WIP, this refactor does not need to preserve downstream compatibility contracts yet. The design should still minimize unnecessary semantic drift inside the package so the intended primitive behavior remains coherent and mechanically verifiable through existing tests.

## Goals / Non-Goals

**Goals:**

- Replace constructor-function and prototype-composition patterns in the baseline runtime with explicit `class` declarations.
- Make inheritance, internal state ownership, and lifecycle hooks explicit for signal and computed instances.
- Preserve the intended primitive API surface and observable runtime behavior covered by the baseline package tests.
- Improve maintainability so future baseline enhancements can target well-defined class boundaries instead of mixed type/runtime patterns.

**Non-Goals:**

- Redesign the intended external baseline API or introduce new primitives.
- Port higher-level `@unsignal/core` model abstractions into the baseline package.
- Rework baseline semantics such as batching, tracking, subscription timing, or effect disposal beyond what is needed to preserve existing behavior.
- Optimize for transpilation targets older than the repository's current Node.js and TypeScript toolchain requirements.

## Decisions

### Use explicit runtime classes for `Signal`, `Computed`, and effect internals

The runtime will define concrete classes directly in TypeScript rather than pairing `declare class` type shapes with separately implemented constructor functions. This keeps the type contract and runtime behavior in the same declaration site and removes the need for `@ts-ignore`-driven redeclaration patterns.

Alternative considered: keep the existing function/prototype model and add comments or helper functions around it. Rejected because the current pain comes from the architectural pattern itself: inheritance and ownership remain implicit, and the implementation continues to require split-brain maintenance between declarations and runtime wiring.

### Preserve factory helpers as thin wrappers around class construction

The public `signal()` and `computed()` functions will remain as the package entry points, but they will become thin wrappers over class constructors. This preserves the intended baseline ergonomics while allowing the internal runtime to become class-oriented.

Alternative considered: export constructors directly and encourage `new Signal()` / `new Computed()`. Rejected because the current baseline API design is function-based, and changing that surface would add avoidable churn on top of the architectural refactor.

### Keep reactive graph mechanics in the baseline module while relocating instance logic into classes

The refactor should move per-instance behavior such as reads, writes, refresh, subscribe, and unsubscribe into class methods while retaining shared scheduler and graph utilities as module-level helpers where they are truly cross-cutting. This separates object responsibilities from shared runtime orchestration without forcing a full file or module decomposition in the same change.

Alternative considered: split the entire runtime into many files during the same refactor. Rejected for now because it compounds structural risk and makes behavioral review harder; the first step is clarifying the object model without broad packaging churn.

### Verify compatibility with focused behavioral tests

Existing tests already cover much of the reactive behavior. The implementation should add or adjust tests only where necessary to pin down class identity, inheritance, and compatibility expectations exposed by the new architecture.

Alternative considered: rely purely on the current suite. Rejected because the refactor specifically targets implementation architecture, and a small amount of explicit coverage helps prevent regressions such as accidentally breaking `instanceof`, subclass method dispatch, or lifecycle hook ownership.

## Risks / Trade-offs

- [Behavioral drift during method migration] -> Preserve existing semantics by moving logic method-by-method, then run the baseline test suite to confirm reactive behavior remains unchanged.
- [Class field initialization order changes internal state timing] -> Prefer constructor assignments that mirror current constructor-function initialization and avoid eager computed work before all reactive links are initialized.
- [Over-scoping the refactor into broader modularization] -> Limit this change to clarifying the core class architecture and defer module splitting unless a concrete need emerges during implementation.
- [WIP API churn leaking into the same refactor] -> Keep public factory functions and exported class names stable within this change, and add tests for `instanceof` and basic API surface continuity so the architectural refactor stays focused.
