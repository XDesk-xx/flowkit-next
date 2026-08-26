# Explore — establish-action-package-and-result-admission

## Outcome

```text
PASS
```

当前 Change 可以在不引入新的 package/result identity、multi-Agent orchestration、Policy、CLI、toolchain integration 或 transport subsystem 的前提下进入 Proposal。

Revision after `20260826-037-review-explore`:

```text
RE-037-001 closed
```

Reviewer identified one exact-current-package freshness hole: a package captured at `prepared A` could otherwise remain structurally admissible after the exact current Action advanced to `resumed A`. The revised boundary now requires **package lifecycle state to equal the exact current Action lifecycle state at admission**, with both sides restricted to `prepared | resumed`. Focused negative proof rejects both `prepared package / resumed current` and `resumed package / prepared current` without adding PackageId, nonce, replay registry, locking, or resume orchestration.

Revision after `20260826-039-review-explore`:

```text
RE-039-001 closed
```

Reviewer identified a second bounded freshness hole across a real Author ↔ Reviewer revision loop: an older `review-explore` package can have the same semantic `ActionIdentity`, reviewer role, and `prepared` state as a later `review-explore` occurrence. The revised boundary therefore also requires **the ActionPackage Run occurrence to equal the exact current Run occurrence supplied by the execution boundary at admission**. Focused negative proof reproduces stale `20260826-037-review-explore` versus current `20260826-039-review-explore`: every 038 invariant passes before the occurrence check, then the stale package is rejected by exact `runId` mismatch. No PackageId, ResultId, nonce, replay registry, locking, or scheduler is introduced.

本次 Explore 的最小问题是：

> Core 如何把已经存在的 exact current Action / Run occurrence / role / authority / predecessor facts 冻结成一个可交给 external executor 的 ActionPackage，并在 executor 返回 Result 后只 admission 属于该 exact package/current Action 的结果？

该问题必须继续保持 Foundation 的单 Action、顺序 Author ↔ Reviewer、显式 Owner authority 与 STOP boundary，不把“external execution”扩展成 Agent runtime framework。

---

## 1. Owner / Delivery boundary

Delivery:

```text
20260824-01-foundation-lifecycle-kernel
```

Change:

```text
establish-action-package-and-result-admission
```

Owner authority:

```text
owner:585262e33c2d6af0b6cb3fc5900f9097d6d984a68cb4088bd630df5cd9722937
```

Source:

```text
owner-input:2026-08-26:authorize-activate-and-explore:20260824-01-foundation-lifecycle-kernel:establish-action-package-and-result-admission
```

Authorized scope:

```text
activate-change
explore
```

No Apply / Archive / Git checkpoint authority is implied.

---

## 2. Baseline facts

Exact base supplied by Owner:

```text
f03fb6756ffa4f7ad759113568a10dee48bfe28f
```

Baseline verification before activation:

```text
OpenSpec active changes       0
OpenSpec validate --all       3/3 PASS
TypeScript typecheck          PASS
Domain tests                  35/35 PASS
Prettier format check         PASS
Node                          22.23.2
pnpm                          11.22.0
OpenSpec                      1.10.0
```

Existing canonical capabilities already provide:

```text
identity / authority
  DeliveryId
  ChangeId
  StandardActionId
  Author / Reviewer execution roles
  explicit OwnerAuthorityFact

Action lifecycle
  one current Action slot
  prepared / resumed / terminal
  exact semantic ActionIdentity
  terminal absorbing for the same Action identity

Run / Result persistence
  Change-scoped RunOccurrence
  generated YYYYMMDD-NNN-action Run id
  role
  lifecycleState
  OwnerAuthorityFact | null
  previousRunId | null
  RunResultRecord
  exact Run ↔ Result linkage
  create-once durable history
```

The current persistence Change deliberately left ActionPackage and Result admission for this Change.

---

## 3. Real input domain

This Change is limited to the current Foundation model:

```text
one repository
one current Change
one current Standard Action
one execution role: author or reviewer
one prepared/resumed Run occurrence
external actor executes that one Action
one candidate Result returns
Core decides whether that Result belongs to the exact prepared package/current Action
```

It does not need to solve:

```text
parallel agents
parallel writers
provider/agent registries
scheduler / automatic next
network transport protocol
distributed package identity
cryptographic attestation
WAL / database / crash recovery
arbitrary external RunId/path input
generic artifact manifest
mutation/Git authority
managed tool runtime
OpenSpec adapter
CLI
Policy next-boundary legality
Delivery Verification
```

---

## 4. Proof questions

### P1 — Does ActionPackage need a new PackageId?

Question:

> Repeated executions of the same semantic Action need exact correlation. Is a second PackageId/ResultId identity required in addition to the already-established Run occurrence?

