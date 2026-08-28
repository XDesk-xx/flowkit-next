# Action — Review Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Action: `review-explore`
- Logical Run id: `20260828-103-review-explore`
- Role: `reviewer`
- Input Run: `20260828-102-revise-explore`
- Review chain start: `20260828-100-explore`

## Review chain

`100 explore → 101 review-explore changes-requested → 102 revise-explore → 103 review-explore`

## Review boundary

Reviewer independently checked:

- 100 and 101 historical Run records remain byte-identical;
- the Delivery manifest and OpenSpec Change scaffold remain unchanged;
- 102 changes only the approved Explore artifact and adds its durable Revise Explore Run;
- RE-101-001 is corrected by removing all implicit latest/highest-sequence current-Run inference;
- V1 now requires an exact caller/host-supplied current Run reference and reads only that exact controlled occurrence through existing persistence APIs;
- `listChangeRunHistory(...)` remains reporting/history only and does not create lifecycle authority;
- terminal selected Run contributes its exact linked context/result to Policy;
- prepared selected Run contributes no manufactured terminal facts;
- no `.flowkit/current-action.json`, Run-lineage/current-selection database, mtime/directory/Git-order heuristic or automatic current-Run selector was introduced;
- the CLI remains a thin surface over existing Policy/persistence/OpenSpec/managed-tool seams;
- checkpoint authorization remains a pure exact Owner gate separate from Git execution;
- no self-hosting, Skill execution, Delivery discovery, Archify materialization or OpenSpec mutation was added to the Explore scope.

## Verdict

`approved`

No blocking Explore finding remains. The Change is ready for Proposal.

## Closure of RE-101-001

Reviewer reproduced the original disconnected-history counterexample with current canonical APIs:

- valid terminal Run `101 review-apply`, `previousRunId = null`;
- valid terminal Run `999 archive`, `previousRunId = null`;
- both are accepted by durable Run persistence;
- history remains ordered `[101, 999]`;
- the unsafe latest/max-sequence heuristic would select Run 999 and can drive Policy to `ready-checkpoint-evaluation`.

Reviewer then selected the exact caller-supplied Run id:

`20260828-101-review-apply`

and used `parseRunOccurrenceId(...) + readDurableRun(...)` for that exact controlled address.

Result:

- exact selected Run: `101 review-apply`;
- disconnected Run 999 remains present but does not enter Policy facts;
- Policy with the selected Run and active Change facts returns `ready-action(archive)`.

Therefore the revised model prevents history ordering from silently creating current-Action authority without adding a new current-state subsystem.

## Proposal constraints

1. CLI input MUST contain an exact current Run reference (`runId` or equivalent exact occurrence) when a current Run is required.
2. CLI MUST parse/validate and read that exact occurrence through the existing controlled Run persistence API.
3. `status` may display history, but history ordering MUST NOT select authority.
4. `next` MUST compose Policy facts from the explicitly selected Run and caller-supplied structural facts; it MUST NOT reproduce Policy transitions.
5. Do not add automatic active-Delivery/current-Run discovery, current-action persistence, lineage validation, mtime/Git/directory heuristics or self-hosting in this Change.
6. Keep the checkpoint surface authorization-only; actual Git add/commit remains external.
7. Keep Archify to managed identity diagnostics only and OpenSpec to the existing read-only observation seam.
8. Build/bin work may make the CLI real and runnable, but MUST remain minimal and must not become a packaging/process framework.

## Independent verification

- Node proof fixture: `22.23.2`;
- typecheck: PASS;
- complete domain suite: `107/107 PASS`;
- format check: PASS;
- exact-current-Run counterexample/revised proof: PASS;
- canonical OpenSpec archive-replayed specs: `9/9 strict PASS`;
- current CLI Change: `0/4`, Proposal ready;
- production source/test mutation by 102: NONE.

## Non-claims

- Reviewer did not modify Author Explore artifacts.
- No Proposal/spec/design/tasks or production implementation was created.
- No current-action registry, Run-lineage subsystem, automatic Run selection, Delivery parser/discovery, self-hosting, Git execution, Archify materialization, OpenSpec mutation, Full Test or Verification PASS is introduced.
