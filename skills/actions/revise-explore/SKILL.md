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

Converge the affected canonical Explore in place by default:

```text
exact finding
→ locate affected current claim
→ replace/remove superseded text
→ preserve unaffected current truth
→ keep a counterexample/failed proof only when it still explains the current invariant
→ rewrite that material as current rationale, not a revision diary
```

Do not append `Reviewer correction`, `Owner correction`, or finding-history sections merely to narrate how the current conclusion was reached. When historical provenance is useful, use a concise exact Run/finding reference instead of duplicating the chronology.

Do not redesign unrelated scope, add capability, reopen settled proof, pull forward later Changes, or create speculative infrastructure.

If a finding requires a new Owner scope/authority decision, STOP and surface it.

## Complexity / scope-drift

Explicitly state whether anything beyond findings-relevant content changed.

## Run / handoff

Keep the three-file Run concise and identify the exact findings addressed, bounded reasoning/revision outcome needed for continuation, and updated Explore identity. Do not copy the full Explore/proof transcript into Run prose.

## Terminal boundary

Stop at `review-explore`. Do not proceed to Propose/Apply/archive/finalization/Git work.

STOP after the revised Explore Result.
