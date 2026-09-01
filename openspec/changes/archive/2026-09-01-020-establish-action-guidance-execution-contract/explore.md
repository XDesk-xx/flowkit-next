# Explore — establish-action-guidance-execution-contract

## Status

```text
PASS / Proposal-ready for independent review
```

Owner authorized exact Change activation plus proof-based Explore.

This Explore uses the repository's current bootstrap execution aids:

```text
.agents/skills/openspec-explore
.agents/skills/explore-proof-based
```

That is intentional and does **not** assume the D03 target contract already exists.
No Proposal, spec delta, design, tasks, production implementation, canonical Action
Guidance migration, or Git checkpoint is created by this Explore.

---

## 1. Owner goal and exact Change boundary

The first D03 Change must establish only this seam:

```text
already-decided exact StandardActionId
+
trusted canonical content-bound Action Guidance identity
↓
exact ActionPackage
↓
existing ActionPackageRef
↓
existing ApplicableCheck executionInputRef
```

It must not establish:

```text
Author Guidance migration
Reviewer Guidance migration
Skill Registry
Guidance Registry
Skill Router
Skill Planner
Agent Runtime
automatic Skill discovery/ranking
automatic next Action / Role switch
new Standard Action
new lifecycle state
second execution identity subsystem
```

---

## 2. Current execution-skill boundary — proven

Current repository guidance explicitly distinguishes:

```text
skills/**
→ canonical repository-owned Skill / Guidance assets

.agents/skills/**
→ repository-managed Agent execution aids used during bootstrap/development
```

Production `src/**` does not execute `.agents/skills/**`.

Current exact repository state:

```text
skills/actions/
└─ README.md

.agents/skills/
├─ openspec-explore
├─ explore-proof-based
├─ review-explore
├─ revise-explore
├─ openspec-propose
├─ proposal-convergence
├─ review-propose
├─ revise-propose
├─ openspec-apply-change
├─ implementation-convergence
├─ review-apply
├─ revise-apply
├─ openspec-archive-change
└─ other bootstrap/tool aids
```

Decision:

> **Throughout Stable Core development, including D03 and D04, `flowkit-next` itself MUST continue to use `.agents/skills/**` as the independent Author / Reviewer bootstrap execution surface. D03 may build and verify the product-side `skills/actions/**` contract for Flowkit-managed Action execution, but the AI developing/reviewing Flowkit must not switch to that in-development product Guidance before Stable Core closure is accepted.**

The two surfaces have intentionally different consumption domains during Stable Core:

```text
.agents/skills/**
→ independent bootstrap HOW used to develop / review flowkit-next itself
→ remains required through Stable Core closure

skills/actions/**
→ product-side canonical Guidance contract exposed by Flowkit-managed Action execution
→ may be implemented/tested during D03
→ MUST NOT self-host flowkit-next development before Stable Core closure acceptance
```

Therefore D03 does **not** authorize:

```text
deleting .agents/skills/**
thinning .agents/skills/** as a D03 acceptance requirement
switching flowkit-next Author/Reviewer execution to skills/actions/**
using candidate product Guidance to prove/review the same candidate implementation
```

This is a deliberate anti-self-hosting boundary, not an accidental duplicate truth:

```text
current Stable Core development HOW
→ .agents bootstrap plane

D03 product capability under construction
→ skills/actions product plane
```

Only after Stable Core closure is complete and its resulting repository baseline is accepted may a separate, explicitly Owner-authorized, fresh-proof self-hosting/convergence Change reconsider whether `.agents/skills/**` can be reduced or replaced. That future convergence is not part of D03 or D04.

---

## 3. Stable-manager boundary — proven

D03 Start commit:

```text
9b32b98db8c989f85ac0e1e5894a91b7e04f05df
```

Accepted previous main / Stable manager base:

```text
4b45552b90ee327488bde3141c51c556e65a2e95
```

There is no source / test / package / config delta between those revisions; the D03
Start commit only materialized Delivery Start planning/architecture artifacts.

The exact D02 Stable manager code at `4b45552...` resolved the newly activated target
repository Change coordination state as:

```text
active
```

Therefore this Explore does not rely on candidate self-takeover.

---

## 4. Activation facts — proven

The D03 manifest now records:

```text
establish-action-guidance-execution-contract = active
converge-author-action-guidance              = planned
converge-reviewer-action-guidance            = planned
```

with exact Owner activation provenance:

```text
owner:d3156f52525224087fefb4d50fb0177eb11a55a4bde06476f1d9d189415266c4
```

and scope:

```text
explore
```

OpenSpec exact Change scaffold exists:

```text
openspec/changes/establish-action-guidance-execution-contract/.openspec.yaml
```

