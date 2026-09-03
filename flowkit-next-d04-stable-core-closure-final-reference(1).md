# Flowkit-next D04 — Delivery Continuity & Stable Core Closure
## Final Stable Planning Reference

> Status: **FINAL**
>
> Exact accepted repository base:
>
> `main@6bda1e87a0c12929c3567de17ede75ecd0cf0bed`
>
> D03 Delivery Final commit:
>
> `90e0f06a40b5d042b676475408b977dde57b68a0`
>
> D04 is the **final planned Stable Core Delivery**.
>
> There is no planned D05.
>
> This document is the single current D04 planning/reference document.
>
> OpenSpec remains specification truth once D04 starts. Git remains repository-byte / exact-revision / history truth.
>
> This document does **not** itself authorize Delivery Start, Change activation, repository mutation, Git commit, PR, merge, release publication, or any later Owner-controlled operation.

---

# 1. D04 product goal

D04 has one product-level goal:

> **Close the Delivery-level execution loop so an already-decided Flowkit Delivery operation can be executed by an Agent through an exact, content-bound package and canonical Delivery Guidance, while preserving exact-state continuity, bounded verification, architecture/finalization discipline, and Owner-controlled repository integration.**

The Stable Core loop is:

```text
accepted main
↓
Delivery Start
↓
bounded OpenSpec Changes
↓
Author / Reviewer Action execution
↓
Formal Full Test
↓
Actual Architecture
↓
canonical diagram convergence
↓
Delivery Final
↓
repository integration
↓
accepted main
↓
next Delivery
```

After D04 reaches accepted main:

```text
Flowkit-next Stable Core
→ COMPLETE
```

The accepted D04 main is also the capability boundary for the first whole-product stable release candidate.

A release label such as `Flowkit-next 1.0.0`, if later chosen by the Owner, applies to the accepted whole-product baseline. D04 does not create an internal version-family or release-control subsystem.

---

# 2. Stable truth and authority boundaries

```text
OpenSpec
→ specification truth

Git
→ repository bytes / exact revision / history

Flowkit Core
→ lifecycle / coordination / legality / acceptance / continuity

Policy
→ deterministic legal-boundary calculation where Policy owns that boundary

Owner
→ explicit authorization where Owner authority is required

Action Guidance
→ HOW for an already-decided Standard Action

Delivery Guidance
→ HOW for an already-decided Delivery operation

Archify
→ derived descriptions only

Memo
→ future/planning input only
```

The following are never independent truth or authority sources:

```text
Skill Markdown
ActionPackage
DeliveryOperationPackage
GuidanceRef
ZIP
Git bundle
dependency/runtime archive
diagram
Run prose
AI memory
execution environment
```

A package can bind exact execution facts. It cannot create authority that does not already exist.

---

# 3. Unified exact-operation execution model

D03 already proves the Action execution pattern:

```text
exact StandardActionId already decided
↓
resolve canonical skills/actions/<actionId>/SKILL.md
↓
freeze exact content identity into GuidanceRef
↓
form exact ActionPackage
↓
Agent receives exact operation context + exact HOW
↓
Agent executes
↓
Result
↓
STOP at the Action boundary
```

D04 extends the **same execution pattern**, not the same lifecycle identity, to Delivery operations:

```text
exact DeliveryOperationId already decided
↓
resolve canonical Delivery Guidance
↓
freeze exact content identity into DeliveryGuidanceRef
↓
form exact DeliveryOperationPackage
↓
Agent receives exact operation context + exact HOW
↓
Agent executes
↓
operation result / closure facts
↓
STOP at the canonical Delivery-operation boundary
```

The central invariant is:

> **WHAT is decided before HOW. The package binds the already-decided operation to exact context and exact Guidance. The Agent does not discover, rank, route, or choose the operation.**

Therefore D04 does not need an Agent-facing Skill discovery layer for product Delivery operations.

It does not require:

```text
.agents/skills/flowkit-delivery-*
Skill discovery
Skill ranking
Skill Router
Skill Planner
Delivery Planner
Agent-selected next operation
```

The execution host must make the exact Guidance bytes matching the package-bound content identity available to the Agent. The Skill Markdown is consumed as normative execution HOW; it is not lifecycle authority.

