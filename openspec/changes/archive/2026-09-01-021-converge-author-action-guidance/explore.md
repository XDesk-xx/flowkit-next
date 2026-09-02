# Explore — Converge Author Action Guidance

## 1. Authorized boundary

```text
delivery:
20260831-03-action-guidance-bounded-agent-execution

change:
converge-author-action-guidance

base:
3af174bdfa2e8ebcf280e87a13565d03dec0b647

role:
author

action:
explore
```

Owner activated this exact Change for proof-based Explore.

Current execution HOW intentionally remains on the independent repository bootstrap plane:

```text
.agents/skills/openspec-explore
+
.agents/skills/explore-proof-based
```

The product-side candidate under:

```text
skills/actions/**
```

MUST NOT drive the D03/D04 Author session that is still developing/reviewing it.

No Proposal, Apply, Archive, Git checkpoint, or self-hosting migration is authorized by this Explore.

---

## 2. Problem statement

Change 1 already established the trusted product execution seam:

```text
already-decided StandardActionId
↓
skills/actions/<actionId>/SKILL.md
↓
canonical path + exact file-content SHA-256
↓
ActionGuidanceRef
↓
ActionPackage
↓
ActionPackageRef
↓
ApplicableCheck executionInputRef
```

But the repository currently contains only:

```text
skills/actions/README.md
```

No product-side canonical Author Action Guidance bodies exist yet.

The Change 2 problem is therefore:

> Converge the already-proven Author execution knowledge into the exact seven Author `StandardActionId` entries under `skills/actions/**`, preserving current authority/lifecycle boundaries and keeping the product HOW minimal, content-bound, and non-self-hosting.

---

## 3. Proven exact Author Action set

Current Policy owns the Author Action set as exactly:

```text
explore
revise-explore
propose
revise-propose
apply
revise-apply
archive
```

This is a strict subset of the current closed ten-value `StandardActionId` set.

Therefore Change 2 requires exactly seven top-level canonical product entries:

```text
skills/actions/explore/SKILL.md
skills/actions/revise-explore/SKILL.md
skills/actions/propose/SKILL.md
skills/actions/revise-propose/SKILL.md
skills/actions/apply/SKILL.md
skills/actions/revise-apply/SKILL.md
skills/actions/archive/SKILL.md
```

Change 2 MUST NOT create additional top-level Action identities for:

```text
proof-based
proposal-convergence
implementation-convergence
mechanical-preflight
handoff
Run-concision
archive-ordinal
```

Those are methods/phases/disciplines inside the stable Action entries.

---

## 4. Existing bootstrap knowledge is sufficient migration input

Current independent bootstrap material already contains the required Author HOW ingredients:

```text
explore
→ .agents/skills/openspec-explore
→ .agents/skills/explore-proof-based

propose
→ .agents/skills/openspec-propose
→ .agents/skills/proposal-convergence

apply
→ .agents/skills/openspec-apply-change
→ .agents/skills/implementation-convergence

revise-explore
→ .agents/skills/revise-explore

revise-propose
→ .agents/skills/revise-propose

revise-apply
→ .agents/skills/revise-apply

archive mechanics
→ .agents/skills/openspec-archive-change
```

Additional repository facts already exist for:

```text
Run concision / three-file surface
handoff / continuation
semantic invariant / literal discipline
minimum mutation
scope drift
STOP discipline
D02 mechanical quality/preflight facts
```

Therefore no new methodology platform is required.

The product entries should **synthesize** accepted project HOW from these sources; they must not depend on `.agents/skills/**` at runtime.

---

## 5. Canonical product Guidance must remain identity-complete at the current boundary

Change 1 deliberately binds exact product Guidance identity to only:

```text
skills/actions/<actionId>/SKILL.md
+
exact bytes SHA-256
```

It does not hash:

```text
transitive project Guidance dependencies
shared product HOW files
Guidance dependency graphs
content closures
```

This creates an important Change 2 constraint.

If execution-semantic project-owned normative HOW were moved into a shared subordinate file:

```text
canonical SKILL.md bytes unchanged
+
shared normative file bytes changed
↓
GuidanceRef unchanged
```

then the current content-bound identity would no longer identify the complete project-owned normative HOW used by that Action.

Therefore the minimum Change 2 rule is:

> **Each canonical Author `SKILL.md` must itself contain the complete Flowkit-specific normative HOW required to execute that Action at the current contract boundary.**

