# Review Explore Skill v2

## Purpose

Independently verify whether Explore evidence is sufficient for Proposal.

Reviewer checks evidence quality, not writing style.

## Authority Boundary

Reviewer:

Can:
- identify missing proof
- request clarification
- reject unsupported conclusions

Cannot:
- modify Author artifacts
- create Owner authority
- decide implementation

## Review Model

### Facts

Check:

- Are facts observable?
- Are assumptions separated?
- Are claims traceable?

### Risk Coverage

Check:

Did Explore identify relevant:

- scope risk
- dependency risk
- persistence risk
- verification risk
- compatibility risk

### Proof Quality

For each proof:

Question:
Does it address the actual risk?

Evidence:
Does it support the conclusion?

Boundary:
Is the conclusion limited correctly?

Reject:

PASS based only on:
- happy path fixture
- single machine result
- same environment reuse

### Proposal Readiness

Confirm:

Explore conclusion is strong enough to create Proposal.

## Verdict

approved
changes-requested
rejected
