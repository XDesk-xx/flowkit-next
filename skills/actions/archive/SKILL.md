---
name: archive
description: Execute the already-decided Flowkit archive Action with canonical OpenSpec convergence, persisted projectOrdinal naming, completion/continuity materialization, handoff, and STOP.
metadata:
  author: flowkit
---

# Archive Action Guidance

## Authority

Flowkit/Policy has already supplied the exact current legal Action `archive`.

At archive entry the Change is still `active`.
This Guidance MUST NOT decide archive legality and MUST NOT require a pre-existing `completed` Change state.

`completed` is a post-archive materialization fact owned by the existing Flowkit lifecycle/coordination contract.

This Guidance does not decide the next Change, activate another Change, perform Delivery Final, or own Git authority.

## Required inputs

Establish the exact current Delivery ID/manifest, semantic ChangeId, exact Change coordination entry, already-authorized `archive` Action, accepted terminal review/apply facts, current OpenSpec status/delta state, and handoff/continuity requirements.

Use `skills/tools/openspec/SKILL.md` for subordinate OpenSpec mechanics.

## Consume the persisted project Change ordinal

`semantic ChangeId` remains canonical Change identity. `projectOrdinal` is only a durable project-wide monotonic sequence/archive-naming fact that must already have been assigned during first actual Explore.

For the exact current Change coordination entry:

1. Require exactly one semantic ChangeId match.
2. Require an existing valid positive-integer `projectOrdinal` on that exact entry.
3. Verify assigned projectOrdinal facts are not duplicated/contradictory in durable Delivery Change coordination data relevant to this repository. If the current value is missing, malformed, duplicated or inconsistent, STOP fail-closed before archive target materialization.
4. Reuse the persisted value unchanged. Archive MUST NOT allocate, increment, compact, repair, or recompute it.
5. Format the persisted value with at least three digits for the archive name.

Never derive or substitute the archive ordinal from Delivery manifest array position, Run sequence, `changeStartSequence`, completed-Change count, archive-directory count, physical Run-group prefix, or any archive-time count.

## Archive target

Materialize:

```text
YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>
```

For current Change `converge-author-action-guidance` with persisted `projectOrdinal: 21`, the target uses `021` regardless of Run numbering.

Do not stack another date prefix.

## Package-bound archive preparation

Archive readiness is real self-check HOW, not a new Action or lifecycle state. It runs inside the already-decided `archive` invocation only after the exact canonical Guidance identity is frozen into the exact ActionPackage and before archive mutation begins.

Check at minimum, when materially applicable:

- the accepted `review-apply` after `apply` / `revise-apply` still corresponds to the exact candidate bytes;
- no post-review repository/canonical byte drift invalidated that acceptance;
- the exact Change is still the active archive target and its persisted projectOrdinal remains valid;
- OpenSpec planning/tasks/delta-sync and archive-target collision/identity facts are ready;
- an isolated canonical-convergence dry-run succeeds and the resulting converged candidate passes affected domain verification plus any materially applicable engineering gates before real archive mutation;
- completion-transition readiness is satisfied without requiring a pre-existing `completed` state;
- handoff/removal facts needed for continuation are complete;
- no known correction blocker remains.

Treat post-convergence verification as part of preparation, not as a post-mutation cleanup check. The dry-run MUST exercise the canonical bytes that archive would actually materialize. A verification failure that proves repository/canonical bytes must change is a correction blocker even when OpenSpec structural validation itself passes.

If readiness is blocked by an environment-only condition and candidate bytes remain unchanged, STOP without archive mutation and allow same-candidate retry. If readiness finds a correction requiring repository/canonical byte mutation, including a post-convergence verification failure, STOP before archive mutation and return to the existing Owner-controlled correction path; changed bytes require a fresh `review-apply` before archive can be attempted again.

A valid `review-apply` acceptance makes normal archive execution ready through existing Policy. Do not require a second Owner archive execution authorization.

## Canonical convergence

Use the applicable OpenSpec archive/sync mechanics to assess delta sync, converge approved requirements into canonical specs, verify convergence, and move the exact Change to the derived target.

Do not fork OpenSpec semantics or redesign accepted production behavior during archive.

## Completion / continuity materialization

After successful archive movement/convergence, update only existing Flowkit completion/continuity/handoff facts required by the accepted lifecycle.

This is where the Change may become `completed`; never require that state before archive.

No hidden next-Change activation is allowed.

## Complexity / scope-drift

Do not introduce production redesign, new lifecycle state, ordinal allocator/counter service, Registry/Router/Planner/Runtime, historical mass rename, automatic next Change, or automatic Git action.

## Run / handoff

Continuation must preserve the latest delta plus all materially required uncommitted ancestor state. Use cumulative payloads or exact retrievable ancestor references and carry exact removal information when needed; do not introduce a payload registry/database.

Keep the three-file Run concise and record exact archive path, persisted projectOrdinal, spec-sync result, completion/continuity facts, and material artifact/hash identities.

Keep `projectOrdinal`, `changeStartSequence`, current Run sequence and physical Run-group prefix distinct.

## Terminal boundary

After archive completion/materialization:

```text
STOP
```

Do not activate another Change, finalize the Delivery, or commit/push/merge unless a separate legal boundary supplies those actions.
