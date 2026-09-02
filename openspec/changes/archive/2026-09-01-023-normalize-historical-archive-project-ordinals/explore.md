# Explore — Normalize Historical Archive Project Ordinals

## 1. Owner boundary and current legal Action

Owner revised D03 execution order so historical archive/projectOrdinal normalization runs before `converge-reviewer-action-guidance`, and explicitly activated:

```text
normalize-historical-archive-project-ordinals
```

The semantic ChangeId contains only canonical kebab-case characters; `/` is not part of the Change identity.

Current coordination facts:

```text
projectOrdinal: 023
state: active
dependsOn:
  correct-artifact-convergence-and-chronology-discipline = completed

converge-reviewer-action-guidance:
  state = planned
  dependsOn = normalize-historical-archive-project-ordinals
  projectOrdinal = unassigned
```

The previous accepted-main Stable manager `4b45552` independently resolves this exact active Change to:

```text
ready-action: explore
```

D03/D04 self-development continues to execute from independent `.agents/skills/**`; candidate `skills/actions/**` is not execution authority for this Explore.

## 2. Detached execution environment proof

The supplied detached dependency environment remains valid for the exact `cb53d07` candidate because the three Node dependency-resolution inputs are Git-object identical to D02 final dependency environment inputs:

```text
package.json         SAME
pnpm-lock.yaml       SAME
pnpm-workspace.yaml  SAME
```

Therefore the restored `node_modules` snapshot is reused directly with Node `22.23.2`. No `pnpm install`, relink, repair or package-manager self-check is required for this Explore.

## 3. Problem A — seven historical archives still use date-only paths

Current repository contains exactly seven archive directories without a three-digit project ordinal:

```text
2026-08-30-establish-trusted-change-coordination-state-binding
2026-08-30-establish-lightweight-incremental-engineering-gate
2026-08-30-establish-structural-dependency-health-fitness
2026-08-30-establish-high-confidence-repository-entropy-hygiene
2026-08-31-correct-openspec-observation-process-failure-portability
2026-08-31-establish-explicit-applicable-check-execution
2026-09-01-establish-action-guidance-execution-contract
```

This is historical inconsistency only. Current Author archive Guidance already requires future archives to consume an already-persisted `projectOrdinal` and materialize:

```text
YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>
```

So no new archive algorithm or Core behavior is needed.

## 4. Historical ordinal mapping is already provable

The repository has an accepted historical proof record from D03 Author Guidance correction:

```text
D01 assigned slots = 001..013, including cancelled 008
D02 assigned slots = 014..019
D03 Change 1       = 020
D03 Author         = 021
D03 chronology corrective = 022
```

The same record explicitly states that assigned slots are stable, cancelled consumed slots are not reused, existing slots are not renumbered, and a new corrective Change appends the next stable slot.

The exact mapping for the seven date-only archives is supported by the accepted Git change order inside the already-proven D02/D03 ranges:

```text
014 establish-trusted-change-coordination-state-binding
015 establish-lightweight-incremental-engineering-gate
016 establish-structural-dependency-health-fitness
017 establish-high-confidence-repository-entropy-hygiene
018 correct-openspec-observation-process-failure-portability
019 establish-explicit-applicable-check-execution
020 establish-action-guidance-execution-contract
```

This migration does **not** derive ordinals from:

```text
Delivery array position
Run occurrence number
changeStartSequence
physical Run-group prefix
archive-directory count
completed-Change count
```

Those remain separate namespaces.

## 5. Prior repository precedent proves rename shape

Git commit `985e9725bdd4656ce064083387b1817a5723a251` already performed the same bounded historical normalization for four earlier archives:

```text
YYYY-MM-DD-<changeId>
→
YYYY-MM-DD-<ordinal>-<changeId>
```

and updated their exact durable archive Run path references without changing product behavior.

Therefore this Change reuses an established repository migration pattern rather than creating a new normalization subsystem.

## 6. Reference surface is bounded

Each of the seven old archive paths is referenced in exactly three tracked durable files:

```text
archive action.md
archive context.json
archive result.json
```

Total exact path references requiring convergence:

```text
7 archive directories
21 durable Run path references
```

No wider current-source, product-Guidance, architecture, package, lockfile or canonical-spec path dependency was found for those old archive paths.

Minimum implementation direction is therefore bounded to exact renames plus exact durable-reference updates.