Allowed subordinate references remain limited to things that do not silently extend the product Guidance identity, for example:

```text
OpenSpec vendor/tool mechanics
repository facts/specs used as execution inputs
non-normative explanatory references
```

Change 2 does NOT need to introduce:

```text
shared normative Guidance graph
transitive hashing
Guidance dependency registry
content closure planner
```

If future proof demonstrates a real need for execution-relevant shared product HOW outside the canonical file, that is a separate identity-closure question.

---

## 6. Author Action convergence model

### explore

Canonical `explore` should preserve:

```text
observable repository facts
fact / assumption / unknown separation
proof before platform
minimum decisive proof
reuse before subsystem
explicit non-goals
Proposal-ready bounded conclusion
Run concision
handoff
STOP at review-explore
```

OpenSpec explore mechanics remain subordinate tool mechanics.

### propose

Canonical `propose` should preserve:

```text
consume approved Explore
preserve accepted scope
trace requirement boundaries
minimum contract
no speculative subsystem
OpenSpec proposal artifact mechanics
scope-drift / complexity check
concise handoff
STOP at review-propose
```

### apply

Canonical `apply` should preserve:

```text
consume exact approved Proposal
implementation convergence
minimum mutation
reuse before new abstraction
preserve non-goals
D02 mechanical preflight facts
minimum relevant verification
handoff completeness
scope-drift / complexity check
STOP at review-apply
```

Mechanical Preflight remains an internal `apply` / `revise-apply` phase, not a Standard Action or separate required Change.

### revise-explore / revise-propose / revise-apply

Each revise entry should preserve:

```text
consume exact Reviewer findings
preserve already-approved material
change only findings-relevant scope
rerun only newly relevant proof/checks
no opportunistic redesign
explicit new-content/scope-drift statement
STOP at the corresponding review boundary
```

### archive

Canonical `archive` should preserve:

```text
consume an exact current `archive` Action only after review-apply approval while the Change is still active
reuse OpenSpec archive/spec-sync mechanics
materialize completion only after successful archive convergence
materialize Flowkit archive naming invariant
no production redesign
no hidden next Action
handoff / continuity facts
concise Run
STOP
```

---

## 7. Archive ordinal defect is a real Author-HOW gap

### Owner correction after the invalid 022 archive candidate

The prior Explore went through two incorrect models:

```text
first incorrect model:
ordinal = current Delivery manifest position

second incorrect model:
ordinal = project-wide sum of all planned Delivery manifest slots
```

The first reset numbering at each Delivery.

The second corrected the cross-Delivery direction but still assigned identity too early by treating planning order as a global identity reservation.

Owner invalidated the `20260901-022-archive` materialization before any Git checkpoint / Delivery Final / accepted-main integration and returned this Change to `revise-explore`.

Reviewer 024 then established the narrower lifecycle boundary:

```text
planned Change
→ no project-wide Change ordinal

Change actually enters Explore
→ assign/freeze one project-wide Change ordinal

same Change later:
review-explore
propose / revise-propose
review-propose
apply / revise-apply
review-apply
archive
→ reuse the same already-assigned ordinal

explored then cancelled
→ ordinal remains consumed
→ never reuse it

planned but never explored
→ consumes no ordinal
```

Therefore the archive naming invariant remains:

```text
YYYY-MM-DD-<3-digit project-wide Change ordinal>-<semantic ChangeId>
```

but Archive does **not** allocate or recompute that ordinal.

Archive only consumes the durable already-assigned Change ordinal.

### D01 cancelled 008 proves assignment-at-Explore rather than planning reservation

D01 contains:

```text
establish-mutation-and-git-checkpoint-boundary
→ real Explore Run exists:
   20260827-077-explore
→ later cancelled
```

Therefore its project Change ordinal `008` remains consumed.

The durable fact supports:

```text
explored
→ assigned
→ later cancelled
→ assigned number remains consumed
```

It does not imply:

```text
planned-only Delivery slot
→ automatically reserves a project ordinal
```

### D03 Change 3 is still unassigned

Current D03 coordination state:

```text
converge-reviewer-action-guidance
→ planned
→ no Explore Run
```

Therefore it has no project Change ordinal yet.

At the current boundary:

```text
022
→ next candidate project ordinal only
→ NOT assigned to converge-reviewer-action-guidance
```

If another corrective/new Change actually enters Explore first, that Change may consume `022`.

Reviewer Guidance would then receive the next available ordinal only when it later enters Explore.

