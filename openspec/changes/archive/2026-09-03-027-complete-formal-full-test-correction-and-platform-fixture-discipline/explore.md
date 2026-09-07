# Explore — Formal Full Test correction and platform-fixture discipline

## Status

```text
PASS
→ Proposal-ready after independent re-review-explore
```

This revised Explore is proof-only. It resolves only reviewer findings `D04-R002-001` and `D04-R002-002`. It does not implement `delivery-full-test`, create Proposal artifacts, modify production code, reopen Change 1, or pull Change 3–5 forward.

## Real product problem

D04 Change 1 already established the reusable exact Delivery-operation execution envelope and content-bound canonical Delivery Guidance.

Change 2 must add the concrete `delivery-full-test` operation while preserving two distinct layers:

```text
generic Stable Core product contract
→ execute the exact project-local Formal Full Test contract already supplied for this Delivery
→ bind result/evidence to the exact candidate and exact material check identities
→ apply same-candidate vs new-candidate correction discipline
→ preserve explicit Owner authority and STOP boundaries
```

```text
flowkit-next D04 self-development fixture
→ currently uses its accepted six-gate repository-local Full Test sequence
→ serves as proof input for this repository only
→ is not universal product command identity
```

The product `skills/delivery/full-test/SKILL.md` MUST NOT hard-code flowkit-next package scripts as the command plan for unrelated managed repositories.

## Pre-Explore continuity proof remains accepted

The nearest repository fixed point is:

```text
d4858d461bd5a08413b8581490e75497f4027efe
```

It is a clean checkpoint whose parent is the D04 Delivery Start fixed point:

```text
eaa1c8f1cf9a52e05b75c3d1133f7aff8449c215
```

That checkpoint contains the complete accepted Change 1 archive closure:

```text
Change 1 coordination state = completed
projectOrdinal = 026
archive path exists
canonical delivery-operation-execution-and-start-continuity spec exists
001–007 Run chain exists
skills/delivery/start exists
Change 2 remained planned before activation
active OpenSpec Changes = 0 before activation
working tree = clean
```

No unexplained repository drift was found before Change 2 activation.

## Accepted correction semantics remain frozen

### Exact repository candidate identity

`deriveApplicableCheckCandidateRef` already derives a content-bound candidate from Git-visible repository state.

Existing accepted proof shows:

- source-byte mutation changes `candidateRef`;
- Git-visible executable-mode mutation changes `candidateRef`;
- symlink-target mutation changes `candidateRef`;
- tracked deletion changes `candidateRef`;
- ignored untracked material and `.flowkit/runs/**` do not self-invalidate the candidate;
- unsupported Git-visible path kinds fail closed.

Decision:

> Change 2 reuses this candidate identity. It does not create a Full Test candidate family, candidate DB, or invalidation subsystem.

### Exact material check identity

The existing applicable-check seam already models project-supplied executable checks using:

```text
checkId
program
ordered args
configRefs
toolRefs
environmentRefs
```

Each declaration derives an exact `checkRef`.

This is the right reusable identity vocabulary for a project-local Formal Full Test plan.

Decision:

> `delivery-full-test` binds the exact project-local check declarations/checkRefs supplied for the current Delivery. It does not discover commands, scan package scripts, or use a Full Test Registry/Planner.

The product contract needs no universal command catalog.

### Result admission

Applicable-check admission already re-derives the current repository candidate and rejects candidate/fact-set mismatch.

Decision:

> Repository/canonical mutation naturally makes prior evidence inapplicable to the new candidate. No explicit candidate invalidation command is required.

### Environment/config/tool correction

Material environment, config, tool, program, or argv identity changes alter the exact check identity.

Therefore:

```text
same candidate
+
changed material check/environment identity
→ stale affected PASS is not reusable
→ affected verification executes again
```

No repository candidate mutation is required merely because external verification mechanics changed.

## Reviewer finding D04-R002-001 — generic Full Test plan binding

The previous Explore incorrectly promoted flowkit-next's literal six-gate sequence into canonical product Delivery Guidance.

That conclusion is removed.

### Generic product contract

The already-defined project-local Formal Full Test contract is supplied to the `delivery-full-test` execution boundary as an exact ordered set of project-local check declarations.

The smallest reusable representation is the existing applicable-check declaration/check identity vocabulary.

Proposal direction:

```text
DeliveryFullTestOperationFacts
→ exact candidateRef
→ exact ordered project-local Formal Full Test checks
   - each check uses existing ApplicableCheckDeclaration semantics
   - each check is resolved/content-bound by existing checkRef semantics
```

No new `FullTestPlanId` or Full Test Registry is justified.

The package itself carries the exact ordered checks; order is part of the concrete Full Test contract for that Delivery.

Implementation may factor the existing check declaration/ref validation into a reusable domain helper, but MUST NOT fabricate an ActionPackage merely to reuse the Action-specific applicable-check execution envelope.

### flowkit-next local fixture

For this repository only, the current project-local Formal Full Test contract remains:

```text
pnpm typecheck
pnpm format:check
pnpm build
pnpm test:domain
exact managed OpenSpec 1.10.0 validate --all --strict
pnpm test:acceptance
```

Those six gates are D04 proof fixture / repository-local verification policy.

They are not canonical Stable Core command identity.

An external managed project may supply a different exact ordered Full Test check set while using the same product `delivery-full-test` HOW.

### Product Guidance responsibility

Canonical:

```text
skills/delivery/full-test/SKILL.md
```

owns only generic HOW:

```text
verify exact package/candidate/authority/Guidance
↓
execute the package-bound project-local Formal Full Test checks exactly
↓
admit only evidence for the current candidate/current check identities
↓
pure environment/fixture correction:
  same candidate may rerun affected checks
↓
repository/canonical correction required:
  STOP
  leave Full Test authority
  normal Owner-controlled correction/revise flow
  new candidate
  restart Formal Full Test
↓
STOP at Formal Full Test result boundary
```

It MUST NOT select the project-local command plan.

## Reviewer finding D04-R002-002 — exact authority source

The exact `delivery-full-test` operation is not legal merely because an arbitrary caller selected it.

Accepted historical D01/D02/D03 evidence consistently requires explicit Owner authorization of the exact Formal Full Test candidate/boundary before independent Verification executes.

Change 2 preserves that authority contract.

### Exact authority shape

Reuse the existing generic `OwnerAuthorityFact`; do not create another authority type/state machine.

The operation-specific validator should require:

```text
authority source/type:
OwnerAuthorityFact

decision:
authorize-formal-full-test

deliveryId:
exact current Delivery

changeId:
absent

scope:
exactly ["delivery-full-test"]
```

This authority proves only:

> the already-decided Formal Full Test operation may execute for this exact Delivery.

It does NOT authorize:

```text
repository/canonical correction
Change activation/mutation
Git mutation
checkpoint/commit/push/merge
Architecture Finalization
Delivery Final
next Delivery operation
```

If repository/canonical correction is required, the Full Test operation MUST STOP and a separately authorized normal correction/revise flow must occur.

### Why this is not a new control plane

`OwnerAuthorityFact` already exists as the shared exact authority structure.

Adding one exact Delivery-operation decision/scope validator:

```text
authorize-formal-full-test
+
scope ["delivery-full-test"]
```

does not create a Delivery authority lifecycle or Registry. It is only a fail-closed recognizer for the authority already required by historical Full Test semantics.

## Same-candidate correction semantics

A Full Test attempt is bound to one exact candidate and one exact project-local check set.

Healthy same-candidate path:

```text
Owner authorizes Formal Full Test for Delivery
↓
prepare delivery-full-test package(candidate A, exact project-local checks)
↓
execute exact checks
↓
environment / fixture / command-setup mechanics fail
↓
repository/canonical candidate still A
↓
correct only external mechanics
↓
material check identity changes where applicable
↓
rerun affected verification for candidate A
```

Prior PASS is reusable only where both candidate identity and exact material check identity still match.

## New-candidate correction semantics

If correction requires Git-visible repository/canonical mutation:

```text
candidate A
↓
STOP current Formal Full Test
↓
separate Owner-controlled normal correction/revise authority
↓
repository/canonical mutation
↓
candidate B != candidate A
↓
prior A evidence cannot prove B
↓
new exact Owner Full Test authorization/boundary as required
↓
new delivery-full-test package for B
↓
restart Formal Full Test
```

No special candidate invalidation operation is needed.

## Platform-fixture discipline

The open Memo `future-full-test-correction-and-platform-fixture-discipline` remains valid proof input:

```text
semantic obligation
≠ identical operating-system fixture mechanics
```

