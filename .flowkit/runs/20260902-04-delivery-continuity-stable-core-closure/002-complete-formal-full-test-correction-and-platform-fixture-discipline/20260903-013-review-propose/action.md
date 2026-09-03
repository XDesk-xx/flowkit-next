# Action — Review Propose

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: complete-formal-full-test-correction-and-platform-fixture-discipline
role: reviewer
action: review-propose
projectOrdinal: 027
changeStartSequence: 002
run: 20260903-013-review-propose
physicalRunGroup: 002
input: 20260903-012-propose
```

Verdict: **APPROVED**.

012 faithfully converts the 010/011-approved revised Explore into a bounded Proposal.

The Proposal freezes the correct generic product boundary:

```text
exact Owner authorization
(authorize-formal-full-test, exact Delivery, no changeId,
 scope exactly ["delivery-full-test"])
↓
trusted current repository candidate
↓
exact ordered project-local Formal Full Test checks
(existing ApplicableCheckDeclaration / checkRef semantics)
↓
existing DeliveryOperationPackage
+ delivery-full-test concrete facts
↓
content-bound generic skills/delivery/full-test/SKILL.md
↓
Agent executes only the package-bound local check contract
↓
exact candidate/check-bound result admission
↓
same-candidate external correction OR new-candidate STOP/restart
↓
STOP
```

The flowkit-next repository's literal six-gate Full Test sequence remains only this repository's D04 proof fixture. It is not promoted into universal Stable Core product Guidance.

The already-decided `delivery-full-test` operation is not selected by an arbitrary caller. It requires the existing exact `OwnerAuthorityFact` boundary:

```text
decision = authorize-formal-full-test
deliveryId = exact current Delivery
changeId = absent
scope = exactly ["delivery-full-test"]
```

That authority does not grant repository/canonical correction, Change mutation, Git mutation, Architecture Finalization, Delivery Final, or next-operation authority.

## Proposal shape

New capability:

```text
formal-full-test-execution-and-correction
```

Modified capability:

```text
delivery-operation-execution-and-start-continuity
→ add only the concrete delivery-full-test facts/authority variant
```

The package remains an execution envelope, not a control plane.

The Proposal explicitly rejects:

```text
FullTestPlanId
Full Test Registry / Planner
command database
dynamic command discovery
finding/correction database
Evidence Platform
candidate invalidation subsystem
new Verification lifecycle
Full Test as Standard Action
fake ActionPackage
automatic correction/Git authority
Change 3–5 implementation
```

## Existing-seam reuse is coherent

The proposed implementation correctly reuses:

```text
ApplicableCheckDeclaration
deriveApplicableCheckRef
deriveApplicableCheckCandidateRef
neutral exact process mechanics
OwnerAuthorityFact
DeliveryOperationPackage
```

while preserving two important asymmetries:

1. Full Test check order is part of the exact project-local contract and must not inherit the Action applicable-check canonical-sort behavior.
2. Delivery Full Test must not fabricate an `ActionPackage` merely to reuse Action-specific execution plumbing.

The proposed small execution/result correlation identity is acceptable only as a bounded content-derived execution/admission ref. It must not evolve into a Registry, durable evidence database, new candidate identity family, or lifecycle identity.

## Correction semantics

The Proposal correctly freezes:

```text
repository/canonical Git-visible mutation
→ current candidate changes
→ current Full Test attempt STOP
→ separate Owner-controlled correction/revise flow
→ new candidate
→ old evidence cannot prove new candidate
→ new exact Full Test boundary/package

pure environment / fixture / command-setup correction
→ repository candidate may remain exact
→ material checkRef drift invalidates only affected stale PASS
→ rerun affected checks
→ unaffected exact candidate+checkRef PASS may remain reusable
```

Platform mechanics may differ, but the semantic proof obligation may not be skipped or weakened.

## Independent Reviewer proof

Payload integrity:

```text
012 payload manifest
→ 25/25 file hashes / byte counts MATCH

011 Reviewer package SHA
→ MATCH

011 Reviewer Run files embedded in 012
→ exact-byte preserved

approved revised Explore SHA
→ MATCH

proposal / design / tasks / both spec-delta hashes
→ MATCH
```

Exact repository continuity:

```text
base checkpoint
→ d4858d461bd5a08413b8581490e75497f4027efe

parent
→ eaa1c8f1cf9a52e05b75c3d1133f7aff8449c215

base checkout before overlay
→ CLEAN

Proposal overlay production mutation
→ NONE

git diff --check
→ PASS
```

OpenSpec:

```text
planning artifacts
→ 4/4 COMPLETE

current Change --strict
→ PASS

--all --strict
→ 19/19 PASS
```

Existing domain regression proof on exact Node 22.23.2 with the unchanged restored dependency snapshot:

```text
196/196 PASS
0 skipped
```

No package-manager install/relink was required.

## Current-step explanation

`review-propose` asks whether the approved revised Explore has become a precise, testable implementation contract without reintroducing the two rejected couplings:

```text
flowkit-next-local commands as universal product HOW
arbitrary caller authority for delivery-full-test
```

Both remain correctly resolved.

## Complexity / minimality

The plan adds only:

```text
one concrete delivery-full-test facts variant
+
one exact Owner-authority recognizer
+
one ordered project-local check resolver/executor seam
+
compact exact execution/result admission identity
+
one generic canonical Full Test Guidance
```

It reuses existing candidate/check/authority/package mechanics and adds no new control plane.

## New-content / scope-drift

```text
Full Test Registry / Planner       NONE
command catalog                    NONE
new authority lifecycle            NONE
new candidate subsystem            NONE
Standard Action lifecycle changes  NONE
Change 3–5 concrete implementation NONE
D05                                NONE
self-hosting takeover              NONE
scope drift                        NONE
```

## Apply attention

1. Keep `orderedChecks` closed and exact; preserve caller-supplied Full Test order while rejecting duplicate ids/refs and mismatched declarations.
2. Keep the exact Owner Full Test recognizer singleton-scoped; do not accept broader scope through `includes`.
3. If extracting neutral process/check helpers, preserve accepted Action applicable-check public behavior and ordering exactly.
4. Keep any `fullTestExecutionRef`/package-ref helper purely content-derived and bounded to execution/admission; do not create a durable evidence/candidate subsystem.
5. Generic `skills/delivery/full-test/SKILL.md` must not hard-code flowkit-next's six repository-local commands.
6. Candidate drift must STOP before any repository mutation; correction remains outside Full Test authority.
7. Do not implement Architecture Finalization, Delivery Final, or Repository Integration concrete facts/HOW in this Change.

Next legal boundary:

```text
apply
```

STOP.
