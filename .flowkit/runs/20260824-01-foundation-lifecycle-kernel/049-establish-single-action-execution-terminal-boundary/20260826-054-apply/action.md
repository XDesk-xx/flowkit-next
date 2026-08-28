# Action — Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-single-action-execution-terminal-boundary`
- Action: `apply`
- Logical Run id: `20260826-054-apply`
- Role: `author`
- Input Run: `20260826-053-review-propose`
- Checkpoint base: `b0a38849aed94476e67245d89a31c7106f9d266d`

## Execution

Reviewer approved the Proposal in Run 053 and the user requested the normal Apply continuation. No new `OwnerAuthorityFact` is created or inferred for this ordinary happy-path Action.

Apply used the upstream `openspec-apply-change` workflow together with Flowkit `implementation-convergence`. The implementation was kept to the approved contract:

- contract Action lifecycle to `prepared | terminal` and reject removed `resumed` / `resume`;
- contract ActionPackage formation/admission to exact `prepared` state while preserving exact Run occurrence freshness and role/outcome-slot checks;
- add one thin single-Action invocation coordinator;
- internally prepare from empty / structurally eligible terminal-different state, or reuse exact same existing `prepared A`;
- invoke one narrow host callback exactly once only after package formation;
- admit the callback candidate through the existing exact Result admission seam;
- terminalize only after successful admission;
- on failure preserve the prepared Action, report bounded failure and STOP;
- preserve admitted `nextBoundary` as opaque data and never auto-execute the next Action.

## Implementation convergence

No provider/Agent registry, retry framework, attempt counter, WAL, crash recovery, persistence redesign, Policy engine, CLI integration, Git mutation framework, new dependency or opportunistic refactor was introduced.

## Verification

- OpenSpec Apply tasks: `9/9 complete` / `all_done`
- TypeScript typecheck: PASS
- Domain tests: `51/51 PASS`
- Repository declared format check: PASS
- Change strict validation: PASS
- OpenSpec validate all strict: `5/5 PASS`
- `package.json` / `pnpm-lock.yaml`: unchanged

## Boundary

Apply stops here. No Reviewer verdict, formal Verification PASS, Archive, checkpoint or Git authority is claimed.
