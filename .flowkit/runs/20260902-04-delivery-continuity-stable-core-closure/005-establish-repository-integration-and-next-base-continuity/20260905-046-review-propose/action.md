# Action — Review Propose

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: establish-repository-integration-and-next-base-continuity
role: reviewer
action: review-propose
projectOrdinal: 030
changeStartSequence: 005
run: 20260905-046-review-propose
physicalRunGroup: 005
input: 20260905-045-revise-propose
```

Verdict: **APPROVED**.

045 resolves the single 044 blocker exactly and does not reopen the already-approved Change 5 architecture.

## D04-R005-001 — RESOLVED

The revised Proposal now freezes terminal accepted-main content continuity as an exact ordinary-Git invariant:

```text
finalCommit
→ already proven candidate-equivalent to finalizedCandidateRef

repository acceptance
↓
acceptedMainCommit = resolve(targetMainRef)
↓
finalCommit is ancestor of acceptedMainCommit
↓
tree(acceptedMainCommit) == tree(finalCommit)
↓
accepted main contains no extra/different product-canonical bytes
↓
nextDeliveryBase = acceptedMainCommit
↓
STOP
```

This closes the lineage gap where ancestry alone could admit concurrent or unrelated bytes into accepted main.

No new accepted-main candidate identity or promotion subsystem is introduced.

## Exact revision scope

043 → 045 changes only:

```text
proposal.md
design.md
repository-integration-and-next-base-continuity/spec.md
tasks.md
PAYLOAD-MANIFEST.json
```

plus the expected 044 Reviewer Run and 045 Revise-Propose Run history.

No production implementation files are changed.

The unchanged delivery-operation delta spec remains untouched.

The revision is therefore precisely scoped to D04-R005-001.

## Accepted prestate/result identity split remains intact

```text
targetMainPreIntegrationCommit
→ package/preparation input only

acceptedMainCommit
→ terminal trusted Git observation only
```

`acceptedMainCommit` is not predeclared in package facts.

## Owner authority remains minimal

The Proposal keeps:

```text
decision = authorize-repository-integration
deliveryId = exact Delivery
changeId = absent
scope = exactly ["delivery-repository-integration"]
```

No new Git-authority type is added.

Authority admission is evaluated together with exact package-bound finalized/Git prestate. Drift invalidates execution and requires fresh trusted preparation/evaluation; it is not silently rebound.

## One-final-commit contract remains exact

```text
preIntegrationHead = P
finalized exact working tree
↓
ordinary commit F
↓
parent(F) = P
rev-list(P..F) = 1
candidate(F) = finalizedCandidateRef
clean poststate
```

Commit identity is re-read from Git and caller/provider supplied SHAs are not truth.

## Provider/review/merge boundary remains external

Branch publication, PR/review and merge mechanics remain bounded repository/provider mechanics.

Terminal admission independently re-reads Git truth:

```text
resolve(targetMainRef)
containment
tree equality
```

No provider callback, PR id, review status or callback-reported accepted-main SHA is truth authority.

## No complexity expansion

045 does not add:

```text
PromotionCandidate
accepted-main candidate subsystem
Git provider abstraction
PR database
promotion lifecycle
merge scheduler
generic Git abstraction
repository snapshot database
automatic rebase/correction
release workflow
automatic next Delivery
D05
```

The required correction is one exact tree-equivalence check using ordinary Git truth.

## Independent Reviewer proof

Payload integrity:

```text
045 payload manifest
→ 25/25 file hashes / byte counts MATCH

045 package SHA-256
→ 5d6bb4395beecf2280ab5ab969d9f861be29c86fe18953f3851901cd8e19a460

input 044 Reviewer package SHA-256
→ edb98f55e425b5f41809e0bb2c13ae03e71c0e6d531f8fe6aad808cb123f041f
→ MATCH

embedded 044 Reviewer action/context/result
→ exact-byte MATCH
```

Exact base continuity:

```text
base
→ 88e376d2ca870b248952477f90adf38409fa679e

parent
→ a170da0373867296813a888c57db8325025a8f5d

embedded bundle SHA-256
→ 43d8ee8639b151cfc7d73f1ae1b73dc2e5bb4b3ce2d73a453cdccbf5832c31e4

production mutation
→ NONE

git diff --check
→ PASS
```

Fresh exact Node 22.23.2 regression:

```text
domain
→ 229/229 PASS
→ 0 skipped
```

Exact managed OpenSpec 1.10.0:

```text
current Change --strict
→ PASS

--all --strict
→ 22/22 PASS
```

Planning hashes:

```text
Explore
→ aa0aff2fa8df8ff039c6f07f801d3a07ec30f31a1249d6c31b9a7494bcb963f6

Proposal
→ 5c72453f6f25c4f8334762ecf7f22f603ee1ca4a73e8c9a979510e17a54d7de3

Design
→ ac269cbbb631971a87b151493a450e75b64ea9278ac88fd6ad0211838670ff47

Tasks
→ 8e81325d583f7515ae46d15208ea9fbf93972466c1833161ca8236d693b97f86

repository-integration spec delta
→ bc8588f9012172f4e97b7f1cd0d798347afd1fbaab12f622953180c228e7d542

delivery-operation delta spec
→ d39b380d9528000d0f0928f22b93682102bbb5dcd70978b68a5f509e4bd423bb
```

## Current-step explanation

This re-review only checks whether the 044 terminal-content blocker is closed tightly enough for Apply.

It is.

The important terminal proof is now fully mechanical:

```text
finalCommit proves finalized candidate
+
acceptedMain tree == finalCommit tree
=
acceptedMain proves same finalized bytes
```

No extra lifecycle or control plane is required.

## Complexity / minimality

```text
revision size
→ one local terminal Git content invariant

new subsystem
→ NONE

new identity family
→ NONE

scope drift
→ NONE
```

## Apply attention

Apply should preserve these exact invariants:

1. `acceptedMainCommit` MUST be resolved from canonical Git ref, never trusted from callback/provider result.
2. `finalCommit` containment MUST be checked.
3. `tree(acceptedMainCommit) == tree(finalCommit)` MUST be checked exactly.
4. `finalCommit` must already have been proven candidate-equivalent to `finalizedCandidateRef`.
5. Tree mismatch MUST STOP; no auto-rebase, correction, verification reuse or concurrent-byte admission.
6. Do not introduce a new accepted-main candidate/promotion subsystem to implement this check.
7. Do not execute real D04 repository integration during Change 5 Apply; use isolated Git fixtures only.

Next legal boundary:

```text
apply
```

STOP.
