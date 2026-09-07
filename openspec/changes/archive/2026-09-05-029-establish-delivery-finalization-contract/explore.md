# Explore — establish-delivery-finalization-contract

## 1. Owner goal and authorized boundary

Owner authorized activation of Change 4 `establish-delivery-finalization-contract` with scope `[explore]` against the exact Change 3 checkpoint `a170da0373867296813a888c57db8325025a8f5d`.

This Explore answers one question:

> What is the smallest reusable contract that can close a Delivery only from accepted Change, Formal Full Test, and Architecture Finalization facts, record exact continuity for the later repository-integration operation, and stop without acquiring Git or repair authority?

This is contract exploration only. It does not execute D04 Formal Full Test, Architecture Finalization, Delivery Final, repository integration, or any Git mutation.

## 2. Pre-Explore continuity and activation facts

The nearest repository fixed point is exact and usable:

```text
branch
→ delivery/20260902-04-delivery-continuity-stable-core-closure

HEAD
→ a170da0373867296813a888c57db8325025a8f5d

origin branch
→ a170da0373867296813a888c57db8325025a8f5d

checkpoint bundle
→ flowkit-next-d04-a170da0373867296813a888c57db8325025a8f5d.bundle
→ complete history
→ exact branch ref a170da0373867296813a888c57db8325025a8f5d
→ SHA-256 9ca8296b5242ca9549ac06cff005381d07948b95bd13729a87c6e948f762c593
```

Before Change 4 mutation:

- tracked worktree and index exactly matched `a170da...`;
- the only untracked item was the verified checkpoint bundle;
- Change 3 Archive was terminal `completed/PASS` with next boundary `checkpoint`;
- the checkpoint commit exists locally and on the delivery branch remote;
- Delivery coordination had zero active Changes;
- OpenSpec reported zero active Changes;
- canonical OpenSpec strict validation passed `20/20`;
- all durable project ordinals were positive, unique, and internally consistent; the maximum was 28.

The exact Owner activation was recorded as:

```text
ref
→ owner:2219b5cebf6d83a3289298cbd1c5a12da5fc8445a501c9916d11640000b73309

sourceRef
→ owner-input:2026-09-05:activate-change:establish-delivery-finalization-contract:proof-explore:preflight-a170da0-pass

scope
→ [explore]
```

Change 4 is the single active Change. First-Explore `projectOrdinal: 29` is persisted exactly once. Planned Change 5 reserves no ordinal.

## 3. Current durable facts

### 3.1 Delivery plan

The final D04 reference and manifest define the Delivery Final preconditions as:

```text
all required planned Changes completed
+
valid Formal Full Test PASS
+
Actual materialized
+
required canonical diagram convergence complete
↓
Delivery Final
↓
record exact closure / continuity facts
↓
STOP
```

The existing closed Delivery operation catalog already contains `delivery-final` and maps it deterministically to `skills/delivery/final/SKILL.md`.

### 3.2 Existing product seams

The following reusable owners already exist:

```text
OwnerAuthorityFact
→ exact structural authority wire fact

DeliveryOperationPackage
→ exact Delivery operation + facts + authority + content-bound Guidance

DeliveryFullTestInvocationTerminal
→ complete terminal PASS, exact candidate, execution ref and ordered checks

DeliveryArchitectureFinalizationTerminal
→ exact Full Test lineage + six fixed output refs/hashes/bytes

deriveApplicableCheckCandidateRef
→ existing repository candidate identity algorithm

OpenSpec active Change observation
→ read-only formal active-set fact
```

No Registry, planner, Delivery state machine, evidence database, or new candidate algorithm is needed.

### 3.3 Exact current gap

Current product behavior proves the missing surface precisely:

- `DeliveryOperationId` accepts `delivery-final`;
- canonical path mapping knows `skills/delivery/final/SKILL.md`;
- that canonical Guidance file does not exist;
- `DeliveryOperationFacts` and `DeliveryOperationPackage` contain only Start, Full Test, and Architecture Finalization variants;
- validator and formation branches explicitly reject `delivery-final`;
- no bounded Delivery Final preparation/invocation module exists;
- a valid structural singleton `finalize-delivery` authority still cannot form a Delivery Final package.

The gap is therefore a fourth concrete package/execution/HOW variant, not a new control plane.

## 4. Current D04 is not ready for real Delivery Final

At this Explore boundary:

```text
Change 4
→ active

Change 5
→ planned

delivery.fullTestStatus
→ pending

delivery.finalizationStatus
→ pending

D04 actual.architecture.json
→ missing

D04 current-to-actual.compare.json
→ missing

D04 planned-to-actual.compare.json
→ missing

architecture/system/workflow.json
→ missing

architecture/system/lifecycle.json
→ missing
```

The existing repository-scoped `architecture/system/data-flow.json` remains present at SHA-256 `2da0b569d536c36d658bea3132b297c73b489121715484870e7a21b12c23dbbf`.

This is expected. Change 4 implements and verifies the reusable contract. Actual D04 Delivery Final can happen only after Change 4 and Change 5 are implemented/reviewed/archived, a final D04 candidate passes Formal Full Test, and Architecture Finalization produces its terminal closure.

There is no circular requirement that Change 4 execute D04 Delivery Final while Change 4 itself is active.

## 5. Proof: accepted facts must be consumed as complete outcomes

String claims such as these are insufficient:

```text
allChangesCompleted = true
fullTest = PASS
actual = completed
diagrams = converged
```

The trusted preparation seam must instead validate complete facts from their existing owners:

1. exact current Delivery identity and coordination prestate;
2. exact required Change set with every required Change `completed`;
3. exact OpenSpec active set empty at the finalization boundary;
4. complete terminal `DeliveryFullTestInvocationTerminal` with `verdict=passed`;
5. complete terminal `DeliveryArchitectureFinalizationTerminal` for the same Delivery, candidate, and Full Test execution, admitted from callback-isolated trusted lineage;
6. all six Architecture Finalization output refs still resolve to exact regular-file bytes/hashes/counts, and both thin compares still satisfy their exact bounded semantic shape;
7. current repository candidate is the exact candidate produced after those accepted derived outputs;
8. exact Delivery Final Owner authority;
9. exact content-bound canonical Delivery Final Guidance.

Preparation may reduce these complete observations into compact package facts only after validation. It must not accept caller-provided booleans, arbitrary paths, standalone digests, or Run prose as substitutes.

### 5.1 Architecture lineage must be isolated from derived logic

The current Architecture Finalization host validates a trusted operation package, then passes that same mutable object reference to `deriveOutputs`. Correction and terminal paths later reuse the callback-visible object. Post-derivation prestate validation rechecks repository candidate and Architecture/system-view bytes, but it does not reconstruct the originally admitted Delivery, operation, candidate, or Full Test identities.

Controlled direct execution proved both vulnerable paths:

```text
callback mutates deliveryId / operationId /
verifiedCandidateRef / fullTestExecutionRef
then returns correction-required
→ correction outcome exposes all forged identities

callback mutates operationId / fullTestExecutionRef
then returns valid ready outputs
→ terminal outcome records the forged Full Test lineage
```

Delivery Final therefore cannot consume the current terminal merely because its shape is structurally complete. The minimum correction is operation-local:

- retain the validated pre-callback package and its Delivery/operation/candidate/Full Test lineage as the exclusive correction, materialization, and terminal admission source;
- give derived logic a defensive deep clone or immutable content-only projection, never the retained trusted object alias;
- after derivation, revalidate repository/Architecture prestate against the retained trusted package;
- prove with focused negative cases that mutation attempts against Delivery, operation, candidate, and Full Test identities cannot alter either correction or terminal outcomes.

The existing content-only callback result and trusted-host six-fixed-slot model remain unchanged. No generic immutability framework, mutation scanner, or second lineage system is justified.

### 5.2 Thin compare bytes need exact semantic admission

The current `validateThinArchitectureCompare` verifies known scalar fields and exact left/right refs/hashes/bytes, but it does not reject extra top-level fields. It accepts any non-empty string list as `classification` and any plain record as `summary`.

A controlled counterexample embedded a complete Architecture payload in an extra compare field and added arbitrary nested summary data. Managed validation and the current host still returned a terminal outcome and materialized the compare. Exact file hash/byte recording preserves those invalid bytes; it does not make them a canonical thin compare.

The accepted historical `Current → Actual` and `Planned → Actual` compares provide one already-established bounded shape: all six examples use the same nine top-level fields, exact `{ref, sha256, bytes}` sides, `semantic`/`presentation` classification, string-valued matching summary entries, and one fixed side-by-side presentation contract.

The minimum local admission correction is therefore:

