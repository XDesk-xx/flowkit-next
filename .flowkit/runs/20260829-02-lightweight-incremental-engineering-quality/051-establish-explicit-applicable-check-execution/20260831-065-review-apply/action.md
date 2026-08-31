# 065 Review Apply — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `review-apply`
- Run: `20260831-065-review-apply`
- Role: `reviewer`
- Input Run: `20260831-064-revise-apply`
- Review chain start: `20260831-051-explore`

## Review result

Reviewer reviewed 064 strictly against the single blocking Apply finding from 063:

```text
RA-063-001
```

## RA-063-001 — RESOLVED

The implementation now restores the exact approved reuse predicate.

Before 064:

```text
prior.status = passed OR reused-passed
→ potentially reusable
```

After 064:

```text
prior.status = passed
→ potentially reusable when candidateRef/checkId/checkRef match exactly

prior.status = reused-passed
→ NOT reusable
→ current check must execute
```

The production delta is exactly one semantic line in:

```text
src/domain/applicable-check-execution.ts
```

No candidate/check/execution/admission identity logic is changed.

## Focused counterexample — PASS

064 adds a decisive executable counterexample:

```text
current candidateRef = C
current checkRef = K

prior:
  candidateRef = C
  checkRef = K
  status = reused-passed

current check:
  process.exit(7)
```

Reviewer independently reproduced:

```text
isApplicableCheckReuseEligible(...)
→ false

executeApplicableChecks(...)
→ current command actually executes
→ status = failed
→ exitCode = 7
```

This proves the fix does not only alter a predicate return value; recursive reuse is actually prevented.

## Delta fidelity

Reviewer compared 064 directly with 062.

Production diff:

```text
(prior.status === "passed" || prior.status === "reused-passed")
↓
prior.status === "passed"
```

Test diff:
- adds explicit reused-passed ineligibility assertion;
- adds a dedicated real-execution counterexample.

No other production semantics are changed.

## Independent regression reproduction

Reviewer reconstructed the 062 candidate, overlaid only the 064 source/test delta, and used exact Node 22.23.2.

Independently reproduced:

```text
focused applicable-check tests
→ 17 / 17 PASS

domain tests
→ 145 / 145 PASS

typecheck
→ PASS

build
→ PASS

quality:dependency-health
→ PASS
→ 0 violations
→ 55 modules / 188 dependencies

quality:entropy
→ PASS
→ 24 / 24 production modules reachable

entropy focused tests
→ 7 / 7 PASS

git diff --check HEAD
→ PASS

Prettier
→ PASS

ESLint
→ PASS

forbidden tracked artifact check
→ PASS

OpenSpec current Change --strict
→ PASS
```

Author records exact-current-repository:

```text
OpenSpec --all --strict
→ 14 / 14 PASS
```

Reviewer’s reconstructed base contains stale pre-archive D02 Change directories, so its local `--all` surface is not exact-current and is not used to contradict the Author’s 14/14 result.

## Artifact / chain integrity

Reviewer verified:

```text
064 inputReviewArchiveSha256
→ exact 063 Reviewer archive

embedded 063 action/context/result
→ byte-for-byte exact

064 source SHA-256
→ exact context claim

064 focused-test SHA-256
→ exact context claim

tasks/package/lock hashes
→ unchanged and exact
```

## Scope / complexity audit

Confirmed unchanged:

```text
host-owned repositoryRoot
host-derived candidateRef
Git-visible mode/kind candidate identity
environmentRefs in checkRef
closed ApplicableCheckExecutionInput
executionInputRef binding
candidate re-derivation at admission
explicit prior-fact input only
no Run-history scan
```

Confirmed absent:

```text
Registry
Planner
Evidence Platform
cache/history store
candidate snapshot DB
provenance traversal
recursive reuse chain
new dependency
package/lock mutation
new authority
```

064 removes an unapproved semantic branch and therefore decreases complexity.

## Verdict

```text
approved
```

No blocking Apply defect remains.

## Next boundary

```text
archive
```

Per canonical Foundation Policy:

```text
review-apply approved
→ archive
```

Reviewer did not archive, activate another Change, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
