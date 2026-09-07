# Delivery Repository Integration

Execute only an already-decided `delivery-repository-integration` operation from its exact, content-bound package.

## Required boundary

Consume the exact Final `requiredEvidence` and the Owner-bound `checkpointOperation`. For `create-new`, verify one ordinary commit with the bound parent/count/clean/v2 content. For `reuse-existing`, verify the authorized exact checkpoint object and clean current state without invoking a new commit callback or requiring a different SHA. In both cases, re-read target prestate, derive the accepted object's shared v2 product projection, and revalidate necessary evidence sources; full-tree equality or generic ancestry is not a substitute for content and acceptance-source proof.

- Revalidate the exact `DeliveryFinalizationRecord`, `finalizedCandidateRef`, current Delivery branch/HEAD, target-main prestate, accepted base and singleton Owner authority before Git mutation.
- Treat package `targetMainPreIntegrationCommit` as pre-integration state only. Never predeclare `acceptedMainCommit`.
- For `create-new`, create exactly one ordinary Delivery Final commit from the exact finalized working tree; re-read its SHA and require exactly one parent equal to the bound prestate. For `reuse-existing`, require the independently authorized checkpoint source and do not require or invoke a commit callback.
- Repository publication, PR/review and merge are ordinary provider/repository mechanics. Provider callback data is audit/mechanics only, never repository truth.
- After repository acceptance, re-read canonical `targetMainRef` from Git and require the trusted acceptance source to bind this exact operation, original target prestate, final commit and accepted commit. Then verify the accepted object's v2 product projection and required evidence.
- Return `acceptedMainCommit` and set `nextDeliveryBase` to that exact commit, then STOP.

## Fail closed

STOP for stale pre-integration HEAD, target-main drift, missing exact state/history or trusted source, multiple-parent create-new commits, unauthorized operation substitution, candidate mismatch, or unbound accepted history.

Do not auto-rebase, resolve conflicts, reuse prior verification for changed bytes, accept concurrent product/canonical bytes, create a promotion/candidate subsystem, publish a release, or activate the next Delivery.
