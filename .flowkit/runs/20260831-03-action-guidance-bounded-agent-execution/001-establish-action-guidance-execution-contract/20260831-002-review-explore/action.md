# Action — Review Explore

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: establish-action-guidance-execution-contract
role: reviewer
action: review-explore
input: 20260831-001-explore
base: 9b32b98db8c989f85ac0e1e5894a91b7e04f05df
stable-manager-base: 4b45552b90ee327488bde3141c51c556e65a2e95
```

## Verdict

```text
CHANGES REQUESTED
```

The substantive Explore direction is accepted:

```text
exact StandardActionId
→ deterministic canonical product Guidance identity
→ exact ActionPackage
→ existing ActionPackageRef
→ existing ApplicableCheck executionInputRef
```

The Owner anti-self-hosting correction is also substantively absorbed:

```text
D03/D04 flowkit-next self-development
→ independent .agents/skills/** bootstrap plane

product-side Flowkit-managed Guidance
→ skills/actions/**

pre-v1 self-hosting takeover
→ forbidden
```

Two bounded corrections are required before Proposal.

---

## D03-RE-001 — Explore artifact hash in context is stale

`context.json` records:

```text
exploreArtifactSha256
= fae5feb0037f62438ac11e067bc1b45a90dbdac242c3f749035a7cc9c5bb6d26
```

But the exact `explore.md` bytes inside the reviewed Author package hash to:

```text
a258689c02a653474a3166b7cf6ceae50117e085450fd1b91d2388e2ff555afa
```

Therefore the durable handoff context does not identify the artifact it actually transfers.

### Required revise-explore

Recompute and replace `exploreArtifactSha256` from the final revised `explore.md` bytes.

Then verify the transferred package contains the exact same bytes.

Do not add another evidence system or checksum registry.

One correct hash is sufficient.

---

## D03-RE-002 — stale `.agents` end-state wording contradicts Owner correction

The reviewed `context.json` contains:

```text
"laterAgentsSurface":
"absent or thin compatibility/bootstrap pointer only if proven necessary"
```

That is superseded for Stable Core scope.

The current Owner correction requires:

```text
During D03 and D04:
.agents/skills/**
→ remains the independent flowkit-next Author/Reviewer bootstrap plane

skills/actions/**
→ product-side Flowkit-managed Guidance under construction

pre-v1 convergence / thinning / deletion
→ NOT a D03/D04 acceptance requirement
```

The Explore prose and `result.json` already state this correctly.
Only the durable context field is stale.

### Required revise-explore

Replace or remove `laterAgentsSurface`.

If retained, it must state the current Owner boundary, for example:

```text
.agents/skills/** remains the independent flowkit-next
self-development plane through Stable Core v1 acceptance;
any later convergence requires fresh proof and explicit Owner authorization.
```

Do not change the substantive Change 1 design.

---

## Independently reproduced proof

Reviewer restored the supplied D03 bundle and independently confirmed:

```text
D03 branch HEAD
= 9b32b98db8c989f85ac0e1e5894a91b7e04f05df

parent
= 4b45552b90ee327488bde3141c51c556e65a2e95

Delivery Start delta
= exactly four Start artifacts

skills/actions/**
= README only

.agents/skills/**
= bootstrap Action/OpenSpec guidance present
```

With the Author delta overlaid:

```text
trusted Change coordination resolver
→ active
```

Using Node `22.23.2`, Reviewer reran:

```text
action-package-result-admission
single-action-execution
applicable-check-execution
trusted-change-coordination
```

Result:

```text
43 / 43 PASS
```

Reviewer also reproduced:

```text
valid current RunContext
→ accepted

same RunContext + guidanceRef
→ rejected by exact-field RunContext validator

valid current ActionPackage
→ accepted

same package + guidanceRef
→ rejected by current ActionPackage validator
```

and inspected the current identity chain:

```text
ActionPackage
→ cloneActionPackage(...)
→ deriveActionPackageRef(...)

ApplicableCheck execution identity
→ includes actionPackageRef
```

Therefore these Explore conclusions are accepted:

```text
missing Guidance identity is real
ActionPackage needs a distinct exact projection/validator
existing ActionPackageRef chain should be reused
executionInputRef naturally consumes actionPackageRef
no second identity subsystem is needed
no Registry / Router / Runtime is justified
```

---

## Non-blocking Proposal focus

The accepted project model allows an Action Skill to evolve internally.

Proposal should keep the meaning of:

```text
exact content-bound Guidance identity
```

clear and bounded.

Do not invent a Guidance graph/Registry in advance.

If the canonical Action entry is intentionally one exact `SKILL.md`, say so.
If later accepted Action Guidance physically includes additional execution-relevant files,
their identity handling must not silently make ActionPackage claim an "exact HOW identity"
while ignoring those bytes.

This is a Proposal precision point, not a third Explore blocker.

---

## Current-step explanation

This lifecycle step independently reviews whether the Author Explore has proven a safe,
minimal contract boundary before Proposal.

The technical direction is accepted.

The revision is needed only because the transferred durable context currently contains:

```text
one wrong artifact hash
+
one superseded Owner-boundary field
```

---

## Complexity assessment

The Explore itself remains minimal.

It reuses:

```text
StandardActionId
ActionPackage
ActionPackageRef
ApplicableCheck executionInputRef
skills/actions root
existing .agents bootstrap plane
```

and does not introduce:

```text
Skill Registry
Guidance Registry
Router
Planner
Agent Runtime
second identity system
new lifecycle state
self-hosting takeover
```

The requested fixes add no capability and no subsystem.

They only restore handoff integrity and Owner-boundary consistency.

STOP at `revise-explore`.
