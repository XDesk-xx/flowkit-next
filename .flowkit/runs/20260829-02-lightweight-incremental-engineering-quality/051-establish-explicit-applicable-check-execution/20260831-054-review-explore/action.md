# 054 Review Explore — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `review-explore`
- Run: `20260831-054-review-explore`
- Role: `reviewer`
- Input Run: `20260831-053-revise-explore`
- Review chain start: `20260831-051-explore`

## Review result

Reviewer re-reviewed 053 strictly against the three blocking findings from 052.

## RE-052-001 — substantially resolved, but one candidate-material gap remains

The main trust problem is correctly fixed.

053 no longer allows arbitrary caller candidateRef truth.

The selected boundary is now:

```text
trusted Flowkit Action execution host
→ derives current candidateRef from actual Git-visible worktree

raw formal plan
→ cannot contain candidateRef

reuse
→ compares prior candidateRef to freshly derived current candidateRef
```

Reviewer independently reproduced:

```text
Run-only mutation under .flowkit/runs/**
→ candidateRef unchanged

source-byte mutation
→ candidateRef changes

stale prior candidateRef
→ cannot override current derivation
→ reuse rejected
```

This closes the original caller-trust defect.

However the exact candidate digest material is still incomplete.

053 currently derives each regular file identity as:

```text
path
+ kind=regular
+ SHA-256(actual bytes)
```

and each symlink as:

```text
path
+ kind=symlink
+ SHA-256(link target)
```

It does not include Git-visible executable/file mode.

Reviewer independently reproduced:

```text
tracked check.sh
mode 100755
bytes unchanged
→ candidateRef R

chmod -x check.sh
mode 100644
bytes unchanged
→ candidateRef still R
```

while Git itself reports:

```text
mode change 100755 => 100644 check.sh
```

For the generic Applicable Check capability this is materially relevant.

Example:

```text
program = ./check.sh

candidate mode 100755
→ prior check can execute/pass

same bytes, mode changed to 100644
→ real rerun can process-fail on POSIX

053 candidateRef
→ unchanged

same checkRef
→ stale prior PASS can be reused
```

That violates:

```text
candidate changed
→ old fact must not be reusable
```

### RE-054-001 — candidate identity omits Git-visible executable mode

Required smallest revise-explore:

Extend the exact candidate manifest only enough to include materially Git-visible file mode/kind identity.

At minimum, for regular worktree paths encode the executable bit / canonical Git mode distinction necessary to distinguish:

```text
100644
100755
```

while preserving the already-selected:
- path identity;
- regular/symlink kind;
- bytes/link-target digest;
- tracked deletion marker;
- .flowkit/runs exclusion;
- fail-closed unsupported/read failure behavior.

Then prove:

```text
same bytes + 100755→100644
→ candidateRef changes
→ prior success is not reusable
```

Do not add Git-tree snapshots, temp indexes, history DBs, or a candidate registry.

If Proposal wants a broader canonical mode encoding, it must stay bounded to actual candidate material identity and not become Git authority.

## RE-052-002 — RESOLVED

053 now includes:

```text
environmentRefs[]
```

in the canonical check declaration and therefore in derived checkRef.

Reviewer independently reproduced:

```text
same candidate
same command/config/tool

platform:linux-x64
→ K1

platform:windows-x64
→ K2

K1 != K2
→ old environment success not reusable
```

This closes the environment-invalidation blocker.

Flowkit still does not infer which environment facts matter; approved formal input owns the explicit materially relevant refs.

## RE-052-003 — RESOLVED

053 selects one explicit closed seam:

```text
ApplicableCheckPlanInput
→ closed approved formal plan
→ no caller candidateRef/checkRef/executionInputRef

Flowkit
→ derive candidateRef
→ derive checkRefs
→ bind exact ActionPackage
→ form ApplicableCheckExecutionInput
→ derive executionInputRef
```

The resolved execution input binds:

```text
exact ActionPackage
+ exact candidateRef
+ exact resolved declared-check set
```

Execution and Result admission consume the same resolved input identity.

Reviewer independently reproduced the decisive identity behavior:

```text
checks [A,B]
→ executionInputRef X

checks [A]
→ executionInputRef Y

X != Y
```

and accepts the fail-closed requirements for:

```text
duplicate declarations
missing result fact
unexpected/mismatched checkId/checkRef
executionInputRef mismatch
candidate drift
```

This closes the execution/admission seam blocker without creating a Registry, plan DB, or fourth Run artifact.

## Accepted 053 decisions — do not reopen

Reviewer accepts:

```text
formal input owns WHAT checks apply
Flowkit does not infer applicability
shell=false exact program+argv execution
compact typed Result.facts structure
candidateRef is host-derived, not caller-supplied
.flowkit/runs/** exclusion
environmentRefs in checkRef
separate closed ApplicableCheckExecutionInput
executionInputRef binding
admission re-derives current candidate identity
explicit prior-success-only reuse
no automatic Run history search
no Check Registry / Verification Planner / Evidence Platform
no formal Verification verdict
```

## Required revise-explore scope

Revise only:

```text
RE-054-001
→ candidate identity must include Git-visible executable/file mode material
```

Required counterexample:

```text
same path
same bytes
100755 → 100644
→ candidateRef changes
→ stale prior PASS cannot be reused
```

Do not reopen the three 052 findings that are otherwise resolved.

## Verdict

```text
changes-requested
```

## Next boundary

```text
revise-explore
```

Reviewer did not mutate Author Explore, create Proposal artifacts, Apply, mutate production/package truth, activate another Change, archive, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
