# Action — Review Propose

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: establish-repository-integration-and-next-base-continuity
role: reviewer
action: review-propose
projectOrdinal: 030
changeStartSequence: 005
run: 20260905-044-review-propose
physicalRunGroup: 005
input: 20260905-043-propose
```

Verdict: **REVISE — MINOR / BOUNDED**.

043 correctly converges almost all 042 Explore requirements:

```text
targetMainPreIntegrationCommit
→ package/preparation input only

acceptedMainCommit
→ terminal Git observation only

repository-integration Owner authority
→ exact singleton operation authority

one final commit
→ ordinary Git truth

provider callback / PR metadata
→ mechanics/audit only, never truth

nextDeliveryBase
→ exact acceptedMainCommit

terminal
→ STOP
```

It also correctly rejects Git provider/PR database/promotion lifecycle/new candidate identity/automatic rebase/release/next-Delivery/D05.

One terminal fail-closed invariant remains under-specified before Apply.

## Finding D04-R005-001 — accepted-main content continuity is not mechanically exact

Blocking, but local.

The Proposal requires:

```text
finalCommit is contained in acceptedMain history
+
accepted-main content satisfies the exact finalized-state relationship
```

but the normative spec/design/tasks do not define that content relationship as an exact mechanically testable condition.

That leaves an implementation hole:

```text
finalizedCandidateRef = C
↓
one final commit F is proven to represent C
↓
repository acceptance creates M
↓
F is ancestor of M

but M also contains unrelated/concurrent product bytes X
that were never covered by:
  Formal Full Test
  Architecture Finalization
  Delivery Final
↓
ancestry succeeds
↓
vague "content continuity" could be implemented too weakly
↓
M becomes nextDeliveryBase
```

That would violate the Change 5 goal:

> connect the **exact Delivery Final candidate** to accepted Git history and the next exact base.

### Required revise-propose convergence

Freeze one exact terminal content invariant using existing Git/candidate truth only.

Preferred minimal form:

```text
post-commit:
candidate(finalCommit tree) = finalizedCandidateRef
(already proposed)

post-acceptance:
acceptedMainCommit = resolve(targetMainRef)
finalCommit is ancestor of acceptedMainCommit
AND
tree(acceptedMainCommit) == tree(finalCommit)
```

Equivalent acceptable form:

```text
derive candidate from acceptedMainCommit exact tree
→ require == finalizedCandidateRef
```

The important invariant is:

> `acceptedMainCommit` MUST NOT contain product/canonical bytes beyond the exact finalized candidate that was already proven before repository integration.

Ordinary Git tree comparison is sufficient. Do NOT create:

```text
PromotionCandidate
accepted-main candidate subsystem
repository snapshot database
provider state model
merge policy engine
generic Git abstraction
```

If exact accepted-main bytes differ from the finalized candidate:

```text
STOP
→ fresh Owner-controlled re-preparation/correction/verification as applicable
```

Do not silently accept the bytes and do not auto-rebase/reverify.

### Keep the existing target-main drift rule

Do not reopen 042's approved boundary:

```text
targetMainPreIntegrationCommit
→ exact prestate

target-main/pre-integration drift before approved integration
→ STOP
→ fresh preparation/authority evaluation
```

The revision only makes terminal accepted-main content admission exact.

## Proposal portions accepted without revision

### 1. Prestate/result identity split

Correct and now normative:

```text
targetMainPreIntegrationCommit
→ package only

acceptedMainCommit
→ terminal only
```

No predeclared accepted-main SHA is allowed.

### 2. Owner authority

Correct reusable shape:

```text
decision = authorize-repository-integration
deliveryId = exact Delivery
changeId = absent
scope = exactly ["delivery-repository-integration"]
```

No new authority type is required.

The authority is operation authority; package/current Git/finalized facts provide the exact execution prestate. Drift invalidates the executable package and requires fresh trusted evaluation rather than silent rebinding.

### 3. One final commit

Correct:

```text
parent(finalCommit) = preIntegrationHead
rev-list(preIntegrationHead..finalCommit) = 1
post-commit candidate = finalizedCandidateRef
clean poststate
```

Caller/provider-supplied commit SHA is not truth.

### 4. Provider-external mechanics

Correct:

```text
branch publication / PR / review / merge
→ bounded repository mechanics

Flowkit terminal
→ re-observe Git truth
```

No provider control plane is justified.

### 5. Next-base STOP

Correct:

```text
acceptedMainCommit
→ nextDeliveryBase
→ STOP
```

No tag/release, next Delivery activation, D05, or next-operation selection.

### 6. State-first continuity

Correct:

```text
exact state exists
→ verify/reuse

missing state
→ STOP
→ restore smallest missing state externally
→ same operation preparation
```

No local/detached/bundle/ZIP lifecycle mode.

## Independent Reviewer proof

Payload / chain:

```text
043 payload manifest
→ 19/19 file hashes / byte counts MATCH

043 package SHA-256
→ 8e631b7f71f416f43d4f22e6ec741fc794b6e47a021b7e3e961b506881ab752e

input 042 Reviewer package SHA-256
→ 9c2bb54d713891b4c83cd4ec13897436632d28f42757a72331f0a53a91d4b39d
→ MATCH

embedded 042 Reviewer action/context/result
→ exact-byte MATCH
```

Exact repository continuity:

```text
base
→ 88e376d2ca870b248952477f90adf38409fa679e

parent
→ a170da0373867296813a888c57db8325025a8f5d

bundle
→ complete history

base checkout before overlay
→ CLEAN

production implementation mutation
→ NONE

git diff --check
→ PASS
```

Fresh exact Node 22.23.2 regression on unchanged dependency snapshot:

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
→ cbff8e377301b643515a96f67077194671f32561406acc082c6c547c002702f1

Design
→ c61a5724c8dc53eeb185b56444d289593ed4d6cdfcacd81a2fc36eb5a21866a9

Tasks
→ 94a6f6e4ac181a264bd9e3a8eea83b734d8d43cc872ace1ad6780d9faa56e768

repository-integration spec delta
→ 8af990c0eacb6c2724f0c451b55ea45ab0744c1d8087027a3570cd1ca04dca52

delivery-operation delta spec
→ d39b380d9528000d0f0928f22b93682102bbb5dcd70978b68a5f509e4bd423bb
```

## Current-step explanation

This `review-propose` is not reopening the overall Change 5 design.

It is checking whether Proposal has frozen enough exact Git/candidate facts that Apply cannot accidentally choose a weaker terminal rule.

Almost everything is already correct.

The single missing precision is:

```text
accepted main contains finalCommit
```

is not sufficient by itself.

The terminal must also prove:

```text
accepted main exact product/canonical bytes
=
already-finalized exact candidate bytes
```

That closes the final lineage gap without introducing any new lifecycle or Git platform.

## Complexity / minimality

Current Proposal:

```text
overall
→ MINIMAL / COHERENT

required revision
→ one exact terminal tree/candidate equality invariant only

new control plane
→ NONE

new identity subsystem
→ NONE
```

## New-content / scope-drift

```text
Git provider abstraction
→ NONE

PR database / promotion lifecycle
→ NONE

new candidate identity
→ NONE

automatic rebase/correction
→ NONE

release workflow
→ NONE

automatic next Delivery
→ NONE

D05
→ NONE

self-hosting takeover
→ NONE

scope drift
→ NONE
```

Next legal boundary:

```text
revise-propose
```

STOP.
