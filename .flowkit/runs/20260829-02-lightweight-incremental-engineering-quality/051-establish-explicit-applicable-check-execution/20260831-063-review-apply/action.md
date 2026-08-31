# 063 Review Apply — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `review-apply`
- Run: `20260831-063-review-apply`
- Role: `reviewer`
- Input Run: `20260831-062-apply`
- Review chain start: `20260831-051-explore`

## Full review-chain reconstruction

Reviewer re-reviewed the implementation against the complete approved chain:

```text
051 Explore
→ initial applicable-check execution model

052 Review Explore
→ candidate/environment/execution-input binding blockers

053 Revise Explore
→ host-derived candidateRef
→ environmentRefs in checkRef
→ closed ApplicableCheckExecutionInput

054 Review Explore
→ executable-mode candidate gap

055 Revise Explore
→ Git-visible 100644/100755/120000/tracked-deletion identity

056 Review Explore
→ APPROVED
→ reuse frozen as:
   prior.status = passed
   + exact candidateRef
   + exact checkRef

057/058/059/060 Proposal chain
→ candidate/non-ignored/root/provenance wording converged

061 Review Propose
→ APPROVED
→ apply

062 Apply
→ bounded implementation
```

062 inputReviewArchiveSha256 exactly matches the 061 Reviewer archive.

## Implementation fidelity — PASS except one reuse widening

The implementation correctly adds:

```text
closed ApplicableCheckPlanInput
host-derived candidateRef
Git-visible candidate manifest
environmentRefs in checkRef
closed ApplicableCheckExecutionInput
executionInputRef
shell=false exact runner
facts.applicableChecks
candidate re-derivation at admission
explicit prior-fact reuse input
```

No Registry, Planner, Evidence Platform, cache/history scan, candidate snapshot DB, temporary Git index, new dependency, package mutation, or new authority was added.

## Independent reproduction

Reviewer reconstructed the current D02 candidate and used exact:

```text
Node 22.23.2
pnpm 11.22.0 environment
dependency-cruiser 18.2.0
OpenSpec 1.10.0
```

Independently reproduced:

```text
focused applicable-check tests
→ 16 / 16 PASS

domain tests
→ 144 / 144 PASS

typecheck
→ PASS

build
→ PASS

Prettier
→ PASS

ESLint
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

OpenSpec current Change --strict
→ PASS
```

The prepared reusable dependency environment still requires the already-known direct `yaml` execution link because it predates current package truth. Reviewer treated that as execution-environment preparation only, not repository truth.

## Blocking finding

### RA-063-001 — reuse predicate accepts `reused-passed` as a reusable prior fact

The approved Explore froze the reuse predicate explicitly as:

```text
prior.status = passed
AND
prior.candidateRef = current Flowkit-derived candidateRef
AND
prior.checkRef = current derived checkRef
```

Reviewer 056 repeated and approved that exact rule.

The current implementation instead uses:

```ts
prior.status === "passed" || prior.status === "reused-passed"
```

inside `isApplicableCheckReuseEligible(...)`.

Reviewer independently reproduced:

```text
current candidateRef = C
current checkRef = K

prior:
  candidateRef = C
  checkRef = K
  status = reused-passed

current implementation:
→ reuse eligible = true
```

That is broader than the approved contract.

A `reused-passed` fact means:

```text
this prior Run itself did not execute the check;
it satisfied the requirement from an earlier prior success
```

Allowing it to become the next reusable prior source creates recursive reuse chains:

```text
executed PASS
→ reused-passed
→ reused-passed
→ reused-passed
→ ...
```

The approved D02 model deliberately kept reuse bounded to an explicitly supplied actual prior successful execution fact rather than building recursive cache/history semantics.

This is not an identity-safety failure when candidate/check identity remains exact, but it is a real Proposal/Explore fidelity defect and unnecessarily increases reuse semantics.

## Required smallest revise-apply

Do not redesign the capability.

Change only the reuse eligibility boundary so:

```text
prior.status === "passed"
→ may be eligible

prior.status === "reused-passed"
→ NOT eligible
→ current check executes
```

Keep `failed` and `process-failed` non-reusable as already implemented.

Add one focused counterexample:

```text
explicit prior reused-passed
+ same candidateRef
+ same checkRef
→ isApplicableCheckReuseEligible = false
→ executeApplicableChecks executes the current check
→ current fact reflects the real current execution outcome
```

Do not:
- change candidate/check/execution identity;
- change admission;
- add provenance-chain traversal;
- add original-source references to `reused-passed`;
- add cache/history lookup;
- create a new Change.

After correction rerun at minimum:

```text
focused applicable-check tests
domain
typecheck
build
quality:gate
quality:dependency-health
quality:entropy
test:entropy
OpenSpec current strict
```

## Verdict

```text
changes-requested
```

## Next boundary

```text
revise-apply
```

Reviewer did not mutate Author implementation, archive, activate another Change, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
