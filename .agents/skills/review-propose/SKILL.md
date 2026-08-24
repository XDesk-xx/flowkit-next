# Review Propose Skill v2

## Purpose

Review OpenSpec Proposal before Apply.

## Authority Boundary

OpenSpec owns Change contract.

Reviewer validates the Proposal but does not replace OpenSpec.

## Review Dimensions

### Explore Alignment

Check:

Proposal scope equals approved Explore boundary.

Reject:

- hidden requirements
- unrelated refactor
- architecture expansion

### Contract Completeness

Check:

- problem is clear
- requirements are testable
- acceptance criteria are measurable

### Design Quality

Check:

- ownership is clear
- persistence impact is considered
- migration impact is considered
- unnecessary abstraction is avoided

### Verification Closure

Check:

Acceptance has matching evidence.

Evidence boundary must cover acceptance boundary.

## Common Failures

Reject:

"Improve stability"

without measurable acceptance.

Reject:

"While here" changes.

## Verdict

approved
changes-requested
rejected
