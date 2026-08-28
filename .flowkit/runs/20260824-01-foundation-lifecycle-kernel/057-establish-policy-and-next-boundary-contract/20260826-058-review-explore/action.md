# Action — Review Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-policy-and-next-boundary-contract`
- Action: `review-explore`
- Logical Run id: `20260826-058-review-explore`
- Role: `reviewer`
- Input Run: `20260826-057-explore`

## Review depth

This Change was treated as a critical governance review rather than a delta-only prose review.

Reviewer independently checked:

- 057 stable-transfer shape and activation authority;
- the current Foundation domain seams reconstructed from the accepted Change 4/5 Apply chain;
- Node 22.23.2 typecheck, complete domain tests and repository format;
- OpenSpec 1.10.0 reconstruction of the previous two archives and all five canonical specs;
- the 42 observable historical Action-to-nextBoundary transitions;
- Policy-rule composition, precedence and fail-closed behavior;
- the real 049 explore → Owner-directed 050 revise-explore correction case;
- historical Owner authority usage for apply/archive versus later explicit user invocation;
- separation between legal-boundary calculation and actual host/Owner execution.

## Verdict

`changes-requested`

Three blocking findings remain.

### RE-058-001 — successful archive is swallowed by the non-active Change guard

057 currently proposes both:

- `Change != active -> BLOCKED(change-not-active)`;
- `terminal archive + PASS -> CHECKPOINT boundary`.

Real durable history shows a successful archive moves the Change from `active` to `completed`. Therefore post-STOP facts are expected to be:

`change.state = completed + currentAction = terminal archive + archive PASS`.

Under the current matrix the non-active guard wins and checkpoint-evaluation becomes unreachable.

Revise Explore MUST define explicit state/precedence semantics for post-archive evaluation. The minimum safe shape is to recognize the exact completed/archive-success boundary before applying the generic non-active blocker, or an equivalent deterministic rule. Other completed/cancelled mismatches must remain fail closed.

### RE-058-002 — reported-boundary conflict and Owner correction need explicit precedence

057 correctly requires a conflicting admitted `nextBoundary` to fail closed and also correctly supports bounded Owner revise-only correction.

Those rules conflict unless evaluation order is explicit.

Real case:

`049 explore PASS` reports normal `review-explore`, then Owner deliberately requests `revise-explore` before Reviewer.

If reported boundary is compared to the final corrected Policy decision, every valid Owner correction becomes `reported-boundary-conflict`.

Revise Explore MUST distinguish:

1. compute deterministic normal boundary from authoritative terminal facts;
2. compare admitted reported `nextBoundary` to that normal boundary;
3. only after normal consistency is established, evaluate an explicit bounded Owner correction and allow the intentional deviation when authority matches.

Equivalent ordering is acceptable, but a valid correction must not be rejected merely because it intentionally differs from the normal boundary.

### RE-058-003 — transition history proves ordering, not the absence of Owner execution authority

The 42/42 audit independently reproduces the Action-to-nextBoundary ordering and is useful evidence for deterministic normal progression.

It does NOT prove that fresh Owner authority is unnecessary for apply/archive execution.

Durable history is mixed:

- earlier completed Changes contain explicit `authorize-apply` / `authorize-archive` Owner facts;
- later execution also contains explicit user invocation without creating a new OwnerAuthorityFact.

Therefore the statement that historical evidence proves normal apply/archive "must not require fresh Owner authorization" is broader than the evidence.

Revise Explore MUST separate:

- `Policy legal next boundary`;
- `external host / Owner request to actually invoke that Action`;
- `OwnerAuthorityFact` only where a boundary explicitly requires a durable authority fact.

It may still choose a simple normal-path model with no extra durable OwnerAuthorityFact for ordinary Standard Actions, but that must be stated as a governance boundary and must preserve explicit external invocation; it must not be claimed as a consequence of the 42/42 transition audit.

## Additional proof note — legacy external Run outcomes

The 42 historical external-orchestrator Runs support ordering, but they are not uniform canonical `RunResultRecord` evidence: several revise Runs use legacy `authorRevisionConclusion`, and some older Author Runs predate `authorConclusion`.

This does not require preserving legacy outcome fields in Policy. Proposal may still use the canonical `RunResultRecord.authorConclusion == "PASS"` contract, but Explore should ground that vocabulary in the canonical persistence/admission contract and tests rather than claim all historical external Run wire shapes already use it.

## Non-claims

- Reviewer did not modify Author Explore artifacts.
- No Proposal/spec/design/tasks or production implementation was created.
- No scheduler, automatic next execution, CLI, OpenSpec adapter, Git authority, Full Test or promotion behavior is introduced.
