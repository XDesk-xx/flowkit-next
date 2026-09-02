# Action — Revise Explore

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: converge-author-action-guidance
role: author
action: revise-explore
input: 20260901-024-review-explore
run: 20260901-025-revise-explore
project Change ordinal: 021
canonical changeStartSequence: 014
```

Consume Reviewer finding `D03-RE-004` only.

Correction:

```text
planned-only Change
→ no project Change ordinal

first actual Explore
→ assign/freeze project Change ordinal

current Change
→ projectOrdinal 021

planned Reviewer Guidance
→ no ordinal yet
→ 022 is next candidate only

Archive
→ consumes existing projectOrdinal
→ does not allocate/recompute
```

Numbering namespaces remain separate:

```text
project Change ordinal 021
≠ changeStartSequence 014
≠ Run sequence 025
```

Persist the current already-assigned ordinal minimally on the exact Delivery Change coordination entry as `projectOrdinal: 21`.

No Proposal, Apply, product implementation, OpenSpec vendor mutation, self-hosting migration, or Git operation is performed.

STOP at `review-explore`.