Proof:

An execution-local controlled model reused the real `RunOccurrence`, `RunContextRecord` and `RunResultRecord` validators. Two `review-explore` executions shared the same semantic ActionIdentity but had different generated Run ids.

Observed:

```text
same ActionIdentity
+ different RunOccurrence sequence
→ different canonical runId
```

A Result for the second occurrence was rejected against the first package when `runId` differed.

Decision:

```text
No new PackageId or ResultId is required for the current single-writer model.
The existing generated Run occurrence is the exact execution-correlation identity.
```

Boundary:

This does not claim globally unique distributed identity; that is outside the real input domain.

---

### P2 — Is `previousRunId` the same thing as the complete Action input?

Question:

> Should the existing persistence field be renamed to `inputRunId` and treated as the complete ActionPackage input?

Proof scenarios:

```text
A. propose
   → review-propose

B. review-propose changes-requested
   → revise-propose

C. later cross-stage repair example
   apply blocked
   → explicit Owner authorization
   → revise-propose
```

In all three, an immediate predecessor Run is useful provenance/handoff context. But the Action also consumes facts that are not represented by that one Run id:

```text
canonical OpenSpec artifacts
current Action identity/state
execution role
explicit Owner authority when applicable
repository truth
```

For cross-stage repair, the immediate blocked Run can remain the predecessor while the Owner authorization remains a separate authority fact.

Decision:

```text
Keep previousRunId semantics as sequential predecessor provenance.
Do not rename it during this Change unless Proposal later proves a contract need.
Do not define "complete Action input" as one Run id.
```

This resolves the pre-activation naming question: `previousRunId` and complete ActionPackage input are not equivalent concepts.

---

### P3 — What is the minimum machine ActionPackage surface?

The existing non-terminal Run context already contains nearly all machine facts required to freeze one execution boundary.

Minimum Proposal direction:

```text
ActionPackage
├─ exact Run occurrence / runId
├─ exact ActionIdentity
├─ exact execution role
├─ current lifecycle state = prepared | resumed
├─ explicit OwnerAuthorityFact | null
└─ previousRunId | null
```

These fields should reuse existing domain types/validators rather than introduce duplicate identity, role, authority or Run schemas.

Important separation:

```text
ActionPackage machine facts
≠ transport ZIP
≠ action.md replacement
≠ OpenSpec truth copy
≠ Skill copy
≠ repository snapshot manifest
```

The current external-orchestrator stable-transfer package remains a bridge/transport mechanism while the candidate runtime is incomplete. This Change only establishes the Core execution contract.

Decision:

```text
Reuse existing facts first.
Do not add arbitrary payload bags, provider metadata, filesystem paths, package UUIDs or tool runtime fields.
```

---

### P4 — What makes a returned Result exactly admissible?

The revised proof model accepts a candidate Result only when all of the following hold:

```text
1. ActionPackage is structurally valid.
2. package lifecycle state is prepared or resumed, never terminal.
3. exact current Action is structurally valid, has the same ActionIdentity, and is prepared or resumed.
4. package lifecycle state == exact current Action lifecycle state.
5. exact current Run occurrence is structurally valid and belongs to that exact current Action boundary.
6. ActionPackage.runId == exact current Run occurrence runId.
7. package execution role matches the Standard Action's execution-role contract.
8. Result is a structurally valid RunResultRecord.
9. Result.runId == ActionPackage.runId.
10. Result.ActionIdentity == ActionPackage.ActionIdentity exactly.
11. Author execution uses the Author outcome slot and does not claim Reviewer verdict.
12. Reviewer execution uses the Reviewer verdict slot and does not claim Author conclusion.
13. Standard Action execution does not manufacture formal Verification verdict authority.
```

Controlled counterexamples rejected:

```text
prior review-explore package + later review-explore current occurrence
right Action + wrong current Run occurrence
right runId + wrong ActionIdentity
prepared package + resumed exact current Action
resumed package + prepared exact current Action
package/current Action terminal mismatch
Author package + reviewerVerdict populated
Reviewer package + authorConclusion populated
Standard Action Result + verificationVerdict populated
```

Focused revision proof used the repository's actual `isRunContextRecord`, `isCurrentAction`, and `isRunResultRecord` validators around an exploration-only admission model. It established:

```text
prepared package + prepared current  → admissible
resumed package  + resumed current   → admissible
prepared package + resumed current   → reject
resumed package  + prepared current  → reject
terminal current/package             → reject
```

Focused revision proof for `RE-039-001` additionally established:

```text
stale package runId   = 20260826-037-review-explore
exact current runId   = 20260826-039-review-explore

all 038 identity/state/role/result-linkage invariants  → PASS
package.runId == exactCurrentRun.runId                 → FAIL
stale package after revised occurrence invariant       → REJECT

fresh package runId == exact current runId             → PASS
```

Decision:

> Result admission must bind the candidate to the exact ActionPackage Run occurrence + exact current Run occurrence + semantic Action + expected execution role **and to the exact current non-terminal lifecycle state captured by the ActionPackage**, while preserving Owner/Reviewer/Verification authority separation.

This is a bounded freshness/correlation invariant, not a replay subsystem. The current single-current-Action model does not require PackageId, ResultId, nonce service, locking, WAL, or generic replay history to close `RE-037-001` or `RE-039-001`.

No hash/fingerprint protocol is required to solve the current correlation/freshness problem.

---

### P5 — Should admission interpret Reviewer verdict / Author conclusion meaning?

Current persistence intentionally treats outcome strings as durable wire data. Policy is planned later and owns legal next-boundary interpretation.

Therefore this Change should distinguish **which authority slot may be populated**, but should not yet turn values such as:

```text
approved
changes-requested
PASS
```

into next-Action Policy decisions.

Decision:

```text
Admission validates exact identity/role/outcome-slot ownership.
Policy later interprets whether a particular accepted verdict/conclusion permits a boundary.
```

This prevents Result admission from becoming Policy.

---

### P6 — Should Result admission terminalize or auto-run the next Action?

Existing lifecycle guidance is already:

```text
prepare / exact resume
→ execute exactly one current Action
→ result admission
→ terminal
→ report next boundary
→ STOP
```

The next planned Change is explicitly:

```text
establish-resume-and-single-action-terminal-boundary
```

Decision:

```text
This Change defines package preparation facts and Result admission only.
It does not own the full execute → terminal → STOP orchestration loop.
```

Admission should return an accepted/admitted Result fact or fail closed. Composition with terminal transition and resume/STOP belongs to the next Change.

Likewise `nextBoundary` remains reported opaque data here; legal next-boundary calculation remains Policy work.

---

## 5. Execution-role boundary

The existing authority contract already separates Author and Reviewer execution roles. The minimum closed mapping required for package/admission is:

```text
Reviewer-owned Standard Actions
  review-explore
  review-propose
  review-apply

Author-owned Standard Actions
  explore
  revise-explore
  propose
  revise-propose
  apply
  revise-apply
  archive
```

This mapping is execution-role binding, not Policy ordering. It answers "who may execute this exact prepared Action", not "which Action is legal next".

Do not create a dynamic Action/role registry.

---

## 6. Proposed contract boundary for the next stage

Proposal should converge around two small domain seams.

### 6.1 ActionPackage contract

A closed, serialization-safe plain-data package built only from already-canonical domain facts.

Required invariants:

```text
exact generated Run occurrence
exact ActionIdentity
expected execution role
prepared/resumed current state only
explicit Owner authority preserved or absent
previousRunId preserved as predecessor provenance
no new package identity
no arbitrary filesystem/path/provider payload
```

### 6.2 Result admission contract

A pure/fail-closed boundary that compares:

```text
ActionPackage
+ exact current Action fact
+ exact current Run occurrence fact
+ candidate RunResultRecord
```

The exact current Run occurrence is an execution-boundary input, not a new global registry. Explore does not require changing the existing `CurrentAction` contract to embed Run identity; Proposal may choose the smallest API shape that supplies the already-canonical occurrence alongside the current Action.

and accepts only exact linkage/role ownership.

Required invariants:

```text
package/current Action same identity
package lifecycle state prepared/resumed
exact current Action state prepared/resumed
package lifecycle state == exact current Action lifecycle state at admission
package Run occurrence == exact current Run occurrence
candidate runId == package runId
candidate ActionIdentity exact match
execution role exact for Standard Action
Author vs Reviewer result slots remain separate
formal Verification verdict cannot be invented by Standard Action execution
nextBoundary not interpreted as Policy legality
no persistence overwrite/dedup registry invented here
```

No production API name is frozen by Explore; Proposal may choose the smallest implementation shape that preserves these invariants.

---

## 7. Risks and bounded responses

### R1 — ActionPackage becomes a generic transport manifest

Response:

```text
Keep package machine-only and closed.
Transport ZIP, repository synchronization, tools and Skills remain separate boundaries.
```

### R2 — Admission becomes Policy

Response:

```text
Validate exact ownership/linkage only.
Do not decide legal next Action from verdict/nextBoundary.
```

### R3 — Admission becomes multi-Agent anti-replay infrastructure

Response:

```text
Current single-writer model uses unique Run occurrence + non-terminal current Action.
No nonce service, ResultId registry, locking or distributed replay protocol.
```

