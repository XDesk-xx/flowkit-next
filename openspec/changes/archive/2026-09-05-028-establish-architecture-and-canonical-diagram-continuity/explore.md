# Explore — Architecture and Canonical Diagram Continuity

## Status

```text
PASS
→ Proposal-ready after independent review-explore
```

This Explore is proof-only. It activates and bounds Change 3; it does not implement product code, create Proposal artifacts, materialize D04 Actual Architecture, mutate canonical system diagrams, execute D04 Formal Full Test, or pull Delivery Final / repository integration scope forward.

## 1. Exact continuity and activation boundary

The nearest repository fixed point is:

```text
0a8a98817b8a5b244bbc841e1101b9f8af73080c
```

Its parent is the accepted Change 2 archive checkpoint:

```text
19c1eab71d26c24534565e1e03ac8f5d3115ad9c
```

`0a8a988...` adds only the exact D04 final planning/reference artifact already declared by the Delivery manifest. Its SHA-256 exactly matches the manifest-declared value `b26217a2ae397772aea7fd96140855b0099a1089e2c2f8c9b2614e50809320a9`.

Pre-Explore continuity proved before Change 3 mutation:

```text
working tree clean
Change 1 = completed / archive present / projectOrdinal 026
Change 2 = completed / archive present / projectOrdinal 027
active OpenSpec Changes = 0
D04 Current / Planned / Current→Planned artifacts present
reference artifact hash = exact manifest hash
unexpected repository drift = none
```

Owner then authorized exact Change 3 activation with scope `[explore]`. Trusted Change coordination returned `active`, and Policy independently returned `ready-action: explore`.

Durable project ordinals were unique and continuous `021..027`, so this first legal Explore assigned `projectOrdinal: 028` exactly once.

## 2. Existing Delivery-operation seam proves a real, bounded third variant

Change 1 and Change 2 already established:

```text
DeliveryOperationId
→ deterministic canonical skills/delivery/** path
→ content-bound DeliveryGuidanceRef
→ exact DeliveryOperationPackage
```

Concrete package variants currently exist only for:

```text
delivery-start
delivery-full-test
```

Current production code intentionally returns false/null for:

```text
delivery-architecture-finalization
delivery-final
delivery-repository-integration
```

The deterministic path already exists:

```text
delivery-architecture-finalization
→ skills/delivery/architecture-finalization/SKILL.md
```

but that Guidance file does not yet exist and a package for this operation cannot currently form.

Decision:

> Change 3 adds one concrete `delivery-architecture-finalization` package/HOW variant on the existing Delivery-operation seam. It does not create another Delivery lifecycle or execution framework.

## 3. Architecture remains derived; exact repository/spec/verification facts remain authoritative

D04 Current and Planned both validate with exact managed Archify 2.15.0 using repository evidence verification at their declared accepted-main revision.

Proof:

```text
D04 Current Archify validation   PASS / 0 errors / 0 warnings
D04 Planned Archify validation   PASS / 0 errors / 0 warnings
existing system data-flow        PASS / 0 errors / 0 warnings
```

The detached transport initially exposed a local-bundle Git `origin`; correcting that remote metadata to the authored canonical repository URL made repository-evidence validation pass without tracked-byte mutation. Transport metadata is not repository truth.

D03 Actual → D04 Current/Planned continuity also preserves the same component identity set and planned graph topology:

```text
components    21 identities continuous
boundaries     3 Current/Planned topology unchanged
connections   15 identities continuous
```

The D04 Current→Planned compare references exact current/planned SHA-256 and byte counts; both receipts match the current files.

Decision:

> Actual Architecture and canonical system views remain derived descriptions. OpenSpec, Git and valid Verification evidence remain their evidence owners. No Reference Architecture or second architecture truth is justified.

## 4. Architecture Finalization must bind one exact successful Formal Full Test candidate

Change 2 already produces a terminal Full Test outcome bound to:

```text
exact DeliveryOperationPackage
exact candidateRef
exact ordered project-local checks/checkRefs
exact full-test executionRef
terminal verdict
```

Architecture Finalization must not infer or rediscover Verification truth. Preparation should accept a trusted terminal `delivery-full-test` outcome and require at least:

```text
operationId = delivery-full-test
terminal verdict = passed
record/package identities internally consistent
current repository candidateRef = passed Full Test candidateRef
```

If the repository candidate has changed before Architecture Finalization begins, package formation must fail closed and Formal Full Test must be re-established for the new candidate.

The architecture package itself needs only the already-validated proof identity, not a second Verification database:

```text
verifiedCandidateRef
fullTestExecutionRef
```

Decision:

> Reuse existing Full Test candidate/execution identity. Do not create ArchitectureCandidateId, Verification Registry, Evidence Platform or another PASS store.

## 5. Expected derived mutations after Full Test are not candidate-correction mutations

