# Action — Review Propose

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: converge-author-action-guidance
role: reviewer
action: review-propose
input: 20260901-027-revise-propose
approved-explore: 20260901-026-review-explore
base: 3af174bdfa2e8ebcf280e87a13565d03dec0b647
```

## Verdict

```text
CHANGES REQUESTED
```

The revised Proposal correctly fixes the ordinal authority model:

```text
planned-only Change
→ no projectOrdinal

first actual Explore
→ assign/freeze one projectOrdinal

later Actions
→ reuse the persisted value

archive
→ consume only
→ never allocate/recompute
```

However, one implementation-boundary gap remains:

> The Proposal requires assignment at first actual Explore, but its implementation tasks do not revise either the product Explore Guidance or the independent Stable Core bootstrap Explore HOW that must actually perform that assignment.

This must be corrected before Apply.

No new Core subsystem is required.

---

# Review-chain trace

```text
023 revise-explore
↓
024 review-explore
→ CHANGES REQUESTED

025 revise-explore
↓
026 review-explore
→ APPROVED

027 revise-propose
↓
028 review-propose
→ CHANGES REQUESTED
```

The exact 026 Reviewer package SHA-256 declared by 027 matches:

```text
8394cb9de79485c12c07978ce6b9f85f53d3d1e84063ead7c36b28b2b0f15759
```

All 027 declared planning artifact hashes match exact package bytes.

---

# Correct ordinal semantics — PASS

The Proposal now correctly freezes:

```text
semantic ChangeId
→ canonical Change identity

projectOrdinal
→ durable project-wide monotonic sequence / archive-naming fact only
```

It no longer treats Delivery planning position as identity authority.

Current facts are correct:

```text
converge-author-action-guidance
→ already explored
→ projectOrdinal: 21

converge-reviewer-action-guidance
→ planned only
→ projectOrdinal absent

