# Action — Review Propose

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: correct-artifact-convergence-and-chronology-discipline
role: reviewer
action: review-propose
input: 20260901-036-propose
approved-explore: 20260901-035-review-explore
base: 9e551bbc50e47d063fdc8185b2f488bb76f0cfbd
projectOrdinal: 022
changeStartSequence: 034
run: 20260901-037-review-propose
physicalRunGroup: 003
```

## Verdict

```text
CHANGES REQUESTED
```

The Proposal correctly preserves the approved corrective scope and is structurally valid.

One bounded formal-contract correction is required before Apply.

No re-Explore, redesign, Core change, or new subsystem is required.

---

# D03-RP-003 — Run ownership wording is too strong and can re-create the verbosity defect in `.flowkit/runs`

035 approved the ownership boundary:

```text
canonical artifact
→ current material truth / proof / invariant / decision / trade-off

Run
→ current Action execution chronology / findings / invalid candidate / revision sequence

Git
→ exact accepted repository bytes/history
```

But 035 also independently proved that Reviewer Runs themselves are currently over-verbose:

```text
Reviewer:
9 Runs
→ 4,191 action.md lines

Author:
11 Runs
→ 744 action.md lines
```

and explicitly reaffirmed the existing temporary Run discipline:

```text
normal action.md target
→ ~20–60 lines

>80 lines
→ exception requiring justification

Reviewer Run
→ verdict
→ blocking finding IDs
→ bounded reasoning
→ exact references
```

Therefore the approved boundary was:

```text
Run owns chronology
AND
Run remains concise
```

not:

```text
Run must preserve detailed discussion / detailed chronology
```

---

# 036 drift

036 currently uses stronger wording in multiple planning artifacts.

`proposal.md`:

```text
.flowkit/runs keeps detailed execution/review chronology
```

`design.md`:

```text
Preserve current design rationale while keeping detailed correction chronology in Runs/Git.

Runs own detailed provenance
```

Formal `author-action-guidance` delta spec:

```text
Detailed Action/finding/revision chronology SHALL remain in existing `.flowkit/runs` history
```

and:

```text
the detailed Reviewer discussion remains in Run history
```

This can be read as a new normative requirement to persist exhaustive discussion in Runs.

That would risk merely moving the revision diary from:

```text
canonical Explore / Design
```

into:

```text
Reviewer action.md
```

while preserving the exact verbosity pattern the corrective Change is intended to reduce.

---

# Required revise-propose

Normalize the ownership wording back to the approved 035 boundary.

Preferred semantic shape:

```text
canonical artifact
→ current converged material truth / proof / rationale

Run
→ concise current-Action execution/finding/revision facts
→ bounded reasoning
→ exact references when material

Git
→ exact complete repository history
```

The formal requirement should say, for example:

```text
Execution/review chronology needed for durable Action continuation
SHALL remain on the existing Run surface at the bounded level required by
the existing Run contract and Guidance.

Canonical artifacts SHALL NOT duplicate that chronology.

This requirement SHALL NOT require exhaustive Reviewer discussion,
full proof transcripts, or revision diaries to be copied into Run prose.
```

A simpler equivalent is acceptable.

The important invariant is:

```text
ownership
≠ duplication obligation
```

and:

```text
Run chronology ownership
≠ detailed prose archive
```

---

# Where to revise

At minimum normalize the stale/over-strong wording in:

```text
proposal.md
design.md
specs/author-action-guidance/spec.md
```

`tasks.md` already points in the correct direction:

```text
bounded finding/reference discipline
avoid full Author-artifact restatement
```

so no task redesign is required unless wording alignment needs a small clarification.

---

# Why this is blocking

This Change exists because real proof showed two related problems:

```text
canonical artifact
→ chronology leakage

Reviewer Runs
→ excessive prose / duplication
```

A formal contract saying:

```text
detailed Reviewer discussion SHALL remain in Runs
```

would cure the first symptom while formalizing the second.

That is a semantic regression even though OpenSpec syntax is valid.

The correction is wording/ownership precision only.

---

# Approved Proposal direction — otherwise PASS

The Proposal correctly preserves:

```text
canonical artifact
→ current material truth / rationale

revise-explore / revise-propose
→ convergence-in-place by default

superseded claims
→ replace/remove

still-material counterexample
→ retain as current rationale

cross-artifact proof duplication
→ reference by default

hard byte/line Gate
→ rejected

TEMPORARY-RUN-SURFACE-GUIDANCE.md
→ retained

product Reviewer Skills
→ remain Change 3

