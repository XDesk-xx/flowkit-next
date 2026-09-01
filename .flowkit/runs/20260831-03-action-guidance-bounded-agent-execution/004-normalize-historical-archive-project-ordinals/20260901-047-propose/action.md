# Action — Propose

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: normalize-historical-archive-project-ordinals
role: author
action: propose
base: cb53d07b18da4382d83291627843507fc4acaf70
projectOrdinal: 023
changeStartSequence: 045
run: 20260901-047-propose
physicalRunGroup: 004
input: 20260901-046-review-explore APPROVED
```

Converged the approved Explore into planning artifacts only.

The Proposal freezes one bounded repository-history/test-normalization plan:

```text
7 proven date-only archives
→ normalize to accepted ordinals 014..020

21 durable archive-Run path references
→ converge to normalized paths

2 existing old-path test assertions
+
1 lifecycle-transient named-state/next-ordinal test
→ replace with immutable history assertions + stable synthetic ordinal proof
```

No product spec delta is created (`skip_specs: true`). `021`, `022`, current `023`, Core ordinal semantics, product Guidance, architecture and dependencies remain unchanged. `converge-reviewer-action-guidance` stays planned/unassigned.

STOP at `review-propose`.
