# Action — Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-policy-and-next-boundary-contract`
- Action: `apply`
- Logical Run id: `20260827-067-apply`
- Role: `author`
- Input Run: `20260827-066-review-propose`
- Checkpoint base: `120731bbf0521508ef108db18b33ce728185adb2`

## Execution

Reviewer approved the revised Proposal in Run 066 and the user requested Apply. Apply used the repository `openspec-apply-change` workflow together with Flowkit `implementation-convergence`.

The implementation stays inside the approved Policy contract:

- add one pure `policy-and-next-boundary` domain evaluator and export it through the existing domain index;
- return only closed `ready-action`, `ready-checkpoint-evaluation`, or `blocked` decisions;
- keep completed-Archive materialization ahead of the generic non-active guard;
- implement the closed normal Author/Reviewer boundary matrix;
- require exact current terminal `RunContextRecord` + `RunResultRecord` linkage via existing `hasMatchingRunLinkage` before reading outcome or reported `nextBoundary`;
- validate reported `nextBoundary` only against the deterministic normal boundary before Owner correction;
- recognize only bounded `revise-action` Owner corrections with exact current Delivery/Change and single requested-action scope;
- reuse existing Action lifecycle transitions/prepared reuse as the final structural-enterability gate;
- never execute an Action, schedule/poll, perform filesystem/OpenSpec lookup, mutate Git, or treat READY as invocation authority.

## Gate / auxiliary-Change disposition

The user explicitly called out the file-size gate because `src/domain/run-result-persistence.ts` already has 588 lines. Apply treated that as baseline debt and required zero regression:

- `src/domain/run-result-persistence.ts` remained byte-identical to base;
- the new Policy production module is 438 lines after repository formatting;
- the two focused Policy test modules are 316 and 323 lines;
- no newly added or modified TypeScript file exceeds 500 lines.

Therefore a separate auxiliary OpenSpec Change was **not triggered**: the approved Policy implementation does not require touching or splitting the pre-existing 588-line module, and opening a refactor Change here would be unrelated scope expansion. If a future gate requires eliminating all baseline >500-line files, that must be a separately Owner-scoped bounded Change.

## Verification

- OpenSpec Apply tasks: `10/10 complete` / `all_done`
- TypeScript typecheck: PASS
- Domain tests: `63/63 PASS`
- Repository format check: PASS
- Change strict validation: PASS
- OpenSpec validate all strict: `6/6 PASS`
- `package.json` / `pnpm-lock.yaml`: unchanged
- no production mutation outside the new Policy module and domain index export

## Boundary

Apply stops here. No Reviewer verdict, formal Verification PASS, Archive, checkpoint or Git authority is claimed.
