# Action — Review Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-cross-delivery-memo-contract`
- Action: `review-explore`
- Logical Run id: `20260827-071-review-explore`
- Role: `reviewer`
- Input Run: `20260827-070-explore`

## Review boundary

Reviewer independently checked the 070 Explore against the supplied `2cc6a6c` base snapshot and the repository `review-explore` skill.

The review verified:

- activation changes only the intended Delivery Change state plus explicit Owner activation fact;
- Memo remains outside StandardAction, CurrentAction, Run/Result and Policy;
- current Delivery-scoped `OwnerAuthorityFact` can structurally carry narrow `create-memo`, `promote-memo` and `dismiss-memo` eligibility tokens without weakening the authority core;
- a no-Delivery Owner authority fact remains invalid;
- the bounded single-writer `.flowkit/memos.json` model is sufficient for the current Author/Reviewer workflow and does not require database/index/WAL/locking;
- `open / promoted / dismissed` plus no-op defer is a closed V1 state model;
- promotion can remain one-way and non-creative: the Memo capability records a caller-established target and does not create Delivery/OpenSpec artifacts;
- existing lifecycle, persistence, ActionPackage, single-Action execution and Policy kernels require no Memo coupling;
- canonical source/spec baseline remains healthy.

## Verdict

`approved`

No current-scope Explore blocker remains. The Change is ready for Proposal.

## Proposal constraints

1. **Promotion target binding**
   - `promoteMemo` MUST fail closed unless the supplied target Delivery/Change exactly matches the eligible Owner authority fact used for that promotion.
   - The caller/integration boundary MUST supply a target that has already been established.
   - Memo itself MUST NOT scan OpenSpec/filesystem or create the target.

2. **Authority ownership**
   - Memo capability consumes an already-established canonical `OwnerAuthorityFact`.
   - It MUST NOT mint, infer, repair, or persist Owner authority facts on its own.
   - Stored Memo fields reference the authority `ref`; the authority fact remains owned by the existing authority/delivery layer.

3. **Mutation boundary**
   - `.flowkit/memos.json` is a narrow capability-owned sidecar path for this Memo contract.
   - Its existence MUST NOT be interpreted as establishing the next Change's generic mutation declaration, repository-scope, Git checkpoint or commit authority.
   - The following `establish-mutation-and-git-checkpoint-boundary` Change still owns those generic rules.

4. **Provenance**
   - If Run provenance is accepted, Proposal should reuse the existing canonical Run occurrence/runId parsing rules rather than accepting arbitrary unbounded Run-id text.
   - Provenance remains informational and MUST NOT become authority or formal scope.

## Non-claims

- Reviewer did not modify Author Explore artifacts.
- No Proposal/spec/design/tasks or production implementation was created.
- No project-scoped Owner authority variant, issue tracker, scheduler, automatic Memo persistence, automatic Delivery/Change creation, CLI, Git checkpoint behavior or Full Test is introduced.
