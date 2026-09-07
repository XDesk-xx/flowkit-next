# Action — Revise Apply

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: establish-delivery-finalization-contract
role: author
action: revise-apply
input: 20260905-037-review-apply
finding: D04-RA004-001
base: a170da0373867296813a888c57db8325025a8f5d
```

## Correction

The operation-local Delivery Final writer no longer serializes the complete
YAML document. It now uses the parsed canonical source ranges only to replace
the three approved existing Delivery scalar values and to append the approved
`formalVerificationCandidate` and exact `finalization` block. Unsupported
presentation shapes fail closed.

A focused presentation-sensitive fixture proves exact whole-file equality
against the expected bounded edit while retaining quoted scalars, a long
scalar, blank lines, a comment, a literal block, unrelated sections, and their
ordering. Existing same-directory staging, replace, reread, and single-target
proof remains intact.

## Boundary

No Proposal artifact, Reviewer verdict, real D04 Delivery manifest closure,
Git operation, repository integration, next Change, Stable manager, doctor, or
candidate self-management operation was executed.

STOP at `review-apply`.