OpenSpec status correctly remains Proposal-ready / planning-incomplete.
Strict Change validation currently fails only because no spec delta exists yet, which is
expected at Explore and confirms Proposal still has formal work to do.

---

## 5. Proof A — missing Guidance identity is a real contract gap

Current `ActionPackage` extends `RunContextRecord` and contains only current execution
facts such as:

```text
runId
occurrence
actionIdentity
role
lifecycleState
ownerAuthority
previousRunId
```

There is no canonical Guidance identity.

Therefore today Flowkit can know:

```text
exact Action
```

without formally knowing:

```text
exact bounded HOW identity
```

Decision:

```text
real Change 1 gap = YES
```

---

## 6. Proof B — StandardActionId is already a closed deterministic key

Current Standard Action set is closed at 10 identities:

```text
explore
review-explore
revise-explore
propose
review-propose
revise-propose
apply
review-apply
revise-apply
archive
```

Counterexample:

```text
isStandardActionId("../explore")
→ false
```

Therefore the canonical entry can be determined without discovery/ranking:

```text
StandardActionId
↓
skills/actions/<actionId>/SKILL.md
```

Examples:

```text
explore
→ skills/actions/explore/SKILL.md

review-explore
→ skills/actions/review-explore/SKILL.md
```

Decision:

> **No Action→method registry is needed. Stable Action identity itself is the canonical top-level Guidance identity key.**

---

## 7. Proof C — caller must not nominate Guidance path/content

The trusted resolver must accept only host-owned repository context plus the already-decided
`StandardActionId`.

It must not accept caller/Agent fields such as:

```text
guidancePath
guidanceSkillName
guidanceContentRef
methodName
```

as authority-bearing selection input.

Minimum resolver boundary:

```text
repositoryRoot
+
exact StandardActionId
↓
deterministic canonical path
↓
read exact canonical entry bytes
↓
exact content identity
↓
GuidanceRef
```

The exact function/schema names remain Proposal decisions.

Fail closed on at least:

```text
missing canonical entry
wrong Action-aligned path
unreadable/non-regular canonical entry
content identity mismatch
```

No Flowkit-managed production Action may silently fall back to `.agents/skills/**`.

This does not remove `.agents/skills/**` from the **flowkit-next self-development bootstrap plane** during Stable Core. The bootstrap plane remains intentionally independent until Stable Core closure.

---

## 8. Proof D — ActionPackage cannot simply keep delegating to exact RunContext validation

Current `RunContextRecord` is an exact-field envelope.

Controlled counterexample:

```text
base RunContext
→ isRunContextRecord = true

base ActionPackage
→ isActionPackage = true

same package + guidanceRef
→ isRunContextRecord = false
→ isActionPackage = false
```

Therefore this implementation would be wrong:

```text
interface ActionPackage extends RunContextRecord {
  guidanceRef: ...
}

isActionPackage(value) {
  if (!isRunContextRecord(value)) return false
  ...
}
```

because the RunContext validator would reject the extra ActionPackage field.

Decision:

> **Keep durable RunContext/context.json unchanged. Give ActionPackage its own exact projection/validator that validates the RunContext-derived fields plus one exact GuidanceRef.**

D03 does not need a fourth Run artifact or a new durable context field.

---

## 9. Proof E — Guidance belongs after exact Action decision and before Agent callback

Current single-Action invocation order is:

```text
establish exact prepared current Action
↓
formActionPackage
↓
execute(actionPackage)
↓
admit result
↓
terminal
↓
STOP
```

This provides the correct trusted placement:

```text
exact Action already decided
↓
resolve Action-aligned canonical Guidance
↓
freeze GuidanceRef into ActionPackage
↓
invoke Agent callback once
```

Therefore Guidance does not decide:

```text
next Action
Role
Owner authorization
Policy legality
Reviewer verdict
Verification truth
```

The exact integration signature remains for Proposal, but it must not expose arbitrary
Guidance nomination to the Agent/caller.

---

## 10. Proof F — existing ActionPackageRef identity chain should be reused

Current D02 code derives:

```text
ActionPackage
↓
deriveActionPackageRef(...)
↓
actionPackageRef
```

by hashing the exact cloned ActionPackage projection.

A controlled non-production hash prototype established:

```text
same ActionPackage facts
+
different Guidance content identity
↓
different action-package hash
```

Observed:

```text
hypotheticalGuidanceContentChangeChangesPackageHash = true
```

This does **not** claim the current production `deriveActionPackageRef()` already includes
Guidance; it does not. It proves that extending the existing exact package projection is
sufficient.

Decision:

```text
Guidance identity
→ include in existing ActionPackage projection/hash material

DO NOT create:
guidanceExecutionRef
Guidance cache identity
second Action execution identity
```

---

## 11. Proof G — ApplicableCheck executionInputRef naturally inherits package identity