---

# 4. Delivery operation identities and canonical Guidance

D04 uses one closed, explicit Delivery operation set:

```text
delivery-start
delivery-full-test
delivery-architecture-finalization
delivery-final
delivery-repository-integration
```

Canonical Guidance mapping:

```text
delivery-start
→ skills/delivery/start/SKILL.md

delivery-full-test
→ skills/delivery/full-test/SKILL.md

delivery-architecture-finalization
→ skills/delivery/architecture-finalization/SKILL.md

delivery-final
→ skills/delivery/final/SKILL.md

delivery-repository-integration
→ skills/delivery/repository-integration/SKILL.md
```

This mapping is deterministic and static.

`DeliveryOperationId` is an execution identity, not a new lifecycle authority.

`DeliveryOperationPackage` is an execution envelope, not a new Delivery lifecycle.

The package must minimally bind:

```text
exact Delivery identity
+
exact DeliveryOperationId
+
exact repository/candidate/state facts required by that operation
+
existing authority facts when that operation requires authority
+
content-bound canonical DeliveryGuidanceRef
```

D04 should reuse already-owned Git, verification, Run, Delivery and authority identities instead of creating another candidate/state identity subsystem.

The exact package schema is proven in Change 1 and must remain the smallest shape that closes these invariants.

Fail closed on at least:

```text
unknown DeliveryOperationId
wrong canonical Guidance path
Guidance content hash mismatch
wrong Delivery identity
stale or mismatched exact state/candidate facts
missing required authority facts
```

No dynamic Registry is required for a closed compile-time mapping.

---

# 5. Action and Delivery remain different lifecycle levels

The shared execution pattern does not collapse Delivery operations into Standard Actions.

```text
Action level
Policy / existing lifecycle facts
↓
exact StandardActionId
↓
ActionPackage
↓
Agent
```

```text
Delivery level
existing Delivery boundary / explicit caller / Owner authority where required
↓
exact DeliveryOperationId
↓
DeliveryOperationPackage
↓
Agent
```

Do not create Delivery operations as Standard Actions:

```text
delivery-start Action
full-test Action
architecture-finalization Action
delivery-final Action
git-merge Action
```

Do not make Action Policy decide the Delivery lifecycle.

Do not make Delivery packages decide which Delivery operation should happen next.

---

# 6. D04 self-development / bootstrap boundary

During D04:

```text
.agents/skills/**
→ flowkit-next repository-local bootstrap / fallback / experimental HOW

skills/actions/**
→ accepted product Action HOW

skills/delivery/**
→ D04 product Delivery HOW under construction
```

D04 must **not** use its under-development `skills/delivery/**` or candidate `DeliveryOperationPackage` implementation as acceptance authority for the same D04 Delivery.

D04 itself continues through the independent `.agents/skills/**` bootstrap plane until D04 is accepted on main.

After Stable Core acceptance, a future fresh proof may decide how Flowkit-next manages itself.

Important long-term principle:

> **Self-hosting does not require self-bootstrap elimination.**

Even after Flowkit-next can manage itself, `.agents/skills/**` may remain indefinitely as repository-local bootstrap, fallback, experimentation, or safe Skill-update isolation.

There is no automatic requirement to delete, synchronize, or converge `.agents/skills/**` with product Guidance.

No self-hosting migration framework is part of D04.

---

# 7. Environment-independent continuity invariant

The D04 continuity rule is:

> **State continuity first. Transport only when continuity is absent.**

Flowkit requires the exact repository/candidate/environment state needed by the next operation.

It does not model separate Core lifecycles for:

```text
local
detached
shared directory
cross-session
cross-machine
fresh machine
ZIP mode
bundle mode
```

At every continuity boundary:

```text
exact required state
↓
is that exact state already available?

YES
→ verify exact identity/bytes
→ reuse directly

NO
→ restore only the missing exact state
→ verify restored identity/bytes
→ continue through the same Core path
```

A transport artifact may contain extra history or may open at a descendant commit. That transport HEAD is not repository authority.

The operation must explicitly select and verify the exact required Git revision before continuing.

---

