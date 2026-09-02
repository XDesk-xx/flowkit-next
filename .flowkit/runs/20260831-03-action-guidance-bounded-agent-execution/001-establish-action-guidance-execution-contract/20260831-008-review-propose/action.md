# Action — Review Propose

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: establish-action-guidance-execution-contract
role: reviewer
action: review-propose
input: 20260831-007-propose
review-chain-start: 20260831-001-explore
approved-explore: 20260831-006-review-explore
base: 9b32b98db8c989f85ac0e1e5894a91b7e04f05df
stable-manager-base: 4b45552b90ee327488bde3141c51c556e65a2e95
```

## Verdict

```text
APPROVED
```

The Proposal faithfully converts the approved Explore into a bounded formal contract.

No blocking finding remains.

---

## Approved contract shape

The Proposal preserves the approved minimum:

```text
already-decided StandardActionId
↓
trusted deterministic canonical product GuidanceRef
↓
exact ActionPackage
↓
existing ActionPackageRef
↓
existing ApplicableCheck executionInputRef
```

It does not create a second execution identity.

---

## Formal capability ownership — PASS

The Proposal introduces exactly one new capability:

```text
action-guidance-execution
```

and modifies:

```text
action-package-and-result-admission
```

This is sufficient.

Reviewer independently checked the existing
`single-action-execution-terminal-boundary` canonical spec.

That existing contract already requires:

```text
each invocation
→ forms an ActionPackage satisfying the closed package contract

package formation failure
→ bounded failure + STOP
```

The new `action-guidance-execution` delta owns the additional rule:

```text
exact Action already decided
↓
trusted Guidance resolution
↓
before Agent callback
```

Therefore a third formal delta for
`single-action-execution-terminal-boundary` would only duplicate semantics.

No missing formal capability delta was found.

---

## Owner self-hosting boundary — PASS

The Proposal correctly preserves:

```text
D03 / D04 flowkit-next self-development
→ .agents/skills/** independent bootstrap plane

skills/actions/**
→ product-side Flowkit-managed canonical Action Guidance

Flowkit-managed product resolver
→ NEVER falls back to .agents/skills/**

pre-Stable-Core self-hosting takeover
→ forbidden
```

The Proposal does not delete, thin, replace, or converge away `.agents/skills/**`.

This matches the current Owner correction.

---

## Guidance identity boundary — PASS

Proposal chooses the bounded representation already allowed by Explore:

```text
ActionGuidanceRef
├─ path
└─ contentSha256
```

with canonical entry:

```text
skills/actions/<StandardActionId>/SKILL.md
```

and:

```text
contentSha256
→ exact bytes of that canonical entry
```

This is accepted for Change 1.

Important Apply guard:

```text
do not expand this Change into
a transitive Skill dependency graph,
Guidance Registry,
content graph,
or shared-reference hash planner.
```

The current Change binds the exact canonical Action entry.

If future product Guidance proves it needs a broader content-closure identity,
that requires fresh proof rather than speculative expansion during Apply.

This is not a blocker and does not change the approved Proposal.

---

## ActionPackage / RunContext separation — PASS

Proposal correctly keeps:

```text
RunContextRecord / context.json
→ unchanged durable contract

ActionPackage
→ own exact envelope
→ RunContext-derived fields + exact GuidanceRef
```

and reuses existing RunContext validation through projection.

No fourth Run artifact or durable Guidance field is introduced.

---

## Identity propagation — PASS

Proposal correctly reuses:

```text
ActionPackage
↓
deriveActionPackageRef
↓
ApplicableCheck execution input
↓
executionInputRef
```

Required behavior:

```text
Guidance contentSha256 changes
↓
ActionPackageRef changes
↓
executionInputRef changes
```

No:

```text
GuidanceExecutionRef
Guidance cache identity
second execution-input contract
```

is introduced.

---

## Changes 2 / 3 ownership — PASS

Change 1 does not populate final Author/Reviewer canonical Guidance bodies.

It uses bounded fixtures for product-side Guidance resolution tests.

Ownership remains:

```text
Change 1
→ Action ↔ Guidance binding / package contract

Change 2
→ Author Action Guidance convergence

Change 3
→ Reviewer Action Guidance convergence
```

No scope theft from later Changes was found.

---

## Independent validation

Reviewer independently verified all Proposal artifact hashes against the exact package.

Result:

```text
proposal.md
design.md
tasks.md
both delta specs
approved explore.md
→ hashes match declared context
```

Using exact Node:

```text
22.23.2
```

and managed OpenSpec:

```text
1.10.0
```

Reviewer reran:

```text
openspec validate establish-action-guidance-execution-contract --strict
→ PASS

openspec validate --all --strict
→ 15 / 15 PASS
```

No production Apply mutation is present in the Proposal package.

---

## Complexity assessment

```text
complexity growth
→ MINIMAL / REQUIRED ONLY
```

New Core surface is limited to:

```text
one bounded GuidanceRef/resolver contract
+
required ActionPackage package-only extension
```

Existing identity and execution seams are reused.

No new:

```text
Registry
Router
Planner
Runtime
cache DB
lifecycle state
Standard Action
Run artifact
Agent compatibility layer
self-hosting transition
```

was introduced.

---

## Scope-drift / new-content assessment

Reviewer explicitly checked whether Proposal introduced new content beyond the approved Explore.

Result:

```text
new capability outside approved Change 1
→ NONE

new authority
→ NONE

new lifecycle semantics
→ NONE

new self-hosting behavior
→ NONE

new compatibility surface
→ NONE

Changes 2/3 content migration pulled forward
→ NONE

ApplicableCheck redesign
→ NONE

Run persistence redesign
→ NONE
```

Proposal-level details newly frozen are limited to items Explore explicitly deferred to Proposal:

```text
ActionGuidanceRef field shape
exact SHA-256 representation
resolver placement/signature direction
regular-file/symlink mechanics
ActionPackage exact-envelope strategy
bounded fixture strategy
```

These are implementation-contract refinements, not product-scope expansion.

Therefore:

```text
scope drift
→ NONE
```

---

## Current-step explanation

This Review Propose checks whether the approved Explore has been converted into a complete,
internally consistent OpenSpec contract before production Apply mutation begins.

Result:

```text
proposal/spec/design/tasks consistency
→ PASS

approved Explore preservation
→ PASS

Owner self-hosting boundary
→ PASS

formal capability ownership
→ PASS

complexity
→ minimized

new-content / scope drift
→ NONE
```

The Change may proceed to Apply.

STOP after this Reviewer verdict.