022
→ next candidate only
```

Archive is also correctly thin:

```text
archive
→ require already-persisted projectOrdinal
→ use it in archive target
→ never allocate/recompute
```

---

# D03-RP-002 — First-Explore ordinal assignment has no implementation owner in the revised tasks

The formal spec now requires:

```text
A Change that actually enters Explore
→ SHALL have exactly one durable projectOrdinal
→ persisted on its exact Delivery Change coordination entry
```

The design likewise says:

```text
first actual Explore
→ assign next project-wide ordinal
→ persist it exactly once
```

But `tasks.md` leaves the already-created product Explore Guidance task completed:

```text
1.1 skills/actions/explore/SKILL.md
→ [x]
```

and does not reopen it for the new first-Explore assignment rule.

The only reopened ordinal implementation tasks are currently centered on:

```text
archive product Guidance
bootstrap archive wrapper
ordinal tests
manifest verification
preflight/handoff
```

That is insufficient.

If Apply followed the tasks exactly, future Change 3 could enter Explore with:

```text
projectOrdinal absent
```

and no current product/bootstrap Explore HOW would be responsible for assigning and persisting it.

The specification would be true on paper but not executable.

---

# Why both product Explore and Stable Core bootstrap Explore matter

## Product-side behavior

D03 is converging canonical product Guidance under:

```text
skills/actions/**
```

Therefore:

```text
skills/actions/explore/SKILL.md
```

must include the Flowkit-specific rule:

```text
when exact current Change first actually enters Explore
and has no projectOrdinal
→ assign the next project-wide ordinal
→ persist it once on the exact Change coordination entry
→ later Explore/review/propose/apply/archive reuse it
```

This is HOW for the already-authorized Explore Action.

It does not decide whether Explore is legal.

---

## D03/D04 independent bootstrap behavior

During Stable Core development, flowkit-next itself still executes Explore through:

```text
.agents/skills/**
```

and MUST NOT self-host on candidate product `skills/actions/explore`.

Therefore the independent bootstrap plane also needs the same first-Explore persistence discipline.

The minimum correction should prefer the already-existing project-owned:

```text
.agents/skills/explore-proof-based/SKILL.md
```

rather than creating another top-level bootstrap wrapper unless proof shows that is necessary.

Keep:

```text
.agents/skills/openspec-explore
→ subordinate OpenSpec mechanics

.agents/skills/explore-proof-based
→ project bootstrap Explore HOW
```

The bootstrap HOW MUST NOT consume candidate:

```text
skills/actions/explore/SKILL.md
```

---

# Required revise-propose

Revise only the ordinal execution ownership.

At minimum:

```text
1. reopen product `skills/actions/explore/SKILL.md`
   for first-Explore projectOrdinal assignment/persistence;

2. add/update the independent `.agents` Explore HOW
   so D03/D04 self-development assigns/persists the ordinal
   without consuming product candidate Guidance;

3. add focused proof that:
   planned-only → no ordinal;
   first actual Explore → assigns once;
   repeated/later Actions → preserve same ordinal;
   explored-then-cancelled → number remains consumed;
   missing ordinal at archive → archive stops rather than allocates;

4. preserve archive as consumer-only;

5. preserve semantic ChangeId as canonical identity.
```

The current `projectOrdinal: 21` on Change 2 remains valid.

Do not remove or recompute it.

---

# Assignment mechanism guard

Proposal does not need to build a global allocation subsystem.

The accepted Explore already prefers the minimum:

```text
existing coordination metadata
+
project-wide persisted high-watermark
+
persist-once at first actual Explore
```

The exact Apply implementation may use repository facts sufficient to obtain the next number,
but MUST NOT introduce:

```text
global counter service
ordinal Registry
allocator daemon
new lifecycle state
new identity subsystem
background sequencing engine
```

If assignment cannot be made deterministically from existing durable facts,
STOP and return to proof rather than hiding allocation inside Archive.

---

# OpenSpec / artifact validation — PASS

Reviewer restored exact base:

```text
3af174bdfa2e8ebcf280e87a13565d03dec0b647
```

and overlaid 027.

Using exact Node:

```text
22.23.2
```

and OpenSpec:

```text
1.10.0
```

Reviewer independently reran:

```text
git diff --check
→ PASS

openspec validate converge-author-action-guidance --strict
→ PASS

openspec validate --all --strict
→ 16 / 16 PASS
```

All declared hashes for:

```text
approved explore
proposal
design
spec
tasks
delivery manifest
```

match exact bytes.

Structural validation is green; D03-RP-002 is a semantic implementation-coverage gap.

---

# Other Proposal boundaries — PASS

No need to reopen:

```text
seven Author canonical product Guidance entries
single-file Guidance identity completeness
Mechanical Preflight internal to apply/revise-apply
archive lifecycle semantics
archive consumer-only projectOrdinal rule
independent .agents Stable Core plane
one narrow bootstrap archive wrapper
temporary Run bridge retention
historical archive non-migration
no self-hosting takeover
```

---

# Complexity assessment

The corrected ordinal model itself remains:

```text
MINIMAL / REQUIRED
```

One durable fact:

```text
changes[].projectOrdinal
```

is sufficient.

D03-RP-002 does not justify a new subsystem.

The minimum added implementation is Guidance-only:

```text
product Explore HOW
+
existing independent bootstrap Explore HOW
+
focused tests
```

No:

```text
Core service
Registry
Router
Planner
Runtime
counter subsystem
allocator subsystem
new lifecycle state
```

is required.

---

# New-content / scope-drift assessment

027 correctly introduces the approved durable ordinal semantics and does not expand
product scope beyond Change 2.

However there is an implementation-coverage omission:

```text
first-Explore assignment semantics
→ formalized
→ not yet assigned to an execution Guidance surface
```

Assessment:

```text
new product capability beyond Change 2
→ NONE

new authority
→ NONE

new lifecycle
→ NONE

new control plane
→ NONE

scope expansion
→ NONE

implementation coverage gap
→ YES
```

The fix should add only the missing Explore HOW implementation responsibility.

---

# Current-step explanation

This Review Propose checks whether the newly approved Explore numbering semantics have
been translated into an executable Proposal before revising Apply.

Result:

```text
ordinal authority model
→ PASS

planned-only reservation
→ removed

semantic ChangeId identity
→ preserved

archive consumer-only rule
→ PASS

durable projectOrdinal
→ PASS

first-Explore assignment implementation owner
→ MISSING

complexity
→ still minimal

scope drift
→ none
```

Next boundary:

```text
revise-propose
```

STOP.