## 7. Problem B — current ordinal unit test encodes lifecycle-transient state

The exact current focused test fails after the already-correct archive transition:

```text
tests/unit/domain/author-action-guidance.test.ts

expected corrective.state = active
actual   corrective.state = completed
```

The same test also hard-codes:

```text
reviewer.state = planned
reviewer.projectOrdinal = undefined
next projectOrdinal = 23
```

Those assertions describe one execution moment, not a durable product invariant. The failure is therefore a test-modeling defect, not an ordinal allocation, archive, Policy or Core defect.

Activation of this normalization Change now provides another decisive counterexample: `projectOrdinal: 023` is legitimately assigned to the newly explored Change while Reviewer remains planned. Any permanent unit test that expects `next === 23` is necessarily stale after a legal lifecycle transition.

## 8. Correct test boundary

Durable unit tests should prove stable semantics with synthetic/stable fixtures:

```text
assigned ordinals are positive integers
assigned ordinals are unique
planned-only entries reserve no ordinal
cancelled-after-Explore entries keep their ordinal consumed
next allocation = max(durable assigned ordinals) + 1
malformed / duplicate assigned facts fail closed
```

Historical migration tests may also assert immutable migration facts such as:

```text
014..020 historical normalized archive paths exist
corresponding date-only paths no longer exist
exact durable archive Run references point to normalized paths
```

Those are historical repository facts, not lifecycle-transient state.

The current test should not permanently assert which Change happens to be `active`, which future Change is still `planned`, or a hard-coded `next` value tied to today's Delivery phase.

## 9. Product/specification impact

No product behavior change is proven necessary.

Existing `author-action-guidance` already owns the forward-looking invariant:

```text
first actual Explore
→ assign/persist one projectOrdinal

archive
→ consume persisted projectOrdinal
→ ordinal-bearing archive name
```

Its existing historical scenario only says **Change 2 itself** must not mass-rename historical archives. It does not prohibit a later explicitly authorized normalization Change.

Therefore expected OpenSpec posture is:

```text
skip_specs: true
```

for this Change, because it is repository-history/test normalization with no spec-level behavior change. OpenSpec 1.10.0 explicitly supports zero-delta tooling/refactor/doc changes through `skip_specs: true` and archive `--skip-specs`; Proposal must not invent a permanent product requirement merely to satisfy schema mechanics.

## 10. Expected mutation surface for later Apply

Bounded expected surface:

```text
openspec/changes/archive/<7 old paths>
  → exact ordinal-bearing rename

.flowkit/runs/**/<their archive Run>/{action.md,context.json,result.json}
  → exact path-reference convergence

tests/unit/domain/author-action-guidance.test.ts
  → remove lifecycle-transient live-state invariant
  → retain/strengthen stable fixture-based ordinal proof

OpenSpec artifacts for this normalization Change
Delivery coordination / Run facts for this exact Change
```

Not expected:

```text
src/**
skills/actions/**
.agents/skills/**
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
architecture/**
canonical product specs
Run schema
Policy / lifecycle / ActionPackage contracts
```

If Proposal/Apply discovers one of those is actually required, STOP and re-evaluate scope rather than silently expanding.

## 11. Explicit non-goals

```text
renumber 021 / 022
renumber any already-numbered archive
reuse cancelled 008
reserve an ordinal for planned Reviewer Guidance
derive ordinal from Run/group/count literals
new ordinal Registry / allocator / counter service
new migration Registry
new lifecycle state
Core mutation
Reviewer Guidance convergence
self-hosting migration
historical Git rewrite
```

`converge-reviewer-action-guidance` remains planned and starts only after this Change completes.

## 12. Proposal-ready boundary

Proof result:

```text
PASS
```

Smallest Proposal direction:

```text
1. Mark this OpenSpec Change as skip_specs because product behavior is unchanged.
2. Normalize exactly seven proven historical archive paths to ordinals 014..020.
3. Update exactly the durable archive Run references that carry those old paths.
4. Replace the lifecycle-transient ordinal test with stable semantic fixtures and immutable historical-normalization assertions where useful.
5. Run focused ordinal tests plus relevant domain/OpenSpec checks.
6. Preserve 021, 022 and current 023 exactly; Reviewer Guidance remains planned/unassigned.
7. STOP at review-explore before Proposal.
```

No new control plane is justified.