Architecture Finalization occurs after a valid Formal Full Test PASS and is expected to materialize/update tracked **derived** description artifacts:

```text
actual.architecture.json
current-to-actual.compare.json
planned-to-actual.compare.json
architecture/system/{workflow,lifecycle,data-flow}.json as required
```

The existing repository `candidateRef` includes ordinary tracked Architecture files. Therefore this rule would be wrong:

```text
run Architecture Finalization
↓
re-derive candidateRef
↓
require it to equal the pre-finalization Full Test candidate
```

Expected derived finalization bytes would make that equality fail even when product/OpenSpec truth was untouched.

Historical D03 finalization already records this distinction explicitly:

```text
productMutationAfterFormalVerification = false
canonicalOpenSpecMutationAfterFormalVerification = false
finalizationDerivedArchitectureMutationAfterFormalVerification = true
```

Decision:

> Bind the pre-finalization verified candidate exactly, then validate and record the derived closure outputs. Do not invent a second candidate projection, architecture-excluded candidate identity, path allowlist or mutation taxonomy merely to make post-finalization `candidateRef` stay equal.

The missing fail-closed boundary is structural, not classificatory. The Architecture Finalization execution seam MUST NOT receive arbitrary repository-write authority.

Freeze this local ownership rule:

```text
Agent / derived-finalization logic
→ computes exact derived output content/result only
→ cannot directly materialize arbitrary repository paths

trusted Architecture Finalization host
→ owns exactly six fixed derived-description output slots
→ materializes only those slots
→ validates exact refs / hashes / Archify results
→ admits closure facts only after the fixed output surface is complete
```

The six operation-owned output slots are closed and static:

```text
delivery-scoped
├─ actual.architecture.json
├─ current-to-actual.compare.json
└─ planned-to-actual.compare.json

repository-scoped canonical system views
├─ architecture/system/workflow.json
├─ architecture/system/lifecycle.json
└─ architecture/system/data-flow.json
```

The host does not accept caller-selected output paths. This is not a generic path-allowlist subsystem; it is one operation-local fixed ownership surface already defined by the Delivery contract.

Required fail-closed invariant:

> A valid Architecture Finalization may change only these six fixed derived-description outputs. Any observed source/OpenSpec/product-truth mutation invalidates the finalization closure and MUST STOP before closure admission.

A minimal implementation may enforce this in either of two equivalent local ways:

```text
preferred:
trusted host alone performs the six fixed writes
```

or, if an execution callback necessarily touches the working tree:

```text
trusted host snapshots/checks repository state around execution
→ accepts changes only when the changed tracked paths are exactly within the six fixed owned outputs
→ any other tracked mutation
   → STOP
   → no closure admission
```

The preferred host-owned write model is simpler because it prevents over-broad mutation structurally rather than detecting it after the fact.

If finalization discovers that source/OpenSpec/canonical product truth must change, it MUST STOP before performing that correction and return to the normal Owner-controlled correction path; the corrected repository forms a new candidate and Formal Full Test restarts.

## 6. Minimum architecture input/output binding

The trusted preparation host can derive deterministic D04 artifact locations from the exact Delivery identity and bind their exact pre-operation bytes.

Current proof surface:

```text
Current Architecture
→ architecture/20260902-04-delivery-continuity-stable-core-closure/json/current.architecture.json
→ SHA-256 0f28cea801c1df5541fcd68d83fa61ed05ddd556eeeaea009955a2b5cd766b70

Planned Architecture
→ architecture/20260902-04-delivery-continuity-stable-core-closure/json/planned.architecture.json
→ SHA-256 97a02e3ef0b36915ea1cdebc88c1d1729d825d376f53accf6a24bf02b28eee31
```

Proposal should bind those content identities plus the fixed repository-scoped system-view prestate. Exact field naming may stay minimal, but the information content should be equivalent to:

```text
DeliveryArchitectureFinalizationOperationFacts
├─ verifiedCandidateRef
├─ fullTestExecutionRef
├─ currentArchitectureRef { artifact, contentSha256 }
├─ plannedArchitectureRef { artifact, contentSha256 }
└─ systemViewPrestate
   ├─ workflowSha256: string | null
   ├─ lifecycleSha256: string | null
   └─ dataFlowSha256: string | null
```

The system-view paths themselves are closed/static product ownership paths, not caller-selected entries:

```text
architecture/system/workflow.json
architecture/system/lifecycle.json
architecture/system/data-flow.json
```

A small non-production proof over the current repository shows:

```text
workflow baseline   missing
lifecycle baseline  missing
data-flow baseline  present / SHA-256 2da0b569d536c36d658bea3132b297c73b489121715484870e7a21b12c23dbbf
```

No Diagram Registry is required to represent three fixed paths and their exact prestate.

## 7. Canonical system-view ownership rule

