# Explore — Establish Delivery Operation Execution and Start Continuity

## 1. Bounded execution facts

This Change is the first D04 Change and is active from the exact Delivery Start fixed point:

```text
accepted main
6bda1e87a0c12929c3567de17ede75ecd0cf0bed
↓
Delivery Start fixed point
eaa1c8f1cf9a52e05b75c3d1133f7aff8449c215
↓
Owner activate-change
↓
Policy ready-action: explore
```

Its durable `projectOrdinal` is `026`, assigned once as `max(existing durable assigned projectOrdinal 021..025) + 1`. Planned-only D04 Changes reserve no ordinal.

The pre-activation continuity proof found no D04 Start drift: the start commit has the exact accepted-main parent, only the four intended Delivery Start files, matching final-reference SHA-256, five planned Changes in the approved order, no pre-created active OpenSpec Change, and unchanged 21-component / 3-boundary / 15-connection architecture topology.

A separate Owner-authorized open Memo now records a future `.agents` bootstrap improvement: every Change should perform a thin Pre-Explore check against the nearest valid repository fixed-point commit. That Memo is non-blocking and is not part of this product Change.

D04 execution continues through independent `.agents/skills/**` bootstrap HOW. This Explore does not read or execute candidate `skills/delivery/**` Guidance as authority for D04 itself.

## 2. Existing Action execution pattern is the reusable proof seam

Accepted D03 product behavior already proves:

```text
exact StandardActionId already decided
↓
canonical skills/actions/<actionId>/SKILL.md
↓
regular-file + exact content SHA-256 GuidanceRef
↓
exact ActionPackage
↓
package-bound preparation / execution
↓
Result
```

Focused tests over Action Guidance, ActionPackage/result admission, single-Action execution, Policy/authority, trusted Change coordination and Memo persistence pass `68/68` on the exact D04 Start base plus current authorized coordination/Memo mutations.

Repository inspection also proves there is currently no production `DeliveryOperation*` implementation and no `skills/delivery/**` product surface. Therefore Change 1 is adding one bounded product execution seam rather than modifying an existing hidden Delivery runtime.

Decision:

> Reuse the proven exact-operation execution pattern. Do not reuse Action lifecycle identity or make Delivery operations Standard Actions.

## 3. DeliveryOperationId is a closed execution identity, not lifecycle authority

The final D04 composition already fixes exactly five operations:

```text
delivery-start
delivery-full-test
delivery-architecture-finalization
delivery-final
delivery-repository-integration
```

The canonical Guidance mapping is static and 1:1:

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

`DeliveryOperationId` answers only “which already-decided Delivery operation is executing”. It MUST NOT select the next operation, activate a Change, decide Review/Verification truth, or create Git authority.

A closed compile-time catalog is sufficient. No Registry, dynamic discovery, ranking, Router or Planner is justified.

## 4. DeliveryGuidanceRef should mirror Action Guidance identity without broadening Action truth

The smallest product Guidance identity remains:

```text
{
  path: canonical repository-relative path,
  contentSha256: exact file bytes SHA-256
}
```

For Delivery the resolver must derive the path only from trusted repository root + exact `DeliveryOperationId`. Caller/Agent nominated paths are not accepted. Canonical entries must be readable regular files, not symlinks or redirected entries. Missing/invalid Guidance fails closed and never falls back to `.agents/skills/**`.

A controlled non-production prototype over the five planned Delivery entries proves:

```text
5/5 static mappings resolve deterministically
unknown operation                 → fail closed
same path with changed bytes      → different content identity
wrong Delivery Guidance for start → package formation rejected
wrong Delivery authority          → package formation rejected
final-entry symlink               → fail closed
```

Decision:

> Introduce a Delivery-specific content-bound GuidanceRef contract with the same path/hash semantics as Action Guidance. Mechanical internal helper reuse is allowed, but accepted Action Guidance semantics do not need to be generalized or reopened merely for type symmetry.

## 5. The minimum DeliveryOperationPackage is a stable envelope over validated operation context

Delivery operations do not need `CurrentAction`, `prepared/terminal`, Run occurrence, Action role or Action Policy state. Copying those fields would falsely create a second Action lifecycle.

The minimum stable package shape is conceptually:

```text
DeliveryOperationPackage
├─ deliveryId
├─ operationId
├─ ownerAuthority: exact OwnerAuthorityFact | null
├─ operationFacts: exact already-validated facts for this operation
└─ guidanceRef: exact DeliveryGuidanceRef
```

The package is formed only by a trusted Delivery-operation host after the operation identity and required authority boundary are already established. `operationFacts` are not arbitrary caller truth: each operation owns a closed validator/resolver for the facts it needs before package formation. The shared package envelope can therefore remain stable while D04 Changes 2–5 add their operation-specific fact contracts.

Change 1 needs to prove only the first concrete variant:

```text
DeliveryStartOperationFacts
├─ acceptedBaseCommit
└─ planningReference
   ├─ artifact/source identity
   └─ contentSha256
```

