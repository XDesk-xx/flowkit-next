---
name: review-apply
description: Review whether an approved Change was implemented faithfully and minimally, with real evidence and without redesigning the Proposal during Apply.
metadata:
  author: flowkit
---

# Review Apply Skill

## Purpose

Review whether the approved Proposal was implemented faithfully, minimally, and verifiably.

Apply review is not a new design stage.

## Authority Boundary

Reviewer checks implementation evidence.

Reviewer does not:

- modify implementation;
- grant missing authority;
- replace Delivery Verification;
- redesign Proposal from scratch;
- approve hidden scope expansion.

## Review Dimensions

### 1. Proposal fidelity

Compare:

```text
Approved requirements/design/tasks
vs
Actual source/test/config mutations
```

Every meaningful implementation mutation should trace to the approved contract.

### 2. Scope compliance

Check:

- only required files/areas changed;
- no deferred/non-goal capability was added;
- Apply did not turn a minimal contract into a generic subsystem.

### 3. Implementation correctness

Check:

- code satisfies normative requirements;
- fail-closed behavior is correct where specified;
- edge cases required by the Proposal are covered;
- existing canonical behavior remains intact.

### 4. Verification evidence

Confirm checks actually ran and match Change acceptance.

Reject chat claims as proof when repository/test evidence is required.

Keep semantic separation between:

- Author conclusion
- Reviewer verdict
- Verification verdict

`review-apply = approved` is not Delivery Verification PASS.

### 5. Contract-defect detection

If implementation reveals that the approved Proposal itself is materially wrong or impossible:

```text
STOP
→ report contract blocker
→ recommend Owner-authorized boundary return (for example revise-propose)
```

Do not demand that Apply silently redesign the contract.

## Verdict

```text
approved
changes-requested
rejected
```

## Implementation Convergence Check

Apply the `implementation-convergence` discipline during review:

- every material mutation must trace to an approved requirement or necessary verification;
- existing seams should be reused before new abstractions are introduced;
- unrelated cleanup, speculative framework work, and future-scope code are review findings;
- new dependencies or architectural layers require clear approved-contract necessity;
- a Proposal defect must be reported as a boundary-return issue, not accepted because the code "works";
- prefer the smallest implementation that faithfully satisfies the approved contract.

Do not reject a simple implementation merely because a more generalized architecture is imaginable.

## Finding / handoff concision discipline

For each material Apply finding, identify the exact affected implementation/artifact/claim, observed fact, contract impact, and minimum required correction; use exact references when material.

Do not restate the whole Author Apply handoff, Proposal, or test transcript in Reviewer Run prose. If accepted-artifact chronology/superseded text materially leaks into the Apply handoff, flag the issue without mutating Author artifacts. Reviewer remains independently mutation-free.
