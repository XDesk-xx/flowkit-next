---
name: revise-propose
description: Resolve exact review-propose findings while preserving approved Explore and unaffected Proposal content, then STOP at review-propose.
metadata:
  author: flowkit
---

# Revise Propose Action Guidance

## Authority

Flowkit/Policy has already decided `revise-propose`. This Guidance owns findings-relevant Author planning mutation only.

## Required inputs

Read exact Reviewer findings, current Proposal/design/spec/tasks, approved Explore/review chain, and unaffected Proposal semantics that must remain stable.

## Revision convergence

Resolve each finding with the smallest formal change that removes the defect.

Preserve approved Explore boundary, unaffected Proposal semantics, non-goals, and accepted capability count.

Do not opportunistically redesign, add unrelated improvements, expand compatibility surfaces, or turn wording corrections into new subsystems.

Rerun only planning/OpenSpec proof made relevant by the revision. If the finding proves the approved design itself is insufficient rather than imprecise, STOP and return to the appropriate earlier correction boundary.

## Complexity / scope-drift

Compare revised artifacts with prior Proposal and state whether new capability/content was introduced beyond findings.

## Run / handoff

Keep the three-file Run concise and bind to exact finding IDs and revised planning artifact identities.

## Terminal boundary

Stop at `review-propose`. Do not begin Apply/archive/finalization/Git work.

STOP after the revised Proposal Result.