### Current Change 2 remains 021

The numeric value for the current Change does not change.

Historical proof:

```text
prior actually-assigned Change ordinals
→ 001..020

current Change:
converge-author-action-guidance
→ first entered Explore at Run 014
→ assigned/froze project Change ordinal 021
```

The defect was the derivation/authority model, not the current Change's numeric value.

### Minimal durable persistence

Reviewer 024 raised one narrow proof question:

> Once Explore assigns a project Change ordinal, where can later Actions consume that exact assigned fact without recomputing identity at Archive?

The current repository already has a repository-owned durable Delivery Change coordination record.

The minimum reuse is one small optional field on the exact Change entry:

```yaml
- id: "converge-author-action-guidance"
  projectOrdinal: 21
  state: active
```

Semantics:

```text
planned-only Change
→ projectOrdinal absent

first actual Explore
→ assign next project-wide ordinal
→ persist projectOrdinal once

later Actions
→ read/reuse exact persisted projectOrdinal

cancelled after Explore
→ keep projectOrdinal

archive
→ require existing projectOrdinal
→ never allocate/recompute it
```

For the current Owner-corrected Change, `projectOrdinal: 21` is materialized now as the durable form of the already-assigned ordinal.

This field does not change:

```text
ChangeState
Policy legality
Owner activation authority
Run/Result identity
ActionPackage identity
```

and current trusted Change coordination resolution already ignores unrelated Change-entry fields when resolving canonical `state` / `dependsOn` / activation provenance.

Therefore the current proof does **not** justify:

```text
global counter service
ordinal Registry
allocator service
new lifecycle state
new identity subsystem
background sequencing engine
```

The archive Guidance can fail closed when the exact active Change lacks a valid assigned `projectOrdinal`.

Future first-Explore assignment may use the highest already-persisted assigned project ordinal as the forward high-watermark and then persist the next number exactly once. No planned-only Change reserves a value.

The currently known next candidate is:

```text
022
```

but it remains unassigned.

### Run numbering and Change numbering are separate namespaces

This correction must not reuse one number for another semantic purpose.

There are distinct numbering surfaces:

```text
A. project Change ordinal
   → project-wide Change identity sequence
   → assigned only when Change first enters Explore
   → current Change = 021
   → used by archive directory naming

B. Run occurrence sequence
   → execution occurrence sequence inside the current Delivery Run history
   → 023 = prior revise-explore
   → 024 = Reviewer review-explore
   → current revise-explore = 025

C. canonical changeStartSequence
   → Run-address fact for the exact Change root
   → first Run sequence for that Change
   → current Change first entered at Run 014
```

Therefore:

```text
project Change ordinal 021
≠ Run 021
≠ current Run 025
≠ changeStartSequence 014
```

The existing external-orchestrator physical group prefix:

```text
.flowkit/runs/.../002-converge-author-action-guidance/
```

is historical external handoff grouping from this uncommitted D03 execution and MUST NOT be interpreted as:

```text
project Change ordinal
canonical changeStartSequence
current Run sequence
```

Product contract/guidance must not derive archive numbering from that prefix.

The current OpenSpec archive mechanics still only own the vendor date/spec-sync/move mechanics and remain subordinate.

The correct Change 2 product archive rule is:

```text
exact current archive Action already decided
↓
resolve exact current Delivery + Change
↓
read already-assigned durable projectOrdinal
↓
validate it as the current Change's stable assigned ordinal
↓
archive target:
YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>
↓
reuse OpenSpec archive/spec-sync mechanics
↓
STOP
```

If the assigned ordinal is missing, malformed, ambiguous, or inconsistent with exact current Change handoff facts, archive HOW must STOP.

Archive MUST NOT:

```text
derive ordinal from Delivery manifest array position
count completed Changes
count archive directories
use current Run number
use changeStartSequence
allocate next ordinal
compact gaps
reuse cancelled ordinals
```

No Core state, global counter service, registry, allocator, or archive lifecycle expansion is required.

---

## 8. OpenSpec vendor archive mechanics must remain vendor mechanics

Current `.agents/skills/openspec-archive-change/SKILL.md` is an OpenSpec-generated bootstrap skill and is nearly the same as the repository vendor copy under:

```text
skills/vendors/openspec/openspec-archive-change/SKILL.md
```

Its built-in target rule is the OpenSpec date-only form.

Flowkit-specific project-wide Change ordinal semantics must not be injected into the vendor source of truth as if OpenSpec owned that rule.

