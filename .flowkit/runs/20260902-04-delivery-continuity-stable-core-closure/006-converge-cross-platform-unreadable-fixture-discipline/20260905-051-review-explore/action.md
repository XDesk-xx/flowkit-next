# Action — Review Explore

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: converge-cross-platform-unreadable-fixture-discipline
role: reviewer
action: review-explore
projectOrdinal: 031
changeStartSequence: 006
run: 20260905-051-review-explore
physicalRunGroup: 006
input: 20260905-050-explore
```

Verdict: **APPROVED**.

050 identifies a real, bounded closure-correction problem and keeps the response smaller than the product contract it is proving.

The decisive finding is:

```text
two Guidance unreadable fixtures
→ assume chmod(0o000) creates unreadability

native Windows/NTFS
→ may still permit the read

production resolver
→ already fail-closes on actual readFile exception

therefore
→ current proof gap is fixture portability,
   not a proven production resolver defect
```

## Correct closure classification

This is accepted as a proof-triggered **closure corrective Change** after the five planned D04 capability Changes have completed and archived.

It is not:

```text
a sixth planned Stable Core capability
D05
a replacement Delivery composition
```

The frozen D04 reference already permits a normal corrective Change when fresh proof finds a real current-candidate/canonical closure defect.

`required: true` in coordination is acceptable only as a closure-gating fact for this active corrective Change. Proposal MUST NOT rewrite the final D04 reference or recommended planned order to claim that D04 originally contained six planned capability Changes.

## Exact failing surface

Repository inspection independently confirms exactly two existing unreadable-Guidance fixture sites that use `chmod(..., 0o000)`:

```text
tests/unit/domain/action-guidance-execution.test.ts
tests/unit/domain/delivery-operation-execution.test.ts
```

No production Guidance resolver uses chmod or platform-specific permission logic.

Both resolvers already have the required semantic shape:

```text
canonical/regular/realpath validation
↓
readFile
↓
read succeeds → bind exact Guidance
read throws   → catch → null
```

So current proof does not justify production resolver mutation.

## Capability-aware fixture direction

The Explore's preferred direction is accepted:

```text
actual read capability
→ decides whether unreadable fixture exists

NOT

process.platform
mode bits alone
```

Linux/root retains a real low-privilege permission-denial proof.

Direct-reader hosts:

```text
chmod(000)
↓
probe actual read

permission denied
→ enforce resolver == null

read still succeeds
→ fixture capability absent
→ explicit capability-bound project-local SKIP
```

This is narrower and more truthful than hardcoded `win32` branching or fabricated PASS.

## Canonical spec correction is required

A test-only `t.skip()` would contradict the current canonical requirement:

```text
platform cannot reproduce fixture
+ workaround skips semantic obligation
→ STOP / do not mark missing proof PASS
```

Therefore Proposal correctly needs one narrow MODIFIED requirement in:

```text
formal-full-test-execution-and-correction
```

The revision may permit capability-bound fixture accounting only when all of these remain true:

```text
actual capability probe proves fixture is unavailable
explicit project-local test result records the SKIP
same exact candidate retains a real enforcement-capable proof
silent platform skip remains forbidden
OS-name-only skip remains forbidden
unavailable fixture is not relabeled as semantic PASS
```

This is a correction to an over-strict fixture-accounting rule, not a new verification subsystem.

## Mandatory Proposal precision — Core does not currently persist subtest SKIP facts

Reviewer inspection confirms the current ApplicableCheck / Delivery Full Test execution model records check-level:

```text
passed
failed
reused-passed
process-failed
```

and exact process exit/signal only.

The exact process adapter currently suppresses child stdout/stderr and does not persist Node subtest SKIP accounting.

Therefore Proposal MUST keep the new capability-bound SKIP as **project-local fixture/test accounting** unless fresh proof demonstrates a need for a Core-level skip fact.

Proposal MUST NOT claim that current Formal Full Test terminal facts themselves preserve per-subtest SKIP evidence.

If the contract would require Core to consume/persist cross-platform SKIP facts, STOP and revise rather than silently introducing:

```text
ApplicableCheckStatus = skipped
skip registry
evidence database
cross-platform result store
```

No such subsystem is justified by current Explore proof.

## Native Windows evidence provenance

050 is transparent that:

```text
Owner-provided Windows domain
→ 227/229
→ older pre-Change5 candidate evidence

