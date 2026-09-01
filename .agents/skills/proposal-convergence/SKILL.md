---
name: proposal-convergence
description: Converge an approved Explore into the smallest traceable, testable Proposal contract while preventing scope regression and renewed open-ended exploration.
metadata:
  author: flowkit
---

# Proposal Convergence Skill

## Purpose

Converge an approved Explore into the smallest formal Change contract that satisfies the real authorized use case.

This skill is an auxiliary Propose-stage discipline. It does not replace the normal Proposal mechanism and does not own OpenSpec lifecycle authority.

Explore may discover possibilities. Proposal commits only to what is necessary and justified.

## Core Principle

```text
Approved Explore
+ Owner decisions
+ accepted reviewer findings
→ remove alternatives and deferred branches
→ smallest explicit testable contract
```

Proposal is a convergence phase, not a second Explore phase.

## Required Inputs

Read before finalizing Proposal:

- approved/revised Explore
- latest review-explore verdict
- Owner scope/authority corrections
- relevant existing canonical specs
- relevant historical blocker closures

## Convergence Process

### 1. Build requirement traceability

Every proposed requirement MUST be justified by at least one of:

- explicit Owner requirement/decision
- approved Explore invariant/decision
- decisive proof result
- accepted reviewer blocker required to close the approved model
- existing canonical contract that must be preserved

If no source exists, default action is:

```text
remove
or
mark as non-goal/future work
```

Do not add a requirement because it "might be useful later".

### 2. Reconfirm the real input domain

Proposal MUST keep the bounded model accepted by Explore.

Reject accidental promotion such as:

```text
controlled generated identifier
→ arbitrary external identifier API
single writer
→ concurrency protocol
manual Author/Reviewer loop
→ multi-Agent orchestration
```

### 3. Choose the minimum contract

For each requirement ask:

> What is the smallest invariant that satisfies the approved real use case?

Prefer fail-closed/simple ownership constraints over new subsystems when they are sufficient.

### 4. Enforce non-goals

Explicitly carry forward important non-goals from Explore.

A deferred concern MUST NOT re-enter through design/tasks unless a new Owner decision changes scope.

### 5. Separate contract from implementation mechanism

Proposal/spec should state observable invariants and boundaries.

Design may select a mechanism, but MUST NOT introduce infrastructure beyond what the contract needs.

Avoid premature:

- registries
- schedulers
- generic abstractions
- databases/WAL
- concurrency/locking
- generalized external APIs

unless explicitly required.

### 6. Detect new unknowns

If Propose discovers a new uncertainty that can materially change the contract:

```text
STOP
→ record blocker
→ return to Explore / Owner decision
```

Do not perform an unbounded new investigation inside Proposal.

### 7. Close the Proposal

Before handoff to review-propose confirm:

- every requirement is traceable;
- acceptance is measurable;
- tasks implement only approved requirements;
- design contains no hidden scope expansion;
- non-goals are visible;
- no unresolved contract-changing unknown remains.

## Output

A convergence assessment that can be applied while creating/revising:

```text
proposal.md
specs/**/spec.md
design.md
tasks.md
```

The Proposal remains owned by the normal Change specification authority.

Keep canonical planning artifacts converged to current implementation-relevant content. Do not duplicate the approved Explore proof transcript or review/revision chronology into Proposal/Design. Preserve current rationale and use concise exact cross-artifact or Run/finding references when deeper provenance is material. File size/line count remain diagnostic only, not correctness Gates.
