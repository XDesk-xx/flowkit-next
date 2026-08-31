# 053 Revise Explore — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `revise-explore`
- Run: `20260831-053-revise-explore`
- Role: `author`
- Input reviewer Run: `20260831-052-review-explore`
- Base checkpoint: `d9399c7ee23cffe0ee3926236489135f87ffdd95`

## Revision scope

This revision addresses only:

```text
RE-052-001 trusted actual candidate identity
RE-052-002 material environment identity invalidation
RE-052-003 one closed execution/admission input seam
```

All 052-accepted findings remain frozen.

## Revised decisions

### 1. Candidate identity

Caller-supplied `candidateRef` is rejected.

Flowkit's Action execution host derives `candidateRef` on demand from actual
Git-visible, non-ignored worktree content, excluding only `.flowkit/runs/**`
so execution-history persistence cannot self-invalidate the checked candidate.

The bounded digest requires no temp Git index, snapshot DB, candidate history,
mtime heuristic, or changed-file planner.

Decisive proof:

```text
run-history-only mutation
→ candidateRef unchanged

source bytes change
→ candidateRef changes

prior success with stale candidateRef
+
current host-derived candidateRef
→ not reusable

raw formal plan + candidateRef field
→ closed-input rejection
```

### 2. Environment identity

`environmentRefs[]` is part of the canonical check declaration and therefore
part of derived `checkRef`.

Controlled proof:

```text
same candidate/command/config/tool
Linux environmentRef → K1
Windows environmentRef → K2

K1 != K2
→ old environment success not reusable
```

Flowkit does not infer which environment identities matter.

### 3. Closed execution/admission seam

Selected seam:

```text
ApplicableCheckPlanInput
→ closed raw approved formal input
→ no candidateRef/checkRef fields

Flowkit
→ derive candidateRef
→ derive checkRefs
→ bind exact ActionPackage
→ form closed ApplicableCheckExecutionInput
→ derive executionInputRef
```

Execution and Result admission use that same exact resolved input identity.

Admission must fail closed on:

```text
candidate drift
executionInputRef mismatch
missing required check fact
duplicate fact
unexpected/mismatched checkId/checkRef
declaration-set mismatch
```

Reuse remains explicit prior-success only and requires exact current
Flowkit-derived `candidateRef` + current derived `checkRef`.

## Counterexample proof summary

```text
candidate bytes change + stale prior ref
→ rerun

material environment changes
→ checkRef changes
→ rerun

execution checks [A,B]
admission checks [A]
→ executionInputRef/completeness mismatch
→ reject

duplicate check declaration
→ reject

declared [A,B], facts [A]
→ reject
```

## Verification

- targeted Foundation ActionPackage/RunResult/single-action tests: `28/28 PASS`
- canonical OpenSpec specs strict: `13/13 PASS`
- current Change remains Explore-only; Proposal/spec/design/tasks are absent
- production/package/lock mutation: `NONE`
- `git diff --check`: `PASS`

## Result

```text
PASS
→ review-explore
```

No Proposal or Apply was performed.
