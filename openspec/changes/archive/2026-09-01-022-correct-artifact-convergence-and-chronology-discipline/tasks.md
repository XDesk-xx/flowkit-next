## 1. Converge product Author Guidance

- [x] 1.1 Tighten `skills/actions/explore/SKILL.md` so canonical Explore owns current bounded proof/rationale and does not default to revision chronology; verify the focused Author Guidance test asserts the rule.
- [x] 1.2 Tighten `skills/actions/revise-explore/SKILL.md` to replace/remove superseded claims in place while preserving still-material counterexamples as current rationale; verify focused tests distinguish rationale from revision diary.
- [x] 1.3 Tighten `skills/actions/propose/SKILL.md` and `skills/actions/revise-propose/SKILL.md` so Proposal/Design own only current implementation-relevant content and reference rather than duplicate Explore/revision history; verify focused tests assert the separation.
- [x] 1.4 Preserve identity completeness by keeping all Flowkit-specific normative Author HOW inside each canonical product `SKILL.md`; verify no new top-level product Action Guidance identity is added.

## 2. Maintain independent bootstrap parity

- [x] 2.1 Update only the required `.agents` Author bootstrap HOW to apply the same convergence-in-place/current-rationale distinction; verify the bootstrap files do not read or execute candidate `skills/actions/**` Guidance.
- [x] 2.2 Tighten existing `.agents/skills/review-explore`, `review-propose`, and `review-apply` to use bounded finding/reference discipline, avoid full Author-artifact restatement, and flag material chronology leakage without mutating Author artifacts; verify all three product Reviewer Guidance entries remain absent.
- [x] 2.3 Retain `TEMPORARY-RUN-SURFACE-GUIDANCE.md` unchanged unless implementation proof demonstrates an already-approved minimal correction is required; verify no premature bridge deletion or self-hosting convergence occurs.

## 3. Focused proof and non-goal guards

- [x] 3.1 Extend `tests/unit/domain/author-action-guidance.test.ts` with focused assertions for current-truth convergence, in-place revise, still-material rationale retention, bounded bootstrap Reviewer findings, and provenance separation; run the focused test successfully.
- [x] 3.2 Add guards proving no hard byte/line correctness threshold, new Run schema/artifact, product Reviewer Skill, or production Core `src/**` dependency is introduced; run the focused test successfully.
- [x] 3.3 Run `git diff --check` and OpenSpec strict validation for this Change and all canonical specs; verify both pass before Reviewer handoff.

## 4. Handoff discipline

- [x] 4.1 Produce the Apply handoff with exact changed-artifact hashes, focused proof results, complexity/scope-drift assessment, and `nextBoundary: review-apply`; verify no implementation beyond this approved Guidance-only scope is included.
