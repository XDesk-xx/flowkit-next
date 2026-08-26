---
name: revise-apply
description: Correct Apply-stage implementation defects minimally; stop and return for Owner-authorized Proposal repair when the approved contract itself is defective.
metadata:
  author: flowkit
---

# Revise Apply Skill

## Purpose

Correct implementation-stage defects after review-apply while preserving the approved Proposal boundary.

## Revision Process

### 1. Classify the finding

- implementation defect
- missing required test/verification
- evidence mismatch
- unauthorized scope mutation
- approved-contract defect

### 2. Decide whether the fix belongs to Apply

If the approved contract is correct and implementation is wrong:

```text
revise-apply
→ minimum code/test correction
```

If the finding shows the approved Proposal itself must change materially:

```text
STOP
→ do not rewrite Proposal inside Apply
→ require Owner-authorized return to revise-propose / earlier boundary
```

### 3. Apply minimum implementation correction

- change only what the approved contract requires;
- remove accidental scope expansion when necessary;
- rerun affected verification plus required regression checks.

### 4. Preserve verdict/authority separation

Do not modify reviewer verdicts or fabricate Verification/Owner facts.

## Forbidden

Do not:

- hide failing tests;
- remove inconvenient evidence;
- expand scope to make a test pass;
- introduce deferred/non-goal capabilities;
- repair a Proposal defect by silently changing implementation semantics;
- continue to another lifecycle Action automatically.

## Output

Corrected implementation + evidence ready for independent review-apply.

## Implementation Convergence During Revision

When correcting Apply findings:

1. repair only the implementation defect actually proven by review;
2. reuse the existing seam whenever it can satisfy the approved contract;
3. remove accidental abstractions, dependencies, or unrelated refactors introduced during Apply;
4. do not respond to a narrow defect by generalizing the subsystem;
5. if the required fix changes the approved contract, STOP and request the proper Owner-authorized boundary return.

The revision target is the smallest faithful implementation, not a broader redesign.
