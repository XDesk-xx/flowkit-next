# Action — Review Propose

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: converge-author-action-guidance
role: reviewer
action: review-propose
input: 20260901-016-propose
approved-explore: 20260901-015-review-explore
base: 3af174bdfa2e8ebcf280e87a13565d03dec0b647
```

## Verdict

```text
CHANGES REQUESTED
```

The Proposal is directionally correct and preserves the approved Explore scope.

One bounded semantic-contract correction is required before Apply.

No redesign, new Explore, or new subsystem is required.

---

# D03-RP-001 — Archive precondition wording contradicts canonical lifecycle truth

The proposed `author-action-guidance` spec currently states:

```text
archive SHALL archive only an accepted/completed Change
```

and `tasks.md` similarly asks for:

```text
accepted/completed archive discipline
```

This is not precise enough for a formal OpenSpec contract and can be read as requiring
the Change to be `completed` before `archive` executes.

The existing canonical Policy contract says otherwise:

```text
Change state = active
+
terminal review-apply
+
reviewerVerdict = approved
↓
next legal Action = archive
```

Only after archive execution / completion materialization does the durable Change state become:

```text
completed
```

The existing Policy also explicitly fails closed on:

```text
active + terminal archive + PASS
```

until exact completed materialization occurs.

Therefore:

```text
completed
```

is a post-archive materialization fact, not an archive invocation precondition.

---

## Required revise-propose

Normalize the formal Author Guidance contract to the already-existing lifecycle authority.

Recommended semantic shape:

```text
Flowkit / Policy has already determined
the exact current legal Action = archive
↓
Author archive Guidance executes only that Action
↓
canonical OpenSpec archive convergence
↓
continuity / completion materialization
↓
STOP
```

A precise requirement can say, for example:

```text
When the exact current Action supplied by Flowkit is `archive`,
canonical Author archive Guidance SHALL execute only that already-authorized
archive boundary, perform canonical OpenSpec convergence and required continuity
materialization, and STOP without activating or executing the next Change.
Guidance SHALL NOT independently decide archive legality or require a pre-existing
`completed` Change state.
```

The current lifecycle antecedent may be explained as:

```text
active Change
+
review-apply approved
→ archive
```

but Guidance does not own that Policy rule.

Update the stale wording in:

```text
specs/author-action-guidance/spec.md
tasks.md
```

and any Proposal/Design wording if needed for consistency.

Do not change:

```text
archive ordinal rule
bootstrap archive wrapper
seven Author entries
Mechanical Preflight composition
self-hosting boundary
temporary Run bridge boundary
```

---

# Why this is blocking

OpenSpec strict validation checks structural/spec syntax validity.

Reviewer independently reran:

```text
openspec validate converge-author-action-guidance --strict
→ PASS

openspec validate --all --strict
→ 16 / 16 PASS
```

But syntax-valid OpenSpec can still encode a semantic contradiction.

This Change is explicitly creating canonical Author HOW.
If `archive` HOW freezes the wrong lifecycle prerequisite, later Author execution could:

```text
wait for completed before archive
```

even though current Flowkit Policy requires:

```text
archive while Change is active
```

That would be real lifecycle drift.

The correction is wording/contract precision only.

---

# Proposal direction — otherwise PASS

The Proposal correctly preserves the approved Change 2 shape:

```text
exactly seven Author product Action Guidance entries

skills/actions/<actionId>/SKILL.md
→ single-file identity-complete normative HOW

proof/convergence/preflight/handoff
→ internal methods/disciplines

Mechanical Preflight
→ internal to apply / revise-apply

archive ordinal
→ derived from exact Delivery manifest 1-based changes[] position

.agents/skills/archive/SKILL.md
→ one narrow independent bootstrap archive wrapper

TEMPORARY-RUN-SURFACE-GUIDANCE.md
→ retained

historical unnumbered D02/D03 archives
→ untouched
```

The Proposal does not alter Change 1 Guidance identity, ActionPackage, Policy, Run/Result,
or production Core.

---

# Review-chain integrity — PASS

Reviewer verified:

```text
014 Explore
↓
015 Review Explore
→ APPROVED

016 Propose
→ exact reviewerInputPackageSha256 matches 015 package
```

The declared hashes for:

```text
explore.md
proposal.md
design.md
author-action-guidance delta spec
tasks.md
```

all match exact bytes in the 016 package.

No Apply mutation is present.

---

# Archive ordinal / bootstrap parity — PASS

The Proposal does not expand the previously approved Explore findings.

Archive ordinal remains:

```text
YYYY-MM-DD-<manifest-position:03d>-<semantic ChangeId>
```

with no:

```text
counter
ordinal state
Registry
global sequence
```

The `.agents` bootstrap wrapper remains:

```text
independent self-development HOW only
```

and MUST NOT consume candidate product `skills/actions/archive/SKILL.md`.

No self-hosting convergence is introduced.

---

# Complexity assessment

```text
complexity growth
→ MINIMAL / GUIDANCE-ONLY
```

The Proposal creates one product Guidance capability composed of seven existing Author
Standard Action entries plus one narrow bootstrap archive parity wrapper.

It does not introduce:

```text
new Core subsystem
new lifecycle state
new Standard Action
Registry
Router
Planner
Runtime
second Guidance identity
archive counter
self-hosting transition
```

D03-RP-001 requires zero additional complexity.

It only removes an inaccurate lifecycle prerequisite.

---

# New-content / scope-drift assessment

Compared with the approved 015 Explore:

```text
new product capability
→ NONE

new authority
→ NONE

new lifecycle mechanism
→ NONE

new Standard Action
→ NONE

new shared Guidance identity graph
→ NONE

new compatibility/runtime layer
→ NONE

self-hosting convergence
→ NONE

historical archive migration
→ NONE
```

Therefore:

```text
scope expansion
→ NONE
```

However D03-RP-001 is a semantic-literal mismatch with existing lifecycle truth:

```text
formal wording drift
→ YES, bounded to archive precondition wording
```

The correct fix is to converge wording back to canonical Policy, not to add a new contract.

---

# Current-step explanation

This Review Propose verifies that the approved Explore has been translated into a precise
formal OpenSpec contract before Apply creates the seven canonical Author Guidance bodies.

Result:

```text
approved Explore preservation
→ PASS

artifact / review-chain integrity
→ PASS

OpenSpec structural validation
→ PASS

complexity
→ minimal

scope expansion
→ none

archive lifecycle semantic precision
→ one bounded correction required
```

Next boundary:

```text
revise-propose
```

STOP.
