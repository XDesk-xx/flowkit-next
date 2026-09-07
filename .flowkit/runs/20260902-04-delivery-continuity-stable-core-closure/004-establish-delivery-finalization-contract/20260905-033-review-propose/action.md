# Action — Review Propose

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: establish-delivery-finalization-contract
role: reviewer
action: review-propose
projectOrdinal: 029
changeStartSequence: 004
run: 20260905-033-review-propose
physicalRunGroup: 004
input: 20260905-032-propose
base: a170da0373867296813a888c57db8325025a8f5d
```

Verdict: **CHANGES REQUESTED**.

## Current-step explanation

This review checks whether Proposal 032 is exactly traceable to the approved Explore, normatively complete, and ready for Apply. It does not review implementation, create Verification PASS, authorize Owner/Git actions, or execute the next boundary.

The Proposal correctly preserves the approved bounded model:

```text
one delivery-final package/execution/HOW variant
+ complete prerequisite validation
+ one fixed Delivery coordination writer
+ trusted-lineage isolation
+ exact thin-compare admission direction
+ existing candidate algorithm at successive causal boundaries
```

It also retains the ChatGPT web implementation's content-only derivation, trusted-host six-slot ownership, prestate revalidation, and staged managed Archify validation. No Change 5 behavior or new control plane is pulled forward.

Two exact-contract gaps still require Proposal revision.

## D04-RP004-001 — closure reference serialization is not exact

Affected planning claims:

```text
design.md Decision 1 / 5
→ architectureFinalizationRef uses domain-separated SHA-256 over the trusted terminal

design.md Decision 7
→ deliveryFinalizationRef binds the exact package, completed coordination ref,
  and finalized candidate

tasks.md 1.3 / 4.3
→ exact ref stability and causal binding are testable
```

The approved Explore explicitly left exact closure-ref serialization to Proposal/Design. The current Design names the semantic inputs but does not freeze the exact domain-separation bytes, ref format for `deliveryFinalizationRef`, or deterministic ordered hash material for either ref. “Complete terminal material” and “exact package” alone leave object-key ordering, included fields, and cross-consumer re-derivation to Apply discretion.

Contract impact:

Future Delivery Final and Change 5 consumers cannot independently rederive one canonical identity, and two conforming-looking implementations may produce different refs for the same accepted facts.

Minimum correction:

- define the exact ref prefix/domain tag and deterministic ordered material for `architectureFinalizationRef` and `deliveryFinalizationRef`;
- state the exact included fields and ordering/normalization, avoiding Run prose or incidental object property order;
- bind validator/re-derivation and stable positive/negative tests to that one serialization.

No generic canonical-JSON library, hash registry, or new identity subsystem is justified.

## D04-RP004-002 — canonical presentation shape remains implicit

Affected planning claims:

```text
architecture delta spec
→ presentation must satisfy the fixed side-by-side presentation contract

design.md Decision 4
→ presentation exactly validates existing fixed literals/booleans

tasks.md 1.2
→ malformed presentation must fail closed
```

The Proposal freezes the top-level nine-field compare surface, exact sides, classification, and summary, but does not enumerate the allowed `presentation` field set and exact literal/boolean values. The six historical derived files are proof that one shape exists; they are not a substitute for the OpenSpec contract. Without the exact nested shape, Apply and its negative tests must decide for themselves what “malformed” means.

Minimum correction:

- enumerate the exact allowed `presentation` keys and values in Design and the normative delta boundary;
- require exact field-set admission and rejection of missing, extra, or changed presentation values;
- retain the operation-local validator and avoid a schema registry or diagram platform.

## Complexity / minimality assessment

The overall design is proportional: one new capability, two bounded capability modifications, one fixed writer, and twelve traceable tasks. The requested corrections only finish exact constants/serialization already required by the approved Explore; they do not expand implementation scope.

## New-content / scope-drift assessment

```text
necessary Design/spec exactness
→ IN SCOPE

Change 5 / Git / handoff / automatic next
→ NOT INTRODUCED

Registry / Planner / generic schema or hash platform
→ NOT REQUIRED

scope drift
→ NONE
```

## Independent proof

```text
OpenSpec 1.10.0 --all --strict   21/21 PASS
Architecture focused baseline    9/9 PASS, 0 skipped
git diff --check                 PASS
```

Strict validation proves artifact structure; it does not resolve the two semantic exactness gaps.

Next boundary: `revise-propose`.

STOP.