# 8. Artifact role boundary

Artifacts are conditional mechanics only.

## 8.1 Complete source snapshot

Use only when exact required working-tree bytes are unavailable.

```text
source snapshot
→ transport / recovery only
```

## 8.2 Git bundle

Use only when required Git history/base identity is unavailable.

```text
Git bundle
→ Git-history transport only
```

A bundle HEAD does not redefine the required Delivery base.

## 8.3 Run / cumulative payload

Use for:

```text
lifecycle audit
provenance
material uncommitted Action continuation
```

Do not use Run prose as repository truth.

## 8.4 Dependency/runtime archive

Use only when the required environment is absent.

```text
dependency/runtime archive
→ environment restoration only
```

General rule:

```text
state exists
→ reuse

state missing
→ restore smallest exact missing state

then verify
→ continue
```

No transport artifact is mandatory merely because a Delivery boundary was crossed.

---

# 9. D04 Change composition

D04 contains exactly five required Changes.

## Change 1 — `establish-delivery-operation-execution-and-start-continuity`

Goal:

> Establish the reusable exact Delivery-operation execution envelope and prove it first with Delivery Start, while starting every Delivery from exact accepted repository truth.

Inputs for Delivery Start:

```text
exact previous accepted main HEAD
+
previous accepted Actual as derived continuity input only
+
current Git facts
+
current OpenSpec facts
+
open Memos
+
Owner-approved Delivery goal/composition
```

Required outputs:

```text
closed DeliveryOperationId contract
content-bound DeliveryGuidanceRef contract
minimal DeliveryOperationPackage contract
skills/delivery/start/SKILL.md
repeatable Delivery Start continuity
complete Current Architecture
complete Planned Architecture
Current → Planned compare
exact Delivery Start fixed-point commit/base
```

Must not:

```text
create a Delivery Skill Registry / Router / Planner
create dynamic Skill discovery
turn Delivery operations into Standard Actions
create a second candidate identity subsystem
treat Previous Actual as truth authority
encode local/detached mode in Core
require mandatory transport
self-host D04 through the candidate Delivery mechanism
```

---

## Change 2 — `complete-formal-full-test-correction-and-platform-fixture-discipline`

Depends on Change 1.

Goal:

> Freeze repeatable Formal Full Test execution/correction semantics and provide canonical `delivery-full-test` Guidance through the already-established exact Delivery-operation package model.

Decision rule:

```text
Formal Full Test failure
↓
does repository/canonical truth need to change?

NO
→ environment / fixture / command-setup correction
→ preserve same exact candidate
→ rerun applicable verification

YES
→ STOP
→ normal Owner-controlled correction/revise flow
→ repository/canonical bytes change
→ new exact candidate
→ prior PASS evidence does not prove the new candidate
→ restart Formal Full Test
```

Platform invariant:

```text
same semantic proof obligation
≠
identical operating-system fixture mechanics
```

Required Guidance:

```text
skills/delivery/full-test/SKILL.md
```

Must not build:

```text
finding database
Evidence Platform
automatic corrective Change
candidate invalidation subsystem
filesystem abstraction
platform lifecycle branch
```

---

## Change 3 — `establish-architecture-and-canonical-diagram-continuity`

Depends on Change 2.

Goal:

> Freeze complete Architecture continuity and repository-scoped canonical Workflow/Lifecycle/Data Flow ownership, then provide canonical Architecture Finalization HOW through the Delivery-operation package model.

Architecture continuity:

```text
previous accepted Actual
→ next Current continuity input

Current + Planned
+
accepted exact candidate facts
+
valid Formal Full Test PASS
↓
Actual complete snapshot
```

Thin compares:

```text
Current → Actual
Planned → Actual
```

Canonical current views:

```text
workflow.json
lifecycle.json
data-flow.json
```

D04 may materialize a missing repository-scoped baseline once when D04 establishes ownership for that view.

After a canonical baseline exists:

```text
represented accepted semantics unchanged
→ exact bytes untouched
```

Required Guidance:

```text
skills/delivery/architecture-finalization/SKILL.md
```

Archify remains derived description only.

Must not build:

```text
Reference Architecture
Diagram Registry
Diagram Planner
Diagram Runtime
diagram lifecycle
V/F model
mutation taxonomy
path allowlist
```

If finalization discovers a material implementation/canonical defect:

```text
STOP
→ normal correction flow
→ verification restarts as required
```

---

## Change 4 — `establish-delivery-finalization-contract`

Depends on Change 3.

Goal:

> Close a Delivery only from already-accepted implementation and verification facts, and provide canonical Delivery Final HOW through the Delivery-operation package model.

Preconditions:

```text
all required planned Changes completed
+
valid Formal Full Test PASS
+
Actual materialized
+
required canonical diagram convergence complete
```

Then:

```text
Delivery Final
↓
record exact closure / continuity facts
↓
STOP
```

Required Guidance:

```text
skills/delivery/final/SKILL.md
```

Delivery Final itself does not imply:

```text
source ZIP
Git bundle
Run export
environment switch
Git commit
PR
merge
release publication
```

Finalization derives closure from already-accepted facts. It does not repair implementation.

---

## Change 5 — `establish-repository-integration-and-next-base-continuity`

Depends on Change 4.

Goal:

> Connect the exact Delivery Final candidate to accepted Git history and the next exact base, while preserving explicit Owner Git authority and the same reuse-or-restore continuity invariant.

Flow:

```text
Delivery Final
↓
verify exact finalized state availability
↓
Owner explicit exact Git authorization
↓
one ordinary Delivery Final commit
↓
PR
↓
merge / repository acceptance
↓
read exact accepted main HEAD
↓
next Delivery base
```

Required Guidance:

```text
skills/delivery/repository-integration/SKILL.md
```

State availability:

```text
exact final working tree + required Git history already available
→ verify
→ direct continuation

required state missing
→ restore only missing state
→ verify
→ continue
```

Must not build:

```text
automatic commit
automatic push
automatic merge
Flowkit-owned Git authority
promotion lifecycle
environment-specific integration type
```

---

# 10. Delivery Start fixed-point contract

Delivery Start begins from the exact accepted main, not from an arbitrary restored workspace HEAD.

For D04 the exact accepted base is:

```text
main@6bda1e87a0c12929c3567de17ede75ecd0cf0bed
```

The correct start sequence is:

```text
restore repository/history only if needed
↓
verify exact accepted main exists
↓
checkout exact accepted main
↓
ensure clean working tree
↓
create fresh D04 Delivery branch
↓
Owner authorizes bounded Delivery Start scope
↓
materialize Delivery manifest
↓
materialize Current Architecture
↓
materialize Planned Architecture
↓
materialize Current → Planned compare
↓
validate complete Delivery Start surface
↓
one ordinary Delivery Start commit
↓
read exact Delivery Start commit SHA
↓
that SHA becomes the exact base for D04 Change execution
↓
STOP
```

The Delivery Start commit is a fixed-point repository boundary. It must not be mixed with Change 1 Explore/Proposal/Apply bytes.

The bounded Delivery Start authorization may include the single ordinary start commit. Push/PR/merge remain separate later Git boundaries.

If exact Git mutation authority for the start commit is absent:

```text
materialize + validate
↓
STOP before commit
```

---

# 11. Delivery Start Architecture evidence discipline

Current and Planned Architecture at Delivery Start are derived descriptions of the accepted base and the Owner-approved plan.

The accepted Git revision remains repository truth.

Important evidence invariant:

> **Every repository source referenced by an Archify document must exist at the repository revision declared by that document.**

Therefore Delivery Start Planned Architecture must not create a self-referential Git-evidence problem.

Preferred D04 Start rule:

```text
Current Architecture repository revision
→ exact accepted main

Planned Architecture repository revision
→ exact accepted main

Planned Architecture source refs
→ only accepted-base repository facts / seams that exist at that revision
```

The newly materialized D04 Delivery manifest may describe Delivery composition, but it must not be used as a repository evidence source for a Planned Architecture whose declared revision predates that manifest.

If a future Archify capability explicitly supports verified working-tree evidence, that may be separately proven. D04 does not assume such a mode.

Delivery Start validation must include:

