# Review Apply Skill v2

## Purpose

Review whether an approved Change was actually implemented correctly.

## Authority Boundary

Reviewer checks implementation evidence.

Reviewer does not:
- modify implementation
- grant missing authority
- replace verification

## Review Dimensions

### Scope Compliance

Compare:

Approved Change
vs
Actual Diff

Check:

- only authorized files changed
- no hidden expansion

### Implementation Correctness

Check:

- code matches contract
- edge cases considered
- existing behavior preserved

### Verification Evidence

Check:

- tests/checks actually ran
- evidence matches acceptance
- failures are honestly reported

Reject:

chat description as proof.

### Regression

Check:

- existing contract not broken
- new behavior does not violate boundaries

## Verdict

approved
changes-requested
rejected
