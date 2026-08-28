# Action — Revise Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-policy-and-next-boundary-contract`
- Action: `revise-explore`
- Logical Run id: `20260826-061-revise-explore`
- Role: `author`
- Input Run: `20260826-060-review-explore`
- Trigger: Reviewer `changes-requested`

## Revision

Reviewer confirmed all three 058 findings closed and identified one remaining composition defect: 059 could return an Owner-corrected READY revise Action equal to the exact current terminal revise Action, while the existing lifecycle rejects `terminal A → prepare A`.

This revision closes `RE-060-001` without changing the lifecycle contract:

1. every final `READY_ACTION(target)` must be structurally enterable from the exact current Action slot;
2. null slots reuse the existing lifecycle `prepare(target)` rule;
3. `prepared A` only allows exact `A` reuse without another prepare;
4. terminal slots reuse the existing lifecycle `prepare(target)` rule, which naturally rejects the exact same terminal Action identity;
5. bounded Owner correction therefore no longer advertises immediate `revise-explore → revise-explore`, `revise-propose → revise-propose`, or `revise-apply → revise-apply`.

Focused proof directly composed the current `transitionCurrentAction` seam with the Policy candidates: normal transitions remain 12/12 enterable; Owner-correction combinations are 15/18 enterable, with exactly the three same-terminal revise candidates rejected as intended.

## Stable output

- revised `explore.md`
- this durable Revise Explore Run

## Non-claims

- No Proposal/spec/design/tasks were created.
- No production source or tests were modified.
- Existing terminal absorption was not loosened.
- No resumed/retry/reset semantics, scheduler, automatic Action execution, multi-Agent orchestration, CLI, checkpoint authority, Full Test or promotion behavior was added.
