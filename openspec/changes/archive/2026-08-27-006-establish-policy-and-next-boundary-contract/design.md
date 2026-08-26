## Context

See `proposal.md` and `specs/policy-and-next-boundary/spec.md`. Current Foundation already exposes all structural seams this Change needs:

- `ChangeState` and canonical Delivery/Change identity;
- `CurrentAction` plus `transitionCurrentAction` with `prepared/terminal` semantics;
- `RunContextRecord` / `RunResultRecord` runtime validation, `hasMatchingRunLinkage`, exact Run occurrence identity and separated Author/Reviewer outcome slots;
- structural `OwnerAuthorityFact` validation;
- single-Action invocation that stops after reporting an opaque `nextBoundary`.

The missing piece is a pure composition layer that interprets those facts as a legal next governance boundary. It must not become another lifecycle implementation or an execution/orchestration engine.

## Goals / Non-Goals

**Goals:**

- Add one pure domain evaluator whose output is closed, deterministic and serialization-safe.
- Make precedence explicit enough that completed Archive, normal Action ordering, reported handoff consistency, bounded Owner correction and structural-enterability cannot mask one another.
- Reuse existing validators/transition functions instead of copying identity, authority or Action lifecycle rules.
- Keep blocked diagnoses stable and machine-distinguishable for later host/CLI integration.

**Non-Goals:**

- No filesystem/OpenSpec scanning, scheduler, queue, daemon or automatic invocation.
- No normal-path `authorize-apply/archive` gate and no claim that READY itself is execution authorization.
- No new lifecycle state, retry/resume/reset behavior, attempt identity or second state machine.
- No Git/checkpoint authorization implementation; checkpoint-evaluation remains only a legal boundary.
- No Cross-Delivery Memo, Delivery scheduling, Full Test, promotion, CLI or multi-Agent/provider registry.

## Decisions

### 1. Implement Policy as one pure domain evaluator with closed data

Add a small `policy-and-next-boundary.ts` domain module. Its public evaluator accepts an unknown/raw Policy fact object and returns a closed decision object, conceptually:

```ts
type PolicyDecision =
  | { readonly kind: "ready-action"; readonly actionId: StandardActionId }
  | { readonly kind: "ready-checkpoint-evaluation" }
  | { readonly kind: "blocked"; readonly reason: PolicyBlockedReason };
```

The bounded input contains current `deliveryId`, `changeId`, `changeState`, `currentAction`, nullable `terminalRunContext`, nullable `terminalResult`, and optional `ownerCorrection`. Runtime validation reuses `isSemanticId`/`isChangeState`/`isCurrentAction`/`isRunContextRecord`/`isRunResultRecord`/`hasMatchingRunLinkage`/`isOwnerAuthorityFact`; current Action identity must belong to the same Delivery/Change. Do not introduce a generic Policy AST or dynamic rule registry.

**Why:** this matches the Explore proof domain and gives later host/CLI code one stable legality seam without coupling to transport.

**Alternative rejected:** represent Policy as a configurable workflow graph/DSL. That would duplicate Standard Action/lifecycle authority and expand this Change into orchestration infrastructure.

### 2. Encode evaluation as ordered phases, not independently competing rules

Use one explicit evaluation order:

```text
validate base facts
↓
exact completed-archive exception
↓
generic non-active guard
↓
active initial/prepared or terminal normal-boundary calculation
↓
exact terminal RunContext/Result linkage + identity/outcome validation
↓
reported nextBoundary consistency against NORMAL boundary
↓
optional bounded Owner correction
↓
structural-enterability gate for final Action candidate
↓
READY / BLOCKED
```

This order is part of the design because 058 proved that post-archive precedence and reported/correction ordering are observable correctness constraints.

**Alternative rejected:** collect multiple candidate rules and resolve by generic priority numbers. It adds an unnecessary policy engine and makes masking bugs harder to audit.

### 3. Keep normal boundary mapping as a closed static table/switch

The normal matrix is fixed to the ten Standard Actions and current V1 outcome vocabulary. Use direct constants/switches rather than registry/plugin lookup:

- Author PASS maps explore/revise-explore → review-explore, propose/revise-propose → review-propose, apply/revise-apply → review-apply.
- Reviewer exact `approved` / `changes-requested` maps to next/revise actions.
- `archive` is handled only by the completed-materialization precedence branch.

Any outcome outside the closed vocabulary returns the corresponding blocked reason. Historical legacy fields are not adapters in Policy.

**Alternative rejected:** infer transitions from action naming conventions (`review-*`, `revise-*`). Explicit mapping is smaller, auditable and fail-closed when the Standard Action catalog changes.


### 4. Bind terminal Policy evaluation to the exact current RunContextRecord

For every terminal CurrentAction, require the exact current terminal `RunContextRecord` together with the candidate terminal `RunResultRecord` before reading outcome or reported `nextBoundary`. Reuse existing persistence helpers rather than defining a Policy freshness identity:

```text
isRunContextRecord(terminalRunContext)
+ terminalRunContext.actionIdentity == currentAction.identity
+ hasMatchingRunLinkage(terminalRunContext, terminalResult)
→ terminalResult.runId is the exact current runId for Policy evaluation
```

A stale Result from an earlier occurrence of the same semantic Standard Action therefore fails because its runId differs from the exact current terminal context, even though its ActionIdentity is equal. Map missing context/result, wrong identity, and stale/mismatched runId to `terminal-result-missing-or-mismatched` before outcome/nextBoundary logic.

**Why:** Change 3 already owns Run occurrence identity and linkage; Change 4 already uses the same freshness class at Result admission. Policy only composes that existing truth.

**Alternative rejected:** add PackageId/ResultId, latest-result registry, attempt counter, WAL or replay tracking. None is necessary to distinguish current R2 from stale R1.

### 5. Treat reported `nextBoundary` as a consistency token only

For terminal actions, compute the normal boundary first. If `nextBoundary` is non-null, compare it to a canonical reported token:

- Standard Action boundary → its exact `StandardActionId`;
- checkpoint-evaluation → literal `checkpoint`.

A conflict blocks before any Owner correction is considered. Policy never promotes the reported value into authority.

**Alternative rejected:** accept reported `nextBoundary` as the candidate and only validate that it is a known action. That recreates the handoff-drift bug Policy is meant to eliminate.

### 6. Recognize one narrow Owner correction authority contract

Represent optional correction as a requested Standard Action plus authority fact. Eligibility is deliberately singular:

```text
decision = revise-action
deliveryId = current Delivery
changeId = current Change (must be present)
scope = [requested revise Action]
```

The requested action must be within the reached-stage revise-only set:

```text
explore stage → revise-explore
propose stage → revise-propose | revise-explore
apply stage   → revise-apply | revise-propose | revise-explore
```

Stage is derived only from the exact terminal Standard Action family. No correction is applied for empty/prepared slots, archive/completed state, forward targets or non-revise actions.

**Why:** this preserves the real proactive Owner revise workflow while preventing historical `authorize-*` tokens from becoming a normal Policy gate.

**Alternative rejected:** accept arbitrary Owner `decision`/`scope` and let host code interpret it. That moves Policy eligibility back out of the canonical Policy contract.

### 7. Reuse `transitionCurrentAction` as the final structural-enterability oracle

Do not add a Policy-owned "canEnterAction" state machine.

- null slot: test existing `prepare(target)` transition;
- `prepared A`: only exact A is compatible and is treated as reuse, with no duplicate prepare;
- `terminal A`: test existing `prepare(target)` transition.

If the existing lifecycle rejects the candidate, return `action-boundary-not-enterable`. This closes the exact-same terminal revise issue found in 060 without loosening terminal absorption or introducing retry/reset.

**Alternative rejected:** hard-code only the three currently known same-revise exceptions. Reusing the existing lifecycle seam is both smaller and future-safe if structural prepare rules evolve through a later formal Change.

### 8. Keep Policy blocked reasons closed at the domain boundary

Define `POLICY_BLOCKED_REASONS` and `PolicyBlockedReason` as a fixed literal catalog matching the spec. Internal helper failures must map to one of these reasons; no public free-text fallback or thrown exception is used for expected invalid facts.

**Why:** later CLI/host integration can render human explanations without changing Policy semantics.

## Risks / Trade-offs

- **[Risk] Policy V1 does not choose the next Delivery Change after checkpoint.** → Keep `ready-checkpoint-evaluation` explicit; mutation/checkpoint and later Delivery orchestration Changes own what happens next.
- **[Risk] Exact normal mapping is intentionally coupled to the current ten-action catalog.** → Unit-test every mapping and fail closed if future catalog changes are not accompanied by a Policy Change.
- **[Risk] `RunResultRecord` outcome fields are structurally open strings.** → Policy recognizes only exact V1 semantic values (`PASS`, `approved`, `changes-requested`) and blocks everything else.
- **[Risk] The same semantic Standard Action can have multiple Run occurrences.** → Require exact current `RunContextRecord` + `hasMatchingRunLinkage` before reading any terminal Result outcome, so prior R1 cannot substitute for current R2.
- **[Risk] Owner correction cannot immediately repeat the exact same terminal revise Action.** → Preserve the existing lifecycle constraint and surface `action-boundary-not-enterable`; do not add hidden reset/retry behavior.
- **[Risk] READY may be misread by integration code as execution permission.** → Keep output naming/documentation explicit and add tests/non-goal assertions that evaluator has no execution callback, persistence or mutation dependency.

## Migration Plan

No persisted data migration is required. Add the new domain module/tests/export only. Existing Runs, archived Changes, canonical lifecycle/authority/persistence contracts and historical Owner facts remain byte/semantically unchanged. Rollback is removal of the new module/export/tests before any downstream integration depends on it.
