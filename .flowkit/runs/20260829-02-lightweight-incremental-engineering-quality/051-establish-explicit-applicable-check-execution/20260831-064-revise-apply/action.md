# 064 Revise Apply — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `revise-apply`
- Run: `20260831-064-revise-apply`
- Role: `author`
- Input: `20260831-063-review-apply` (`changes-requested → revise-apply`)
- Git checkpoint claim: `d9399c7ee23cffe0ee3926236489135f87ffdd95`

## Skills used

- `revise-apply`
- `implementation-convergence`

## Blocking finding corrected

### RA-063-001 — recursive reuse from `reused-passed`

Reviewer proved that 062 widened the approved reuse predicate from:

```text
prior.status = passed
+ exact candidateRef
+ exact checkRef
```

to:

```text
prior.status = passed OR reused-passed
```

That permitted recursive reuse chains even though `reused-passed` records only that the prior Run itself reused an earlier success and did not execute the check.

The implementation is now restored to the approved boundary:

```text
prior.status === "passed"
→ may be reuse eligible when candidateRef/checkId/checkRef also match exactly

prior.status === "reused-passed"
→ never reuse eligible
→ execute the current check
```

No candidate/check/execution/admission identity semantics were changed.

## Focused counterexample

A same-candidate/same-check prior fact with:

```text
status = reused-passed
```

is now proven to:

```text
isApplicableCheckReuseEligible
→ false

executeApplicableChecks
→ executes the current command

current command exits 7
→ current fact status = failed
→ exitCode = 7
```

This proves the correction does not merely change a predicate return value; the current check really runs.

## Verification

Exact Node runtime: `22.23.2`.

```text
focused applicable-check tests
→ PASS 17/17

domain tests
→ PASS 145/145

typecheck
→ PASS

build
→ PASS

quality:gate underlying checks
  git diff --check HEAD
  prettier --check
  eslint src tests
  forbidden tracked artifact check
→ PASS

quality:dependency-health
→ PASS, 0 violations, 55 modules / 188 dependencies

quality:entropy
→ PASS, 24/24 production modules reachable

entropy focused tests
→ PASS 7/7

OpenSpec current Change --strict
→ PASS

OpenSpec --all --strict
→ PASS 14/14
```

## Scope preservation

Unchanged:

- host-owned repositoryRoot;
- host-derived candidateRef;
- Git-visible mode/kind material;
- environmentRefs in checkRef;
- closed ApplicableCheckExecutionInput / executionInputRef;
- candidate re-derivation and admission;
- explicit prior-fact input only;
- no Run-history scan;
- no Registry / Planner / Evidence Platform / cache / provenance traversal;
- package.json / pnpm-lock.yaml;
- approved Proposal/spec/design/tasks.

## Conclusion

```text
PASS
→ review-apply
→ STOP
```

No archive, next-Change activation, Delivery Formal Full Test, checkpoint, commit, push, or merge was performed.
