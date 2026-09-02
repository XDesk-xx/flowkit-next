# Action — Revise Explore

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: correct-archive-handoff-and-cross-platform-verification-discipline
role: author
action: revise-explore
base: 39ef634bc7680af0494d4d918adf58e338601a83
projectOrdinal: 025
changeStartSequence: 061
run: 20260902-071-revise-explore
physicalRunGroup: 006
input: Owner correction after 070 review-propose
```

Owner corrected the cross-platform proof execution boundary: the two former Windows-only proof gaps must be closed through equivalent Linux-hosted semantic simulation rather than native Windows execution.

The canonical Explore now proves that `resolveActionGuidanceRef` has no platform-specific production branch and observes only real filesystem/read success or failure. A real Linux low-privilege `EACCES` therefore simulates the Windows ACL-denial semantic at the product boundary and proves fail-closed behavior without validating Windows ACL command mechanics. The Git executable-mode gap is simulated on Linux with `core.filemode=false` plus `git update-index --chmod=+x/-x`, proving identical bytes with `100644` vs `100755` change the real candidate identity while reproducing the Windows-relevant worktree limitation.

No product contract, Core implementation, Proposal artifact or dependency was changed in this revise-explore.

Next boundary: `review-explore`.

STOP.
