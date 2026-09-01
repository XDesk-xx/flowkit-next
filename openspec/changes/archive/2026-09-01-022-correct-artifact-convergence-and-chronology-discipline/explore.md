# Explore — Correct Artifact Convergence and Chronology Discipline

## 1. Owner boundary

Owner has revised D03 composition and activated this bounded corrective Change before `converge-reviewer-action-guidance`.

Goal:

```text
canonical OpenSpec artifacts
→ current converged truth

.flowkit/runs
→ create-once execution / review chronology

Git
→ accepted repository bytes and history
```

The correction is HOW-first. It must not create a document platform, new lifecycle, Reviewer mutation authority, hard Markdown-size Gate, or self-hosting takeover.

Current numbering namespaces are separate:

```text
projectOrdinal          = 022
changeStartSequence     = 034
current Run sequence    = 034
physical Run group      = 003
```

`projectOrdinal` was assigned only because this Change has now actually entered Explore. Planned `converge-reviewer-action-guidance` still has no `projectOrdinal`.

## 2. Observable repository evidence

### Canonical Explore growth is recurrent

At base `9e551bb`, eight archived `explore.md` files exceed 20 KB. Examples:

```text
27,936 B  establish-action-lifecycle-domain-contract
25,613 B  establish-run-result-persistence
24,131 B  establish-trusted-change-coordination-state-binding
23,982 B  converge-author-action-guidance
```

Change 2 final artifacts:

```text
explore.md   23,982 B / 995 lines
design.md    12,001 B / 187 lines
proposal.md   4,414 B /  32 lines
tasks.md      5,587 B /  29 lines
```

Size is diagnostic only. A large artifact is not automatically wrong.

### Chronology leaks into canonical Explore

Change 2 final `explore.md` contains explicit revision-history sections:

```text
Owner correction after the invalid 022 archive candidate
15A. Owner rollback / prior-candidate disposition
15B. Reviewer 024 finding convergence
```

The same chronology is already durably represented by create-once Runs:

```text
022 archive
023 revise-explore
024 review-explore
025 revise-explore
```

Those Runs preserve the invalid candidate, Owner correction, exact finding, revised conclusion and next boundary. Therefore retaining the same sequence as appended canonical-Explore history is not required to preserve execution truth.

### Reviewer Run verbosity is also material

For Change 2:

```text
9 Reviewer action.md files
→ 4,191 lines total

11 Author action.md files
→ 744 lines total
```

Several Reviewer actions are 300–600 lines. This is inconsistent with the existing temporary rule that Reviewer Runs should persist verdict, blocking finding IDs, bounded reasoning and exact references rather than a second copy of Author artifacts or full proof transcripts.

## 3. Root-cause proof

Existing product Author Guidance already says “concise”, but the revise HOW does not define a strong replacement rule for superseded canonical content.

Current `revise-explore` says to preserve unaffected content and perform minimum correction. Bootstrap `revise-explore` additionally says historical proof may be preserved as rationale “when appropriate”. Neither clearly distinguishes:

```text
material counterexample still needed by current contract
vs
revision chronology already owned by Runs
```

Current bootstrap Reviewer HOW checks proof quality and findings, but does not explicitly require:

```text
bounded finding references
no full Author-artifact restatement
chronology leakage as a convergence finding
no demand that revision diary remain in canonical artifacts
```

The stable three-file Run surface already exists, so a new persistence mechanism is not required.

## 4. Correct ownership boundary

The smallest durable invariant is:

```text
canonical OpenSpec artifact
→ current material truth only
→ current proof / invariant / decision / trade-off

Run
→ who did what, finding chronology, invalid candidate facts, revision sequence

Git
→ accepted repository bytes/history
```

“Current material truth only” does not mean deleting useful failed proof. If an earlier failure/counterexample still explains the current invariant, rewrite it into the current rationale without preserving the execution timeline around it.

Example:

```text
wrong:
Reviewer 024 said X, Owner then corrected Y, so revision Z happened

preferred canonical form:
Invariant Y is required because counterexample X demonstrates failure mode Z
```

The chronology remains in Runs.

## 5. Convergence-in-place rule

For `revise-explore` and `revise-propose`, default behavior should be:

```text
exact finding
→ locate affected current claim/decision
→ replace/remove superseded text in place
→ preserve unaffected current truth
→ retain only still-material evidence
→ STOP
```

Do not append a “Reviewer correction / Owner correction / revision history” section merely because a revision occurred.

