---
name: revise-explore
description: Resolve exact review-explore findings without reopening unaffected Explore content, then STOP at review-explore.
metadata:
  author: flowkit
---

# Revise Explore Action Guidance

## Authority

Flowkit/Policy has already decided `revise-explore`. This Guidance owns findings-relevant Author mutation only.

## Required inputs

Read the exact Reviewer finding IDs/reasoning, current Explore, prior accepted facts, Owner scope, and exact repository/spec base.

## Revision convergence

For each finding use:

```text
finding
→ affected claim/artifact
→ minimum proof/text correction
→ exact convergence evidence
```

Preserve unaffected correct/approved content. Rerun only proof made relevant by the revision.

Do not redesign unrelated scope, add capability, reopen settled proof, pull forward later Changes, or create speculative infrastructure.

If a finding requires a new Owner scope/authority decision, STOP and surface it.

## Complexity / scope-drift

Explicitly state whether anything beyond findings-relevant content changed.

## Run / handoff

Keep the three-file Run concise and identify exact findings addressed plus updated Explore identity.

## Terminal boundary

Stop at `review-explore`. Do not proceed to Propose/Apply/archive/finalization/Git work.

STOP after the revised Explore Result.