Current D02 execution identity includes:

```text
actionPackageRef
candidateRef
checks
```

Controlled proof:

```text
actionPackageRef changes
↓
executionInputRef changes
```

Observed:

```text
actionPackageRefChangeChangesExecutionInputHash = true
```

Therefore Change 1 should only extend the existing ActionPackage identity projection.
No ApplicableCheck identity redesign is required.

---

## 12. Proof H — Change 1 must not perform Changes 2/3 migration

Current canonical root exists, but final Action bodies do not:

```text
skills/actions/
└─ README.md
```

This is expected staging.

Change ownership remains:

```text
Change 1
→ trusted Action ↔ Guidance identity binding contract

Change 2
→ converge Author Action Guidance bodies

Change 3
→ converge Reviewer Action Guidance bodies
```

Decision:

> **Change 1 may introduce resolver/package contracts and tests using bounded repository fixtures, but it must not silently populate the final Author/Reviewer canonical Guidance bodies.**

Throughout D03 and D04 Stable Core development, the external Author / Reviewer bootstrap continues using `.agents/skills/**`.

Even after Changes 2/3 create product-side canonical Guidance bodies, flowkit-next self-development MUST continue using the independent `.agents` bootstrap plane until Stable Core closure is accepted. This prevents candidate self-hosting and does not make `.agents` a production fallback for Flowkit-managed Actions.

---

## 13. Focused regression proof

Relevant current contracts were tested together:

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

This establishes that the current Foundation/D02 seams remain healthy before Proposal.
No corrective Foundation Change is required.

---

## 14. Proposal-ready minimum direction

Proposal should stay within this bounded direction:

```text
1. Introduce one exact GuidanceRef contract representing:
   canonical Action-aligned repository path identity
   + exact content identity.

2. Resolve GuidanceRef from repositoryRoot + already-decided StandardActionId.
   Caller/Agent cannot nominate arbitrary path or content identity.

3. Keep RunContext/context.json unchanged.
   ActionPackage gets its own exact validator/projection including GuidanceRef.

4. Freeze trusted GuidanceRef before Agent callback execution.

5. Reject missing/wrong/non-canonical product Guidance closed.
   No Flowkit-managed production fallback to .agents/skills/**.
   Preserve .agents/skills/** as the independent flowkit-next self-development bootstrap through Stable Core closure.

6. Extend existing ActionPackage cloning/hash projection so Guidance identity
   changes ActionPackageRef.

7. Reuse existing ApplicableCheck executionInputRef propagation unchanged.

8. Test wrong-Action substitution, content drift, missing entry, and identity
   propagation directly.
```

The exact TypeScript property names and exact hash representation are Proposal/design details,
not a reason to broaden Explore.

---

## 15. Explicit non-goals

```text
Skill Registry
Guidance Registry
Skill Router
Skill Planner
Skill metadata database
method routing table
Agent Runtime
Provider abstraction
dynamic Skill discovery/ranking
dynamic .agents projection platform
Guidance cache DB
second identity subsystem
new Standard Action
new lifecycle state
RunContext/context.json Guidance persistence
fourth Run artifact
Author Guidance migration
Reviewer Guidance migration
Mechanical Preflight implementation
Agent compatibility implementation
automatic next Action / Role switch / Owner decision
self-hosting takeover before Stable Core closure
D03/D04 convergence or deletion of .agents/skills/**
```

---

## 16. Limitations / deferred proof

Explore intentionally leaves these to Proposal/Apply because they do not change the bounded
product boundary:

```text
exact GuidanceRef TypeScript field names
exact SHA/content-ref literal representation
exact trusted resolver function location/signature
exact regular-file/symlink implementation mechanics
exact unit-test fixture organization
```

Later D03 Changes still own actual canonical HOW convergence.

Agent compatibility remains proof-gated and absent from initial composition.

Self-hosting convergence is separately out of Stable Core scope: D03/D04 must not use product-side `skills/actions/**` to drive the Author/Reviewer sessions that are still developing Stable Core closure.

---

## 17. Explore conclusion

```text
problem real                         = PASS
exact Action identity already exists = PASS
canonical root ownership clear       = PASS
independent .agents bootstrap boundary = PASS
trusted deterministic binding bounded = PASS
RunContext separation required        = PASS
ActionPackageRef reuse sufficient     = PASS
executionInputRef reuse sufficient    = PASS
Foundation corrective Change needed   = NO
Registry / Router / Runtime needed     = NO
Proposal ready                        = YES
```

The smallest real Change is:

```text
exact current Action
↓
trusted deterministic canonical GuidanceRef
↓
exact ActionPackage
↓
existing ActionPackageRef / executionInputRef
```

STOP at `review-explore`.