```text
git diff --check
OpenSpec validation
Archify Current validation
Archify Planned validation
compare receipt/hash consistency
no unexpected production mutation
no active Change created automatically
```

No artificial component must be added merely to make an Architecture diagram appear changed.

D04 currently plans responsibility/contract convergence across existing seams. A new control-plane component requires fresh proof and explicit Owner composition revision.

---

# 12. Delivery Operational Guidance ownership

Canonical product ownership:

```text
skills/delivery/start
skills/delivery/full-test
skills/delivery/architecture-finalization
skills/delivery/final
skills/delivery/repository-integration
```

These files own normative product HOW for their exact Delivery operation.

They must not duplicate lifecycle truth.

They must not select the next Delivery operation.

They must not become a second source of Git/OpenSpec/Owner authority.

The DeliveryOperationPackage freezes the exact Guidance identity before Agent execution, analogous to the already-proven ActionPackage pattern.

No top-level product Guidance is planned for:

```text
handoff
restore
transport
skill discovery
skill synchronization
```

Reuse/restore/transport are subordinate conditional mechanics inside the relevant exact operation HOW.

---

# 13. Representative execution proof

D04 must prove the same continuity and execution contract in at least two contexts.

## Shared exact state

Example:

```text
same repository directory
same exact working tree
same required Git history
same valid environment
```

Expected:

```text
verify
→ direct reuse
→ no artificial transport
```

## Non-shared exact state

Example:

```text
detached/non-shared execution
→ next operation elsewhere
```

Expected:

```text
restore only missing repository/history/environment state
→ verify exact identity/bytes
→ prepare the same exact Delivery operation package
→ execute through the same lifecycle/authority contract
```

Acceptance means one contract works in both contexts.

It does not mean two supported lifecycle modes exist.

---

# 14. Historical/platform discipline

D04 does not rewrite completed historical Changes merely because later proof mechanics improve.

Historical observations contribute:

```text
invariant
Guidance
fixture/correction rule
```

not:

```text
mass historical rewrite
old archive mutation
old Run rewrite
automatic old-Delivery rerun
compatibility subsystem
```

If D04 discovers a real defect in the current repository/canonical candidate:

```text
STOP
→ normal corrective Change/revise flow
→ exact candidate changes
→ verification restarts as required
```

---

# 15. External-project readiness after D04

After D04 accepted main, a target project should need only its normal local inputs:

```text
repository / Git state
OpenSpec / project contracts
project-local configuration/tooling
Owner scope / authority
Agent capable of executing the exact package + supplied canonical Guidance
```

The reusable loop is:

```text
target-project accepted state
↓
exact delivery-start operation
↓
DeliveryOperationPackage + skills/delivery/start
↓
bounded Changes
↓
ActionPackage + skills/actions/**
↓
exact delivery-full-test operation
↓
exact delivery-architecture-finalization operation
↓
exact delivery-final operation
↓
exact delivery-repository-integration operation
↓
accepted main
```

External-project management does not require:

```text
self-hosting convergence
central project Registry
web console
automatic multi-project scheduler
Agent Skill discovery
one-command project wizard
automatic Git integration
```

---

# 16. D04 acceptance candidate

D04 is accepted only when real execution proves:

```text
exact accepted previous main
↓
repeatable Delivery Start fixed point
↓
exact Delivery Start commit/base
↓
multiple bounded OpenSpec Changes
↓
exact ActionPackage execution continues to work
↓
exact DeliveryOperationPackage execution exists for all five Delivery operations
↓
Formal Full Test
   ├─ pure environment/fixture correction → same candidate
   └─ repository/canonical correction → new candidate + restart
↓
Actual Architecture
↓
canonical Workflow/Lifecycle/Data Flow convergence
↓
Delivery Final
↓
exact finalized-state reuse-or-restore
↓
Owner-authorized repository integration
↓
ordinary final commit
↓
PR / merge
↓
exact accepted main
↓
next-base continuity
```

Additionally:

```text
Delivery operation WHAT is always decided before HOW

DeliveryOperationPackage binds exact operation + context + content-bound Guidance

Agent does not discover or choose the Delivery operation

skills/delivery/** is canonical product HOW

.agents/skills/** remains independent repository-local bootstrap/fallback during D04

shared/non-shared contexts use one continuity contract

no environment lifecycle mode exists

no D05 exists

no self-hosting takeover is required
```