The trusted host additionally verifies the actual canonical repository is at the exact accepted base and satisfies the clean-start precondition before invoking Delivery Start. Current Git/OpenSpec/Memo/Previous-Actual facts are read from their canonical owners during Start HOW; they are not accepted as caller-supplied truth merely to make the package larger.

This avoids a second candidate/state identity subsystem. Later operations may reuse already-owned candidate/verification/architecture/Git identities inside their own validated facts where those facts are actually required.

## 6. Delivery Start authority and Git mutation remain explicit

For `delivery-start`, the package can only be executable when the exact Owner authority matches the current Delivery and authorizes the bounded Delivery Start scope. The package preserves that authority fact; it does not mint or infer it.

The product Start HOW should execute:

```text
exact accepted base selected and verified
↓
exact Delivery Start package formed
↓
Agent consumes exact skills/delivery/start/SKILL.md HOW
↓
materialize manifest + Current + Planned + compare
↓
validate Start surface
↓
if bounded start-commit authority is present:
  one ordinary Delivery Start fixed-point commit
else:
  STOP before commit
↓
return exact closure/fixed-point facts
↓
STOP
```

Transport is not a Delivery mode and is not part of package identity. Missing repository/history/environment state is restored before the same operation preparation path; state that already exists is reused directly.

## 7. Bootstrap independence is preserved

D04 itself already performed Delivery Start through `.agents` bootstrap HOW before the product `skills/delivery/start/SKILL.md` exists. That is intentional proof isolation.

Change 1 MUST NOT:

```text
use the candidate Delivery Start Skill to justify the current D04 Start
replace .agents bootstrap execution during D04
add .agents/skills/flowkit-delivery-* projection
add dynamic Agent Skill discovery
require self-hosting convergence
```

The candidate product mechanism is implemented and tested for future Flowkit-managed projects; D04 acceptance continues independently.

## 8. Concept ownership and implementation boundary

The bounded product direction is:

```text
identity
→ closed DeliveryOperationId literals

delivery Guidance execution
→ deterministic canonical path + content-bound ref

delivery operation execution
→ validated context + minimal exact package + bounded callback seam

skills/delivery/start/SKILL.md
→ canonical Delivery Start HOW

OpenSpec
→ one new Delivery-operation/start-continuity capability contract
```

No evidence requires:

```text
Delivery lifecycle state machine
DeliveryOperation Registry
Skill/Guidance Registry
Router / Planner / scheduler
Delivery operations as Standard Actions
new candidate database / continuation database
CLI auto-discovery or auto-run loop
Agent-facing .agents product projection
automatic Git authority
```

The existing Foundation CLI explicitly remains thin and need not become a Delivery-operation runner in this Change. The reusable domain/host seam is sufficient for the product contract; later productization may add an explicit caller surface only if separately proven necessary.

## 9. Proposal-ready invariants

Proposal should freeze at least:

1. Exactly five closed `DeliveryOperationId` literals with deterministic canonical `skills/delivery/**` mapping.
2. Delivery Guidance is path + exact content SHA-256, resolved only from trusted repository root + exact operation id, with regular-file/symlink/readability fail-closed behavior and no `.agents` fallback.
3. `DeliveryOperationPackage` binds exact Delivery identity, already-decided operation, exact matching Guidance, exact validated operation facts and existing authority fact/null; it owns no lifecycle decision.
4. Package formation fails closed on unknown operation, wrong Guidance mapping/hash, wrong Delivery identity, malformed/mismatched operation facts, or missing/mismatched required authority.
5. Change 1 implements/proves only the concrete `delivery-start` facts and canonical Start HOW; Changes 2–5 extend operation-specific facts/HOW without changing the closed execution model.
6. Delivery Start verifies exact accepted Git base and clean repository precondition, consumes the exact Owner-approved planning input identity, materializes/validates the Start surface, and performs at most the explicitly authorized single fixed-point commit.
7. State continuity remains one rule: reuse exact available state; restore only missing state before operation preparation; no local/detached lifecycle branch.
8. D04 does not self-host the candidate product Delivery mechanism.

## 10. Explicit non-goals / deferred concerns

```text
Pre-Explore fixed-point check implementation in .agents
→ recorded in Memo; outside this Change

full-test operation facts/HOW
→ Change 2

architecture-finalization operation facts/HOW
→ Change 3

delivery-final operation facts/HOW
→ Change 4

repository-integration operation facts/HOW
→ Change 5

self-hosting convergence
→ future fresh proof only
```

## 11. Explore conclusion

```text
PASS
```

The real gap is bounded and Proposal-ready. Delivery execution can reuse the proven Action exact-operation/package pattern without importing Action lifecycle semantics. A static five-operation identity set, deterministic content-bound Delivery Guidance, one minimal package envelope over trusted operation-specific facts, and the first concrete Delivery Start facts/HOW are sufficient for Change 1.

No new control plane is justified.
