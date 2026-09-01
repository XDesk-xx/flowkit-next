---
name: archive
description: Independent D03/D04 flowkit-next bootstrap archive wrapper that consumes persisted projectOrdinal naming/handoff/STOP around existing OpenSpec archive mechanics without consuming candidate product Guidance.
metadata:
  author: flowkit
---

# Bootstrap Archive Wrapper

## Scope

This file exists only for flowkit-next's independent D03/D04 self-development plane.

It is not the product archive Guidance and MUST NOT read, execute, or delegate to `skills/actions/archive/SKILL.md`.

Flowkit/Policy has already supplied the exact legal Action `archive`.

## Composition

```text
exact current Change coordination entry
↓
consume persisted projectOrdinal
↓
existing .agents/skills/openspec-archive-change mechanics
↓
Flowkit completion / handoff facts
↓
STOP
```

## Persisted project ordinal

`semantic ChangeId` remains canonical Change identity. `projectOrdinal` is only the durable project-wide monotonic sequence/archive-naming fact previously assigned during first actual Explore.

Read the exact current Delivery manifest and exact Change coordination entry:

```text
openspec/delivery-groups/<delivery-id>.yaml
```

Require:

1. exactly one exact semantic ChangeId match;
2. an existing valid positive-integer `projectOrdinal` on that exact Change;
3. no duplicate/contradictory assigned projectOrdinal fact in durable repository Delivery Change coordination data.

STOP fail-closed on missing, malformed, duplicated, contradictory or otherwise inconsistent ordinal facts.

Archive MUST NOT allocate, increment, compact, repair or recompute an ordinal. It MUST NOT fall back to Delivery array position, Run number, `changeStartSequence`, completed/archive counts, physical Run-group prefixes, or archive-directory counting.

Archive target:

```text
YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>
```

Use the persisted value unchanged and zero-pad to at least three digits.

## OpenSpec mechanics

Reuse:

```text
.agents/skills/openspec-archive-change/SKILL.md
```

for OpenSpec status, delta-sync assessment, canonical convergence, movement mechanics, and warnings.

Where generic OpenSpec mechanics would use a date-only target, this wrapper supplies the Flowkit-specific target above. Do not make OpenSpec/vendor semantics own Flowkit `projectOrdinal` assignment or identity.

## Completion semantics

Archive executes while the Change is active after legality is already established.

Do not require pre-existing `completed`.

After successful archive convergence/movement, materialize only the existing Flowkit completion/continuity/handoff facts required by the lifecycle.

## Independence / minimality

Do not consume candidate product Guidance.
Do not create mirror wrappers for the other six Author Actions merely for symmetry.
Do not introduce a Registry/Router/Planner/Runtime/counter service/allocator subsystem/new lifecycle state.

## Run / handoff / STOP

Keep the standard three-file Run concise and record the exact archive path, persisted projectOrdinal, spec-sync/completion facts and identities needed for continuation.

Keep projectOrdinal separate from Run sequence, changeStartSequence and external physical group prefix.

Do not activate the next Change, perform Delivery finalization, or exercise Git authority inside archive.

STOP after the archive Result.
