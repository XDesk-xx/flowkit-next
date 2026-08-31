# 047 Review Apply — correct-openspec-observation-process-failure-portability

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `correct-openspec-observation-process-failure-portability`
- Action: `review-apply`
- Run: `20260831-047-review-apply`
- Role: `reviewer`
- Input Run: `20260831-046-apply`
- Review chain start: `20260831-040-explore`

## Full review-chain result

Reviewer re-reviewed the full chain:

```text
040 Explore
→ portability defect confirmed

041 Review Explore
→ CHANGES REQUESTED
→ RE-041-001

042 Revise Explore
→ Windows observable tuple proven
→ Branch B / observable precedence selected

043 Review Explore
→ APPROVED

044 Propose
→ minimal spec clarification + portable deterministic tests

045 Review Propose
→ APPROVED

046 Apply
→ bounded internal classifier extraction + portable boundary-test correction
```

The 046 input review hash matches the 045 Reviewer archive.

No rejected Windows/platform/exit-code/stdout/stderr heuristic was reintroduced.

## Portability implementation — PASS

Reviewer independently inspected the production diff.

`src/domain/openspec-observation.ts` changes only from:

```text
inline:
code === null || signal !== null
```

to the internal pure helper:

```text
classifyManagedOpenSpecClose(code, signal)
```

The helper is:

```text
code === null || signal !== null
→ openspec-process-failed

otherwise
→ numeric exitCode
```

Externally observable classification semantics are unchanged.

The helper is not exported from `src/domain/index.ts` and does not create runtime state, process supervision, platform branching, or a public process abstraction.

## Portable boundary proof — PASS

Reviewer independently reproduced with exact Node 22.23.2:

```text
focused openspec-observation-boundary
→ 14 / 14 PASS

code=null
→ openspec-process-failed

signal!=null
→ openspec-process-failed

numeric close
→ numeric outcome

real process.exit(1) + empty stdout
→ malformed-machine-output

valid machine JSON + numeric non-zero
→ openspec-formal-outcome
```

The old universal self-`SIGKILL` assertion is gone.

No Windows skip or synthetic Windows classification is used.

## Integration checks reproduced

Reviewer independently reconstructed the current D02 candidate and reproduced:

```text
domain tests
→ 128 / 128 PASS

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
→ 47 modules / 162 dependencies

quality:entropy command
→ PASS
→ 19 / 19 production modules reachable

OpenSpec current Change --strict
→ PASS
```

Package/lock truth remains unchanged by 046.

## Blocking finding

### RA-047-001 — existing entropy focused test regressed from the new production source

046 adds the new production source:

```text
src/internal/openspec-process-outcome.ts
```

It is correctly reachable from the existing production roots through:

```text
src/domain/openspec-observation.ts
```

Therefore the repository's production-source baseline has legitimately changed:

```text
before 046
→ 18 production modules

after 046
→ 19 production modules
```

The production entropy command correctly reports:

```text
19 / 19 reachable
→ PASS
```

However the existing focused entropy test from the already-completed Repository Entropy Hygiene Change still hard-codes:

```text
assert.equal(result.total, 18)
assert.equal(result.reachable.length, 18)
```

Reviewer independently ran:

```text
node --test tests/unit/quality/production-reachability.test.mjs
```

and reproduced:

```text
6 / 7 PASS
1 FAIL

accepted repository baseline has every production source reachable

actual total     = 19
expected total   = 18
```

This is a real repository regression caused by the current Apply's new production source.

The Author's verification ran:

```text
quality:entropy
→ PASS 19/19
```

but did not run the existing `test:entropy` focused suite, so the stale baseline assertion was missed.

### Required smallest revise-apply

Do NOT create a new Change and do NOT redesign Entropy Hygiene.

Revise this Apply only enough to keep the already-accepted repository test surface coherent with the new production source.

Preferred bounded correction:

```text
tests/unit/quality/production-reachability.test.mjs

healthy repository baseline
→ assert zero unreachable findings
→ assert reachable.length === total
```

rather than coupling the test forever to a literal module count.

A literal update:

```text
18 → 19
```

would also close the immediate regression, but the invariant form better matches the archived canonical requirement:

```text
every resolved src module reachable
→ PASS
```

and avoids forcing unrelated future production-source additions to edit this test merely because module count changes.

The revision MUST NOT:
- change production reachability semantics;
- change production roots;
- add a baseline/waiver mechanism;
- alter the portability classifier behavior;
- broaden this Change beyond the one affected existing test.

After correction, rerun at minimum:

```text
focused openspec boundary
test:entropy
domain
typecheck
quality:gate
quality:dependency-health
quality:entropy
build
current Change strict
```

## Verdict

```text
changes-requested
```

The portability correction itself is correct, but Apply is not repository-clean until the affected existing entropy focused test passes.

## Next boundary

```text
revise-apply
```

Reviewer did not mutate Author production/test artifacts, archive the Change, activate another Change, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
