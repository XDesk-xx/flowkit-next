# Action — Revise Explore

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: complete-formal-full-test-correction-and-platform-fixture-discipline
role: author
action: revise-explore
base: d4858d461bd5a08413b8581490e75497f4027efe
projectOrdinal: 027
changeStartSequence: 002
run: 20260902-010-revise-explore
physicalRunGroup: 002
input-review: 20260902-009-review-explore
```

Reviewer verdict was `REVISE` with exactly two blockers: `D04-R002-001` and `D04-R002-002`.

The revision is deliberately bounded:

1. Remove flowkit-next's literal six-gate commands from the generic product `delivery-full-test` HOW contract. The six gates remain only this repository's project-local D04 Full Test fixture.
2. Bind the generic operation to the exact ordered project-local checks using the already-proven ApplicableCheck declaration/checkRef vocabulary, without a Full Test Registry/Planner or ActionPackage reuse.
3. Freeze explicit Owner authorization as the legal source that makes `delivery-full-test` already-decided: existing `OwnerAuthorityFact`, `decision=authorize-formal-full-test`, exact Delivery, no Change identity, exact scope `[delivery-full-test]`.
4. Preserve all previously accepted candidate/check/admission/correction/platform-fixture conclusions.

No production code, Proposal artifact, Change 3–5 scope, historical archive, or `.agents` skill was modified.

STOP at `review-explore`.