---

# 17. Explicit non-goals

D04 MUST NOT introduce:

```text
D05 pre-creation
self-hosting takeover
mandatory .agents deletion or convergence
Agent-facing Delivery Skill projection requirement
Skill Registry / Guidance Registry / Skill Router / Skill Planner
dynamic Skill discovery / ranking
Delivery operations as Standard Actions
second Delivery lifecycle
local/detached executionMode in Core
mandatory ZIP handoff
mandatory Git bundle handoff
mandatory dependency archive handoff
transport subsystem
payload registry
continuation database
automatic Git authority
automatic commit/push/merge
promotion lifecycle
Release Registry
automatic tag/publish workflow
Verification finding database
Evidence Platform
new candidate identity subsystem
Reference Architecture
Diagram Registry / Planner / Runtime
V/F model
mutation taxonomy
path mutation allowlist
internal contract version families
```

A small closed `DeliveryOperationId` set, deterministic Guidance path mapping, content-bound `DeliveryGuidanceRef`, and exact `DeliveryOperationPackage` are explicitly **not** a Registry/Router/control plane because they do not discover, rank, choose, or authorize operations.

---

# 18. Stable Core completion outcome

When D04 reaches accepted main:

```text
Foundation lifecycle
+
engineering quality
+
bounded Action execution
+
canonical Action Guidance
+
exact Delivery-operation execution packages
+
canonical Delivery Guidance
+
Delivery Start continuity
+
Formal Full Test correction semantics
+
Architecture/canonical diagram continuity
+
Delivery Final
+
repository/next-base continuity
=
Flowkit-next Stable Core
```

After that boundary:

```text
Core control plane
→ default freeze

execution know-how
→ Guidance first

repository mechanical quality
→ repository/project tooling first

new Core capability
→ only after repeated fresh proof of a missing
   authority / lifecycle / truth / coordination /
   acceptance / continuity contract
```

---

# 19. Final frozen principles

```text
D04 is the final planned Stable Core Delivery.

D04 contains exactly five planned Changes.

D05 does not exist in the current roadmap.

Action and Delivery share one execution pattern:
exact operation → content-bound Guidance → exact package → Agent.

Action and Delivery do not share one lifecycle identity.

WHAT is decided before HOW.

The Agent does not discover, rank, route, or choose the operation.

skills/actions/** owns canonical Action HOW.

skills/delivery/** owns canonical Delivery HOW.

.agents/skills/** may remain permanently as repository-local bootstrap,
fallback, experimentation, and safe Skill-update isolation.

Self-hosting does not require self-bootstrap elimination.

State continuity first.
Transport only when continuity is absent.

Transport HEAD is never repository authority.
The exact required Git revision must be selected explicitly.

Delivery Start creates a clean fixed-point commit before Change execution.

Planned Architecture must not cite repository files that do not exist
at its declared repository revision.

Formal Full Test preserves the same candidate only for pure
environment/fixture/command-setup correction.

Repository/canonical mutation creates a new candidate and restarts proof.

Archify remains derived description only.

Delivery Final closes the Delivery.
Repository integration happens afterwards under explicit Git authority.

D04 accepted main is the candidate boundary for the first stable
whole-product Flowkit-next release.

No new control plane without fresh proof.
```

---

# 20. Next legal boundary

This document does not itself authorize execution.

The next legal sequence is:

```text
Owner accepts this final D04 reference
↓
restore an execution environment from any sufficient transport source if needed
↓
explicitly select exact accepted base:
main@6bda1e87a0c12929c3567de17ede75ecd0cf0bed
↓
verify clean exact repository state
↓
create a fresh D04 Delivery branch
↓
Owner authorizes D04 Delivery Start
↓
execute Delivery Start through the independent D04 bootstrap HOW
↓
materialize + validate manifest / Current / Planned / compare
↓
one ordinary Delivery Start fixed-point commit
↓
read exact start commit SHA
↓
STOP
↓
then begin Change 1:
establish-delivery-operation-execution-and-start-continuity
```
