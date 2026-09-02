# Action — Revise Propose

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: converge-author-action-guidance
role: author
action: revise-propose
input: 20260901-028-review-propose
approved-explore: 20260901-026-review-explore
base: 3af174bdfa2e8ebcf280e87a13565d03dec0b647
```

## Reviewer finding

```text
D03-RP-002
→ first-actual-Explore projectOrdinal assignment/persistence
  was formalized but had no implementation HOW owner
```

## Revision boundary

Revise Proposal only to assign execution ownership:

```text
product Explore HOW
→ skills/actions/explore/SKILL.md

D03/D04 independent bootstrap Explore HOW
→ .agents/skills/explore-proof-based/SKILL.md
```

Both operate only after exact Explore is already legal/current. Neither decides activation or legality. Bootstrap MUST NOT consume candidate product Guidance. No Counter/Registry/allocator/new lifecycle is introduced.

STOP at `review-propose`; Apply is not started.
