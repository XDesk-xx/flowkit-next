# 057 Propose — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `propose`
- Run: `20260831-057-propose`
- Role: `author`
- Input: `20260831-056-review-explore` (`approved → propose`)
- Git checkpoint claim: `d9399c7ee23cffe0ee3926236489135f87ffdd95`

## Skills used

```text
openspec-propose
proposal-convergence
```

The normal OpenSpec propose workflow created the complete spec-driven planning set, while proposal-convergence preserved the final reviewed Explore trust/identity boundaries and prevented deferred Registry/Planner/Evidence branches from re-entering scope.

## Objective

Converge the fully approved 051→056 proof chain into the smallest formal capability that executes already-required mechanical checks against the exact current candidate, admits complete exact facts, and allows reuse only under exact current candidate/check identity equality.

## Proposal convergence

Created the complete planning set:

- `proposal.md`
- `specs/applicable-check-execution/spec.md`
- `design.md`
- `tasks.md`

The Proposal preserves the approved authority split:

```text
approved formal execution input
→ WHAT checks are required

Flowkit Action host
→ derive actual current candidate identity
→ derive exact check identities
→ bind closed execution input
→ execute exact shell-free checks
→ admit compact mechanical facts

applicable-check facts
≠ Formal Verification
≠ Reviewer verdict
≠ Owner authority
≠ Policy / next-Action authority
```

## Exact candidate boundary

Caller-provided reusable candidate truth remains prohibited.

The Proposal requires a one-shot current Git-visible worktree identity covering:

```text
path
kind
Git-visible mode
content/link-target identity
tracked deletion
```

including at least:

```text
100644
100755
120000
tracked deletion
```

and excluding only:

```text
.flowkit/runs/**
```

so current Run persistence does not self-invalidate the candidate.

The Proposal preserves the decisive Reviewer proof that same bytes with a Git-visible `100755→100644` change must change candidateRef and invalidate prior reuse.

No temporary Git index, candidate snapshot DB, candidate history store, or Git authority expansion is introduced.

## Exact check / environment boundary

Every required check declaration includes exact:

```text
checkId
program
ordered argv
configRefs
toolRefs
environmentRefs
```

and Flowkit derives checkRef from the complete material declaration.

Material environment changes therefore invalidate reuse even when candidate and command/config/tool identities otherwise match.

## Closed execution/admission seam

The Proposal selects one bounded resolved execution contract:

```text
ApplicableCheckPlanInput
→ Flowkit candidate/check binding
→ ApplicableCheckExecutionInput
→ executionInputRef
```

The resolved input binds:

```text
exact ActionPackage/run/action identity
current Flowkit-derived candidateRef
complete resolved required-check set
```

Execution and admission consume the same executionInputRef.

Admission re-derives current candidate identity and rejects:

```text
candidate drift
executionInputRef mismatch
candidateRef mismatch
missing facts
duplicate facts
unexpected facts
checkRef mismatch
```

## Exact execution and compact facts

Non-reused checks execute with:

```text
exact program
exact ordered argv
shell=false
repository-root cwd
```

The existing RunResult top-level shape remains unchanged. Applicable-check results use a compact reserved typed structure under existing `facts`, not a fourth Run artifact or evidence blob.

## Reuse contract

Reuse is allowed only from an explicitly supplied prior successful mechanical fact when:

```text
prior candidateRef
= current Flowkit-derived candidateRef

AND

prior checkRef
= current derived checkRef
```

Any candidate/content/mode or command/config/tool/environment identity change forces current execution.

There is no automatic Run-history scan, cache DB, TTL, freshness heuristic, Evidence DAG, or best-match selection.

## Explicit non-goals preserved

```text
no Check Registry
no Gate Registry
no Verification Planner
no Evidence Platform / DAG / cache DB
no candidate snapshot/history subsystem
no temp Git index authority
no smart test selection
no changed-file planner
no package-script applicability inference
no OpenSpec Markdown parsing
no automatic history lookup
no background execution / retry engine
no fourth Run artifact
no automatic lifecycle advancement
```

## Validation

```text
OpenSpec planning set → 4/4 DONE
OpenSpec current Change strict → PASS
OpenSpec --all --strict → 14/14 PASS
git diff --check HEAD → PASS
production mutation → NONE
package/lock mutation → NONE
Apply → NOT STARTED
```

The current working tree also contains the earlier Owner-authorized Memo mutation and Change activation/Explore/Review chain; Propose did not alter production source, package truth, or those previously authorized Memo semantics.

## Conclusion

```text
PASS
→ review-propose
```

No Apply, archive, next-Change activation, Delivery Formal Full Test, Git checkpoint, commit, push, or merge was performed.
