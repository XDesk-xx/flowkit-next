# Action — Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-openspec-thin-integration`
- Action: `apply`
- Logical Run id: `20260828-095-apply`
- Role: `author`
- Input Run: `20260828-094-review-propose`
- Base Git revision: `91d1271d20925b7346aa36e7135c5f99b391c672` (owner-supplied checkpoint archive metadata; detached snapshot excludes `.git`)

## Execution

The reviewer-approved Proposal was implemented using upstream `openspec-apply-change` plus Flowkit `implementation-convergence`.

The implementation adds one focused read-only OpenSpec observation module and two focused test files. The public product surface remains limited to:

- observation of the repo-local OpenSpec Change identifier set via closed `list --json`;
- observation of one exact Change planning/artifact status via closed `status --change <id> --json`.

Implementation boundaries preserved:

- exact managed OpenSpec runtime is resolved through existing `resolveManagedTool({ toolId: "openspec" })`;
- invocation uses current host `process.execPath`, exact resolved entrypoint, argument-array child process execution, canonical requested cwd, and no shell/PATH executable selection;
- successful observations exact-bind OpenSpec `root.path` to the canonical requested repository root;
- valid JSON on non-zero exit is reported only as the closed `openspec-formal-outcome` diagnostic and is not interpreted as Flowkit lifecycle/authority;
- malformed JSON, invalid machine shape, abnormal process completion, root mismatch, and formal non-zero remain distinct diagnostics;
- active Change observation projects only canonical Change ids;
- exact Change status projects only approved schema/change-root/planning/artifact fields and preserves OpenSpec `ready|blocked|done|skipped`, `requires`, and `missingDeps` without filesystem/Markdown inference;
- no OpenSpec state mirror/cache or `.flowkit` write is introduced;
- production runtime has no `.agents`/Skill, Policy, Memo, Action lifecycle, Run/Result, or self-hosting dependency;
- no generic OpenSpec command executor or wrapper for adjacent commands is introduced.

OpenSpec Apply progress reached `9/9 complete` / `all_done`.

## Verification

- focused observation tests: `14/14 PASS`;
- complete domain tests: `105/105 PASS`;
- typecheck: PASS;
- format check: PASS;
- current Change strict validation: PASS;
- OpenSpec validate-all strict: `9/9 PASS`;
- real managed OpenSpec 1.10.0 exact-root list/status proof: PASS;
- missing Change non-zero machine outcome proof: PASS;
- fake PATH isolation proof: PASS;
- nested-root nearest-root rejection proof: PASS;
- TypeScript code gate: PASS; all four new/modified TypeScript files are <= 500 lines and the historical 588-line file remains byte-identical.

## Non-claims

- No independent `review-apply` has been performed by this Run.
- No Verification PASS, archive authority, checkpoint authority, Git commit, Foundation CLI, Archify integration, Skill migration, or self-hosting is claimed.
