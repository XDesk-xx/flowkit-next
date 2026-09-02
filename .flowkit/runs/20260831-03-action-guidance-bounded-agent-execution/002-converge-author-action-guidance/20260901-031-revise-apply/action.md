# Action — Revise Apply

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: converge-author-action-guidance
role: author
action: revise-apply
input: 20260901-030-review-propose
approved-explore-review: 20260901-026-review-explore
approved-proposal-review: 20260901-030-review-propose
prior-apply: 20260901-020-apply
base: 3af174bdfa2e8ebcf280e87a13565d03dec0b647
```

## Purpose

Revise the earlier Apply candidate to implement the approved 029/030 projectOrdinal contract without reopening already-correct Author Guidance.

## Exact correction

```text
first actual Explore
→ exact Explore already current/legal
→ reuse persisted projectOrdinal when present
→ otherwise derive next only from durable already-assigned projectOrdinal facts
→ validate positive-integer / unique / internally consistent facts
→ persist max(existing assigned projectOrdinal) + 1 exactly once
→ STOP fail-closed on ambiguity/inconsistency/no durable baseline

archive
→ read exact persisted projectOrdinal only
→ validate exact Change + ordinal consistency
→ YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>
→ never allocate/recompute/fallback
```

Updated implementation HOW surfaces:

```text
skills/actions/explore/SKILL.md
skills/actions/archive/SKILL.md
.agents/skills/explore-proof-based/SKILL.md
.agents/skills/archive/SKILL.md
```

Focused proof updated in:

```text
tests/unit/domain/author-action-guidance.test.ts
```

Current durable coordination fact:

```text
converge-author-action-guidance
→ projectOrdinal: 21

converge-reviewer-action-guidance
→ planned
→ projectOrdinal absent
```

Numbering namespaces remain separate:

```text
project Change ordinal = 021
changeStartSequence = 014
current Run sequence = 031
external physical Run group prefix = 002
```

`semantic ChangeId` remains canonical identity. `projectOrdinal` is sequence/archive-naming fact only.

## Mechanical Preflight

```text
Node                              22.23.2
pnpm                              11.22.0
OpenSpec                          1.10.0
Guidance/resolver focused tests   17 / 17 PASS
Domain tests                      165 / 165 PASS
Detached acceptance                4 / 4 PASS
git diff --check                 PASS
TypeScript typecheck             PASS
Prettier                         PASS
ESLint                           PASS
Forbidden tracked artifacts      PASS
Dependency Health                58 modules / 213 dependencies / 0 violations
Repository Entropy               25 / 25 production modules reachable
Build                            PASS
OpenSpec Change strict           PASS
OpenSpec all strict              16 / 16 PASS
Tasks                            17 / 17 complete
```

No production Core source, package/lock dependency graph, or OpenSpec vendor archive mechanics were changed.

## Boundary

No archive, next Change activation, Delivery finalization, Git checkpoint, commit, push or merge is performed here.

```text
nextBoundary: review-apply
STOP
```
