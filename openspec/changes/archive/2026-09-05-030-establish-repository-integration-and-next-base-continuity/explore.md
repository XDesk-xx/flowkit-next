# Explore — establish-repository-integration-and-next-base-continuity

## 1. Owner goal and exact boundary

The final D04 Change must connect an already-finalized exact Delivery state to accepted Git history and the next exact base without giving Flowkit implicit Git authority or creating a second promotion/repository lifecycle.

This Explore answers one question:

> What is the smallest reusable repository-integration contract that can consume exact Delivery Final continuity, require explicit exact Owner Git authorization, produce one ordinary Delivery Final commit, pass through the repository's review/merge path, read exact accepted main, and stop with that accepted main as the next base?

This Explore does **not** execute the real D04 Formal Full Test, Architecture Finalization, Delivery Final, final commit, push, PR, merge, release, or next Delivery.

## 2. Pre-Explore continuity and Change 4 drift assessment

Nearest fixed point:

```text
88e376d2ca870b248952477f90adf38409fa679e
chore(delivery): D04 archive checkpoint — Change 4 established & archived
```

Its parent is the Change 3 checkpoint `a170da0373867296813a888c57db8325025a8f5d`.

Pre-activation proof established:

- tracked worktree/index exactly matched `88e376d...`;
- final D04 planning reference SHA-256 is exact `b26217a2ae397772aea7fd96140855b0099a1089e2c2f8c9b2614e50809320a9`;
- Change 1/2/3/4 are `completed` with project ordinals 26/27/28/29;
- zero active Delivery/OpenSpec Changes existed before activation;
- Change 4 final Reviewer result is `approved`, `archiveAllowed=true`, `scopeDriftAssessment=NONE`;
- Change 4 archive is terminal PASS with 21/21 canonical OpenSpec specs and zero active Changes;
- current Change 5 was `planned` and had no assigned ordinal;
- `delivery-repository-integration` remains explicitly fail-closed in `DeliveryOperationPackage` validation;
- `skills/delivery/repository-integration/SKILL.md` does not exist.

Change 4 did modify Architecture Finalization seams, but the archived Proposal/Reviewer evidence bounds those modifications to direct-consumer prerequisite integrity only: defensive trusted-lineage isolation, exact thin-compare admission, and post-materialization candidate continuity. It did not execute real Architecture Finalization or repository integration, did not create Git/next-operation authority, and did not introduce a new Architecture lifecycle/control plane. This is implementation-level convergence required by Delivery Final consumption, not D04 product-goal drift.

Therefore `88e376d...` is a valid Pre-Explore continuity anchor.

## 3. Activation and ordinal

Owner activation is recorded as one exact structural fact:

```text
decision  = activate-change
delivery  = 20260902-04-delivery-continuity-stable-core-closure
change    = establish-repository-integration-and-next-base-continuity
scope     = [explore]
```

Trusted Change coordination resolves the exact Change as `active`; existing Policy independently returns `ready-action: explore` for an active Change with no current Action.

Durable project ordinals before this Change are exactly `26, 27, 28, 29`; first Explore therefore persists `projectOrdinal: 30` once. No planned-only Change reserves an ordinal.

## 4. Existing reusable owners

### 4.1 Delivery Final already provides the semantic finalized-state anchor

Change 4 established `DeliveryFinalizationRecord` containing:

```text
deliveryFinalizationRef
verifiedCandidateRef
fullTestExecutionRef
architectureFinalizationRef
architectureMaterializedCandidateRef
coordinationRef
finalizedCandidateRef
```

The record is re-derivable and content-bound. `finalizedCandidateRef` uses the existing repository candidate algorithm rather than a new integration candidate identity.

The canonical Delivery coordination closure also records:

```text
delivery.state              = completed
delivery.fullTestStatus     = passed
delivery.finalizationStatus = completed
finalization.state          = completed
finalization.gitCheckpoint  = pending-owner-authorized-local-delivery-commit
```

