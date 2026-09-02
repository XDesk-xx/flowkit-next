# Action — Explore

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: correct-archive-handoff-and-cross-platform-verification-discipline
role: author
action: explore
base: 39ef634bc7680af0494d4d918adf58e338601a83
projectOrdinal: 025
changeStartSequence: 061
run: 20260901-061-explore
physicalRunGroup: 006
```

Owner activated one final bounded D03 corrective Change after Reviewer pre-scope `REVISE — MINOR`; the two Reviewer wording corrections and the later Owner clarification that archive `prepare` itself must perform a real self-check are absorbed into the current Explore.

Execution HOW uses the independent bootstrap plane:

```text
.agents/skills/openspec-explore
.agents/skills/explore-proof-based
```

Explore proves the minimum archive-prepare/correction boundary, exactly two Windows-only proof-mechanics gaps, continuation completeness, and stale canonical Author-spec convergence. It does not implement production behavior, mutate Memo state, perform D03 finalization, or exercise Git authority.

STOP at `review-explore`.