Correct layering:

```text
Flowkit Author archive HOW
↓
Flowkit project-wide Change ordinal + handoff + STOP discipline
↓
reuse OpenSpec archive/spec-sync mechanics
```

not:

```text
modify OpenSpec semantics
or
make OpenSpec own Flowkit project-wide Change ordinal authority
```

---

## 9. D03/D04 bootstrap parity without self-hosting

Product-side archive convergence alone does not fix the current flowkit-next self-development path, because D03/D04 intentionally continue to execute through `.agents/skills/**`.

The smallest proven bootstrap parity direction is:

```text
project-owned .agents archive wrapper / composite HOW
↓
Flowkit project-wide archive ordinal invariant
+
existing .agents/skills/openspec-archive-change mechanics
```

This wrapper remains:

```text
independent bootstrap/development HOW
```

and MUST NOT read/execute candidate:

```text
skills/actions/archive/SKILL.md
```

to develop Flowkit itself.

Change 2 does NOT justify creating seven duplicate `.agents` wrappers. Existing bootstrap Author paths already work; only archive currently has a proven parity defect.

The Proposal may select the exact project-owned `.agents` wrapper path/name, but MUST preserve these invariants:

```text
vendor OpenSpec skill remains vendor-owned
bootstrap parity is explicit
product canonical skill is not consumed by current D03/D04 self-development
no dynamic projection
no compatibility runtime
```

---

## 10. Historical archive normalization is not Change 2 scope

Existing unnumbered D02 archives and the date-only D03 Change 1 archive are historical evidence of the regression.

The invalid `20260901-022-archive` materialization is explicitly discarded by Owner authorization before Git checkpoint / Delivery Final / accepted-main integration.

Change 2 SHOULD NOT silently mass-rename already accepted historical archive directories merely to make history visually uniform.

A historical rename would require consistent updates to durable references and would turn Guidance convergence into repository-history normalization.

Default boundary:

```text
preserve historical paths
↓
fix Author archive HOW going forward
```

---

## 11. Temporary Run-surface bridge cleanup boundary

The repository still contains:

```text
TEMPORARY-RUN-SURFACE-GUIDANCE.md
+
AGENTS.md temporary D03 bridge reference
```

The temporary bridge applies to both Author and Reviewer self-development Runs.

Because:

```text
Change 2
→ converges Author product Guidance only

Change 3
→ still must converge Reviewer product Guidance

D03/D04 self-development
→ continues through independent .agents bootstrap
```

Change 2 alone MUST NOT delete the shared temporary bridge merely because Author product Guidance now exists.

The earliest safe cleanup point is after the relevant Author **and Reviewer** formal/bootstrap guidance coverage has absorbed the bridge semantics and no current self-development consumer depends on the temporary document.

This prevents both:

```text
premature bridge deletion
```

and:

```text
candidate product Guidance self-hosting takeover
```

No new Run persistence contract is required.

---

## 12. Mechanical Preflight boundary

No independent Mechanical Preflight Change or Standard Action is required.

Current D02 facts already provide the mechanical inputs:

```text
Lightweight Gate
Structural Dependency Health
Repository Entropy Hygiene
Applicable Check facts
```

Change 2 should compose them inside:

```text
apply
revise-apply
```

alongside directly applicable checks such as:

```text
artifact existence
OpenSpec strict validation
task/handoff completeness
actual diff availability
forbidden runtime/generated artifacts
```

Preflight remains HOW and cannot become Reviewer/Verification/Policy authority.

---

## 13. Proof executed in this Explore

### Activation / lifecycle proof

Trusted coordination resolves:

```text
converge-author-action-guidance
→ active
```

from the exact Delivery manifest plus exact Owner activation provenance.

### Focused contract regression

Exact Node `22.23.2`:

```text
action-guidance-execution tests
policy / next-boundary tests
trusted change-coordination tests

22 / 22 PASS
0 FAIL
0 SKIP
```

### Repository proof

```text
canonical Author product Guidance bodies present
→ 0 / 7

author Standard Actions
→ exactly 7

project-wide Change ordinal proof
→ prior actually-assigned ordinals = 001..020
→ D01 cancelled 008 had a real Explore before cancellation and therefore remains consumed
→ current Change first entered Explore at Run 014 and remains assigned project ordinal 021
→ planned Reviewer Guidance has no Explore and therefore has no assigned project ordinal
→ 022 is only the next candidate ordinal at the current boundary

numbering namespace proof
→ project Change ordinal = 021
→ canonical changeStartSequence = 014
→ current revise-explore Run sequence = 025
→ these values have different semantics and MUST NOT be substituted for one another
```

