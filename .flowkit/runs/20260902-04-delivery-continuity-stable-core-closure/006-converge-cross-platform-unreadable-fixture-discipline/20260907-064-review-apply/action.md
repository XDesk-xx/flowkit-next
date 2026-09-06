# Action — Review Apply

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: converge-cross-platform-unreadable-fixture-discipline
role: reviewer
action: review-apply
projectOrdinal: 031
changeStartSequence: 006
run: 20260907-064-review-apply
input: 20260907-063-apply
approvedProposalReview: 20260907-062-review-propose
base: 875b7827867fd8489f9c3d05837fa3879ec15e2b
```

Verdict: **changes-requested**.

## Current step

This Action independently reviews the exact `063-apply` candidate against the
Proposal approved by `062`. Reviewer changes only this Run and does not revise
Author artifacts, execute Archive, claim formal Verification authority, or
create Owner/Git authority.

No external `flowkit` command is available. No candidate CLI was substituted
for lifecycle authority; candidate test execution was used only as acceptance
evidence.

## Blocking finding

### D04-RA006-001 — pre-mutation setup failures escape helper-owned cleanup

**Affected code:**

```text
tests/unit/domain/unreadable-guidance-fixture.ts:138-145
tests/unit/domain/action-guidance-execution.test.ts:218-228
tests/unit/domain/delivery-operation-execution.test.ts:307-320
```

Both callers set `fixtureOwnsCleanup = true` immediately before awaiting the
shared helper, so their outer `finally` blocks intentionally stop deleting the
temporary root. The helper, however, performs `resolveSafeFixturePaths(...)`
and native-Windows SID discovery before entering its own `try/finally`.
Consequently, an error from either preflight path is thrown after caller cleanup
has been disabled but before helper cleanup becomes reachable.

Reviewer reproduced this on native Windows with a valid caller-created root and
exact internal regular file, then forced `whoami.exe` startup failure by using
an empty child-command search path. The observed result was:

```text
error                → resolve current Windows user SID failed to start: ENOENT
rootRetained         → true
retainedPathReported → false
resolver callback    → not executed
```

The Reviewer removed the temporary proof root after observing the failure and
removed the ephemeral proof script; no proof fixture was retained.

This violates the approved fail-closed lifecycle: Design requires setup,
assertion, restoration, and cleanup failures to be handled distinctly; task
`1.4` requires temporary-root cleanup from the helper lifecycle and exact
retained-path reporting when cleanup cannot complete. The defect is especially
relevant to the documented restricted-Windows risk: the happy path passes, but
the setup-failure path silently leaks the root without identifying it.

### Minimum revise-apply

Keep the existing three-file, test-only shape and correct only ownership/error
handling:

1. Ensure helper-owned cleanup covers every failure after a valid temporary
   root is accepted, including SID discovery/native-command setup failures; do
   not delete any root that has not passed the bounded safety checks.
2. On every such failure, either remove the accepted temporary root or report
   its exact retained path if cleanup/restoration cannot complete.
3. Add focused regression proof for a pre-mutation native setup failure so a
   caller cannot disable its cleanup before the helper can assume it.
4. Preserve exact current-SID `RD` denial, restoration/read recovery, both real
   resolver assertions, POSIX/root proof, and zero unreadable-fixture SKIP.

No production change, generic filesystem/process abstraction, verification
subsystem, or broader redesign is authorized by this finding.

## Positive assessment and independent checks

The ordinary native-Windows path and the requested scope are otherwise
converged:

```text
focused Guidance tests       → 19/19 PASS, 0 skipped
Domain TAP summary           → 241/241 PASS, 0 skipped
Acceptance                   → 5/5 PASS, 0 skipped
managed OpenSpec current     → PASS
managed OpenSpec all strict  → 23/23 PASS
typecheck / format / lint    → PASS
git diff --check             → PASS
src/** / canonical spec diff → NONE
```

The helper and both test hashes match the exact artifacts declared by
`063-apply`. Production resolvers, canonical specs, dependency/toolchain bytes,
and unrelated subsystems remain untouched. These positive results do not cover
the reproduced preflight cleanup failure.

## Required assessments

```text
implementation complexity → PROPORTIONAL_AND_BOUNDED
new control plane          → NONE
scope drift                → NONE
blocking defect            → ONE_LOCAL_FAILURE_LIFECYCLE_DEVIATION
archiveAllowed             → false
nextBoundary               → revise-apply
```

STOP.