bootstrap Reviewer parity
→ .agents only

self-hosting takeover
→ absent
```

No new product capability is introduced.

---

# Formal product boundary — PASS

036 modifies only:

```text
author-action-guidance
```

for product semantics.

This is the smallest correct formal capability boundary because Author owns mutation of:

```text
explore.md
proposal.md
design.md
```

The corrective does not create a new:

```text
artifact convergence platform
document history capability
Run-history capability
Reviewer product capability
```

---

# Reviewer product Guidance boundary — PASS

The Proposal explicitly leaves:

```text
skills/actions/review-explore
skills/actions/review-propose
skills/actions/review-apply
```

outside this Change.

Bootstrap Reviewer HOW under:

```text
.agents/skills/**
```

may receive only the minimum D03/D04 execution parity required to:

```text
emit bounded findings
use exact references
avoid full Author-artifact restatement
flag chronology leakage
remain mutation-free
```

That does not pre-implement Change 3 product Guidance.

---

# Hard size Gate / persistence-platform non-goals — PASS

036 correctly rejects:

```text
hard Markdown byte threshold
hard line-count threshold
Markdown linter/AST platform
Artifact Registry
Document History DB
Evidence Platform
new Run schema
new lifecycle
Registry / Router / Planner / Runtime
```

Size remains diagnostic only.

No new persistence authority is introduced.

---

# Artifact / review-chain integrity — PASS

Reviewer verified:

```text
036 inputReviewerPackageSha256
→ matches exact 035 Reviewer package
→ 73752958ed41c699b7fe98f55df368013b55c55a64eb96e2f4b88c063ffd3059
```

All declared exact hashes match package bytes:

```text
explore.md
→ 32b694f1672b95cae59f7c6f580770d9126d9cfd46f161bac9db5e08cb082797

proposal.md
→ 633500c49b4c4545203a08e90b9ae2dbb8a431255aba7694f764098e6108157a

design.md
→ b683bbcbccc637a6509445f9c3d055d89bc0ae12e5600330df5c4c89a59b88bf

author-action-guidance delta
→ 3139fd4e07c7c8a90ef1218dfcfcde0650c459ba8048366df30b0c55e8912710

tasks.md
→ 01a885c9a1d3225211c7c5fe4eb1f5555a1730398e4ad7115fccb43702705870

Delivery manifest
→ 0b1dd2ea6d6ee90d412d3eaed6a8f21e285687ac64064109edbf10a378256f77
```

---

# Independent validation

Reviewer restored exact base:

```text
9e551bbc50e47d063fdc8185b2f488bb76f0cfbd
```

and overlaid the exact 036 package.

Using exact:

```text
Node 22.23.2
OpenSpec 1.10.0
```

Reviewer reran:

```text
git diff --check
→ PASS

openspec validate correct-artifact-convergence-and-chronology-discipline --strict
→ PASS

openspec validate --all --strict
→ 17 / 17 PASS
```

The blocker is semantic contract precision, not structural validation.

---

# Complexity assessment

The Proposal remains:

```text
MINIMAL / GUIDANCE-ONLY
```

D03-RP-003 requires no new structure.

The fix only removes an over-strong prose obligation.

No:

```text
Core contract
Run schema
new persistence surface
new lifecycle
new Standard Action
Registry
Router
Planner
Runtime
```

is needed.

---

# New-content / scope-drift assessment

Compared with approved 035 Explore:

```text
new product capability
→ NONE

new authority
→ NONE

new lifecycle
→ NONE

product Reviewer Guidance pulled forward
→ NONE

self-hosting convergence
→ NONE

new persistence platform
→ NONE

scope expansion
→ NONE
```

But there is one bounded semantic drift:

```text
Run chronology ownership
→ strengthened into detailed chronology/discussion persistence obligation
```

Therefore:

```text
scope drift
→ NONE

formal semantic drift
→ YES, bounded to Run prose/detail obligation
```

The correct fix is to converge wording back to the existing concise Run contract.

---

# Current-step explanation

This Review Propose verifies that the approved Explore has been translated into a precise
formal OpenSpec contract before Apply mutates Author/bootstrap Guidance.

Result:

```text
artifact convergence model
→ PASS

revise-in-place
→ PASS

current-rationale retention
→ PASS

Reviewer product boundary
→ PASS

hard size Gate rejection
→ PASS

Core/persistence non-goals
→ PASS

OpenSpec strict
→ PASS

Run ownership wording
→ one bounded correction required

complexity
→ minimal

scope expansion
→ none
```

Next boundary:

```text
revise-propose
```

STOP.
