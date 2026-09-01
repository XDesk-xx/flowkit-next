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

Converge affected Proposal/Design/spec/task claims in place. Replace or remove superseded planning text instead of appending review/revision chronology. Keep historical proof only when it still materially explains the current design, expressed as current rationale; otherwise rely on concise exact Run/finding or cross-artifact references for provenance.

Do not opportunistically redesign, add unrelated improvements, expand compatibility surfaces, or turn wording corrections into new subsystems.

Rerun only planning/OpenSpec proof made relevant by the revision. If the finding proves the approved design itself is insufficient rather than imprecise, STOP and return to the appropriate earlier correction boundary.

## Complexity / scope-drift

Compare revised artifacts with prior Proposal and state whether new capability/content was introduced beyond findings.

## Run / handoff

Keep the three-file Run concise and bind to exact finding IDs, bounded revision outcomes/reasoning required for continuation, and revised planning artifact identities. Do not restate the full Proposal/Design or proof transcript in Run prose.

## Terminal boundary

Stop at `review-propose`. Do not begin Apply/archive/finalization/Git work.

STOP after the revised Proposal Result.