This is exactly the handoff seam Change 5 needs. Repository integration must consume/revalidate it; it must not infer finalization from Run prose or create another finalized-state database.

### 4.2 Git already owns exact history/revision truth

No Flowkit-specific Git truth model is needed. Ordinary Git can provide the exact facts required by integration:

```text
current delivery branch
current pre-integration HEAD
recorded accepted-main/base commit
final commit identity + parent
branch/ref reachability
accepted main HEAD after merge
```

The current D04 checkpoint also proves the accepted base `6bda1e87...` remains an ancestor of the delivery branch.

### 4.3 Existing OwnerAuthorityFact is sufficient

A controlled structural proof shows the existing generic `OwnerAuthorityFact` accepts an exact repository-integration decision such as:

```text
decision = authorize-repository-integration
deliveryId = exact Delivery
changeId = absent
scope = [delivery-repository-integration]
```

No new authority type/class is required.

The new operation-specific recognizer should require this exact decision, exact Delivery, absent `changeId`, and singleton scope. Review approval, Delivery Final authority, checkpoint authorization, verification PASS, or broader Git scope must not be inherited or combined into repository-integration authority.

### 4.4 Delivery Start already proves the bounded Git-callback pattern

`delivery-start` already demonstrates the relevant minimal pattern:

```text
exact operation package
+ explicit bounded Owner authority
+ trusted validation
+ host-supplied Git callback
→ exact commit SHA
→ STOP
```

Change 5 can extend this execution style to repository integration without creating an automatic Git engine. The host/provider performs repository-specific Git/PR mechanics only after exact package + Owner authority admission; Flowkit validates bounded results and resulting Git truth.

## 5. Exact finalized-state availability contract

The operation must prepare only from the exact finalized state, not from a transport artifact or arbitrary caller summary.

Trusted preparation should revalidate at least:

```text
exact Delivery Final terminal record
exact deliveryFinalizationRef re-derivation
exact finalizedCandidateRef == current repository candidate
exact completed Delivery coordination bytes/ref
current branch == recorded Delivery branch
current Git HEAD == exact pre-integration HEAD
recorded accepted-main/base commit exists in history
canonical target main ref is observable at an exact commit
```

The package does not need ZIP/bundle/source-snapshot identities.

Continuity rule remains:

```text
exact required state/history available
→ verify + reuse

missing exact state/history/environment
→ STOP operation preparation
→ restore only missing exact state outside the lifecycle model
→ verify
→ prepare the same operation again
```

No `local`, `detached`, `bundle`, `ZIP`, `shared`, or `remote` Delivery mode is introduced.

## 6. Target-main drift must fail closed, not trigger an automatic rebase/promotion flow

Repository integration is the final Stable Core boundary. It must not silently combine an already-verified/finalized Delivery with unrelated accepted-main mutations.

Minimum safe rule:

- preparation binds the exact accepted-main target commit observed before Git mutation;
- for the D04/reference model, that target must remain compatible with the Delivery's recorded accepted base/expected integration base;
- if target main changes before commit/review/merge admission, STOP and require explicit Owner-controlled correction/re-preparation;
- no automatic rebase, conflict resolver, verification reuse assumption, or promotion lifecycle is created.

This keeps `D04 accepted main` meaningful as the accepted history containing the exact finalized Delivery rather than silently accepting unverified concurrent bytes.

The exact stale-main handling can be narrowed in Proposal, but it must be fail-closed and cannot auto-correct.

## 7. One ordinary Delivery Final commit is provable with normal Git facts

A repository-external controlled Git prototype proved the required topology without any Flowkit Git model:

```text
preIntegrationHead = P
finalized working tree
↓ ordinary commit
finalCommit = F
parent(F) = P
rev-list count(P..F) = 1
working tree clean
↓ push/review/merge
acceptedMain = M
F is ancestor of M
main before merge was exact expected base
```

All checks passed.

Therefore Change 5 can require:

```text
exactly one new Delivery Final commit after the bound pre-integration HEAD
final commit parent == bound pre-integration HEAD
post-commit current product candidate == finalizedCandidateRef
working tree/index satisfy exact post-commit cleanliness requirements
```

The final commit SHA is Git truth. `finalizedCandidateRef` remains the existing product/canonical candidate identity. No second GitCandidate/PromotionCandidate type is needed.

## 8. PR/review/merge belongs to repository mechanics, not a new provider subsystem

The D04 reference requires PR then merge/repository acceptance, but Stable Core does not need to own GitHub/GitLab/provider APIs.

Minimum boundary:

```text
trusted package + exact Owner repository-integration authority
↓
bounded host/provider integration mechanics
  - create the one final commit
  - publish delivery branch
  - use repository's ordinary review/PR path
  - merge only after repository acceptance
↓
trusted Git observation
  - exact final commit exists
  - accepted main ref resolves exactly
  - final commit is contained in accepted main history
  - accepted main content remains compatible with exact finalized candidate
↓
terminal continuity record
```

An opaque PR/review reference may be retained as audit/continuation metadata if required by Proposal, but it is not a new truth authority. Accepted Git history remains the repository acceptance truth.

Do not build:

```text
Git provider abstraction
PR database
review state machine
merge scheduler
promotion controller
repository registry
```

## 9. Accepted-main and next-base continuity

After successful repository acceptance, the operation must read the canonical accepted main HEAD from Git rather than trusting a callback-provided SHA alone.

Terminal facts should minimally bind:

```text
deliveryFinalizationRef
finalizedCandidateRef
preIntegrationHead
finalCommit
acceptedMainCommit
(optional bounded review reference if required)
```

The host must revalidate the exact relationships used by the contract. The exact accepted main commit then becomes:

```text
nextDeliveryBase = acceptedMainCommit
```

This does not create or activate a next Delivery. It only records the exact continuity fact and STOPs.

No release tag/publication is implied.

## 10. Minimum DeliveryOperationPackage extension

The existing operation catalog already contains exact `delivery-repository-integration` and deterministic canonical path:

```text
skills/delivery/repository-integration/SKILL.md
```

Current package validation intentionally returns `false` for that operation, proving Change 5 has not been pre-implemented.

Proposal should add one final closed concrete operation-facts variant. The minimum facts should be derived from trusted current Git + trusted Delivery Final state and should bind only what is necessary to prevent stale/wrong-state integration, approximately:

```text
deliveryFinalizationRef
finalizedCandidateRef
completed coordination identity
preIntegrationHeadCommit
expectedAcceptedMainCommit / target-main fact
exact Delivery branch/main identities required by the repository contract
```

Exact field shape must remain minimal and should reuse existing `DeliveryFinalizationRecord`, candidate-ref, Git commit literal, Delivery identity and Guidance-ref semantics rather than inventing generic repository-state objects.

`ownerAuthority` is exact `authorize-repository-integration`, not inherited Final/Verification/Reviewer/checkpoint authority.

## 11. Canonical Guidance boundary

Change 5 should add:

```text
skills/delivery/repository-integration/SKILL.md
```

The Guidance describes HOW to execute an already-authorized exact integration package:

```text
revalidate exact finalized state/history
reuse exact state if available; restore only missing state if absent
perform bounded final commit + ordinary repository review/merge mechanics through the host
reobserve exact Git truth
record accepted main / next-base continuity
STOP
```

It must not:

- decide whether repository integration should happen;
- create Owner authority;
- select a different Delivery operation;
- auto-rebase/correct/reverify product bytes;
- auto-start the next Delivery;
- tag/publish a release;
- require a transport artifact when state already exists.

## 12. Proof evidence

### Repository continuity

```text
HEAD                            88e376d2ca870b248952477f90adf38409fa679e
parent                          a170da0373867296813a888c57db8325025a8f5d
reference SHA-256               b26217a2ae397772aea7fd96140855b0099a1089e2c2f8c9b2614e50809320a9
active OpenSpec before activation 0
Change 1..4                    completed
ordinals                       26,27,28,29 unique
Change 5 before activation     planned / no ordinal
```

