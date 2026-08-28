# Action — Review Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Action: `review-apply`
- Logical Run id: `20260828-109-review-apply`
- Role: `reviewer`
- Input Run: `20260828-108-apply`
- Review chain start: `20260828-100-explore`

## Review chain

`100 explore → 101 review-explore changes-requested → 102 revise-explore → 103 review-explore approved → 104 propose → 105 review-propose changes-requested → 106 revise-propose → 107 review-propose approved → 108 apply → 109 review-apply`

## Review boundary

Reviewer independently checked implementation fidelity, scope containment and executable evidence under the repository `review-apply` discipline.

The review verified:

- historical Runs 100–107 remain byte-identical in the 108 transfer;
- approved Explore / Proposal / Design / Spec / Delivery manifest remain unchanged;
- 108 changes only task completion plus the approved CLI/build/package implementation and its durable Apply Run;
- package dependency sets remain unchanged;
- command catalog is closed to `status | next | doctor`;
- `next` supports exactly the approved explicit current-Run authority forms:
  - exact runId → canonical occurrence parsing + exact durable Run read only;
  - explicit `currentRunId:null` → no Run read/history scan and direct null CurrentAction/terminal facts;
- omitted/malformed currentRun input fails closed;
- disconnected higher-sequence history cannot influence an exact selected Run or explicit-null branch;
- `next` delegates lifecycle legality to canonical Policy and does not duplicate the transition table;
- checkpoint authorization is a pure exact Owner gate and performs no Git operation;
- `status` is a read-only projection of exact selected Run + approved OpenSpec observations;
- `doctor` resolves exact managed OpenSpec/Archify and exact-root OpenSpec observation, while Archify is never invoked;
- fake PATH/global OpenSpec/Archify cannot take over;
- production CLI does not read/execute `.agents/skills/**`, discover active Delivery/current Run, self-host the workflow, mutate OpenSpec, materialize Archify architecture, or execute Git;
- new/modified TypeScript files satisfy the approved <500-line code gate.

## Verdict

`approved`

No blocking Apply finding remains.

## Independent executable proof

Reviewer rebuilt the accepted baseline with the 108 Apply overlay and used the exact detached Node `22.23.2` proof fixture.

### Static / regression

- typecheck: PASS;
- complete domain suite: `116/116 PASS`;
- format check: PASS;
- production build: PASS;
- emitted `dist/cli/entrypoint.js` retains Node shebang;
- OpenSpec Change planning: `4/4 complete`;
- current Change strict validation: PASS;
- OpenSpec validate-all strict: `10/10 PASS`;
- tasks: `13/13 all_done`.

### Real managed runtime

Using actual managed fixtures:

- OpenSpec `1.10.0`;
- Archify `2.15.0`.

`flowkit doctor` result:

- OpenSpec runtime PASS;
- Archify runtime PASS;
- exact OpenSpec root PASS;
- overall doctor PASS.

With fake `openspec` and `archify` executables prepended to PATH:

- doctor still PASS using managed runtimes;
- fake executables were not invoked.

### Explicit current-Run authority

Reviewer created two valid but disconnected durable Runs:

- sequence `101` terminal `review-propose`, approved → apply;
- sequence `999` terminal `archive`.

Selecting exact Run `101` through the emitted CLI returned:

`ready-action(apply)`

The disconnected higher-sequence Run did not affect the decision.

Explicit:

`currentRunId: null`

returned:

`ready-action(explore)`

even when unrelated higher-sequence history existed.

Omitting `currentRunId` returned exit `2` with closed `invalid-request`.

### Checkpoint gate

Reviewer created an exact terminal archive Run and invoked `next` with:

- `changeState=completed`;
- exact archive runId;
- exact matching `authorize-checkpoint` OwnerAuthorityFact.

Result:

- Policy: `ready-checkpoint-evaluation`;
- checkpoint: `authorized=true`.

The proof repository contained no `.git` before or after the command.

Therefore authorization is reported only; no Git repository or Git mutation is created.

Wrong/malformed checkpoint authority fails closed.

### Machine transport

- unknown command → exit `2`, `invalid-command`;
- malformed JSON → exit `2`, `invalid-request-json`;
- invalid checkpoint authority → exit `2`, `invalid-checkpoint-authority`;
- valid Policy `blocked` and authorization `false` remain successful formal machine outcomes as covered by the focused suite.

## Implementation convergence

The implementation reuses existing seams:

- durable Run persistence;
- canonical Policy;
- managed-tool resolution;
- OpenSpec thin observation;
- OwnerAuthorityFact validation.

It does not add:

- a current-action registry;
- Run-lineage/current-selection subsystem;
- automatic Delivery/current-Run discovery;
- generic command/process framework;
- MutationDeclaration/per-file mutation authority;
- Git wrapper/executor;
- Archify materialization;
- Skill/self-hosting runtime;
- new dependencies.

## Review reconstruction note

The exact `698538c` checkpoint ZIP named in the Author Run was not part of the current user upload. Reviewer reconstructed the accepted implementation baseline from the retained accepted repository material and prior approved managed-tool/OpenSpec overlays, then applied the 108 delta. Material code/spec/runtime claims were independently executed against that reconstructed canonical baseline.

## Non-claims

- Reviewer did not modify Author implementation or planning artifacts.
- `review-apply = approved` is not Delivery Verification PASS.
- No archive, Git checkpoint, Owner archive authority, final cross-platform Full Test, self-hosting or Delivery promotion was performed.