D03 intentionally retained only `architecture/system/data-flow.json`. Its Architecture README and finalization facts state that workflow/lifecycle had no prior repository-scoped baseline and D04 owns the reusable continuity contract.

Change 3 should freeze this rule:

```text
fixed canonical system view missing
+
D04 establishes repository-scoped ownership
→ first baseline may be materialized once from accepted semantics
```

After a baseline exists:

```text
represented accepted semantics unchanged
→ preserve exact bytes

represented accepted semantics changed
→ update the derived current view to the newly accepted semantics
```

For every materialized/updated view, use exact managed Archify validation. Generated HTML remains disposable and outside Git.

This is Guidance/HOW plus fixed ownership, not a Diagram lifecycle.

## 8. Actual and thin-compare closure

Architecture Finalization should produce one complete Actual Architecture for the exact passed candidate and two thin compares:

```text
Current → Actual
Planned → Actual
```

Thin compares retain the already-proven pattern:

```text
left/right artifact ref
+
exact content SHA-256
+
byte count / concise classification-summary surface
```

They do not copy the compared Architecture documents and do not become truth.

The operation result/closure facts should bind exact output refs/hashes so Change 4 can prove Delivery Final prerequisites without rereading Run prose as authority.

D04 Actual is **not** materialized during this Change's Explore/Apply merely because Change 3 implements the mechanism. D04's own Architecture Finalization operation happens later only after the final D04 candidate has a valid Formal Full Test PASS.

## 9. Authority boundary

The Full Test Owner authority is specific to `delivery-full-test` and MUST NOT be reused as Architecture Finalization authority.

The final D04 reference does not require a new Owner authority fact for Architecture Finalization. This operation changes only derived description artifacts and is legal after an explicit trusted Delivery-operation caller selects exact `delivery-architecture-finalization` and supplies a valid passed Full Test proof.

Proposal direction:

```text
DeliveryArchitectureFinalizationOperationPackage.ownerAuthority = null
```

and package validation should reject an unrelated/broader Owner fact rather than smuggle Full Test, Delivery Final or Git authority into this operation.

This preserves:

```text
WHAT already selected by trusted Delivery boundary/caller
↓
package binds exact context + HOW
↓
Agent executes derived finalization
```

No automatic next-operation selection follows.

## 10. Minimum implementation ownership

Proposal should stay within:

```text
src/domain/delivery-operation-execution.ts
→ add architecture-finalization facts/package validation only

bounded architecture-finalization host/domain seam
→ validate passed Full Test/current candidate
→ bind exact Current/Planned/system-view prestate
→ resolve exact Guidance
→ receive exact derived output content/result
→ materialize only the six fixed operation-owned output slots
→ validate/return exact closure refs/hashes or STOP

skills/delivery/architecture-finalization/SKILL.md
→ generic canonical HOW

OpenSpec delta/tests
→ architecture continuity + canonical system-view ownership
```

Existing managed Archify resolution remains the exact tool identity seam. The Foundation CLI does not need to become an Architecture runner.

## 11. Explicit non-goals

```text
Reference Architecture
Diagram Registry / Diagram Planner / Diagram Runtime
Architecture lifecycle/state machine
V/F model
mutation taxonomy / path allowlist
architecture-excluded candidate identity
new Verification/Evidence store
new Owner authority type
Full Test authority reuse for Architecture Finalization
automatic correction
automatic Delivery Final
automatic Git commit/push/merge
D04 Actual materialization before a valid final D04 Full Test PASS
```

## 12. Proof summary

```text
Pre-Explore fixed-point continuity                    PASS
trusted coordination                                  active
Policy                                                ready-action: explore
projectOrdinal                                        028
focused existing contracts                            64/64 PASS
canonical OpenSpec specs                              19/19 PASS
active Change strict validation                       expected pre-Proposal failure: no delta yet
Archify Current validation                            PASS / 0E / 0W
Archify Planned validation                            PASS / 0E / 0W
Archify existing data-flow validation                 PASS / 0E / 0W
D03 Actual → D04 component identity continuity        21/21
D04 Current/Planned boundary topology continuity      3/3
D03 Actual → D04 connection identity continuity       15/15
Current→Planned compare receipt hashes/bytes          PASS
architecture-finalization Guidance exists now         false
architecture-finalization package forms now           false
Registry/Planner/new lifecycle required               false
production implementation mutation in Explore         NONE
```

## 13. Explore conclusion

```text
PASS
```

The real Change 3 gap is bounded: add one `delivery-architecture-finalization` concrete package/host/HOW variant that consumes an exact successful Formal Full Test candidate, binds exact Current/Planned and fixed system-view prestate, then materializes validated derived Actual/compare/system-view closure facts through a trusted host that owns only the six fixed derived-description output slots.

The existing Delivery package model, existing Full Test candidate/execution identity, exact managed Archify runtime and three static system-view ownership paths are sufficient. No new control plane is justified.
