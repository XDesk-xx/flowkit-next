# 056 Review Explore — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `review-explore`
- Run: `20260831-056-review-explore`
- Role: `reviewer`
- Input Run: `20260831-055-revise-explore`
- Review chain start: `20260831-051-explore`

## Full review-chain reconstruction

Reviewer re-reviewed the complete Explore chain:

```text
051 Explore
→ exact required-check execution direction established
→ three trust/binding gaps remained

052 Review Explore
→ CHANGES REQUESTED
→ RE-052-001 candidate identity trust
→ RE-052-002 environment identity invalidation
→ RE-052-003 closed execution/admission seam

053 Revise Explore
→ host-derived candidateRef
→ environmentRefs included in checkRef
→ ApplicableCheckExecutionInput + executionInputRef selected

054 Review Explore
→ RE-052-002 RESOLVED
→ RE-052-003 RESOLVED
→ caller-trust part of RE-052-001 RESOLVED
→ one remaining candidate-material gap:
   executable Git mode omitted

055 Revise Explore
→ candidate manifest now includes Git-visible mode/kind
→ 100755 / 100644 / 120000 / tracked deletion covered
```

No accepted 053 decision was reopened.

## RE-054-001 — RESOLVED

055 now defines candidate identity from the actual Git-visible worktree using:

```text
path
+ canonical kind
+ canonical Git-visible mode
+ bytes/link-target digest
```

with at least:

```text
100644
100755
120000
tracked deletion
```

The selected derivation preserves Git-visible worktree executable-mode changes rather than relying only on the index mode.

Reviewer independently reproduced the decisive Git fact:

```text
tracked check.sh
bytes unchanged

100755 → 100644

git diff --summary
→ mode change 100755 => 100644 check.sh
```

Under the revised candidate manifest this mode material changes the canonical manifest and therefore changes candidateRef.

The required reuse consequence is now valid:

```text
prior PASS:
candidateRef = R1
checkRef = K

current same bytes but mode-changed candidate:
candidateRef = R2

R1 != R2
→ prior PASS not reusable
→ check must execute
```

This closes the remaining exact-candidate-material gap without adding a candidate snapshot/history/registry subsystem.

## Previous 052 findings remain resolved

### Candidate trust ownership

```text
caller
→ does NOT supply reusable candidateRef

trusted Flowkit Action host
→ derives candidateRef from actual Git-visible worktree
```

`.flowkit/runs/**` remains the one explicit exclusion so writing the current Run does not invalidate the candidate itself.

### Environment identity

```text
environmentRefs[]
→ part of exact check declaration
→ part of checkRef
```

Material environment changes therefore invalidate prior reuse.

### Closed execution/admission seam

The selected contract remains:

```text
ApplicableCheckPlanInput
→ approved formal WHAT

Flowkit
→ derive candidateRef
→ derive checkRefs
→ bind exact ActionPackage
→ form closed ApplicableCheckExecutionInput
→ derive executionInputRef

execution
+
Result admission
→ consume the same resolved identity
```

Missing/duplicate/mismatched declarations or facts fail closed.

## Reuse contract — ACCEPTED

The complete D02 reuse rule is now sufficiently proven:

```text
explicit prior fact status = passed
AND
same current Flowkit-derived candidateRef
AND
same derived checkRef
→ reusable

otherwise
→ rerun
```

Because checkRef contains exact:

```text
program
argv
configRefs
toolRefs
environmentRefs
```

reuse now binds:

```text
actual candidate
+
exact check/config/tool/environment identity
```

No automatic Run-history scan, cache DB, freshness heuristic, or Evidence DAG is introduced.

## Scope / authority audit

Accepted boundaries remain intact:

```text
formal approved input
→ owns WHAT checks are required

Flowkit
→ binds identity
→ executes exact shell=false program+argv
→ records compact facts
→ admits facts against same closed input

Applicable-check fact
≠ Verification verdict
≠ Reviewer verdict
≠ Owner authority
≠ Policy decision
```

No:

```text
Check Registry
Gate Registry
Verification Planner
Evidence Platform
candidate snapshot DB
temp Git authority/index
candidate history store
changed-file planner
background execution
retry engine
fourth Run artifact
```

is introduced.

## Artifact integrity

Reviewer verified:

```text
055 inputReviewerArchiveSha256
→ exact 054 Reviewer ZIP

055 revisedExploreSha256
→ exact supplied revised explore.md
```

The supplied payload remains Explore-only:
- no Proposal;
- no spec delta;
- no design;
- no tasks;
- no production/package/lock mutation.

## Proposal constraints

Proposal must preserve the complete final reviewed model:

1. WHAT checks apply remains explicit approved formal input.
2. Caller cannot supply candidateRef/checkRef/executionInputRef as reusable truth.
3. Flowkit Action host derives candidateRef from exact Git-visible current worktree.
4. Candidate manifest includes path + kind + Git-visible mode + content/link identity, including at least `100644`, `100755`, `120000`, tracked deletion.
5. `.flowkit/runs/**` is excluded solely to prevent self-invalidation.
6. Exact check declaration includes ordered program/argv and explicit config/tool/environment refs.
7. One closed `ApplicableCheckExecutionInput` binds exact ActionPackage + candidate + declared-check set.
8. Execution and admission consume the same `executionInputRef`.
9. Admission re-derives current candidate identity and fails closed on drift or incomplete/mismatched fact sets.
10. Reuse accepts only explicit prior successful fact with exact candidateRef + checkRef equality.
11. Result facts remain compact mechanical execution facts, not Formal Verification.
12. Do not introduce Registry/Planner/Evidence Platform/cache/history/snapshot subsystems.
13. Exact implementation names may be refined in design, but the trust and identity boundaries above must not change.

## Verdict

```text
approved
```

All Explore blockers are resolved.

The Change is Proposal-ready.

## Next boundary

```text
propose
```

Reviewer did not create Proposal artifacts, Apply, mutate production/package truth, activate another Change, archive, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