current exact checkpoint Linux domain
→ 241/241
```

The older Windows result is sufficient to identify the known fixture portability defect because the relevant unreadable fixture code remains the same semantic surface.

It is NOT current-candidate Windows acceptance evidence.

Apply/Review MUST obtain fresh native-Windows proof for the corrected new candidate.

Minimum expected post-Apply accounting:

```text
Linux
→ zero unexplained FAIL
→ real unreadable enforcement proof retained

Windows
→ zero unexplained FAIL
→ exactly capability-bound SKIP where actual read remains possible

Acceptance
→ PASS on both platforms
```

Any different Windows product/canonical defect must be returned to the Owner-controlled correction loop and MUST NOT be absorbed automatically by this Change.

## Candidate continuity after correction

The Change will mutate tracked test bytes and one canonical spec.

Therefore after archive:

```text
new exact checkpoint
↓
all prior Formal Full Test terminal proof is stale for the new candidate
↓
restart real cross-platform Formal Full Test
```

The Explore correctly does not run real D04 Formal Full Test, Architecture Finalization, Delivery Final, or Repository Integration during this corrective Change.

## Complexity / minimality

Accepted minimum surface:

```text
two known fixture tests
+
one narrow MODIFIED platform-fixture requirement
+
fresh native Windows proof
```

Explicitly rejected:

```text
Windows ACL subsystem
icacls dependency
generic filesystem abstraction
platform lifecycle
production Windows branch
new ApplicableCheckStatus
skip registry
evidence platform
new candidate identity
D05
```

No new control plane is required.

## Independent Reviewer proof

Payload integrity:

```text
050 payload manifest
→ 9/9 file hashes / byte counts MATCH

050 package SHA-256
→ b82439d9d7f30a587458aab145a1e87a479e4771bdd0c651fd1922c8b49fb37e
```

Exact repository continuity:

```text
bundle SHA-256
→ 34f3b4371e71a2de4713db487292ef2a61ccc3dcb3e7e7bca0f25b5f28c579a9

exact checkpoint
→ 875b7827867fd8489f9c3d05837fa3879ec15e2b

parent
→ 88e376d2ca870b248952477f90adf38409fa679e

checkout before authorized Explore overlay
→ CLEAN

five planned capability Changes
→ completed / archived

active Changes before 031 activation
→ 0

git diff --check
→ PASS
```

Fresh exact Node 22.23.2 proof on the 050 exact candidate:

```text
focused Action + Delivery Guidance
→ 19/19 PASS
→ 0 skipped

domain
→ 241/241 PASS
→ 0 skipped

typecheck
→ PASS

build
→ PASS

format
→ PASS

lint
→ PASS

acceptance
→ 5/5 PASS
→ 0 skipped

forbidden tracked artifacts
→ PASS

dependency health
→ 80 modules / 359 dependencies
→ 0 violations

repository entropy
→ 40/40 production modules reachable

entropy focused
→ 7/7 PASS

canonical OpenSpec specs
→ 22/22 PASS

active Change strict
→ expected Explore-stage failure only:
   no delta yet

git diff --check
→ PASS
```

## Current-step explanation

`review-explore` is deciding whether the two native-Windows fixture failures justify a bounded corrective Change and whether the smallest correction is known before Proposal.

They do, and it is.

The correct correction is not:

```text
teach Core Windows ACLs
```

and not:

```text
hardcode win32 → skip
```

It is:

```text
probe whether the fixture is actually enforceable
→ prove when enforceable
→ explicitly account when unavailable
→ keep real same-candidate enforcement proof elsewhere
```

## New-content / scope-drift

```text
production resolver change
→ NOT justified

sixth planned capability
→ NO

D05
→ NO

new Core capability
→ NO

ACL/filesystem subsystem
→ NO

skip/evidence registry
→ NO

real D04 closure operations
→ NOT executed

scope drift
→ NONE
```

Next legal boundary:

```text
propose
```

STOP.
