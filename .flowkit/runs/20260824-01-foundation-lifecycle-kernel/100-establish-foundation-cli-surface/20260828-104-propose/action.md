# Action — Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Action: `propose`
- Logical Run id: `20260828-104-propose`
- Role: `author`
- Input Run: `20260828-103-review-explore`
- Base Git revision: `698538c0588dab9737e91bff77595d591258880d` (from owner-supplied checkpoint archive metadata; detached snapshot excludes `.git`)

## Execution

The approved `100 explore → 101 review-explore changes-requested → 102 revise-explore → 103 review-explore approved` chain was converged into formal OpenSpec planning artifacts using upstream `openspec-propose` plus the Flowkit `proposal-convergence` discipline.

The Proposal introduces one new capability, `foundation-cli-surface`, and modifies zero existing canonical capabilities.

The planning contract keeps the reviewer-approved boundary:

- one real build/bin surface emits a runnable `flowkit` entrypoint without turning Node 22.23.2 into exact product runtime authority;
- the command catalog is closed to `status`, `next`, and `doctor`;
- command requests use explicit JSON input via `--input <path>` so Delivery/Change/current-Run facts remain caller-owned and cross-platform shell quoting does not become a hidden protocol;
- whenever a current Run is required, caller/host supplies an exact `runId` plus exact controlled Run address facts; CLI parses and reads only that occurrence through existing durable Run APIs;
- history ordering remains reporting-only and never selects current-Run authority; max sequence, mtime, directory order, Git history and implicit latest are forbidden;
- `next` reconstructs Policy facts only from the exact selected Run and caller structural facts, then delegates lifecycle legality exclusively to `evaluatePolicyAndNextBoundary(...)`;
- terminal selected Runs contribute their exact linked context/result, while prepared Runs contribute no manufactured terminal facts;
- checkpoint evaluation remains a separate pure exact Owner `authorize-checkpoint` gate outside Policy and outside Git execution;
- `doctor` resolves exact managed OpenSpec and Archify identities plus exact-root OpenSpec observation; Archify is not invoked for architecture materialization;
- valid domain outcomes such as Policy `blocked` and `authorized=false` remain machine results, while malformed input/Run/integration failures use closed non-zero CLI failure output;
- no Delivery discovery/current registry, self-hosting, Skill execution, provider orchestration, OpenSpec mutation, Archify materialization, Git mutation, Full Test or Delivery Final is introduced;
- all new/modified TypeScript files must remain below the existing 500-line code gate, and the historical >500-line Run persistence file must not be modified for CLI convenience.

No contract-changing unknown emerged during Proposal convergence.

## Stable output

- `proposal.md`
- new `foundation-cli-surface` delta spec
- `design.md`
- `tasks.md`
- this durable Propose Run

## Non-claims

- No production source, test, package or build configuration mutation was performed in this Propose Run.
- No Apply is executed by this Run.
- No automatic Delivery/current-Run discovery, self-hosting, Skill runtime, Agent/provider execution, OpenSpec mutation, Archify architecture generation, Git checkpoint execution, Windows/Linux final acceptance, Delivery Full Test or Owner promotion is introduced.
