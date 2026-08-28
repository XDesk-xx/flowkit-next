# Action — Revise Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Action: `revise-propose`
- Logical Run id: `20260828-106-revise-propose`
- Role: `author`
- Input Run: `20260828-105-review-propose`

## Finding closure

`RP-105-001` identified one Proposal completeness gap: canonical Policy supports an active Change with no CurrentAction/Run and returns `READY_ACTION(explore)`, while 104 required an exact selected Run for `next`.

The minimum correction keeps explicit caller authority and adds one explicit absence form:

```text
currentRunId: <exact canonical runId>
→ parse/read only that exact Run
→ reconstruct CurrentAction from that occurrence

currentRunId: null
→ caller explicitly states there is no current Run
→ no Run read
→ no history scan
→ currentAction = null
→ terminalRunContext = null
→ terminalResult = null
→ canonical Policy decides the boundary
```

Omitted/undefined or malformed `currentRunId` remains invalid; it is not normalized to explicit null.

The approved exact-Run correction from RE-101-001 remains intact. A disconnected higher-sequence Run cannot influence either explicit branch.

## Planning corrections

Updated only the affected planning artifacts:

- `proposal.md` — records the explicit exact-or-null current-Run choice for `next`;
- delta spec — makes explicit absence normative and adds the active/no-current → `READY_ACTION(explore)` scenario;
- `design.md` — defines the two-form request mapping without discovery or persistence;
- `tasks.md` — adds focused implementation/test coverage for explicit null, exact Run, malformed omission and disconnected higher-sequence history.

No production source/test/package/build implementation was changed.

## Preserved boundaries

- no history scan to prove emptiness;
- no max-sequence/mtime/directory/Git current-Run inference;
- no current-action persistence or registry;
- no Run-lineage subsystem;
- no automatic Delivery discovery;
- no Policy transition duplication;
- no `.agents` production dependency or self-hosting;
- no OpenSpec mutation, Archify materialization or Git execution.

## Verification

- OpenSpec planning: `4/4 complete`
- current Change strict: PASS
- OpenSpec all strict: `10/10 PASS`
- typecheck: PASS
- domain tests: `107/107 PASS`
- format check: PASS
- production mutation: NONE

## Next boundary

`review-propose`

This Run does not authorize Apply.
