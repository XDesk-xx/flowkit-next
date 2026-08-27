# Action — Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-openspec-thin-integration`
- Action: `propose`
- Logical Run id: `20260828-093-propose`
- Role: `author`
- Input Run: `20260828-092-review-explore`
- Base Git revision: `91d1271d20925b7346aa36e7135c5f99b391c672` (from owner-supplied checkpoint archive metadata; detached snapshot excludes `.git`)

## Execution

The approved `091 explore → 092 review-explore` chain was converged into formal OpenSpec planning artifacts using upstream `openspec-propose` plus the Flowkit `proposal-convergence` discipline.

The Proposal introduces one new capability, `openspec-thin-integration`, and modifies zero existing canonical capabilities.

The planning contract keeps the reviewer-approved boundary:

- V1 exposes exactly two repo-local, read-only observations: active OpenSpec Change ids and exact Change planning/artifact status;
- invocation consumes only `resolveManagedTool("openspec")`, current host `process.execPath`, the resolved exact entrypoint, argument-array child process execution, and explicit requested repository cwd;
- PATH/global/shell lookup is never a fallback;
- successful observations must exact-bind canonical requested repository root to OpenSpec-reported `root.path`;
- active Change observation projects only canonical Change ids;
- exact Change status projects only requested identity, schema/change root, planning completeness and artifact readiness/dependency fields;
- valid JSON on a non-zero OpenSpec exit remains a machine-distinguishable formal outcome and is not collapsed into process/malformed-output failure;
- raw stdout/stderr, arbitrary exit-code/result passthrough, `nextSteps`, `actionContext`, `planningHome`, `artifactPaths` and unrelated OpenSpec fields are not stable Flowkit contract;
- observations remain transient and do not become Policy, Reviewer, Verification, Owner, Run/Result, Git authority, or `.flowkit` state mirror;
- production code does not read or execute `.agents/skills/**` and does not introduce self-hosting;
- no generic OpenSpec command executor or wrapper for `instructions`, `context`, `validate`, `show`, `new change`, `archive` or other commands is introduced.

No contract-changing unknown emerged during Proposal convergence.

## Stable output

- `proposal.md`
- new `openspec-thin-integration` delta spec
- `design.md`
- `tasks.md`
- this durable Propose Run

## Non-claims

- No production source or test mutation was performed.
- No Apply is executed by this Run.
- No OpenSpec workflow/state-machine ownership, automatic explore/propose/apply/archive, Policy/OpenSpec coupling, Memo integration, Skill migration, self-hosting, Foundation CLI implementation, Archify integration, Git checkpoint capability, or whole-manager cross-platform acceptance is introduced.
