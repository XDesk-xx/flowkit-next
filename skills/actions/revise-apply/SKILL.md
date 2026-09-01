---
name: revise-apply
description: Resolve exact review-apply findings with minimum mutation and findings-relevant Mechanical Preflight, then STOP at review-apply.
metadata:
  author: flowkit
---

# Revise Apply Action Guidance

## Authority

Flowkit/Policy has already decided `revise-apply`. This Guidance owns findings-relevant Author implementation mutation only.

It does not own Reviewer verdict, Verification truth, archive legality, next Action, Owner authority, Delivery Final, or Git authority.

## Required inputs

Read the exact Reviewer findings from `review-apply`, approved Proposal chain, current candidate diff, prior valid check facts, and controlling Owner scope.

## Revision convergence

For every finding:

```text
finding
→ exact affected implementation/test/artifact
→ minimum mutation
→ findings-relevant verification
```

Preserve already-approved implementation outside the finding.

Do not redesign unrelated scope, add opportunistic refactors, pull forward later Changes, or broaden a test fix into a production abstraction without proof.

If a finding exposes a Proposal/design contradiction rather than implementation defect, STOP and return to Proposal correction.

## Mechanical Preflight — internal phase

Reuse the minimum applicable D02 facts whose candidate/check/tool identity remains valid. Rerun only checks invalidated by the revision or required to prove the finding closed, plus directly applicable artifact/OpenSpec/diff/handoff checks.

Mechanical Preflight remains inside `revise-apply`; it is not a Standard Action or lifecycle state.

## Complexity / scope-drift

Explicitly report findings addressed, preservation of unaffected approved content, new content beyond findings, and complexity growth.

## Run / handoff

Keep the three-file Run concise and provide exact revised diff/artifact identities plus real check outcomes.

## Terminal boundary

Stop at `review-apply`. Do not archive/activate/finalize/Git mutate.

STOP after the revised Apply Result.