### R4 — `previousRunId` is overloaded as all execution input

Response:

```text
Keep it as predecessor provenance.
ActionPackage is the complete execution boundary, not one Run reference.
```

### R5 — Standard Action fabricates Verification PASS

Response:

```text
Admission preserves independent Verification authority by rejecting a Standard Action candidate that tries to populate formal verificationVerdict.
```

### R6 — A stale package survives a prepare → resume state advance

Response:

```text
Bind admission freshness to the exact current Action lifecycle state.
Require package.state == current.state and both states in prepared|resumed.
Reject state mismatch before admitting Result.
Do not add PackageId/nonce/replay registry for this single-current-Action model.
```

### R7 — A stale same-Action package survives an intervening revision loop

Response:

```text
Bind the package to the exact current Run occurrence as well as Action identity/state.
Require package.runId == exactCurrentRun.runId before admitting Result.
Reuse the existing canonical RunOccurrence/runId.
Do not add PackageId, ResultId, nonce, replay registry or global Run lookup.
```

---

## 8. Explicit non-goals

Do not pull the following into Proposal:

```text
multi-Agent orchestration
Agent/provider registry
parallel execution / locking
scheduler / automatic next
network protocol
cryptographic package signing
new PackageId / ResultId
legacy Run migration
previousRunId rename for cosmetic consistency
filesystem hardening subsystem
arbitrary payload/path APIs
Action-specific repository mutation authority
managed toolchain resolution
OpenSpec thin adapter
CLI
Git checkpoint
Policy ordering / next legality
resume/terminal/STOP orchestration
Delivery Full Test / Verification
```

---

## 9. Proof evidence summary

Execution-local proof used the repository's real TypeScript validators and an exploration-only admission model; it did not mutate production source/tests.

Result:

```text
PASS
```

Focused revision proof (`RE-037-001`):

```text
proof script sha256  1d2b3fef35b22a2942eabd79786af3f3b8c464b9ea13d4c6d60b875d58b56746
proof result sha256  b6ce327aa0116378391efd4968090e1729836fdcf2a16fe8fb3c7900f94ea733
stable transfer       excluded (execution-local proof only)
```

Proved:

```text
- repeated same ActionIdentity is disambiguated by existing Run occurrence;
- no extra package/result UUID is required for current scope;
- wrong runId or wrong ActionIdentity must fail admission;
- role/outcome-slot cross-wiring must fail admission;
- Standard Action must not claim formal Verification verdict;
- previousRunId is predecessor provenance, not complete Action input;
- package/current lifecycle-state equality rejects prepare→resume stale-package mismatch;
- lifecycle state equality alone does NOT reject a prior same-Action occurrence after an intervening revision loop;
- package.runId == exactCurrentRun.runId rejects that stale prior occurrence;
- a fresh package for the exact current occurrence remains admissible under the occurrence freshness invariant.
```

Focused revision proof (`RE-039-001`):

```text
proof script sha256  8f683b4e4def78c49ae8768d1ff5263e8255a4b3dfd63195fd66e41f8e575a0a
proof result sha256  87a08292c8923c567961e1e9318f6430c319ea9283f6a2c37b574ea24886002c
stable transfer       excluded (execution-local proof only)
```

Not proved / intentionally deferred:

```text
multi-process race freedom
network replay protection
crash atomicity
provider execution protocol
Policy interpretation of verdict literals
mutation scope enforcement
whole-manager resume/terminal orchestration
```

Those are outside this Change's authorized real input domain or owned by later planned Changes.

---

## 10. Explore stopping decision

The proof-based stop conditions are satisfied:

```text
minimum real use case bounded                     YES
contract-changing unknowns resolved               YES
remaining unknowns are later/non-goal concerns    YES
Proposal can be written without new scope         YES
```

Therefore:

```text
Author Explore conclusion: PASS
Next boundary reported: review-explore
```

Reviewer should especially challenge:

```text
1. whether the minimum ActionPackage fields are sufficient without inventing a new package identity;
2. whether previousRunId is correctly retained as provenance rather than renamed;
3. whether execution-role/outcome-slot separation is admission rather than Policy;
4. whether forcing formal verificationVerdict to remain absent/null for Standard Action execution preserves the existing authority contract;
5. whether package/current lifecycle-state equality closes prepare→resume staleness;
6. whether package.runId == exactCurrentRun.runId closes repeated same-Action occurrence staleness without inventing replay infrastructure;
7. whether the exact current Run occurrence can remain a narrow execution-boundary input rather than expanding CurrentAction or creating a registry;
8. whether any resume/terminal/Policy/transport mechanism has accidentally leaked into scope.
```
