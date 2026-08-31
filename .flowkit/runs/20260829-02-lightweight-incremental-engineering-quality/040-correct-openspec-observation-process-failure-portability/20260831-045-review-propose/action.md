# 045 Review Propose — correct-openspec-observation-process-failure-portability

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `correct-openspec-observation-process-failure-portability`
- Action: `review-propose`
- Run: `20260831-045-review-propose`
- Role: `reviewer`
- Input Run: `20260831-044-propose`
- Review chain start: `20260831-040-explore`

## Full review-chain reconstruction

Reviewer re-reviewed the complete chain:

```text
040 Explore
→ real Windows/Linux portability defect confirmed
→ exact Windows raw tuple still missing

041 Review Explore
→ CHANGES REQUESTED
→ RE-041-001

042 Revise Explore
→ Windows tuple proven:
   code=1 / signal=null / stdout=""
→ Branch B selected
→ minimal spec clarification required

043 Review Explore
→ APPROVED
→ production broadening rejected
→ observable precedence accepted

044 Propose
→ freezes only the 042/043 approved correction
```

Reviewer verified:

```text
044 inputReviewArchiveSha256
→ exact 043 Reviewer ZIP

044 approvedExploreSha256
→ exact 042 revised Explore

all five Proposal artifact SHA-256 values
→ exact match
```

No rejected 040/041 assumption is reintroduced.

## Proposal convergence

The Proposal correctly freezes the portable classification contract:

```text
spawn/error
or close with:
  code=null
  OR signal!=null
→ openspec-process-failed

otherwise numeric close exists
→ validate required machine JSON first

numeric close + malformed/empty required stdout
→ malformed-machine-output

numeric non-zero + valid formal OpenSpec JSON
→ openspec-formal-outcome
```

This matches the final approved Explore.

The spec delta correctly defines the boundary through host-observable facts rather than hidden OS termination cause.

## Production behavior

The Proposal correctly defaults to:

```text
current production classification behavior
→ unchanged
```

Apply may only extract the already-existing close-tuple decision into the smallest internal pure testability seam if deterministic tests require it.

That seam:

```text
MUST NOT enter src/domain/index.ts
MUST NOT alter public API
MUST NOT add runtime state
MUST NOT become a process supervisor/runtime abstraction
```

No Proposal language authorizes classification broadening.

## Portable test correction

The rejected universal assertion:

```text
child self process.kill(SIGKILL)
→ always openspec-process-failed
```

is not preserved as contract truth.

Instead Proposal requires deterministic coverage for all three distinct observable categories:

```text
host-observable abnormal close
→ openspec-process-failed

numeric close + malformed/empty required machine output
→ malformed-machine-output

numeric non-zero + valid machine JSON
→ openspec-formal-outcome
```

This is the correct replacement for the non-portable fixture assumption.

`tasks.md` requests Windows focused execution when a Windows environment is available, but the contract proof itself no longer depends on a platform-specific kill fixture and contains no platform skip. Reviewer therefore does not treat absence of a Windows host during Apply as a Proposal blocker, provided deterministic tuple coverage is complete and no Windows-specific branch is introduced.

## Spec-delta quality

The modified `openspec-thin-integration` requirement is narrowly scoped and resolves the previous abstract overlap between:

```text
process cannot start or complete
```

and:

```text
required stdout is malformed
```

by specifying observable precedence.

It preserves:

```text
existing diagnostic taxonomy
valid JSON + non-zero formal outcome
malformed required JSON diagnostic
no free-text lifecycle inference
```

No new capability, diagnostic kind, or lifecycle taxonomy is created.

## Non-goal audit

Confirmed absent:

```text
Windows-specific production branch
exit-code-1 heuristic
non-zero + empty-stdout heuristic
stderr inference
hidden OS-cause reconstruction
diagnostic taxonomy expansion
new dependency
package/lock mutation
generic process supervisor
runtime abstraction
Applicable Checks merge
architecture expansion
```

## Independent validation

Reviewer independently verified:

```text
OpenSpec 1.10.0
current Change --strict
→ PASS
```

The Author records:

```text
OpenSpec --all --strict
→ 14 / 14 PASS
git diff --check
→ PASS
```

The supplied Proposal package is delta-only, so Reviewer does not use a stale reconstructed repository to contradict the Author's exact-current-repository all-items count.

No production or package mutation is present in the Propose payload.

## Apply constraints

1. Preserve current externally observable production classification unless a smaller already-observable fact is independently proven.
2. If extracting a helper, keep it internal and limited to the existing close-tuple classification decision.
3. Do not export the helper through `src/domain/index.ts`.
4. Remove the self-SIGKILL universal contract assertion.
5. Add deterministic coverage for both `code=null` and `signal!=null` process-failure shapes where practical.
6. Preserve real numeric-close malformed-output coverage.
7. Preserve valid JSON + numeric non-zero formal-outcome coverage.
8. Do not add `process.platform` branching, exit-code heuristics, stdout/stderr heuristics, or hidden-cause inference.
9. Do not add dependencies, package/lock changes, process supervision/runtime machinery, or Applicable Checks scope.
10. Run the declared integration checks. Windows focused execution is desirable when available, but Apply acceptance MUST rest on portable deterministic boundary coverage rather than an OS-specific kill assumption.
11. If implementation cannot preserve current public behavior with the bounded seam, STOP and return to Proposal review instead of broadening Apply.

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
