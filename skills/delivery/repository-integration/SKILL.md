# Delivery Repository Integration

Execute only an already-decided `delivery-repository-integration` operation from its exact, content-bound package.

## Required boundary

- Revalidate the exact `DeliveryFinalizationRecord`, `finalizedCandidateRef`, current Delivery branch/HEAD, target-main prestate, accepted base and singleton Owner authority before Git mutation.
- Treat package `targetMainPreIntegrationCommit` as pre-integration state only. Never predeclare `acceptedMainCommit`.
- Create exactly one ordinary Delivery Final commit from the exact finalized working tree. Re-read its SHA from Git and prove one-commit ancestry plus candidate equivalence.
- Repository publication, PR/review and merge are ordinary provider/repository mechanics. Provider callback data is audit/mechanics only, never repository truth.
- After repository acceptance, re-read canonical `targetMainRef` from Git. Require final-commit containment and exact Git tree equality between accepted main and the final commit.
- Return `acceptedMainCommit` and set `nextDeliveryBase` to that exact commit, then STOP.

## Fail closed

STOP for stale pre-integration HEAD, target-main drift, missing exact state/history, multiple commits, candidate mismatch, accepted-main non-containment or accepted-main tree mismatch.

Do not auto-rebase, resolve conflicts, reuse prior verification for changed bytes, accept concurrent product/canonical bytes, create a promotion/candidate subsystem, publish a release, or activate the next Delivery.
