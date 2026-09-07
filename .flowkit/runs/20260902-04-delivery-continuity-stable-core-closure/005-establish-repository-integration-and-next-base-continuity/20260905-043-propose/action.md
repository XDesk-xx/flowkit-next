# Action — Propose

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: establish-repository-integration-and-next-base-continuity
role: author
action: propose
base: 88e376d2ca870b248952477f90adf38409fa679e
projectOrdinal: 030
changeStartSequence: 005
run: 20260905-043-propose
physicalRunGroup: 005
input: 20260905-042-review-explore
```

Reviewer `042-review-explore` verdict is `APPROVED` with `proposalAllowed=true` and `nextBoundary=propose`.

Proposal freezes only the approved final Change 5 boundary:

```text
trusted DeliveryFinalizationRecord / finalizedCandidateRef
+ exact preIntegrationHead / delivery branch
+ targetMainRef + targetMainPreIntegrationCommit
+ exact singleton authorize-repository-integration Owner authority
+ content-bound repository-integration Guidance
↓
one ordinary Delivery Final commit
↓
provider-external ordinary review / merge mechanics
↓
trusted Git re-observation of acceptedMainCommit
↓
nextDeliveryBase = acceptedMainCommit
↓
STOP
```

Reviewer naming precision is frozen explicitly: `targetMainPreIntegrationCommit` is package/preparation input; `acceptedMainCommit` is terminal Git observation only and is never predeclared as an expected SHA.

No Git provider/PR database, Promotion lifecycle, automatic rebase/correction, new candidate identity, release workflow, automatic next Delivery, D05, mandatory transport, or self-hosting takeover enters Proposal.

STOP at `review-propose`.