Example already observed:

```text
semantic obligation:
unreadable canonical Guidance must fail closed

Linux:
permission denial fixture may prove it directly

native Windows:
POSIX chmod(000) may not reproduce identical unreadability semantics
```

Therefore platform-specific fixture mechanics may differ, but the semantic proof obligation may not be weakened.

If only external fixture mechanics change, candidate may remain exact and affected checks rerun.

If repository/canonical test bytes must change, STOP into normal correction flow and create a new candidate.

Historical D03 archives are not rewritten.

## Proof executed / reused

Reviewer independently reproduced the existing relevant seams on exact checkpoint `d4858d46...`:

```text
action-guidance-execution
applicable-check-execution
author-action-guidance
delivery-operation-execution
delivery-start-execution
managed-tool-resolution

69 / 69 PASS
0 skipped
```

Canonical OpenSpec:

```text
18 / 18 strict PASS
```

Active Change strict validation remains expected pre-Proposal failure only because no spec delta exists yet.

Additional source-level convergence for this revision:

```text
ApplicableCheckDeclaration
→ already project-supplied, command/tool/config/environment exact

deriveApplicableCheckRef
→ already content-binds each concrete check

OwnerAuthorityFact
→ already generic exact authority structure

DeliveryOperationPackage.ownerAuthority
→ already owns exact Delivery authority carriage

delivery-full-test concrete package variant
→ currently absent, so Proposal can add it without changing Change 1 behavior
```

No production code was changed during revise-explore.

## Required Proposal invariants

1. Extend the existing `DeliveryOperationPackage` model with exactly one `delivery-full-test` concrete variant.
2. Reuse existing Git-visible `candidateRef`; do not create a Full Test candidate identity subsystem.
3. Bind the exact ordered project-local Formal Full Test checks using existing applicable-check declaration/checkRef semantics; do not hard-code flowkit-next's six commands into generic product Guidance.
4. Preserve flowkit-next's six-gate sequence only as this repository's D04 proof fixture/project-local plan.
5. Add canonical `skills/delivery/full-test/SKILL.md` owning generic execution/correction/STOP HOW, not project command selection.
6. Require exact Owner authorization through existing `OwnerAuthorityFact` with `decision=authorize-formal-full-test`, exact Delivery identity, no Change identity, and exact singleton scope `["delivery-full-test"]`.
7. Full Test authority MUST NOT imply correction, Change, Git, Architecture Finalization, Delivery Final, or next-operation authority.
8. Bind a Full Test attempt to one exact current candidate before Agent execution and recheck candidate continuity at result/terminal admission.
9. Pure environment/fixture/command-setup correction may continue on the same candidate only when repository/canonical candidate identity remains exact.
10. Material check/environment identity drift forces affected verification to execute again rather than reusing stale PASS.
11. Any repository/canonical mutation ends the current attempt, uses separate normal correction/revise authority, creates a new candidate, and restarts Formal Full Test.
12. Platform fixture mechanics may differ while semantic proof obligations remain identical.

## Explicit non-goals

```text
universal six-gate command catalog
Full Test Registry / Planner / command database
FullTestPlanId identity family
finding database
correction Registry
Evidence Platform
automatic corrective Change
candidate invalidation subsystem
candidate snapshot database
platform lifecycle branch
filesystem abstraction
new Verification lifecycle
Full Test as Standard Action
Skill/Guidance Router
automatic Git/correction authority
historical D03 archive rewrite
Change 3–5 implementation
```

## Proposal-ready boundary

The corrected smallest direction is:

```text
explicit exact Owner authorization
(authorize-formal-full-test, exact Delivery, scope=["delivery-full-test"])
↓
exact current repository candidate
↓
exact ordered project-local Formal Full Test checks
(existing applicable-check declaration/checkRef semantics)
↓
existing DeliveryOperationPackage + delivery-full-test facts variant
↓
content-bound generic skills/delivery/full-test/SKILL.md
↓
Agent executes exactly the package-bound local Full Test contract
↓
Verification evidence remains exact candidate/check-bound
↓
STOP at result or correction boundary
```

Correction remains outside Full Test authority:

```text
same candidate + external mechanics correction
→ rerun affected checks

repository/canonical correction required
→ STOP
→ separate normal Owner-controlled correction/revise flow
→ new candidate
→ restart Full Test
```

No new control plane is justified.
