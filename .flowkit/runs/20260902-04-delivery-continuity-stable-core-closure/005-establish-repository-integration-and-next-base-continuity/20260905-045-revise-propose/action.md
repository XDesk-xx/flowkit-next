# Action — Revise Propose

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: establish-repository-integration-and-next-base-continuity
role: author
action: revise-propose
base: 88e376d2ca870b248952477f90adf38409fa679e
projectOrdinal: 030
changeStartSequence: 005
run: 20260905-045-revise-propose
physicalRunGroup: 005
input: 20260905-044-review-propose
```

Reviewer `044-review-propose` verdict is `REVISE — MINOR / BOUNDED` with one blocker: `D04-R005-001`.

The revision freezes one exact terminal accepted-main content invariant and changes nothing else:

```text
finalCommit F
→ already proven candidate-equivalent to finalizedCandidateRef

repository acceptance
→ acceptedMainCommit = resolve(targetMainRef)
→ finalCommit is ancestor of acceptedMainCommit
→ tree(acceptedMainCommit) == tree(finalCommit)
→ acceptedMain contains no additional/different product or canonical bytes
→ nextDeliveryBase = acceptedMainCommit
→ STOP
```

Any accepted-main tree mismatch now fails closed and requires fresh Owner-controlled re-preparation/correction/verification as applicable. The operation does not auto-rebase, auto-reverify, or silently admit concurrent bytes.

No PromotionCandidate, accepted-main candidate subsystem, provider model, merge policy engine, generic Git abstraction, automatic release, automatic next Delivery, or D05 is introduced.

STOP at `review-propose`.
