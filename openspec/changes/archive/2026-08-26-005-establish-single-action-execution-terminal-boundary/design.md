## Context

See `proposal.md`. Current Core already exposes three pure seams that should be reused rather than replaced:

- `transitionCurrentAction(...)` owns structural prepare/terminal legality;
- `formActionPackage(...)` freezes exact current Action + Run context facts;
- `admitActionResult(...)` validates candidate Result against exact package/current Action/current Run occurrence.

The missing piece is a thin composition seam for one Standard Action invocation. The composition must also contract the lifecycle model from `prepared | resumed | terminal` to `prepared | terminal` without introducing another execution identity or recovery subsystem.

## Goals / Non-Goals

**Goals:**

- remove `resume` event / `resumed` state from the existing lifecycle and package/admission domain contracts;
- keep `prepare` as an internal structural transition and keep `prepared` as the one executable current-Action state;
- support both invocation entry cases: internally prepare when no target current Action exists, or reuse exact same existing `prepared A` without duplicate prepare;
- bind every actual invocation to the caller-provided exact Run context/occurrence and invoke one narrow host execution callback exactly once;
- after callback return, reuse existing Result admission; only an admitted Result may terminalize the exact current Action;
- return one bounded terminal/failure outcome and never recurse/loop into the next Standard Action.

**Non-Goals:**

- retry/recovery/crash continuation, WAL, attempt counters or replay registries;
- creating Run occurrences or durable Run persistence inside the invocation coordinator;
- Policy legality/next-Action selection or Owner happy-path authorization policy;
- provider/Agent registry, transport protocol or scheduler;
- mutation/Git checkpoint, OpenSpec adapter or CLI work.

## Decisions

### 1. Contract lifecycle to `prepared | terminal`

Remove `resumed` from `ACTION_LIFECYCLE_STATES`, remove the `resume` lifecycle event, and simplify transition logic to only internal `prepare` and exact `terminal`.

Rationale: approved Explore proved all ten Standard Actions complete directly from `prepared`, while exact Run occurrence already owns execution-occurrence identity. Keeping `resumed` would duplicate Run semantics and force every downstream validator/test to preserve a state with no current independent consumer.

Alternative rejected: keep `resumed` “for future recovery”. This would retain complexity solely for speculative scope and conflict with proposal convergence.

### 2. Keep `prepare` internal; allow invocation entry to reuse exact `prepared A`

Add a small entry helper/composition branch with the following deterministic behavior:

```text
current = null
→ structural prepare target A
→ A/prepared

current = terminal B, target A, A != B
→ structural prepare A
→ A/prepared

current = prepared A, target A
→ reuse exact A/prepared
→ no prepare event

current = prepared A, target B
→ fail closed
```

Rationale: `prepare` already protects the single-current-Action invariant, but it is not a StandardActionId or independent Run. Reusing an existing `prepared A` is required for a later allowed invocation after an earlier admission failure because duplicate `prepare A` is intentionally invalid.

Alternative rejected: make `prepare` idempotent. That weakens the existing fail-closed lifecycle contract and hides whether the caller is reusing an existing current Action or accidentally re-preparing it.

### 3. Reuse caller-provided Run context; do not create retry identity

The invocation coordinator receives the exact `RunContextRecord` for the execution occurrence selected by the outer runtime. It does not allocate sequence numbers or persist a Run. It uses the prepared current Action plus that context to call existing `formActionPackage(...)`.

For a later invocation of the same still-prepared A, the outer boundary supplies a new Run occurrence/context; package formation naturally produces a new package while stale prior packages remain rejectable by exact runId comparison.

Rationale: Run persistence already owns occurrence identity and uniqueness. Creating another attempt/retry identifier would duplicate that authority.

### 4. Use one narrow host execution callback, not a provider framework

Introduce a minimal callback dependency conceptually equivalent to:

```ts
(actionPackage: ActionPackage) => unknown | Promise<unknown>
```

The coordinator calls it exactly once for a successfully formed package. The returned value is treated only as a candidate Result and must pass existing `admitActionResult(...)` checks.

Rationale: a callback is the smallest way for Core to express “execute exactly one external Standard Action” while keeping provider/Agent/transport implementation outside the domain contract. It also makes exactly-once-per-invocation behavior directly testable.

Alternative rejected: return a package and end the Core invocation before execution. That would reintroduce the prepare/package-only stop the Change exists to remove and cannot enforce one complete invocation boundary.

Alternative rejected: build a provider/Agent registry. No current requirement needs discovery, routing or dynamic registration.

### 5. Terminalize only after successful admission

After the callback returns:

1. call existing `admitActionResult(...)` using the package, exact prepared current Action, and the same Run context occurrence;
2. if admission fails, return a bounded failure outcome with the exact current Action still `prepared`;
3. if admission succeeds, call existing structural terminal transition for the exact same Action identity;
4. return terminal current Action + admitted Result.

The coordinator is pure with respect to repository persistence: it returns facts; later persistence/host layers decide how to durably materialize them under existing contracts.

Rationale: admission already owns Result trust; terminalization must not get ahead of admission.

### 6. Model STOP as non-recursive return, not another lifecycle state

The coordinator returns exactly one outcome for the invocation and contains no loop/recursive call that prepares or executes another Standard Action. `nextBoundary` remains a field on the admitted Result and is returned unchanged as opaque data.

Rationale: STOP is an execution boundary, not a new state literal or persisted authority fact. Later Policy decides legal continuation.

## Risks / Trade-offs

- **[Breaking lifecycle contraction]** Existing code/tests that accept `resumed` will fail. → Update only lifecycle and package/admission callers/tests proven by the Change; reject legacy `resumed` fail-closed instead of adding compatibility normalization.
- **[Host callback throws/rejects]** No Result can be admitted or terminalized. → Treat callback failure as invocation failure; preserve the exact prepared current Action and return/propagate a bounded failure without automatic retry.
- **[Caller supplies stale or mismatched Run context]** A package could target the wrong occurrence if not checked. → Reuse existing `formActionPackage` and `admitActionResult` exact identity/state/run checks; do not weaken them in the coordinator.
- **[Same prepared Action invoked again]** Duplicate prepare would fail. → Explicitly reuse exact `prepared A`; require a new caller-provided Run occurrence/context for the new execution occurrence.

## Migration Plan

1. Contract lifecycle literals/events/transitions and focused lifecycle tests from `prepared/resumed/terminal` to `prepared/terminal`.
2. Contract ActionPackage executable state and admission tests to `prepared` only while preserving exact Run occurrence freshness.
3. Add the thin single-Action invocation coordinator and focused tests for internal prepare, prepared reuse, exactly-one callback execution, admission failure, successful terminalization and opaque `nextBoundary` reporting.
4. Keep persistence, Policy, transport, CLI and Git boundaries unchanged.
5. During archive/spec synchronization, ensure the canonical `action-lifecycle` Purpose no longer claims a resume capability after the requirement removal.
