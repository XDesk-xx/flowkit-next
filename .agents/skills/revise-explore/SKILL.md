---
name: revise-explore
description: Revise Flowkit Explore after reviewer findings or Owner scope correction using the minimum proof and boundary correction needed for re-review.
metadata:
  author: flowkit
---

# Revise Explore Skill

## Purpose

Repair Explore after reviewer findings or Owner scope correction while preserving stage discipline.

The objective is not "more Explore" by default. The objective is the smallest correction needed to restore a truthful, bounded, Proposal-ready Explore.

## Authority Priority

Apply authority in this order:

1. explicit Owner scope/authority decision;
2. accepted Delivery/Change boundary;
3. reviewer finding;
4. prior Author exploratory direction.

When Owner narrows the real use case, revise the Explore around the corrected input domain even if earlier proof explored broader possibilities.

## Process

### 1. Read the triggering input

Classify it as:

- missing decisive evidence
- incorrect assumption
- missing material risk
- invalid proof boundary
- scope drift / over-generalization
- authority issue
- Owner scope correction

### 2. Identify the smallest semantic correction

Ask:

- What exact conclusion is wrong/incomplete?
- Does the finding belong to the real current input domain?
- Can the risk be closed by narrowing ownership/generation rather than designing a generic subsystem?

### 3. Revise only necessary Explore material

Update as needed:

- facts
- risks
- proof
- decisions
- limitations/non-goals
- Proposal direction

Preserve useful historical proof as rationale when appropriate, but downgrade it from blocker if the corrected scope makes it non-target.

### 4. Re-run focused proof

Run only proof necessary for the corrected boundary.

Do not continue an obsolete proof branch just because earlier reviews opened it.

### 5. Re-evaluate Proposal readiness

The revised Explore should clearly state:

- current real use case
- minimum contract
- decisive proof
- deferred/non-goal concerns
- whether any blocker remains

## Forbidden

Do not:

- erase failed historical evidence;
- rewrite facts merely to obtain PASS;
- expand scope to satisfy a finding;
- turn every edge case into a new protocol;
- implement production code;
- generate Proposal artifacts.

## Output

A revised Explore ready for independent re-review, or an explicit blocked/unknown result.
