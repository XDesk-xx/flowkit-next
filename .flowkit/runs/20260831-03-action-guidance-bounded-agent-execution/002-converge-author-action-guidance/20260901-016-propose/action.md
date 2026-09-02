# Action — Propose

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: converge-author-action-guidance
role: author
action: propose
input: 20260901-015-review-explore
base: 3af174bdfa2e8ebcf280e87a13565d03dec0b647
skills:
  .agents/skills/openspec-propose
  .agents/skills/proposal-convergence
```

## Approved boundary

015 Reviewer approved 014 Explore with no blocking findings. This Propose formalizes only the approved Author Guidance convergence boundary.

## Proposal scope

```text
new capability:
author-action-guidance

product canonical entries to implement:
7 Author StandardActionId-aligned SKILL.md files

bootstrap parity:
one independent .agents/skills/archive wrapper only

production Core changes:
none planned
```

The Proposal preserves Change 1 single-file Guidance identity, keeps Mechanical Preflight internal to apply/revise-apply, fixes archive naming as `YYYY-MM-DD-<Delivery manifest ordinal:03d>-<semantic ChangeId>`, retains the temporary Run bridge, and forbids self-hosting takeover / Registry / Router / Runtime growth.

## Result

```text
PASS
planning artifacts: 4/4 complete
OpenSpec strict: PASS
next boundary: review-propose
```

## STOP

Do not enter Apply until the Proposal is independently reviewed and the normal next boundary is reached.
