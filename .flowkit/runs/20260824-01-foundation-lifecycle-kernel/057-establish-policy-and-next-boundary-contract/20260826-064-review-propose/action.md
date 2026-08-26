# Action — Review Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-policy-and-next-boundary-contract`
- Action: `review-propose`
- Logical Run id: `20260826-064-review-propose`
- Role: `reviewer`
- Input Run: `20260826-063-propose`
- Review chain start: `20260826-057-explore`

## Review chain

`057 explore → 058 review-explore → 059 revise-explore → 060 review-explore → 061 revise-explore → 062 review-explore approved → 063 propose → 064 review-propose`

## Review boundary

Reviewer checked:

- 057–062 historical Run records remain byte-identical in 063;
- the 062-approved Explore artifact and delivery-group state remain unchanged;
- post-archive precedence, reported-boundary consistency before Owner correction, legality/invocation/authority separation, and final structural-enterability are all carried into Proposal/spec/design/tasks;
- OpenSpec planning/strict validation and current domain baseline remain healthy;
- Proposal contract completeness against repeated same-Standard-Action Run occurrences.

## Verdict

`changes-requested`

One blocking contract hole remains.

### RP-064-001 — terminal Policy Result is not bound to the exact current Run occurrence

The Proposal repeatedly calls `terminalResult` the exact/matching terminal Result, but the normative check only requires:

`terminalResult.actionIdentity == currentAction.identity`.

`CurrentAction` contains only semantic Action identity + lifecycle state; it does not contain the Run occurrence/runId.

The existing persistence contract explicitly allows the same Standard Action to appear in multiple distinct Run occurrences. Therefore after a real loop such as:

`review-explore(R1) → revise-explore → review-explore(R2)`

both R1 and R2 Results have the same semantic `ActionIdentity`. Both are structurally valid `RunResultRecord`s, but only R2 belongs to the exact current terminal occurrence.

With the 063 Policy facts, a stale R1 Result can satisfy the listed Result-identity rule and influence normal-boundary outcome, reported-boundary consistency, and Owner-correction evaluation.

This is the same freshness class already solved at ActionPackage admission and must remain fail closed at Policy evaluation.

#### Minimum required revision

Reuse the existing Run occurrence/linkage truth. The exact shape may be chosen in revise-propose, for example:

- include the exact current terminal `RunOccurrence`, or
- include the exact terminal `RunContextRecord`, or
- an equivalent existing canonical fact that lets Policy prove the current runId.

Before reading outcome/nextBoundary, require both:

- exact ActionIdentity linkage; and
- `terminalResult.runId == exact current terminal runId`.

Add focused verification for:

- fresh current occurrence Result → eligible for Policy evaluation;
- stale previous occurrence of the same Standard Action → `BLOCKED(terminal-result-missing-or-mismatched)` or another explicit closed linkage reason;
- exact current occurrence but wrong ActionIdentity → blocked as today.

Do not add PackageId/ResultId, replay registry, WAL, locking, scheduler, retry framework, or a second lifecycle state machine.

## Non-claims

- Reviewer did not modify Author planning artifacts.
- No production Apply mutation was performed.
- This review does not reopen the approved Policy scope beyond exact current terminal Result linkage.
- No Verification PASS, Owner archive/checkpoint authority, scheduler, automatic execution, CLI, or Git behavior is claimed.
