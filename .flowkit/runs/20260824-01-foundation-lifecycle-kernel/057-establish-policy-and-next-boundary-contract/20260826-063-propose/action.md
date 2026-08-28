# Action — Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-policy-and-next-boundary-contract`
- Action: `propose`
- Logical Run id: `20260826-063-propose`
- Role: `author`
- Input Run: `20260826-062-review-explore`
- Base Git revision: `120731bbf0521508ef108db18b33ce728185adb2`

## Execution

The approved Explore chain `057 → 058 → 059 → 060 → 061 → 062` was converted into formal OpenSpec planning artifacts using the upstream `openspec-propose` workflow and the Flowkit `proposal-convergence` discipline.

Proposal convergence keeps exactly one new capability, `policy-and-next-boundary`, and modifies no existing capability contract. The Policy is a pure legality seam with closed outputs: legal Standard Action, checkpoint-evaluation, or deterministic blocked diagnosis.

The proposal formalizes all reviewer-closed Explore corrections:

- exact completed Archive materialization takes precedence over the generic non-active guard;
- reported `nextBoundary` is checked against the deterministic normal boundary before any Owner correction;
- Owner correction is exceptional, revise-only, and requires one exact `revise-action` authority recognition;
- every final READY Action must pass the existing lifecycle/prepared-reuse structural-enterability seam;
- READY expresses legality only and does not execute or authorize host invocation.

During convergence, the completed-Archive branch was further tightened so an incorrect non-null reported checkpoint token returns `reported-boundary-conflict` instead of being masked as `change-not-active`.

## Stable output

- `proposal.md`
- new `policy-and-next-boundary` delta spec
- `design.md`
- `tasks.md`
- this durable Propose Run

## Non-claims

- No production source/test mutation was performed.
- No Apply is executed by this Run.
- No scheduler, automatic next execution, retry/resume/reset, second lifecycle state machine, normal-path Owner authorization gate, Git/checkpoint authority, OpenSpec filesystem adapter, CLI, Full Test or multi-Agent/provider registry is introduced.
- No fresh Owner authority is inferred from Reviewer approval.