- accept only that exact known top-level compare surface; reject extra or embedded Architecture/product payload fields;
- require exact pair-specific left/right refs and their expected hashes/byte counts;
- bound classification to the known unique classification values and require matching non-empty string summary entries, not arbitrary nested records;
- require and validate the fixed presentation object in the canonical shape;
- add focused and acceptance negatives for extra fields, embedded Architecture payload, unknown/duplicate classification, mismatched summary, and malformed presentation.

This remains an operation-local Architecture prerequisite validator. It does not introduce a schema registry, diagram platform, or generic JSON validation subsystem.

## 6. Proof: Architecture closure needs one downstream continuity fact

The current `DeliveryArchitectureFinalizationClosureRecord` contains:

```text
verifiedCandidateRef
fullTestExecutionRef
six exact output refs / SHA-256 / byte counts
```

It does not contain the repository candidate identity after those six accepted outputs have been materialized.

An isolated Git-backed experiment reused the existing `deriveApplicableCheckCandidateRef` algorithm and proved:

```text
Formal Full Test candidate
candidate:sha256:f9a57df0ddd40360e5e246e3f95dba4a076dbaf9162924bd3a4d4a654a7cbd14

after accepted Architecture output materialization
candidate:sha256:f5ec6787ceccf94c26d1be8b56e89c989ca41878c0f2fbe98101e8b1cc2518d9

after bounded Delivery closure materialization
candidate:sha256:28cb504e75a829600547d6130abadc89279796e9d768f25493c0cf3b6b1599d2

after adding durable .flowkit/runs/** result
candidate:sha256:28cb504e75a829600547d6130abadc89279796e9d768f25493c0cf3b6b1599d2
```

Decision impact:

- Architecture Finalization must first close callback lineage isolation and exact thin-compare admission so its terminal is a trustworthy Delivery Final prerequisite;
- Delivery Final must not require current repository candidate equality with the pre-Architecture Full Test candidate;
- output refs alone cannot prove that no unrelated repository drift occurred between Architecture Finalization and Delivery Final;
- the smallest continuity repair is to extend the Architecture terminal closure with the existing algorithm's post-materialization candidate ref;
- Delivery Final preparation then requires current repository candidate equality with that ref;
- Delivery Final terminal closure records a new finalized candidate ref after its own bounded closure materialization;
- `.flowkit/runs/**` remains excluded by the existing candidate algorithm, so durable result persistence does not perturb the finalized candidate identity.

This reuses one candidate algorithm at successive causal boundaries. It does not create an Architecture candidate type, product-only candidate, snapshot database, exclusion exception, or second identity subsystem.

## 7. Proof: Delivery Final requires its own exact Owner authority

Delivery Final changes durable Delivery coordination from active/pending to completed closure. It is not merely derived Architecture validation and must not inherit authority from:

- Change 4 activation;
- Full Test authorization;
- Architecture Finalization's explicit `null` authority;
- Review approval;
- Verification PASS;
- terminal Run status.

D03 records historical Owner intent using `decision=finalize-delivery`, but combines Delivery Final with source ZIP and AI handoff scopes in an order that is not structurally valid under the current canonical `OwnerAuthorityFact` validator. It is historical evidence, not a reusable D04 wire contract.

A current structural proof accepts this bounded form:

```text
decision = finalize-delivery
deliveryId = exact current Delivery
changeId = absent
scope = [delivery-final]
```

Proposal direction:

- add an operation-specific recognizer for exactly that decision/Delivery/absent-Change/singleton-scope combination;
- reject missing, broader, Change-scoped, Full-Test, Git, handoff, or mismatched authority;
- do not create a separate Owner confirmation for Actual Architecture—the terminal Architecture Finalization closure is the technical proof, while `finalize-delivery` is the mutation permission.

The Owner authorization that activated this Explore is not Delivery Final authority and cannot be reused later.

## 8. Exact Change-completion and coordination boundary

Delivery Final must observe the complete canonical Delivery coordination prestate through a trusted bounded seam. The information content must include:

```text
exact Delivery id
delivery state active
full-test status / accepted Full Test linkage
finalization status pending
exact required Change ids
every required Change state completed
exact canonical coordination artifact path/content identity
```

`projectOrdinal` remains archive naming/coordination data and is not part of Delivery or Change semantic identity. Delivery Final must not turn it into a package identity or completion counter.

The exact OpenSpec active-set observation must also be empty. This is a read-only precondition check; Change 4 must not expand the production OpenSpec adapter into a generic mutating workflow executor.