No production source was changed by Explore.

---

## 14. Minimum Proposal direction

Proposal should remain bounded to:

```text
A. seven product canonical Author SKILL.md entries

B. Author Guidance content contract
   → Action-specific normative HOW
   → Run concision / handoff / literal / scope / STOP disciplines
   → Mechanical Preflight inside apply/revise-apply

C. archive ordinal rule
   → YYYY-MM-DD-<project-wide monotonic ordinal:03d>-<semantic ChangeId>
   → ordinal assigned/frozen when exact Change first enters Explore
   → planned-only Changes consume no ordinal
   → explored-then-cancelled ordinal remains consumed
   → persist the assigned value once on the existing exact Change coordination entry
   → Archive consumes the persisted value and never allocates/recomputes it
   → Run sequence / changeStartSequence are separate numbering namespaces

D. minimal independent bootstrap archive parity
   → project-owned .agents Flowkit archive wrapper/composition
   → reuse vendor OpenSpec archive mechanics

E. focused repository verification
   → all seven canonical entries exist
   → product resolver can resolve exact entries
   → no .agents production fallback
   → no top-level Skill explosion
```

Proposal must NOT require production Core changes unless new proof shows the existing Change 1 resolver/package contract is insufficient.

---

## 15. Explicit non-goals

```text
Flowkit self-hosting takeover
.agents deletion/thinning
seven duplicate .agents Action wrappers
Skill Registry
Guidance Registry
Skill Router
Skill Planner
Agent Runtime
dynamic Skill discovery/ranking
transitive product Guidance dependency graph
shared normative Guidance hash planner
second Guidance identity subsystem
new Standard Action
new lifecycle state
independent Mechanical Preflight Change
OpenSpec vendor semantics fork
mass historical archive rename
Run persistence redesign
automatic next Action
automatic Role switch
automatic Author/Reviewer loop
```

---

## 15A. Owner rollback / prior-candidate disposition

```text
20260901-022-archive
→ execution occurred
→ materialization invalidated by explicit Owner correction
→ no Git checkpoint
→ no Delivery Final
→ no accepted-main integration

converge-author-action-guidance
→ restored active

current legal working boundary
→ revise-explore
```

The prior Proposal / Apply candidate is retained as historical candidate evidence but is no longer sufficient for archive until the corrected ordinal semantics traverse review-explore → revise-propose → review-propose → revise-apply → review-apply.

No new Change is created.

---

## 15B. Reviewer 024 finding convergence

```text
D03-RE-004
→ ADDRESSED
```

Correction:

```text
planning-slot reservation model
→ removed

planned-only Change ordinal
→ none

assignment boundary
→ first actual Explore

current Change project ordinal
→ 021 retained

planned Reviewer Guidance
→ no ordinal yet

durable persistence
→ one existing exact Change coordination field: projectOrdinal

Archive
→ consumes persisted ordinal only

Run sequence
→ separate namespace

changeStartSequence
→ separate Run-address namespace
```

No other approved Change 2 Explore boundary was reopened.

---

## 16. Explore conclusion

```text
Change 2 gap                         REAL
exact Author canonical entry count  7
existing bootstrap migration input  SUFFICIENT
production Core change required     NO EVIDENCE
single-file Guidance identity        MUST BE PRESERVED
shared normative product HOW graph   NOT REQUIRED
archive ordinal defect               REAL
archive ordinal source               assigned at first actual Explore; durably persisted on exact Change entry
current Change project ordinal         021
planned Change 3 ordinal               UNASSIGNED; 022 is next candidate only
current revise-explore Run sequence    025
current canonical changeStartSequence  014
new archive counter/registry           NOT REQUIRED
bootstrap archive parity             REQUIRED / BOUNDED
self-hosting convergence             FORBIDDEN
historical mass rename               OUT OF SCOPE
temporary Run bridge deletion        NOT YET SAFE IN CHANGE 2 ALONE
Mechanical Preflight                 INTERNAL TO APPLY/REVISE-APPLY
Registry / Router / Runtime          NOT REQUIRED
```

Verdict:

```text
PASS
```

The Change is bounded and Proposal-ready.

STOP at independent `review-explore`.
