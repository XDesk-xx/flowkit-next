# Action — Review Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Action: `review-propose`
- Logical Run id: `20260828-105-review-propose`
- Role: `reviewer`
- Input Run: `20260828-104-propose`
- Review chain start: `20260828-100-explore`

## Review chain

`100 explore → 101 review-explore changes-requested → 102 revise-explore → 103 review-explore approved → 104 propose → 105 review-propose`

## Review boundary

Reviewer independently checked:

- all 15 files carried from the 103 reviewer payload remain byte-identical in 104;
- 104 adds only Proposal/spec/design/tasks plus its durable Propose Run;
- the RE-101-001 correction remains intact: history ordering is non-authoritative and an exact current Run, when one exists, must be explicitly caller-selected;
- no automatic Delivery/current-Run discovery, current registry, Run-lineage subsystem, self-hosting, Skill execution, OpenSpec mutation, Archify materialization, Git execution or second lifecycle manager was introduced;
- `status | next | doctor` remains a closed CLI command family;
- `next` delegates transition legality to canonical Policy;
- checkpoint authorization remains a pure exact Owner gate separate from Git execution;
- build/bin design remains plain TypeScript emit and does not turn Node 22.23.2 into exact product runtime authority;
- current source/spec baseline remains healthy.

## Verdict

`changes-requested`

One blocking Proposal contract hole remains.

### RP-105-001 — `next` cannot represent the canonical no-current-Run initial Policy state

The approved Policy contract has a formal initial active-Change state:

```text
changeState = active
currentAction = null
terminalRunContext = null
terminalResult = null
ownerCorrection = null
→ ready-action(explore)
```

Reviewer independently invoked the existing canonical `evaluatePolicyAndNextBoundary(...)` with those exact facts and received:

```json
{"kind":"ready-action","actionId":"explore"}
```

104 currently specifies `next` as requiring an exact selected durable Run/currentRunId and reconstructing CurrentAction from that Run.

That makes the first stable CLI unable to express a newly activated Change that has no Run yet, even though this is a canonical Policy state and requires no discovery or inference.

This is a contract-completeness gap, not a request for automatic state discovery.

### Minimum required revise-propose correction

Keep the explicit-input authority model and make the no-current state explicit.

A minimal V1 shape is:

- the request field is present explicitly;
- `currentRunId: <canonical run id>` means:
  - parse/read exactly that Run;
  - reconstruct current Action only from that exact occurrence;
- `currentRunId: null` means:
  - caller explicitly asserts there is no current Run;
  - CLI does not scan history;
  - CLI constructs `currentAction = null`;
  - CLI passes `terminalRunContext = null`;
  - CLI passes `terminalResult = null`;
  - canonical Policy decides the boundary.

Missing/omitted `currentRunId` may remain an invalid request if the command schema wants to distinguish omission from explicit no-current state.

Do NOT:

- scan history to prove emptiness;
- infer no-current from missing directories;
- add current-action persistence;
- add a Run-lineage/current-selection registry;
- add Delivery discovery.

Add focused contract/tasks coverage for:

1. `next` + explicit no-current Run + active Change → canonical `ready-action(explore)`;
2. explicit exact Run → existing selected-Run behavior remains unchanged;
3. missing/malformed current-run field → fail closed according to the final request schema;
4. disconnected higher-sequence history does not influence either explicit branch.

`status` may use the same explicit nullable form if the Proposal wants status on a newly activated Change, but the blocker requires at minimum that `next` can expose the canonical Policy initial state.

## Confirmed Proposal boundaries

- Build surface remains one minimal `flowkit` bin with a separate emit config.
- `status`, `next`, `doctor` remain the only commands.
- Policy transition table is not duplicated.
- Existing Run persistence APIs remain unchanged.
- Checkpoint gate checks only `ready-checkpoint-evaluation` + exact `authorize-checkpoint` Owner authority and performs no Git mutation.
- OpenSpec remains read-only through the existing observation seam.
- Archify remains diagnostic identity only in `doctor`.
- Valid Policy `blocked` and `authorized=false` remain formal machine outcomes.
- Production code remains independent of `.agents/skills/**`.
- Final Windows/Linux whole-manager acceptance remains deferred.

## Independent verification

Reviewer reconstructed the accepted source baseline and overlaid 104 planning:

- Node proof fixture: `22.23.2`;
- typecheck: PASS;
- complete domain suite: `107/107 PASS`;
- format check: PASS;
- OpenSpec Change planning: `4/4 complete`;
- current Change strict validation: PASS;
- canonical archive-replayed OpenSpec specs + current Change: `10/10 strict PASS`;
- production mutation by 104: NONE;
- 103 carried files preserved: `15/15 byte-identical`.

## Non-claims

- Reviewer did not modify Author planning artifacts.
- No Apply/source/test/build mutation was performed.
- `review-propose = changes-requested` is not Verification FAIL.
- No automatic discovery, self-hosting, Git execution, Archify materialization, OpenSpec mutation, Full Test or Owner promotion is introduced.
