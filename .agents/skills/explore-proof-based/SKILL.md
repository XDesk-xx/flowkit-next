---
name: explore-proof-based
description: Proof-based Explore for Flowkit changes. Use to investigate contract-changing unknowns, persist first-Explore project ordinal facts in the independent bootstrap plane, bound real scope, and stop exploration before it drifts into non-goal subsystems.
metadata:
  author: flowkit
---

# Explore Proof-Based Skill

## Purpose

Execute Explore as a bounded, proof-based investigation before Proposal.

Explore exists to answer:

> What must be true for this Change to be proposed safely, and what is the smallest real problem boundary?

Explore may broaden the question space temporarily, but it MUST NOT silently broaden the product input domain or turn the Change into a generic subsystem.

## Authority Boundary

Policy / Owner authority decides whether an Action is legal.

This skill defines HOW Explore is performed after the exact Explore Action is already current/legal.

Explore evidence is not approval. Reviewer approval is still required before Proposal.

Owner scope correction overrides prior exploratory direction. When Owner narrows the real use case, obsolete proof branches become historical risk evidence, not mandatory Proposal blockers.

This independent D03/D04 bootstrap skill MUST NOT read or execute candidate `skills/actions/explore/SKILL.md`.

## First-Explore project ordinal bootstrap parity

`semantic ChangeId` remains canonical identity. `projectOrdinal` is only a durable project-wide monotonic sequence/archive-naming fact.

After the exact Explore Action is already legal/current:

1. Read the exact Delivery Change coordination entry.
2. If it already has a valid positive-integer `projectOrdinal`, reuse it unchanged.
3. If absent, inspect durable already-assigned `projectOrdinal` facts from repository Delivery Change coordination entries.
4. Require the durable assigned facts to be valid, unique and internally consistent. On malformed, duplicate, contradictory or insufficient facts, STOP fail-closed.
5. Derive the next value only as `max(existing assigned projectOrdinal) + 1` and persist it exactly once on the exact current Change entry.
6. Planned-only Changes reserve nothing. An explored-then-cancelled Change keeps its assigned ordinal consumed.

Never use Delivery array position, Run number, `changeStartSequence`, completed/archive counts, physical Run-group prefix, or archive-directory counting as fallback sequencing input.

If there is no durable assigned ordinal baseline, STOP for an explicit bounded bootstrap/Owner decision rather than inventing an initial value.

This is bootstrap HOW maintenance only. It does not decide activation/legality and does not create a Registry, counter service, allocator subsystem, new lifecycle state or self-hosting convergence.

## Core Principle

For each material uncertainty:

```text
Risk
→ Question
→ Proof
→ Evidence
→ Decision impact
→ Boundary
```

Proof budget follows decision impact.

Do not prove edge cases merely because they exist. Continue proof only when the uncertainty can change the current contract, block the real use case, or invalidate an important assumption.

## Process

### 1. Establish the real use case

Record:

- Owner-stated goal
- current Delivery / Change scope
- real actors and inputs
- existing contracts/specs
- known non-goals

Separate:

```text
Facts
Assumptions
Unknowns
Future possibilities
```

Do not treat a future possibility as a current input domain without authority.

### 2. Scan material risks

Consider only risks relevant to the current Change, including when applicable:

- authority / identity
- lifecycle boundary
- persistence/state integrity
- compatibility
- migration
- verification closure
- future direct consumer impact
- scope expansion

### 3. Prioritize proof

For each important risk ask:

1. Is it inside the real authorized input domain?
2. Can it change the contract?
3. Can it block the minimum real use case?

If all three are no:

```text
record as limitation / future risk if valuable
→ stop exploring that branch
```

### 4. Execute minimum decisive proof

Allowed:

- targeted source/spec inspection
- controlled experiment
- focused fixture/test
- counterexample
- small non-production prototype

Forbidden:

- unrelated refactor
- production implementation
- architecture expansion
- generic subsystem design not required by the real use case
- exhaustive proof of explicitly deferred input domains

### 5. Reduce proof into decisions

For every proof, record:

- what it established
- what decision it changes or supports
- what it does NOT establish

A proof with no decision impact should not become a Proposal requirement by default.

### 6. Produce Proposal-ready boundary

Explore should end with:

- problem statement
- durable facts
- required invariants
- resolved key unknowns
- remaining limitations
- explicit non-goals / deferred concerns
- minimum Proposal direction
- PASS / FAIL / UNKNOWN

## Stop Conditions

Stop Explore successfully when:

- the minimum real use case is bounded;
- key contract-changing unknowns are resolved;
- remaining unknowns are outside the authorized input domain or explicitly deferred;
- a Proposal can be written without inventing new scope.

Stop Explore as blocked when:

- required authority is missing;
- a key claim cannot be supported;
- the real scope cannot be bounded;
- ordinal persistence facts are ambiguous/inconsistent;
- a newly discovered issue requires Owner scope/priority decision.

Never convert UNKNOWN into PASS.

## Anti-Drift Rules

Reject these patterns:

```text
edge case discovered
→ enlarge input domain
→ discover more edge cases
→ build generic subsystem
```

Prefer:

```text
edge case discovered
→ ask whether input is real
→ constrain generation/ownership when appropriate
→ prove the bounded model
→ defer non-goals
```
