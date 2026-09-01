---
name: apply
description: Execute the already-decided Flowkit apply Action by implementing the exact approved Proposal with minimum mutation, internal Mechanical Preflight, bounded handoff, and STOP at review-apply.
metadata:
  author: flowkit
---

# Apply Action Guidance

## Authority

Flowkit/Policy has already decided the exact current Action `apply`.
This Guidance owns HOW only. It does not decide Reviewer verdict, Verification PASS, next Action, Owner authority, archive legality, Delivery Final, or Git authority.

## Required inputs

Read the exact approved Proposal/design/spec/tasks, latest approving `review-propose`, exact repository candidate/base, controlling Owner scope, applicable existing seams, and explicit non-goals.

Use `skills/tools/openspec/SKILL.md` for subordinate OpenSpec apply/task mechanics.

## Implementation convergence

1. Every material mutation must trace to an approved requirement, task, design decision, or necessary verification need.
2. Reuse existing contracts/utilities/D02 facts/repository tooling before adding structure.
3. Implement the complete approved behavior with the smallest coherent diff.
4. Do not pull forward later Changes, silently narrow requirements, opportunistically refactor, or create internal version families.
5. Mark tasks complete only after their specified behavior is implemented and verified.
6. If implementation reveals a real design contradiction, STOP and return to the normal correction path.

## Mechanical Preflight — internal phase

Mechanical Preflight is part of `apply`; it is NOT a Standard Action, Reviewer, Verification authority, or lifecycle stage.

Reuse the minimum applicable D02 facts/checks:

```text
Lightweight Gate
Structural Dependency Health
Repository Entropy Hygiene
Applicable Check facts
```

Also check directly applicable artifact existence, OpenSpec strict validation, task completeness, handoff completeness, actual diff availability, and forbidden generated/runtime artifacts.

Reuse same-candidate PASS facts only when candidate/check/tool identity remains materially valid.

## Complexity / scope-drift check

Explicitly assess new capability, authority, lifecycle semantics, Standard Action, compatibility surface, later-Change content, and control plane.

## Run / handoff

Keep the three-file Run concise. Handoff exact changed artifact/diff identities and real check outcomes needed for independent `review-apply`.

## Terminal boundary

Successful Apply stops at:

```text
review-apply
```

Do not perform Reviewer work, archive, next-Change activation, Delivery finalization, or Git checkpoint/push/merge.

STOP after the real Apply Result is materialized.
