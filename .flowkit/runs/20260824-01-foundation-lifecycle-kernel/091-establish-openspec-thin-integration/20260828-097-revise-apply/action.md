# Action — Revise Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-openspec-thin-integration`
- Action: `revise-apply`
- Logical Run id: `20260828-097-revise-apply`
- Role: `author`
- Input Run: `20260828-096-review-apply`
- Review finding: `RA-096-001`

## Revision basis

Run 096 returned `changes-requested` because non-zero OpenSpec output was classified as `openspec-formal-outcome` after only proving that stdout was a JSON object. Arbitrary objects such as `{}` or `{"hello":"world"}` therefore crossed the fail-closed machine boundary.

The approved Spec already requires a **valid OpenSpec machine JSON formal outcome** before the non-zero branch may receive that classification. This is an implementation defect, not a Proposal defect, so the correction remains inside `revise-apply`.

Skills used:

- `.agents/skills/revise-apply/SKILL.md`
- `.agents/skills/implementation-convergence/SKILL.md`

## Minimum correction

The existing read-only adapter remains unchanged in responsibility. Before a non-zero result can become `openspec-formal-outcome`, it now validates a closed OpenSpec 1.10.0 failure envelope for the only two approved commands:

- `status --change <id> --json`: top-level `status` envelope;
- `list --json`: OpenSpec's list failure null-shape (`changes: []`, `root: null`, `status`).

Each status item requires the OpenSpec 1.10.0 diagnostic machine fields `severity`, `code`, and `message`; only the current optional machine fields `target` and `fix` are accepted. The implementation validates structure only. It does not parse message text, map OpenSpec codes to Flowkit lifecycle semantics, expose raw transport data, or add any new command wrapper.

Focused negatives now prove non-zero `{}` and an unrelated object fail as `invalid-machine-shape`, while real missing-Change output and the list null-shape still remain formal outcomes.

## Code gate

Current Change TypeScript surface:

- `src/domain/index.ts`: 14 lines;
- `src/domain/openspec-observation.ts`: 401 lines;
- `tests/unit/domain/openspec-observation.test.ts`: 270 lines;
- `tests/unit/domain/openspec-observation-boundary.test.ts`: 273 lines;
- new/modified TypeScript files over 500 lines: none.

The historical `src/domain/run-result-persistence.ts` remains byte-identical at 588 lines. No auxiliary refactor Change is required.

## Verification

- focused OpenSpec observation tests: `16/16 PASS`;
- complete domain tests: `107/107 PASS`;
- typecheck: PASS;
- format check: PASS;
- OpenSpec Apply state: `9/9 all_done`;
- current Change strict validation: PASS;
- OpenSpec validate-all strict: `9/9 PASS`;
- real managed OpenSpec 1.10.0 exact-root list/status proof: PASS;
- real missing-Change non-zero formal outcome: PASS;
- fake PATH isolation: PASS;
- nested-root rejection: PASS;
- package/dependency mutation: NONE.

## Boundary

`RA-096-001` is corrected without Proposal/spec/design/task semantic change.

STOP at `review-apply` for independent re-review. No archive, checkpoint, Owner authority or Git authority is claimed.
