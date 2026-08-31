# 062 Apply — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `apply`
- Run: `20260831-062-apply`
- Role: `author`
- Input: `20260831-061-review-propose` (`approved → apply`)
- Git checkpoint claim: `d9399c7ee23cffe0ee3926236489135f87ffdd95`

## Skills used

- `openspec-apply-change`
- `implementation-convergence`

## Bounded implementation

Implemented only the approved Applicable Check execution contract:

- added a closed `ApplicableCheckPlanInput` that contains only explicit required-check declarations and rejects caller-owned repository/candidate/check/execution identity fields;
- derives deterministic `checkRef` from exact program, ordered argv, and canonical config/tool/environment reference sets;
- derives current `candidateRef` from the trusted host-owned Git worktree, including tracked files, non-ignored untracked files/symlinks, Git-visible `100644` / `100755` / `120000`, tracked deletion, and content/link-target identity;
- excludes only `.flowkit/runs/**` from candidate material so Run persistence cannot self-invalidate the checked candidate;
- fails candidate derivation closed on unsupported Git-visible kinds or ambiguous material;
- binds exact ActionPackage identity + candidateRef + complete resolved check set into one closed `ApplicableCheckExecutionInput` / `executionInputRef`;
- executes exact `program + argv` with `shell=false` and records `passed`, `failed`, or `process-failed` mechanical outcomes;
- adds the reserved typed `facts.applicableChecks` structure without adding a new Result top-level field or fourth Run artifact;
- validates the reserved facts key from the existing RunResult validator when present, while Results without it remain backward-compatible;
- re-derives candidateRef at applicable-check admission and rejects candidate drift, execution/candidate identity mismatch, missing/duplicate/unexpected facts, or checkRef mismatch;
- permits reuse only from explicitly supplied successful prior facts with exact current candidateRef + checkRef equality, and emits an explicit current `reused-passed` fact;
- performs no automatic `.flowkit/runs` history lookup, cache lookup, TTL/freshness check, planner, best-match selection, or candidate snapshot persistence;
- leaves Reviewer, Verification, Owner, Policy, next-Action, and lifecycle authority unchanged.
- introduces no Proposal-unowned arbitrary check-count / argv-count / ref-count / text-length limits; validators enforce semantic structure and the already-canonical Run facts budget only.

No new dependency, package/lock mutation, Registry, Planner, Evidence Platform, cache/history subsystem, temporary Git index, candidate snapshot DB, or background execution was introduced.

## Decisive proof

```text
focused applicable-check tests
→ PASS 16/16

closed plan
→ caller repositoryRoot/candidateRef rejected
→ duplicate checkId/material refs rejected

check identity
→ ordered argv material
→ config/tool/environment drift changes checkRef

candidate identity
→ ignored untracked material absent
→ .flowkit/runs/** mutation stable
→ source bytes change ref
→ same bytes 100755→100644 changes ref
→ symlink target change changes ref
→ tracked deletion changes ref
→ unsupported Gitlink kind fails closed

exact execution
→ success => passed
→ exit 7 => failed
→ missing executable => process-failed

admission
→ exact complete facts PASS
→ candidate drift FAIL
→ executionInputRef/candidateRef mismatch FAIL
→ missing/duplicate/unexpected/checkRef mismatch FAIL

reuse
→ explicit exact prior success => reused-passed
→ failed/stale/source-mode/config/tool/environment mismatch => execute/rerun
→ no Run-history scan
```

## Integration verification

Exact Node runtime: `22.23.2`.

```text
domain tests
→ PASS 144/144

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

detached acceptance with isolated managed FLOWKIT_HOME
→ PASS 4/4
```

The first acceptance invocation was intentionally rejected because `FLOWKIT_HOME` was not supplied. After restoring an isolated execution-only managed OpenSpec 1.10.0 + Archify 2.15.0 home, the same acceptance suite passed 4/4. No repository package/config mutation was made to accommodate that execution prerequisite.

## Conclusion

```text
PASS
→ review-apply
→ STOP
```

No archive, next-Change activation, Delivery Formal Full Test, Git checkpoint, commit, push, or merge was performed.
