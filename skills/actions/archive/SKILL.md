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

Keep the three-file Run concise and record exact archive path, persisted projectOrdinal, spec-sync result, completion/continuity facts, and material artifact/hash identities.

Keep `projectOrdinal`, `changeStartSequence`, current Run sequence and physical Run-group prefix distinct.

## Terminal boundary

After archive completion/materialization:

```text
STOP
```

Do not activate another Change, finalize the Delivery, or commit/push/merge unless a separate legal boundary supplies those actions.
