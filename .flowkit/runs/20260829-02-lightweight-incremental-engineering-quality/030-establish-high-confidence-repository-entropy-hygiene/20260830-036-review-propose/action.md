# 036 Review Propose — establish-high-confidence-repository-entropy-hygiene

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-high-confidence-repository-entropy-hygiene`
- Action: `review-propose`
- Run: `20260830-036-review-propose`
- Role: `reviewer`
- Input Run: `20260830-035-propose`
- Review chain start: `20260830-030-explore`

## Full review-chain reconstruction

Reviewer re-reviewed the chain from its beginning rather than reviewing 035 in isolation.

### 030 Explore — original candidate

The original Explore investigated two candidate entropy signals:

```text
A. production dead/orphan source
B. unused direct package declarations
```

It initially explored:

```text
dependency-cruiser orphan=true
→ candidate production dead-source blocker

Knip dependency-only
→ candidate unused-dependency blocker
```

### 031 Review Explore — changes requested

Reviewer independently disproved the critical assumption:

```text
dependency-cruiser orphan=true
≠ unreachable from production roots
```

A connected dead subgraph:

```text
dead-a.ts → dead-b.ts
```

with neither file reachable from the real production roots was not detected by `orphan=true`.

Finding:

```text
RE-031-001
```

Required revision:

```text
prove real production-root reachability
or narrow the contract
```

### 033 Revise Explore — bounded correction

Author corrected the dead-source semantics to:

```text
existing dependency-cruiser 18.2.0
→ TypeScript-aware src graph extraction

exact production roots:
- src/cli/entrypoint.ts
- src/domain/index.ts

bounded local-src graph traversal
→ all src modules - reachable closure
→ non-empty = FAIL
```

The revised proof demonstrated:

```text
current baseline
→ 18 / 18 reachable

connected dead subgraph
→ both modules detected

test-only reference
→ does not create production liveness
```

The revised Explore also deliberately narrowed the Stable Core scope:

```text
Knip
→ evaluated but rejected

unused dependencies
→ deferred

unused exports/types
→ excluded

home-grown unused-package scanner
→ prohibited
```

### 034 Review Explore — approved

Reviewer independently reproduced the corrected reachability proof and closed:

```text
RE-031-001
```

034 approved exactly one Proposal-ready entropy blocker:

```text
production src source
unreachable from exact production roots
```

with Knip excluded from package truth.

### 035 Propose — chain convergence

035 correctly consumes:

```text
input = 034 approved review
approved Explore = 033 revised Explore
```

Reviewer verified the supplied chain identities:

```text
035 context.approvedExploreSha256
= exact SHA-256 of 033 revised explore.md

035 context.inputReviewArchiveSha256
= exact SHA-256 of 034 Reviewer ZIP
```

No rejected 030 semantics were reintroduced.

## Proposal convergence

The Proposal freezes only the final approved capability:

```text
quality:entropy
→ independent repository command

dependency-cruiser 18.2.0
→ graph extraction only

roots:
- src/cli/entrypoint.ts
- src/domain/index.ts

local src reachability walk
→ any resolved src module outside closure
→ FAIL
```

It explicitly preserves:

```text
orphan=true
→ NOT the dead-source rule

test-only reference
→ NOT production liveness

internally connected unreachable subgraph
→ FAIL

type-only local src edge
→ remains a liveness edge

missing/invalid root or malformed graph
→ fail closed in implementation/tests
```

The Proposal keeps the accepted zero-baseline/no-exception-state posture.

## Scope discipline

The Proposal correctly excludes:

```text
Knip integration
unused dependency blocker
unused exports/types
unused test-file detection
custom unused-package scanner
Structural Dependency Health rule reimplementation
dynamic root registry
baseline / waiver / cache
changed-file planner
automatic cleanup/deletion
quality registry/platform
Formal Full Test ownership
new lifecycle / authority state
```

It also leaves:

```text
quality:gate
quality:dependency-health
```

unchanged.

No package or production mutation is present in the Propose payload.

## Package / environment boundary

The Proposal correctly relies on the already-adopted repository truth:

```text
dependency-cruiser 18.2.0
```

and does not add Knip or another dependency.

Therefore this Change does not require a package/lock mutation merely to implement the approved capability, and it does not pull detached node_modules regeneration into the Change lifecycle.

## Proposal artifacts

Reviewer independently verified all Author-declared artifact SHA-256 values.

Using managed OpenSpec 1.10.0, Reviewer independently validated:

```text
current Change --strict
→ PASS
```

The Author records:

```text
OpenSpec --all --strict
→ 13 / 13 PASS
```

The 035 payload is delta-only. Reviewer's locally available reconstructed repository snapshot contains stale pre-archive Change directories from earlier D02 steps, so its `--all` result is not an exact replay of the current repository and is not used to contradict the Author's current-repository result.

No current-Change OpenSpec inconsistency was found.

## Apply constraints

Apply must preserve the complete reviewed chain, not just the wording of 035:

1. Use the exact two roots:
   - `src/cli/entrypoint.ts`
   - `src/domain/index.ts`.
2. Reuse dependency-cruiser 18.2.0 only for graph extraction.
3. Do not use `orphan=true` as a substitute for reachability.
4. Traverse resolved local `src` edges and fail on every `src` module outside the two-root closure.
5. Keep type-only local source edges as liveness edges.
6. Validate both roots and fail closed on malformed/invalid graph input.
7. Add/reproduce all four proof cases:
   - healthy zero baseline;
   - isolated unreachable source;
   - connected unreachable subgraph;
   - test-only-referenced production source.
8. Keep output deterministic and sorted.
9. Keep one independent `quality:entropy` command.
10. Do not add Knip or another unused-package scanner.
11. Do not modify `quality:gate` or `quality:dependency-health`.
12. Do not add baseline/waiver/cache/changed-file planning, automatic cleanup, Registry/Platform, or lifecycle state.
13. Run the declared integration checks, but do not absorb those checks into `quality:entropy`.
14. No detached environment archive packaging becomes an Apply task merely because existing dependency-cruiser is reused.

## Verdict

```text
approved
```

The Proposal is Apply-ready.

## Next boundary

```text
apply
```

Reviewer did not Apply, mutate production/package truth, activate another Change, archive, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