Exceptions are semantic, not chronological: retain historical facts only when the fact itself remains necessary to understand the current contract or risk.

Proposal/design discipline should similarly separate responsibilities:

```text
proposal.md
→ current scope / intent / capability delta

design.md
→ current decisions / trade-offs needed for implementation

explore.md
→ current bounded proof / conclusions

tasks.md
→ current implementation checklist
```

These artifacts should reference rather than duplicate one another.

## 6. Reviewer-side boundary before Change 3

This corrective Change must not create product:

```text
skills/actions/review-explore
skills/actions/review-propose
skills/actions/review-apply
```

Those remain Change 3.

However, D03/D04 self-development still uses independent `.agents/skills/**`. To validate the corrected interaction before Change 3 product convergence, the smallest bootstrap parity may update existing bootstrap Reviewer HOW to require:

```text
bounded findings
exact artifact/claim references
no full artifact restatement
chronology leakage / superseded-content retention as review findings when material
Reviewer remains mutation-free
```

This is bootstrap HOW maintenance, not self-hosting and not premature product Reviewer Guidance.

## 7. Author/product and bootstrap surfaces likely affected

Proof supports a bounded correction around existing HOW, primarily:

```text
product Author:
skills/actions/explore/SKILL.md
skills/actions/revise-explore/SKILL.md
skills/actions/propose/SKILL.md
skills/actions/revise-propose/SKILL.md

independent Author bootstrap as needed:
.agents/skills/explore-proof-based/SKILL.md
.agents/skills/revise-explore/SKILL.md
.agents/skills/proposal-convergence/SKILL.md
.agents/skills/revise-propose/SKILL.md

independent Reviewer bootstrap as needed:
.agents/skills/review-explore/SKILL.md
.agents/skills/review-propose/SKILL.md
.agents/skills/review-apply/SKILL.md
```

OpenSpec-prefixed vendor/tool mechanics are not the target.

`TEMPORARY-RUN-SURFACE-GUIDANCE.md` should remain until Change 3 proves Reviewer product convergence and the independent bootstrap plane no longer needs the temporary bridge.

## 8. Specification boundary

No new Core capability is proven necessary.

The smallest formal product delta is expected to **modify the existing `author-action-guidance` capability** with artifact-convergence requirements for Author-owned artifact mutation. Reviewer product requirements remain deferred to Change 3.

Run-result persistence semantics do not need modification: Runs already provide create-once chronology and stable three-file history.

No new `artifact-convergence` Registry/capability platform is justified.

## 9. Verification direction

Proposal should require focused proof that:

1. Author canonical/revise Guidance says canonical artifacts converge to current truth rather than append revision chronology.
2. Superseded statements are replaced/removed while still-material counterexamples are preserved as current rationale.
3. Proposal/design do not duplicate Explore or revision diary by default.
4. Bootstrap Reviewer HOW produces bounded findings/references and does not require canonical chronology retention.
5. Product Reviewer Skills remain absent until Change 3.
6. `.agents` never consumes candidate `skills/actions/**` during D03/D04.
7. No hard byte/line correctness Gate is introduced.
8. No Core source, Run schema, Registry, Planner, Runtime or Evidence Platform is added.

Change 3 should then serve as immediate live validation of this corrected Author↔Reviewer interaction.

## 10. Explicit non-goals

```text
hard explore/design byte limits
Markdown linter / AST platform
Artifact Registry / Document History DB
Evidence Platform
new Run artifact type or Run schema
new lifecycle / Action
Reviewer mutation authority
product Reviewer Skills in this Change
OpenSpec vendor-skill rewrite
self-hosting takeover
Windows native unreadable-file correction
historical projectOrdinal/archive normalization
```

The Windows and historical-normalization issues remain separate future corrective scopes.

## 11. Explore conclusion

```text
artifact convergence problem              REAL
20KB threshold as correctness rule         REJECTED
canonical truth / chronology ownership gap REAL
new Core capability required               NO
new persistence system required            NO
Author Guidance correction                 REQUIRED / BOUNDED
bootstrap Author parity                     LIKELY REQUIRED
bootstrap Reviewer parity                   REQUIRED FOR LIVE VALIDATION
product Reviewer Guidance                   DEFER TO CHANGE 3
TEMPORARY Run bridge deletion               NOT YET SAFE
self-hosting convergence                    FORBIDDEN
Change 3 as live validation                 YES
```

Verdict:

```text
PASS
```

The Change is bounded and Proposal-ready.

STOP at independent `review-explore`.
