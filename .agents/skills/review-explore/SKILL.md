---
name: review-explore
description: Review Flowkit Explore evidence for truth, scope discipline, decisive proof, and Proposal readiness without demanding proof for explicit non-goals.
metadata:
  author: flowkit
---

# Review Explore Skill

## Purpose

Independently determine whether Explore is sufficiently truthful, bounded, and proven to enter Proposal.

Reviewer checks evidence quality AND scope discipline, not writing style.

## Authority Boundary

Reviewer can:

- challenge facts and assumptions
- identify missing decisive proof
- identify scope drift
- request a narrower or better-bounded model
- reject unsupported Proposal readiness

Reviewer cannot:

- modify Author artifacts
- create Owner authority
- invent a larger product requirement
- require proof for explicit non-goals merely because they are theoretically possible
- start implementation

## Review Model

### 1. Real-use-case alignment

Confirm:

- Owner goal is represented accurately;
- actors and input domains are real, not silently generalized;
- explicit Owner scope corrections are honored;
- non-goals remain non-goals.

Flag scope drift when Explore turns a bounded use case into a generic platform/subsystem without authority.

### 2. Facts and assumptions

Check:

- facts are observable/traceable;
- assumptions are labeled;
- unknowns are honest;
- historical evidence is not mistaken for a current requirement.

### 3. Risk coverage

Ask whether Explore covered the material risks that can affect the current contract.

Do NOT demand exhaustive treatment of risks outside the authorized input domain.

### 4. Proof quality

For each important proof:

```text
Question → Evidence → Decision impact → Boundary
```

Reject:

- happy-path-only proof for a material invariant;
- claims broader than evidence;
- proof branches with no relationship to the real use case being promoted into blockers.

### 5. Stop-discipline review

Ask:

- Has the Author resolved the uncertainties that can change the Proposal?
- Are remaining concerns explicitly deferred/non-goal?
- Is further exploration likely to change the current contract?

If not, do not keep Explore open merely to enumerate more theoretical edge cases.

### 6. Proposal readiness

Approve when the approved Explore can answer:

- what the Change is solving;
- the minimum required invariants;
- what evidence supports them;
- what is explicitly not being solved;
- what Proposal must formalize.

## Verdict

```text
approved
changes-requested
rejected
```

A `changes-requested` finding should identify the smallest missing fact/proof/boundary needed for Proposal readiness.

## Finding / artifact-convergence discipline

For each material finding, identify the exact affected artifact/claim, bounded observed fact, why it matters, and the minimum required correction. Use exact references when material.

Do not restate the whole Author Explore or reproduce the full proof transcript in Reviewer Run prose. Flag material superseded conclusions or review/Owner chronology that leaked into canonical Explore when that chronology is not needed to understand current truth. Reviewer remains mutation-free: request in-place Author convergence; never edit the Author artifact.
