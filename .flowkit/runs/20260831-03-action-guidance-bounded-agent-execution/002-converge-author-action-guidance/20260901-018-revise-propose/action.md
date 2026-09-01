# Action — Revise Propose

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: converge-author-action-guidance
role: author
action: revise-propose
input: 20260901-017-review-propose
base: 3af174bdfa2e8ebcf280e87a13565d03dec0b647
skill:
  .agents/skills/revise-propose
```

## Reviewer finding

```text
D03-RP-001
```

017 identified one bounded formal wording drift: canonical Author archive Guidance could be read as requiring the Change to be `completed` before archive, while existing lifecycle/Policy reaches exact Action `archive` while the Change is still active after `review-apply` approval and materializes `completed` afterward.

## Revision

Only the affected formal Proposal artifacts were corrected:

```text
specs/author-action-guidance/spec.md
→ archive Guidance executes only an already-authorized exact `archive` Action
→ Guidance does not decide archive legality
→ Guidance does not require pre-existing `completed`
→ completion is post-archive materialization owned by existing lifecycle/coordination

tasks.md
→ implementation task now enforces the same lifecycle precision

design.md
→ archive decision explicitly records the existing Policy/Guidance ownership boundary
```

The approved Explore and proposal.md are unchanged.

## Preserved scope

Unchanged:

```text
seven Author canonical product Guidance entries
archive ordinal rule
one narrow independent .agents archive wrapper
Mechanical Preflight composition
self-hosting boundary
TEMPORARY-RUN-SURFACE-GUIDANCE.md retention
no historical archive mass rename
no Core/Policy/Run/Result/lifecycle redesign
```

## Result

```text
PASS
D03-RP-001: addressed
OpenSpec strict: PASS
production mutation: NONE
Apply: NOT STARTED
next boundary: review-propose
```

## STOP

Do not enter Apply until the revised Proposal is independently reviewed.
