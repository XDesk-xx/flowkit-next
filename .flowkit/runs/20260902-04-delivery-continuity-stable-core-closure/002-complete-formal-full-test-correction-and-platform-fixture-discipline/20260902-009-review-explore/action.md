# Action — Review Explore

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: complete-formal-full-test-correction-and-platform-fixture-discipline
role: reviewer
action: review-explore
projectOrdinal: 027
changeStartSequence: 002
run: 20260902-009-review-explore
physicalRunGroup: 002
input: 20260902-008-explore
```

Verdict: **REVISE**.

The Explore has strong proof for candidate/check identity reuse and for the same-candidate-vs-new-candidate correction distinction, but two material contract questions are not yet converged.

## Finding D04-R002-001 — flowkit-next self-test commands are being promoted into generic product Delivery Guidance

Blocking.

008 states that Change 2 must preserve this literal six-gate sequence and place it in canonical product `skills/delivery/full-test/SKILL.md`:

```text
pnpm typecheck
pnpm format:check
pnpm build
pnpm test:domain
exact managed OpenSpec 1.10.0 validate --all --strict
pnpm test:acceptance
```

Those commands are real and accepted for **flowkit-next's own repository Full Test**. Historical D01 proof froze them for flowkit-next self-development/final verification.

But D04's final stable product boundary is broader:

```text
D04 accepted main
→ Stable Core manages external projects

target project supplies:
repository/Git
OpenSpec/project contracts
project-local configuration/tooling
Owner scope/authority
```

Therefore flowkit-next-specific package scripts cannot silently become the universal product `delivery-full-test` HOW for every managed repository.

The current Explore conflates:

```text
A. flowkit-next's own D04/self-development Full Test fixture/plan

with

B. generic Stable Core delivery-full-test execution/correction contract
```

Required revise-explore convergence:

```text
canonical delivery-full-test Guidance
→ own generic operation HOW:
   exact candidate binding
   execution of the already-defined project-local Formal Full Test contract
   same-candidate environment/fixture correction
   new-candidate repository/canonical correction
   exact current-evidence admission
   STOP / authority boundaries

flowkit-next literal six-gate sequence
→ remain flowkit-next project-local verification contract / D04 proof fixture
→ not universal Stable Core command identity
```

Do not solve this by creating a Full Test Registry, Planner, platform, or generic command database.

Proof the smallest way the already-existing project-local Full Test contract is supplied/bound. Reuse existing applicable-check / repository-local configuration seams if sufficient; introduce no new identity family unless proof actually requires it.

## Finding D04-R002-002 — the already-decided `delivery-full-test` authority source is unresolved

Blocking.

D04's exact-operation model requires:

```text
WHAT decided before HOW
```

and `DeliveryOperationPackage` must bind existing authority facts when the operation requires authority.

008 currently says, in effect:

```text
"If the execution surface later carries an explicit Owner/caller authority fact..."
```

and leaves Proposal to choose the authority shape.

That is not yet a converged Explore boundary.

Accepted historical Full Test evidence already states:

```text
final Change archive / exact checkpoint
↓
explicit Owner Full Test authorization
↓
independent Verification executes Formal Full Test
↓
formal Verification PASS / FAIL
```

Therefore revise-explore must do one of these explicitly:

```text
A. preserve explicit, exact, scope-bound Owner authorization
   as the legal source that makes delivery-full-test already-decided;

or

B. provide fresh proof for a deliberate authority-contract change.
```

It must not silently weaken the existing boundary to arbitrary "caller selected full-test".

The authority fact may authorize only the already-decided Formal Full Test operation. It MUST NOT grant repository correction, Change mutation, Git mutation, Delivery Final, or next-operation authority.

No Delivery authority state machine is required.

## What is already approved in principle

The following Explore conclusions are strong and should remain stable through revise-explore:

```text
reuse existing Git-visible candidate identity
→ YES

repository/canonical bytes change
→ candidate changes / prior evidence cannot prove new candidate

environment/config/tool/check identity changes
→ candidate may remain exact
→ stale affected PASS is not reusable
→ rerun affected verification

result admission rechecks current candidate
→ YES

platform fixture semantic obligation
≠ identical OS fixture mechanics

finding DB / correction Registry
→ NO

Evidence Platform
→ NO

candidate invalidation subsystem
→ NO

platform lifecycle branch
→ NO

automatic corrective Change
→ NO
```

The Reviewer independently reproduced the claimed existing seams.

## Independent Reviewer proof

Exact handoff / base:

```text
008 payload file hashes / byte counts
→ MATCH

embedded final reference SHA
→ b26217a2ae397772aea7fd96140855b0099a1089e2c2f8c9b2614e50809320a9
→ MATCH

embedded d4858d46 bundle SHA
→ 3f6ec54c7b0fc32fca26a1f5fb12a346f2a149dd86f62e0dfb25b13128197e54
→ MATCH

git bundle
→ complete history

exact checkpoint
→ d4858d461bd5a08413b8581490e75497f4027efe

checkpoint parent
→ eaa1c8f1cf9a52e05b75c3d1133f7aff8449c215

working tree before Explore overlay
→ CLEAN

Change 1 archived
→ PRESENT
```

Existing seam proof on the same candidate:

```text
action-guidance-execution
applicable-check-execution
author-action-guidance
delivery-operation-execution
delivery-start-execution
managed-tool-resolution

→ 69/69 PASS
→ 0 skipped
```

Canonical OpenSpec:

```text
18/18 specs strict PASS

active Change strict
→ expected Explore-stage failure only:
   no spec delta yet
```

Repository formatting integrity:

```text
git diff --check
→ PASS
```

Repository inspection also confirms:

```text
candidateRef changes on:
source bytes
Git-visible executable mode
symlink target
tracked deletion

candidateRef ignores:
ignored untracked material
.flowkit/runs-only material

checkRef changes on:
material environment/config/tool/program/argv identity

admission:
re-derives current candidate
rejects candidate/fact-set mismatch
```

These are real accepted seams and justify the correction model.

## Current-step explanation

`review-explore` asks whether Change 2 has fully determined the smallest product-level Formal Full Test contract before Proposal freezes spec/design/tasks.

The correction semantics are mostly proven, but the current Explore still mixes one project's self-test command plan into generic Stable Core HOW and leaves the legal source of the already-decided Full Test operation unresolved.

Therefore Proposal is not yet safe.

## Complexity / minimality

The required revision should reduce coupling, not add machinery.

Expected correction:

```text
separate generic delivery-full-test HOW
from flowkit-next-local six-gate proof fixture

+
freeze the existing exact authority source
```

Not expected:

```text
new Verification lifecycle
Full Test Registry / Planner
command database
candidate database
Skill Router
platform subsystem
automatic correction
```

## New-content / scope-drift

The current Explore has no Change 3–5 implementation drift, no D05, no self-hosting takeover, and no production mutation.

The two findings are contract-convergence issues inside Change 2 only.

Next legal boundary:

```text
revise-explore
```

STOP.