The complete coordination observation is validated before being reduced to package facts. The package may bind the exact coordination content ref and completed required Change identities; it does not need to copy the entire Delivery manifest or every archived artifact.

## 9. Minimal package and lineage direction

Exact field naming belongs to Proposal/Design, but the minimum information content is:

```text
DeliveryFinalOperationFacts
├─ verifiedCandidateRef
├─ fullTestExecutionRef
├─ architectureFinalizationRef or equivalent exact closure identity
│  └─ admitted from callback-isolated lineage and exact thin compares
├─ architectureMaterializedCandidateRef
├─ exact Delivery coordination prestate ref
└─ completed required Change identities

DeliveryFinalOperationPackage
├─ deliveryId
├─ operationId = delivery-final
├─ ownerAuthority = exact finalize-delivery singleton authority
├─ operationFacts
└─ content-bound skills/delivery/final/SKILL.md ref
```

The package binds an already-decided exact operation. It does not decide that Delivery Final is next and does not call repository integration.

## 10. Bounded execution and mutation ordering

Before this Delivery Final sequence can begin, Architecture Finalization must retain its validated pre-callback package as the exclusive outcome source, expose only a defensive copy/projection to derived logic, and admit only exact bounded thin compares. The safe Delivery Final operation sequence is:

```text
validate complete Full Test / Architecture / Change / OpenSpec / Owner facts
↓
derive current architecture-materialized candidate and exact coordination prestate
↓
resolve content-bound Delivery Final Guidance
↓
form exact DeliveryFinalOperationPackage
↓
revalidate package-bound prestate before execution
↓
derive and validate one bounded canonical Delivery closure output
↓
materialize only the exact Delivery coordination closure surface
↓
re-read canonical coordination and derive finalized repository candidate
↓
admit compact terminal lineage result
↓
STOP
```

The closure surface records facts equivalent to:

```text
delivery.state = completed
delivery.fullTestStatus = passed
delivery.finalizationStatus = completed
exact Full Test candidate/execution linkage
exact Architecture Finalization/output linkage
exact architecture-materialized input candidate
exact finalized output candidate
```

The existing Delivery manifest remains the durable coordination surface; the terminal operation Result is execution/lineage truth. No second Delivery-state document or closure database is justified.

The operation should use one bounded execution callback/derivation and one fixed canonical coordination target. It must not give derived logic arbitrary repository-write authority. Staging/validation must complete before the closure mutation is admitted.

Failure behavior:

- stale/mismatched prerequisite, candidate, output, authority, or Guidance fails before closure execution;
- callback-mutated lineage or non-exact/embedded thin compare bytes cannot become an admitted Architecture prerequisite;
- a required source/OpenSpec/canonical/Architecture correction returns a normal correction-required STOP and invalidates reuse of the old Full Test candidate as applicable;
- invalid closure output or failed materialization does not produce terminal success;
- repository drift during execution stops admission;
- no automatic rollback platform, corrective Change, Full Test rerun, Architecture rerun, Git operation, or next Delivery operation is invoked.

Because the intended durable mutation is one fixed coordination closure surface, Change 4 does not need a generic mutation taxonomy, path allowlist, transaction framework, or filesystem planner.

## 11. Terminal Delivery Final closure

The compact terminal record must preserve the causal chain:

```text
verified Full Test candidate
  + fullTestExecutionRef
↓
accepted Architecture Finalization closure
  + six exact output identities
  + architectureMaterializedCandidateRef
↓
Delivery Final coordination closure
  + exact closure artifact/content identity
↓
finalizedCandidateRef
↓
STOP
```

The later Change 5 repository-integration operation can consume the exact `finalizedCandidateRef` and closure identity, revalidate current availability/bytes, and then require separate explicit Git authority. It does not need to infer finalized state from prose or recompute a historical candidate from incomplete hashes.

Delivery Final itself does not create a Git commit, branch, PR, merge, tag, accepted-main identity, release, source ZIP, Git bundle, dependency archive, or environment switch.

The recovery ZIP/handoff produced around the Change 3 checkpoint remains conditional transport only. Its existence is not a Delivery Final precondition or product output.

## 12. Minimum implementation ownership for Proposal

Proposal should stay within:

```text
src/domain/delivery-operation-execution.ts
→ fourth closed delivery-final facts/package variant
→ exact finalize-delivery authority recognizer

bounded Delivery Final domain/host seam
→ validate complete trusted prerequisites
→ form package
→ execute once
→ admit compact terminal lineage or STOP

minimal Architecture closure extension
→ isolate trusted package/Full Test lineage from callback-visible data
→ harden thin-compare admission to the exact bounded canonical shape
→ add post-materialization candidate ref using existing candidate algorithm

skills/delivery/final/SKILL.md
→ generic canonical HOW for the already-decided operation

focused domain/acceptance tests
→ callback mutation isolation, exact thin-compare negatives, eligibility, lineage, drift, authority, single execution, STOP and no-Git proof

OpenSpec delta
→ Delivery Final capability plus minimal modification to existing Delivery-operation/Architecture continuity capabilities
```

Existing Start and Full Test behavior remains unchanged. The Architecture Finalization host retains its content-only derivation, fixed six output slots, staged managed Archify validation, and prestate checks; its only Change 4 corrections are defensive lineage isolation, exact thin-compare admission, and the additive post-materialization candidate continuity fact required by this direct consumer.

## 13. Explicit non-goals

```text
actual D04 Formal Full Test
actual D04 Architecture Finalization or Actual materialization
actual D04 Delivery Final
Change 5 activation or implementation
repository integration
Git add / commit / push / PR / merge / tag
source ZIP / bundle / handoff as Delivery Final requirement
Delivery Final as Standard Action
Action Policy ownership of Delivery lifecycle
automatic next operation
automatic correction or Full Test rerun
second Delivery lifecycle/state store
candidate snapshot database or new candidate algorithm
generic manifest framework
generic mutation scanner / taxonomy / path allowlist
generic immutability framework or schema registry
Registry / Router / Planner / Runtime
OpenSpec mutating command executor
historical D01/D02/D03 manifest rewrite
D05 or self-hosting takeover
```

## 14. Proof results and limitations

```text
Pre-Explore repository fixed point                         PASS
HEAD / origin / checkpoint bundle                         a170da... exact
Change 3 terminal Archive + checkpoint                    PASS
single active Change after activation                     Change 4 only
projectOrdinal                                            29 unique
canonical OpenSpec strict                                 20/20 PASS
existing final Guidance resolution                        null
existing delivery-final package formation                 null
singleton current authority structural proof              PASS
D03 broader historical authority under current validator  rejected
candidate lineage isolated proof                           C0 != C1 != C2
Run exclusion from finalized candidate                     PASS
callback alias correction-path counterexample              reproduced
callback alias terminal-path counterexample                reproduced
embedded Architecture thin-compare counterexample          reproduced
temporary proof-only cases                                  2/2 + 1/1 PASS
original Architecture Finalization focused suite            9/9 PASS
historical exact compare-shape sample                        6/6 consistent
existing focused Delivery contracts on native Windows     37/38
known pre-existing chmod(0o000) fixture limitation         1
Change 3 checkpoint primary Linux domain evidence          216/216 PASS
production implementation mutation during Explore          NONE
Proposal/Design/Specs/Tasks during Explore                  NONE
```

The native-Windows failure is the existing permission fixture in `tests/unit/domain/delivery-operation-execution.test.ts`: NTFS does not make the file unreadable merely from POSIX `chmod(0o000)`. It is not a Delivery Final product defect and is not hidden, skipped, or pulled into Change 4 scope. The accepted primary platform remains Linux x64 glibc.

Remaining limitations are deliberate:

- exact TypeScript field names and closure-ref serialization belong to Proposal/Design;
- exact validator factoring belongs to Proposal/Design, but the accepted compare information shape and rejection boundary are no longer open;
- D04's actual Full Test, Architecture outputs, Delivery Final authority, and finalized candidate do not yet exist;
- the final operation cannot be executed until Change 5 is also completed and the later Delivery-level prerequisites are real.

These limitations do not block Proposal because the required information, ownership, lineage, authority, and failure boundaries are now bounded.

## 15. Explore conclusion

```text
PASS
```

The real Change 4 problem is bounded to one fourth `delivery-final` package/execution/HOW variant plus three local direct-consumer corrections on the existing Architecture prerequisite: isolate trusted lineage from callback aliases, admit only exact bounded thin compares, and record the post-materialization candidate. Complete trusted outcomes are validated first, compact exact facts are package-bound, one bounded Delivery coordination closure is materialized, and the existing candidate algorithm records `verified → architecture-materialized → finalized` lineage.

No new control plane, candidate system, evidence store, immutability/schema platform, Git authority, or mandatory handoff is justified.
