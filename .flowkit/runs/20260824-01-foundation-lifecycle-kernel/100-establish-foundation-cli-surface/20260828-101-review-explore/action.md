# Action — Review Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Action: `review-explore`
- Logical Run id: `20260828-101-review-explore`
- Role: `reviewer`
- Input Run: `20260828-100-explore`
- Review chain start: `20260828-100-explore`

## Review boundary

Reviewer independently checked 100 under the repository `review-explore` model, with special attention to keeping the first CLI as a thin surface over existing Core rather than a second lifecycle manager.

The review verified:

- Delivery state is coherent: `9 completed / 1 cancelled / 1 active / 1 planned`;
- `establish-foundation-cli-surface` is the only active Change and its declared dependencies are completed;
- the Owner `activate-change` authority fact is structurally valid;
- 100 itself introduces no production source/test mutation and no Proposal/spec/design/tasks;
- the current accepted source baseline typechecks, formats and passes the complete domain suite;
- replaying the three preceding accepted archives yields `9/9` canonical OpenSpec specs strict PASS;
- a production emit prototype can compile current `src/**` to runnable Node ESM and import the existing Core seams;
- existing Policy can produce `ready-checkpoint-evaluation` from exact completed-archive terminal facts;
- existing `OwnerAuthorityFact` is structurally sufficient for a thin exact `authorize-checkpoint` gate, while wrong Change authority is rejected;
- the proposed CLI scope correctly excludes self-hosting, Skill execution, Delivery discovery, Archify materialization, OpenSpec mutation and Git execution.

## Verdict

`changes-requested`

One blocking Explore finding remains.

### RE-101-001 — `max sequence / latest Run = current Action` is not a safe canonical inference

100's decisive proof currently proposes this V1 reconstruction path:

`listChangeRunHistory(...)`
→ select the latest/highest-sequence Run
→ use `latest.context.lifecycleState` and identity as the current Action
→ pair terminal context/result when terminal
→ call Policy.

That inference is broader than the existing durable Run contract.

Current persistence guarantees:

- each durable Run is structurally validated;
- Run sequence is unique within a Change;
- history is returned in stable sequence order;
- `previousRunId` is preserved as data.

Current persistence does **not** validate that all Runs form one continuous `previousRunId` chain, nor does it establish that the numerically greatest valid occurrence is the authoritative current Run.

Reviewer reproduced this using only current canonical APIs:

1. write a valid terminal `review-apply` Run at sequence `101`;
2. write another independently valid terminal `archive` Run at sequence `999` with `previousRunId = null`;
3. both writes succeed;
4. `listChangeRunHistory()` returns both and sequence `999` as the last record;
5. reconstructing CurrentAction from that last record and supplying `changeState=completed` causes existing Policy to return `ready-checkpoint-evaluation`.

The sequence-999 Run is structurally valid but disconnected from the earlier handoff chain. Therefore the CLI must not silently turn ordering into new current-Action authority.

This is especially important for the first stable CLI because `flowkit next` would otherwise create a lifecycle inference rule that does not exist in Run persistence, Policy or Action lifecycle contracts.

### Minimum required revise-explore boundary

Do not add a current-action registry, Run-chain database or new persistence subsystem.

Keep the existing explicit-input model and narrow it:

- caller/host supplies the exact current Run occurrence/runId (or an equivalent exact already-authoritative current Run reference) together with the existing required Delivery/Change structural context;
- CLI reads that exact durable Run through the existing controlled Run API;
- CLI reconstructs CurrentAction only from that explicitly selected exact Run;
- if the selected context is terminal, pass its exact linked context/result to Policy;
- if it is prepared, do not manufacture terminal facts;
- no `max(sequence)`, newest-mtime, directory-order or Git-order heuristic may create current-Action authority.

If a later self-hosting capability wants automatic current-Run discovery/lineage proof, that is a separate explicitly authorized concern.

The Proposal may choose the exact CLI flag/JSON field name for this current-run reference.

## Confirmed bounded directions

The following Explore decisions remain supported and should not be expanded while fixing RE-101-001:

1. **Real executable surface**
   - a small build config/package bin is justified;
   - build output is runtime artifact, not a new framework.

2. **Closed command family**
   - V1 remains exactly `status`, `next`, `doctor`;
   - no automatic next-Action execution.

3. **Policy ownership**
   - `next` calls `evaluatePolicyAndNextBoundary`;
   - CLI must not reproduce the Policy transition table.

4. **Checkpoint authorization**
   - `ready-checkpoint-evaluation` + exact canonical Owner `authorize-checkpoint` fact may be evaluated by a pure host/CLI gate;
   - authorization remains separate from Git execution;
   - no MutationDeclaration/per-file authorization returns.

5. **OpenSpec boundary**
   - reuse the existing two read-only observations;
   - OpenSpec list membership must not be reinterpreted as Flowkit `ChangeState=active`;
   - no generic OpenSpec command executor or mutation command.

6. **Archify boundary**
   - `doctor` may resolve exact Archify identity only;
   - no architecture rendering/materialization or Archify truth enters CLI lifecycle.

7. **Bootstrap/self-hosting boundary**
   - product code does not read/execute `.agents/skills/**`;
   - no Delivery-group YAML parser/current-Delivery registry/Git-branch inference is introduced.

8. **Acceptance boundary**
   - this Change makes the CLI buildable/runnable;
   - Windows/Linux whole-manager acceptance remains the final planned Change.

## Independent verification

Reviewer reconstructed the accepted source from the available checkpoint plus accepted Memo/managed-tool/OpenSpec implementation overlays and ran:

- Node proof fixture: `22.23.2`;
- typecheck: PASS;
- complete domain suite: `107/107 PASS`;
- format check: PASS;
- production source emit prototype: PASS;
- emitted Core import under Node 22.23.2: PASS;
- checkpoint Policy composition proof: PASS;
- exact checkpoint authority structural/gate proof: PASS;
- wrong Change checkpoint authority rejection: PASS;
- disconnected-latest Run counterexample: REPRODUCED.

OpenSpec canonical replay:

- archive accepted Cross-Delivery Memo change;
- archive accepted Managed Toolchain change;
- archive accepted OpenSpec Thin Integration change;
- canonical specs strict validation: `9/9 PASS`.

Current active CLI Change status remains `0/4` planning artifacts with Proposal ready.

## Review limitation

The exact checkpoint archive named by 100 (`...-698538c.zip`) was not supplied in this review turn, so its archive SHA/Git revision was not independently re-derived from that exact file.

This is non-blocking to the finding and the rest of Explore review because:

- 100 is only an activation/Explore overlay with no production implementation mutation;
- current accepted source facts were reconstructed from available accepted material;
- all material CLI/Core composition claims and the blocking current-Run inference counterexample were independently exercised.

## Non-claims

- Reviewer did not modify Author Explore artifacts.
- No Proposal/spec/design/tasks or production implementation was created.
- No new current-action persistence, Run lineage subsystem, Delivery parser, self-hosting, Git execution, Archify materialization, Full Test or Verification PASS is introduced.
