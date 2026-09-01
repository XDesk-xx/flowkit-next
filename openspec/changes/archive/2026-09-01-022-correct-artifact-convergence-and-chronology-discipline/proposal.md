## Why

D03 real execution shows that repeated review/revise cycles can leave superseded conclusions and revision chronology inside canonical OpenSpec artifacts even though the same execution history is already durably preserved by `.flowkit/runs` and Git. This makes current truth harder to read and risks teaching the upcoming Reviewer Guidance to reproduce the same verbosity pattern.

## What Changes

- Tighten Author artifact-convergence HOW so `explore.md`, `proposal.md`, and `design.md` preserve the current material proof/decision/rationale rather than an append-only revision diary.
- Make `revise-explore` and `revise-propose` converge Reviewer findings in place: replace/remove superseded claims, preserve unaffected current truth, and retain failed proof/counterexamples only when they still explain the current contract.
- Preserve traceability without duplication: canonical artifacts keep rationale still needed to understand the current design and may reference exact Run/finding provenance; `.flowkit/runs` keeps only the concise current-Action execution/finding/revision facts and bounded reasoning required for durable continuation, while Git keeps exact repository history. Run ownership does not require exhaustive discussion or proof transcripts.
- Bring the independent D03/D04 `.agents` Author/Reviewer bootstrap HOW to the minimum parity needed to exercise the same bounded finding/convergence discipline before product Reviewer Guidance is created in the next Change.
- Keep file-size/line-count observations diagnostic only; introduce no hard Markdown-size Gate, new Run schema, document-history subsystem, Reviewer mutation authority, or product Reviewer Skill in this Change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `author-action-guidance`: add explicit canonical-artifact convergence and provenance-separation requirements for Author-owned Explore/Propose revision behavior.

## Impact

Expected mutation is limited to existing Author Action Guidance under `skills/actions/**`, matching independent bootstrap HOW under `.agents/skills/**`, and focused Guidance tests. `src/**`, ActionPackage/Policy/Run-Result contracts, package dependencies, OpenSpec vendor mechanics, and the three product Reviewer Guidance entries remain unchanged. `TEMPORARY-RUN-SURFACE-GUIDANCE.md` remains until later proof shows it can safely be removed.
