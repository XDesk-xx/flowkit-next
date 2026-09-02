---
name: propose
description: Execute the already-decided Flowkit propose Action by converging approved Explore into the minimum complete OpenSpec planning contract, then STOP at review-propose.
metadata:
  author: flowkit
---

# Propose Action Guidance

## Authority

Flowkit/Policy has already decided the exact current Action `propose`.
This Guidance owns HOW only. It does not decide lifecycle legality, Reviewer verdict, Apply permission, next Action, Owner authority, Verification truth, Delivery Final, or Git authority.

## Required inputs

Read the exact approved Explore and approving review, current OpenSpec Change status/instructions, and controlling Owner scope.

Use `skills/tools/openspec/SKILL.md` for subordinate OpenSpec mechanics. Do not recreate a second OpenSpec manual.

## Proposal convergence

1. Preserve approved Explore boundaries unless fresh evidence materially invalidates them.
2. Produce the minimum complete planning artifacts required by the current OpenSpec schema, normally proposal/design/delta specs/tasks.
3. Trace material requirements/tasks back to approved Explore.
4. Formalize intentionally deferred detail without silently adding capability, authority, lifecycle state, compatibility surface, control plane, or later-Change scope.
5. Keep implementation out of Propose.

## Planning artifact convergence

Keep each canonical planning artifact limited to its current responsibility:

```text
proposal.md → current scope / capability delta
design.md   → current implementation-relevant decisions / trade-offs / rationale
tasks.md    → current implementation checklist
```

Do not copy the approved Explore proof transcript or review/revision chronology into Proposal/Design merely for auditability. Preserve rationale still needed to understand the current design and prefer concise exact cross-artifact or Run/finding references when deeper provenance is material.

File size and line count are diagnostic signals only, not correctness Gates.

## Complexity / scope-drift check

Explicitly report complexity growth, new content beyond approved Explore, and scope drift. If a genuinely new independently specifiable capability appears, surface it rather than hiding it inside tasks.

## Run / handoff

Keep the three-file Run concise and bind the handoff to exact planning artifact identities when material.

## Terminal boundary

Successful Propose stops at:

```text
review-propose
```

Do not begin Apply, archive, next-Change activation, Delivery finalization, or Git mutation.

STOP after the real Propose Result is materialized.