### Change 4 independent acceptance facts

Final Reviewer:

```text
verdict              approved
archiveAllowed       true
scopeDriftAssessment NONE
```

Archive:

```text
21/21 canonical OpenSpec PASS
229/229 Linux domain PASS
5/5 acceptance PASS
real D04 Full Test              NOT RUN
real D04 Architecture Finalization NOT PERFORMED
real D04 Delivery Final         NOT PERFORMED
repository integration          NOT PERFORMED
```

### Current focused product contracts

Exact Node 22.23.2 focused run:

```text
33/33 PASS
```

covering Delivery Final, DeliveryOperationPackage, Policy and trusted Change coordination.

Canonical OpenSpec specs after activation remain:

```text
21/21 PASS
```

The active Change itself fails strict validation only because Proposal deltas do not exist yet, which is the expected pre-Proposal Explore state.

### Static absence proof

```text
delivery-repository-integration package validation → false
canonical repository-integration Guidance file       → absent
```

### Git topology prototype

```text
final commit parent matched pre-integration HEAD → PASS
exactly one final commit                         → PASS
clean after final commit                         → PASS
final commit ancestor of accepted main           → PASS
merge first-parent target was expected main      → PASS
```

### Authority structural proof

Existing `OwnerAuthorityFact` accepts exact `authorize-repository-integration` + singleton `delivery-repository-integration` scope → PASS.

## 13. Proposal-ready invariants

1. `delivery-repository-integration` remains the fifth and final bounded Delivery operation variant; no sixth operation or D05 is created.
2. Package formation consumes trusted Delivery Final continuity and trusted current Git facts, not arbitrary caller summaries.
3. Existing `finalizedCandidateRef` remains product/canonical candidate identity; exact Git commit SHAs remain repository/history identity.
4. Repository integration requires one exact operation-specific Owner Git authority; no inherited Reviewer/Verification/Final/checkpoint authority.
5. Exact required state is reused when present; missing state is restored outside lifecycle semantics and then revalidated.
6. Exactly one ordinary Delivery Final commit is formed from the exact finalized state, with exact pre-integration parent/cleanliness/candidate checks.
7. PR/review/merge mechanics remain bounded external repository mechanics; Flowkit does not become a provider/PR subsystem.
8. Accepted main is re-read from Git after repository acceptance and must contain the exact final commit/finalized state according to the approved contract.
9. Accepted main HEAD is recorded as exact next-base continuity and the operation STOPs.
10. No automatic rebase/correction, commit/push/merge without exact authority, release publication, next Delivery activation, Registry/Router/Planner/Promotion lifecycle, or mandatory transport is introduced.

## 14. Minimum Proposal direction

Proposal should implement only:

```text
closed delivery-repository-integration operation facts/package variant
+ exact repository-integration Owner authority recognizer
+ bounded preparation/execution/terminal continuity seam
+ canonical skills/delivery/repository-integration/SKILL.md
+ focused Git-state/topology/authority/state-continuity tests
```

It should reuse:

```text
DeliveryFinalizationRecord
existing candidate algorithm
existing DeliveryOperationPackage / GuidanceRef pattern
OwnerAuthorityFact
ordinary Git commit/ref/history facts
Delivery Start bounded Git-callback precedent
```

It should not create generic Git/repository infrastructure beyond the narrow operation-local seams required for these invariants.

## 15. Explore conclusion

```text
PASS
```

Change 5 is bounded and Proposal-ready after Reviewer approval.

No new control plane is required. The final Stable Core closure can remain:

```text
exact finalized state
+ exact Git state
+ exact Owner repository-integration authority
+ content-bound repository-integration Guidance
→ bounded host integration
→ accepted main exact SHA
→ next-base continuity
→ STOP
```
