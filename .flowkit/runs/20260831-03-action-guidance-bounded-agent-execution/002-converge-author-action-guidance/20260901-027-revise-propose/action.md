# Action — Revise Propose

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: converge-author-action-guidance
role: author
action: revise-propose
input: 20260901-026-review-explore
approved-explore: 20260901-025-revise-explore
base: 3af174bdfa2e8ebcf280e87a13565d03dec0b647
skill:
  .agents/skills/revise-propose
```

## Approved correction entering Proposal

026 approved the 025 Explore correction:

```text
planned-only Change
→ projectOrdinal absent

first actual Explore
→ assign/freeze project-wide projectOrdinal
→ persist once on exact Change coordination entry

later Actions
→ reuse persisted projectOrdinal

explored then cancelled
→ ordinal remains consumed

archive
→ requires persisted projectOrdinal
→ never allocates/recomputes it
```

Canonical Change identity remains the semantic `ChangeId`.

`projectOrdinal` is only a durable project-wide monotonic sequence / archive-naming fact.

## Numbering namespaces

These values are intentionally independent:

```text
projectOrdinal
→ 021
→ project-wide Change sequence / archive naming

changeStartSequence
→ 014
→ first Run sequence for this Change

current Run sequence
→ 027
→ this revise-propose occurrence

physical external group prefix
→ 002
→ historical handoff grouping only
```

No one of these values may be derived from or substituted for another.

## Proposal revision

Only ordinal-related planning semantics were revised:

```text
proposal.md
→ project-wide persisted projectOrdinal model
→ semantic ChangeId remains canonical identity

design.md
→ assign once at first actual Explore
→ archive consumes only persisted projectOrdinal
→ no archive-time allocation/recomputation
→ explicit numbering namespace separation

specs/author-action-guidance/spec.md
→ planned-only no reservation
→ explored Change persists one ordinal
→ cancelled-after-Explore keeps gap
→ archive consumes persisted ordinal only
→ missing/malformed ordinal fails closed

tasks.md
→ reopen only correction-relevant implementation/check/handoff work
```

Existing correct Author Guidance work is preserved.

## Current exact facts

```text
converge-author-action-guidance
→ projectOrdinal: 21
→ state: active

converge-reviewer-action-guidance
→ state: planned
→ projectOrdinal absent

022
→ next candidate ordinal only
→ not assigned
```

## Preserved boundaries

Unchanged:

```text
seven Author canonical product Guidance entries
single-file Guidance identity completeness
Mechanical Preflight inside apply/revise-apply
independent .agents bootstrap through D04
one narrow bootstrap archive wrapper
TEMPORARY-RUN-SURFACE-GUIDANCE.md retention
no historical archive mass normalization
no self-hosting takeover
no Core/Policy/ActionPackage/Run identity redesign
```

## Result

```text
PASS
026 approved Explore: preserved
OpenSpec Change strict: PASS
OpenSpec all strict: 16 / 16 PASS
git diff --check: PASS
production mutation: NONE
Apply correction: NOT STARTED
next boundary: review-propose
```

## STOP

Do not enter revise-apply until the revised Proposal is independently reviewed.
