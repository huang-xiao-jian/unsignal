## Context

`@unsignal/baseline` is currently a single-file implementation with a single large test file. Although the package is positioned as a builtin signal primitive implementation, it also includes `createModel`, recursive action wrapping, model-owned effect capture, and model disposal behavior. Those concerns are not primitive reactive graph behavior; they are a higher-level composition layer.

The current design leaks model concerns into primitive APIs. In particular, `untracked()` suppresses both dependency collection and `createModel` effect capture, and the `Effect` constructor participates in ambient model ownership through `capturedEffects`. The test suite mirrors that mismatch: the tail of `packages/baseline/src/index.test.ts` is dominated by model construction, model disposal, and model type tests rather than primitive runtime semantics.

## Goals / Non-Goals

**Goals:**

- Remove `createModel` and all model-only exports from the public baseline API.
- Remove model-only runtime state and simplify primitive semantics around `untracked()` and `Effect`.
- Keep the primitive runtime behavior of `signal`, `computed`, `effect`, `batch`, `action`, and `untracked` intact.
- Split baseline tests into smaller, semantically grouped files that map to primitive features.
- Preserve or rewrite only the tests that validate baseline primitive contracts.

**Non-Goals:**

- Redesign `@unsignal/core` or adapt downstream packages in this change.
- Introduce a replacement model abstraction inside `@unsignal/baseline`.
- Rewrite the entire baseline implementation into multiple runtime source files unless needed by the refactor.
- Guarantee compatibility with the Preact team’s higher-level API surface beyond the retained primitives.

## Decisions

### 1. Treat `createModel` as out of scope for baseline primitives

`createModel` will be removed instead of reworked. This package is defining a builtin primitive runtime, not an object modeling layer. Retaining `createModel` would preserve the need for ambient ownership state and keep the API surface tied to compatibility expectations that the project no longer wants.

Alternatives considered:

- Keep `createModel` but de-emphasize it in docs.
  Rejected because the runtime and tests would remain structurally coupled to model semantics.
- Move `createModel` into `@unsignal/core` in the same change.
  Rejected because `core` is explicitly out of scope for this change.

### 2. Remove model-only runtime machinery rather than only hiding exports

The refactor should delete `capturedEffects`, `startCapturingEffects()`, `wrapInAction()`, and the `Effect` constructor behavior that records effects for model disposal. `untracked()` should revert to suppressing dependency tracking only.

Alternatives considered:

- Remove exports only and keep the internals temporarily.
  Rejected because it leaves dead architectural baggage and preserves model-shaped semantics in primitive APIs.

### 3. Keep `action` as a primitive convenience API for now

`action` will remain part of the baseline surface because it directly composes primitive behaviors already present in the runtime: batching and untracked execution. Unlike `createModel`, it does not require ambient ownership or object graph lifecycle behavior.

Alternatives considered:

- Remove `action` along with `createModel`.
  Rejected because it is not necessary to satisfy the current refactor goal and would expand the scope into a broader API redesign.

### 4. Split tests by primitive feature, with a thin integration layer

The large `index.test.ts` file will be decomposed into targeted suites such as `signal.test.ts`, `computed.test.ts`, `effect.test.ts`, `batch.test.ts`, `action.test.ts`, `untracked.test.ts`, plus a small `integration.test.ts` for cross-primitive execution ordering or interactions that do not belong cleanly to one primitive.

Tests that only verify `createModel` ergonomics, model disposal, nested model composition, or model typing will be removed. Tests that verify primitive contracts but currently do so indirectly through `createModel` will be rewritten as direct primitive tests.

Alternatives considered:

- Keep a single test file and only remove the model section.
  Rejected because the file would remain difficult to navigate and maintain.
- Split by internal implementation section names in `index.ts`.
  Rejected because the intent is semantic test readability, not mirroring source layout.

## Risks / Trade-offs

- [Breaking API removal] Consumers may rely on `createModel` or exported model types. → Mitigation: call out the removal explicitly in proposal/docs and limit the change to baseline only.
- [Behavior drift during cleanup] Removing model capture plumbing may accidentally change `untracked()` or `effect()` semantics beyond the intended scope. → Mitigation: preserve direct primitive tests and add focused tests for retained semantics before deleting model-only assertions.
- [Test reorganization churn] Splitting tests can hide accidental coverage loss if done mechanically. → Mitigation: classify existing tests into keep, rewrite, and delete buckets before moving them.
- [Temporary mismatch with older repo specs] The repository’s existing `specs/baseline/spec.md` is broader than the new OpenSpec capability. → Mitigation: use this change to establish a narrower OpenSpec contract for baseline primitives without trying to reconcile the older spec system in the same step.

## Migration Plan

Implementation can land as a single refactor change because the package is local to the monorepo. The migration sequence should be:

1. Add or rewrite primitive-focused tests that preserve intended runtime behavior.
2. Remove `createModel` exports, types, and runtime machinery.
3. Split the monolithic test suite into semantic files and delete model-only tests.
4. Update baseline package documentation to reflect the new primitive-only surface.

If rollback is needed, restore the removed model API and the previous monolithic test structure from version control. No data migration is involved.

## Open Questions

- Should the baseline README explicitly document `action` as part of the stable primitive surface, or keep it as an implementation convenience with minimal promotion?
- Should the final test layout include a dedicated `types.test.ts` for retained baseline type assertions, or should those assertions stay colocated with feature suites?
