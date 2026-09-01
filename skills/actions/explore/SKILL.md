---
name: explore
description: Execute the already-decided Flowkit explore Action with proof-first bounded investigation, first-Explore project ordinal persistence, concise handoff, and STOP discipline.
metadata:
  author: flowkit
---

# Explore Action Guidance

## Authority

Flowkit/Policy has already decided the exact current Action `explore`.
This Guidance owns HOW only. It does not decide activation, legality, next Action, Role, Owner authority, Reviewer verdict, Verification truth, Change completion, Delivery Final, or Git authority.

## Required inputs

Establish the exact Delivery/Change context, Owner scope, repository base, OpenSpec facts, accepted references, explicit non-goals, and the exact current Delivery Change coordination entry.

Use `skills/tools/openspec/SKILL.md` only for subordinate OpenSpec tool mechanics. OpenSpec remains specification/artifact truth.

## First-Explore project ordinal materialization

This phase runs only after Flowkit/Owner has already made the exact Change's `explore` Action current/legal.

`semantic ChangeId` remains the canonical Change identity. `projectOrdinal` is only a durable project-wide monotonic sequence/archive-naming fact.

For the exact current Change coordination entry:

1. If a valid positive-integer `projectOrdinal` is already present, reuse it unchanged. Do not allocate again.
2. If `projectOrdinal` is absent, inspect durable already-assigned `projectOrdinal` facts from repository Delivery Change coordination entries.
3. Require every assigned fact used for sequencing to be a valid positive integer and require assigned ordinals to be unambiguous/unique. If durable facts are malformed, duplicated, contradictory, or otherwise insufficient to derive one next value safely, STOP fail-closed.
4. Derive the next value as `max(existing assigned projectOrdinal) + 1` and persist it exactly once on the exact current Change coordination entry.
5. Planned-only Changes do not reserve numbers. An explored Change that is later cancelled keeps its already-assigned ordinal consumed.

Do not derive or substitute `projectOrdinal` from Delivery manifest array position, Run sequence, `changeStartSequence`, completed/archive counts, physical Run-group prefixes, or archive-directory counting.

If no durable assigned ordinal baseline exists, STOP and require an explicit bounded bootstrap/Owner decision rather than inventing a number.

## Method

Proof before platform: prove only what can materially change the bounded contract; prefer the minimum decisive proof.

1. Separate observable `fact / assumption / unknown / future possibility`.
2. For every material uncertainty use `risk → question → minimum decisive proof → evidence → decision impact`.
3. Prefer focused source/spec inspection, controlled experiments, counterexamples, or bounded non-production fixtures.
4. Do not implement production behavior during Explore.
5. Reuse accepted contracts/tools before proposing new abstractions.
6. End with durable facts, required invariants, resolved contract-changing unknowns, explicit non-goals, limitations, smallest Proposal-ready direction, and `PASS / FAIL / UNKNOWN`.
7. Never convert UNKNOWN into PASS.

## Canonical artifact convergence

Treat canonical Explore as the current bounded proof/rationale for the Change, not as an append-only revision chronology.

Keep facts, counterexamples, failed proof, or prior observations only when they still materially explain the current invariant or limitation. Express such material as current rationale rather than as `Reviewer correction`, `Owner correction`, or revision-diary sections.

Execution/review chronology needed for durable continuation belongs on the existing Run surface only at the bounded level required by the existing concise Run contract. Prefer concise exact Run/finding references when deeper provenance is useful. Git preserves exact repository history.

File size and line count are diagnostic signals only. They may trigger a semantic duplication/convergence check but are not correctness Gates.

## Complexity / scope-drift check

Explicitly check for unjustified new capability, authority, lifecycle semantics, acceptance requirement, compatibility surface, later-Change content, or control plane.

Do not create Registry/Router/Planner/Runtime/cache/new lifecycle/identity subsystem/counter service merely to make ordinal persistence or an edge case cleaner.

## Run / handoff

Use only the existing concise three-file Run surface by default:

```text
action.md
context.json
result.json
```

Persist decisions and material identities, not duplicated canonical artifacts or command transcripts.

Keep these namespaces distinct in handoff when relevant:

```text
projectOrdinal
changeStartSequence
current Run sequence
physical Run-group prefix
```

## Terminal boundary

Successful Explore stops at:

```text
review-explore
```

Do not create Proposal content, Apply implementation, archive work, next-Change activation, Delivery finalization, or Git mutation.

STOP after the real Explore Result is materialized.
