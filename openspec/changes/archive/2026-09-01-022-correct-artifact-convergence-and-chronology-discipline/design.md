## Context

See `proposal.md` for motivation and `explore.md` for the repository proof. The existing truth/history surfaces are already sufficient:

```text
OpenSpec Change artifacts → current specification/planning truth
.flowkit/runs              → create-once Action / finding chronology
Git                        → exact repository history
```

The defect is therefore HOW-level convergence, not missing persistence. D03/D04 also retain the independent `.agents/skills/**` self-development plane; candidate `skills/actions/**` must not drive its own development/review.

## Goals / Non-Goals

**Goals:**

- Make Author Explore/Propose revisions converge current artifacts in place.
- Preserve current design rationale while keeping only bounded continuation-relevant correction facts/reasoning in Runs and exact repository evolution in Git.
- Give bootstrap Reviewer HOW enough bounded-finding discipline to validate this behavior before Change 3 creates product Reviewer Guidance.
- Keep the correction testable with focused Guidance proof and no Core mutation.

**Non-Goals:**

- Hard byte/line limits or Markdown linting.
- New document/history/evidence persistence.
- New lifecycle state, Action, Registry, Planner, Runtime or Reviewer mutation authority.
- Product `review-explore`, `review-propose`, or `review-apply` Guidance; those remain Change 3.
- Removing `TEMPORARY-RUN-SURFACE-GUIDANCE.md` before later proof.

## Decisions

### 1. Canonical artifacts own current rationale; Runs own concise Action provenance

Canonical artifacts keep the reasoning still required to understand the current contract. They do not need to preserve the chronological story of every rejected candidate or correction. Existing Runs preserve only the bounded current-Action facts, findings, revision outcome, reasoning, and exact references needed for durable continuation; they are not exhaustive discussion archives. Git preserves exact repository evolution.

When deeper provenance is useful, a concise exact pointer is sufficient, for example:

```text
Decision rationale: <current reason>
Provenance: finding D03-RE-004 / Run 024
```

The pointer is not a new truth authority; it lets a future reader follow from current rationale to the bounded historical Run/finding fact without requiring either the canonical artifact or Run prose to duplicate a full discussion transcript.

**Alternative rejected:** copy Reviewer findings/correction history into Design for auditability, or require Runs to preserve exhaustive discussion. Either approach duplicates material and recreates the verbosity defect on another surface.

### 2. Revise converges in place by default

For `revise-explore` and `revise-propose`:

```text
exact finding
→ locate affected current claim
→ replace/remove superseded text
→ preserve unaffected current truth
→ rewrite still-material counterexample as current rationale
→ record concise Run result/provenance
→ STOP
```

A historical fact stays canonical only when the fact itself remains material to the current proof—not merely because it happened during a revision.

**Alternative rejected:** append `Reviewer correction`, `Owner correction`, or `finding convergence` sections after every revision. That preserves chronology twice and causes linear artifact growth across review cycles.

### 3. Artifact responsibilities stay separated

```text
explore.md  → current bounded proof / conclusions
proposal.md → current scope / capability delta
design.md   → implementation-relevant decisions / trade-offs / rationale
tasks.md    → current implementation checklist
Runs        → concise Action/finding/revision facts + bounded reasoning/references
Git         → exact history
```

Cross-artifact references are preferred over copying large proof passages.

### 4. Bootstrap Reviewer parity is bounded and temporary in purpose

This Change may tighten existing `.agents/skills/review-{explore,propose,apply}` so D03/D04 reviewers:

- identify the exact affected artifact/claim;
- state bounded material findings and required correction;
- do not restate whole Author artifacts/proof transcripts;
- flag material superseded-content/chronology leakage;
- never mutate Author artifacts or require revision diaries to remain canonical.

This does not create product Reviewer Guidance and does not switch self-development to `skills/actions/**`.

### 5. Size remains a diagnostic signal only

No fixed byte/line number is normative. An unusually large artifact may trigger a semantic check for duplicated proof, superseded conclusions or chronology leakage; legitimate complexity may still justify a large artifact.

**Alternative rejected:** `explore.md > N KB → FAIL`. File size is not equivalent to semantic redundancy.

## Risks / Trade-offs

- **[Risk] Over-concision removes rationale needed by future maintainers** → Keep the current reason/trade-off/counterexample whenever it is still material; remove only chronology that does not change current understanding.
- **[Risk] Provenance becomes hard to follow after removing revision diary text** → Allow concise exact Run/finding references; Runs preserve bounded continuation-relevant facts/reasoning, while Git preserves exact repository history. No surface is required to duplicate a full discussion transcript.
- **[Risk] Bootstrap Reviewer edits accidentally pre-implement Change 3** → Restrict bootstrap edits to D03/D04 execution parity; keep all three product Reviewer entries absent.
- **[Risk] Guidance becomes a de facto size policy** → Tests assert semantic rules/non-goals, not byte thresholds.
