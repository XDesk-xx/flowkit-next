# Action — Revise Explore

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: correct-archive-handoff-and-cross-platform-verification-discipline
role: author
action: revise-explore
base: 39ef634bc7680af0494d4d918adf58e338601a83
projectOrdinal: 025
changeStartSequence: 061
run: 20260902-067-revise-explore
physicalRunGroup: 006
input: 20260902-066-review-explore
```

Converged Reviewer finding `R065-001` without expanding A/B/C/D/E scope.

The canonical Explore now rejects pre-ActionPackage product-Guidance execution and acknowledges the minimum bounded execution-order correction required for real preparation: stage a structurally valid prepared candidate inside the existing invocation, form the exact ActionPackage/Guidance identity, run one read-only package-bound preparation check, expose/commit prepared only on PASS, and preserve the pre-invocation currentAction on preparation BLOCKED/failure.

Controlled proof established that the same exact archive ActionPackage can bind the preparation check, blocked preparation can discard the staged candidate and retain terminal `review-apply`, existing Policy can then admit Owner-controlled `revise-apply`, and the PASS branch remains compatible with the existing execution/terminal path.

No production implementation, Proposal, new Standard Action/state, PreparationPackage/Run/Result identity, Registry/Planner/Runtime, or Windows abstraction was introduced.

Next boundary: `review-explore`.

STOP.
