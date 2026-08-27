# Action — Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-cross-delivery-memo-contract`
- Action: `propose`
- Logical Run id: `20260827-072-propose`
- Role: `author`
- Input Run: `20260827-071-review-explore`
- Base Git revision: `2cc6a6c0cdcad771ed7d5503c1e7197ffee553d3`

## Execution

The approved `070 explore → 071 review-explore` chain was converged into formal OpenSpec planning artifacts using upstream `openspec-propose` plus the Flowkit `proposal-convergence` discipline.

Proposal keeps one new capability, `cross-delivery-memo`, and modifies zero existing capability contracts. The Memo remains a project-level durable concern sidecar for Owner-authorized concerns that are intentionally outside the current formal Delivery/Change scope.

The four Reviewer Proposal constraints are formalized:

- promotion target Delivery/Change must exactly match the eligible `promote-memo` OwnerAuthorityFact used for that promotion;
- Memo consumes existing canonical Owner authority and never mints, infers, repairs or persists authority facts;
- `.flowkit/memos.json` is capability-owned narrow persistence only and does not establish generic mutation/Git checkpoint authority;
- optional Run provenance reuses the existing canonical Run occurrence/runId parser rather than accepting arbitrary Run-id text.

The Proposal also preserves the approved lightweight model: one JSON document, `open|promoted|dismissed`, no defer mutation, no Memo Standard Action/Run/STOP, no Policy input/blocker, and no automatic Delivery/OpenSpec target creation.

## Stable output

- `proposal.md`
- new `cross-delivery-memo` delta spec
- `design.md`
- `tasks.md`
- this durable Propose Run

## Non-claims

- No production source or test mutation was performed.
- No Apply is executed by this Run.
- No project-scoped/no-Delivery Owner authority variant is introduced.
- No issue tracker, backlog, priority/tag system, scheduler, database/index/WAL/locking, automatic Memo persistence, automatic Delivery/Change creation, generic repository mutation authority, Git checkpoint behavior, CLI or Full Test is introduced.
