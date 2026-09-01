---
name: review-propose
description: Review a Proposal for Explore traceability, minimality, contract completeness, non-goal enforcement, and readiness for Apply.
metadata:
  author: flowkit
---

# Review Propose Skill

## Purpose

Review whether Proposal has correctly converged the approved Explore into a minimal, complete, testable contract before Apply.

## Authority Boundary

Reviewer validates the Proposal but does not replace the specification authority.

Reviewer may request correction of contract holes or scope regression.

Reviewer must not use review-propose to restart open-ended exploration or introduce unrelated future architecture.

## Review Dimensions

### 1. Explore traceability

For every material requirement ask:

> Why is this required?

Valid sources include:

- Owner decision
- approved Explore invariant/decision
- decisive proof
- accepted reviewer blocker
- existing canonical requirement

Reject untraceable "while here" requirements.

### 2. Scope convergence

Confirm:

- Proposal scope equals the approved Explore boundary;
- Owner scope corrections are honored;
- deferred/non-goal branches have not silently returned;
- the real input domain has not been generalized.

### 3. Minimal contract

Check whether a smaller invariant can satisfy the same approved use case.

Reject unnecessary subsystem growth, especially abstractions introduced only for hypothetical future cases.

### 4. Contract completeness

Check:

- problem is clear;
- requirements are normative/testable;
- observable failure behavior is defined where material;
- acceptance criteria are measurable;
- tasks cover the requirements without adding new scope.

### 5. Design discipline

Check:

- ownership is clear;
- persistence/migration impact is considered when relevant;
- design does not create a second authority/state machine;
- implementation mechanism is proportional to the approved model.

### 6. Verification closure

Acceptance must have a plausible matching verification path.

Do not require Delivery-level verification inside an ordinary Change unless the contract says so.

## Finding Discipline

A blocking finding should describe a contract hole in the approved model.

Prefer the smallest correction. Example:

```text
history must not be overwritten
→ require create-once / duplicate rejection
```

Do not automatically escalate to:

```text
locking + WAL + database + distributed coordination
```

unless the approved input model requires them.

## Finding / artifact-convergence discipline

Keep each material finding bounded to the exact affected planning artifact/claim, observed contract defect, why it matters, and the minimum required correction; cite exact references when material.

Do not restate the full Proposal/Design/Explore or copy proof transcripts into Reviewer Run prose. Flag material revision chronology or superseded planning text that leaked into canonical artifacts, but remain mutation-free and require the Author to converge the affected text in place.

## Verdict

```text
approved
changes-requested
rejected
```
