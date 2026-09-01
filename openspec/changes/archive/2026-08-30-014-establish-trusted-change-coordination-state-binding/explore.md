# Explore — establish-trusted-change-coordination-state-binding

## 1. Authority and real use case

Owner has explicitly authorized all three bootstrap decisions required for this correction:

```text
revise D02 composition
+
add establish-trusted-change-coordination-state-binding
+
activate / proof-based Explore
```

This is the one-time bootstrap correction already anticipated by the approved D02 proof concern. The existing CLI is used only as the current execution transport; this Explore does **not** claim that the pre-correction CLI proves its own activation authority.

Current exact repository checkpoint:

```text
0e6f74617300f13fd8676d8bda8c7904909f7dc4
```

Delivery:

```text
20260829-02-lightweight-incremental-engineering-quality
```

Corrective Change:

```text
establish-trusted-change-coordination-state-binding
```

The original four D02 engineering-quality Changes remain planned and now hard-depend on this correction.

---

## 2. Problem statement

D01 intentionally froze a bootstrap CLI contract where `status` / `next` consume caller-supplied exact Delivery/Change structural facts, including `changeState`.

Stable Core later froze a stronger semantic meaning:

```text
active
→ Owner authorized the exact Change to enter the Flowkit Action lifecycle
```

The missing contract completion is therefore not a D01 implementation bug. It is:

```text
bootstrap caller structural fact
↓
(no trusted durable binding today)
↓
Policy legality input
```

when the required Stable Core trust flow is:

```text
explicit Owner authority
↓
authorized durable Delivery-Change coordination materialization
↓
trusted exact Delivery+Change coordination resolution
↓
canonical ChangeState
↓
pure Policy
```

---

## 3. Proof A — current CLI legality follows caller state, not durable state

### Current source path

`src/cli/request.ts` defines:

```ts
interface CommonRunRequest {
  readonly repositoryRoot: string;
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
  readonly changeState: ChangeState;
  readonly changeStartSequence: number;
  readonly flowkitHome: string;
}
```

The parser validates only that the supplied literal is a valid `ChangeState`, then preserves it.

`src/cli/foundation-cli.ts` passes:

```ts
changeState: request.changeState
```

directly into `evaluatePolicyAndNextBoundary(...)`.

`src/domain/policy-and-next-boundary.ts` correctly treats `active` as the active-Change legality input and keeps Policy pure / deterministic.

### Controlled D02 counterexample

The current durable D02 manifest says:

```text
establish-lightweight-incremental-engineering-gate
→ planned
→ dependsOn establish-trusted-change-coordination-state-binding
```

while the corrective Change is:

```text
establish-trusted-change-coordination-state-binding
→ active
```

Using the real current CLI:

#### Counterexample 1

Caller claims the planned Gate is active:

```text
manifest Gate state = planned
caller request.changeState = active
currentRunId = null
```

Observed result:

```json
{"kind":"next","decision":{"kind":"ready-action","actionId":"explore"},"checkpoint":{"authorized":false,"reason":"policy-not-ready"}}
```

#### Counterexample 2

Caller claims the active corrective Change is planned:

```text
manifest correction state = active
caller request.changeState = planned
currentRunId = null
```

Observed result:

```json
{"kind":"next","decision":{"kind":"blocked","reason":"change-not-active"},"checkpoint":{"authorized":false,"reason":"policy-not-ready"}}
```

### Result

```text
PASS — material gap reproduced on the exact current D02 state.
```

Decision impact:

> `changeState` cannot remain an authority-bearing caller input for lifecycle legality.

What this does **not** prove:

- Policy itself is defective;
- D01 violated its accepted bootstrap contract;
- a new state engine or persistence system is required.

---

## 4. Proof B — current durable coordination truth already exists

D01 proof history explicitly froze activation persistence:

```text
Change active fact must remain in the Delivery manifest;
it cannot exist only in chat.
```

The D01 activation proof used:

```text
planned → active
↓
openspec/delivery-groups/<delivery>.yaml
+
Owner activate-change decision
```

and treated the formal Delivery manifest as the durable fact from which activation could be recovered in a new session / payload overlay.

Current D02 uses the same durable representation:

```text
openspec/delivery-groups/
20260829-02-lightweight-incremental-engineering-quality.yaml
```

It contains exact:

```text
Delivery ID
Change IDs
Change state
hard dependsOn
Owner decisions
```

No production source currently reads `openspec/delivery-groups/**`, and no second production coordination-state store exists.

### Result

```text
PASS — reuse the existing Delivery manifest as the current durable coordination source; do not create another current-state store.
```

This freezes the architecture property, not a generic YAML framework.

---

## 5. Revised Proof C — structural validity is not activation eligibility

Reviewer finding `RE-002-001` is correct: `isOwnerAuthorityFact(...)` only proves the canonical wire shape. It intentionally does **not** decide whether a particular `decision + scope` is eligible for a lifecycle boundary.

### Focused structural counterexample

Using the accepted `isOwnerAuthorityFact(...)` validator on the exact same `activate-change` identity shape:

```text
scope = ["explore"]
→ structural-valid = true

scope = ["checkpoint"]
→ structural-valid = true

scope = ["propose"]
→ structural-valid = true
```

Therefore:

```text
structural-valid OwnerAuthorityFact
≠ activation eligibility
```

and the trusted resolver must implement an explicit activation-provenance recognition rule rather than treating any structural-valid `activate-change` fact as sufficient.

### Deriving the current activation scope from accepted evidence

The current D02 bootstrap activation recorded for this exact corrective Change is:

```text
decision = activate-change
deliveryId = 20260829-02-lightweight-incremental-engineering-quality
changeId = establish-trusted-change-coordination-state-binding
scope = ["explore"]
```

D01 execution history also shows the current normal activation convention after the initial first-Change bootstrap: the other 11 distinct Foundation Changes with durable `activate-change` Run-context authority use the exact single-element scope:

```text
["explore"]
```

The initial D01 bootstrap Change contains older bootstrap-era authority material with broader / pre-convergence scope representation. That historical artifact is not evidence that current Stable Core activation eligibility should accept a broader scope. This correction defines the **current** canonical recognition rule and does not rewrite historical bootstrap facts.

### Frozen activation-provenance recognition rule

For a durable Change whose current coordination state is `active`, trusted lifecycle resolution may recognize Owner activation provenance only when there is at least one authority fact satisfying **all** of:

```text
isOwnerAuthorityFact(fact) = true
fact.decision = "activate-change"
fact.deliveryId = exact requested Delivery ID
fact.changeId = exact requested Change ID
fact.scope = ["explore"] exactly
```

`scope=["explore"]` is exact, not contains-based. A broader or different structural-valid scope does not satisfy the activation boundary.

Examples that must be rejected for activation eligibility even though they may be structurally valid:

```text
["checkpoint"]
["propose"]
["archive"]
["activate-change", "explore"]
```

The decision already names the activation decision; the scope names the exact first lifecycle action enabled by that activation. Normal Change activation therefore authorizes entry to `explore`, not checkpoint/propose/archive or a generic bundle of lifecycle permissions.

### Wrong-scope fail-closed proof

Given:

```text
durable exact Change state = active
+
structural-valid OwnerAuthorityFact
  decision = activate-change
  exact deliveryId
  exact changeId
  scope = ["checkpoint"]
```

then:

```text
activation provenance recognition = FAIL
↓
trusted resolver MUST NOT yield lifecycle-enterable active
```

The same fail-closed rule applies to any scope other than exact `["explore"]`.

For non-active durable states, historical activation provenance must never self-upgrade the current state.

### Result

```text
PASS — activation provenance now separates wire structural validity from lifecycle eligibility and freezes exact current eligibility as activate-change + exact Delivery/Change + scope=["explore"].
```

No generic Owner-authority registry, checkpoint-authority redesign, signature system, or new authority record type is required.

---

## 6. Proof D — dependency legality is now a real durable condition

Reviewer proof established a real activation dependency:

```text
all four normal D02 Changes
↓ dependOn
establish-trusted-change-coordination-state-binding
```

Current composition now records that hard dependency for all four quality Changes.

There is currently no production `dependsOn` reader in `src/**`.

This Change must **not** build an activation service or graph platform. However, when resolving an allegedly `active` Change for lifecycle legality, the trusted coordination seam must fail closed if any direct hard dependency in the exact Delivery manifest is not `completed`.

Minimum rule:

```text
Change state = active
+
activation-eligible Owner fact:
  decision = activate-change
  exact Delivery + Change identity
  exact scope = ["explore"]
+
all direct dependsOn targets = completed
↓
trusted resolved state may be active
```

If a direct dependency is missing, duplicated, malformed, or not completed:

```text
active must not become lifecycle-enterable
```

This directly proves the roadmap's existing dependency semantics without creating soft/optional/conditional dependency machinery or a general graph engine.

### Result

```text
PASS — direct hard-dependency completion belongs in the same trusted coordination resolution boundary because it is now a proven prerequisite for active legality.
```

---

## 7. Proof E — Policy remains pure

Current Policy already accepts canonical structural facts and performs no repository / manifest / Git / OpenSpec IO for normal legality calculation.

The correction should preserve:

```text
Policy
→ pure
→ deterministic
→ repository-IO free
→ authority-source agnostic
```

Therefore manifest reading, exact Change lookup, Owner provenance binding, and direct dependency validation belong before Policy in the CLI/application composition layer.

Target composition:

```text
request identity / execution context
↓
trusted coordination resolver
↓
canonical ChangeState
↓
status projection / pure Policy
```

### Result

```text
PASS — no Policy redesign is required.
```

---

## 8. Proof F — `status` and `next` must share one resolver

Current `CommonRunRequest.changeState` is shared by both command surfaces:

```text
status
next
```

`statusCommand()` currently reports:

```text
changeState: request.changeState
```

while `nextCommand()` passes the same caller state to Policy.

Fixing only `next` would create:

```text
status → caller truth
next   → durable truth
```

which is a split-brain CLI contract.

### Result

```text
PASS — status and next must consume the same trusted coordination resolver.
```

No broader CLI redesign is needed. `doctor`, current-Run selection, OpenSpec observation generally, and checkpoint authorization remain outside this correction.

---

## 9. Proof G — authoritative caller `changeState` can be removed

The repository is currently:

```text
private: true
version: 0.1.0
```

and the authoritative `changeState` request field is consumed only by this repository's CLI/tests/contracts; no separately versioned external compatibility contract or published consumer is present in the current accepted scope.

Therefore the preferred current-contract end state is:

```text
remove authority-bearing request.changeState
```

rather than preserving two state sources.

If Proposal discovers one bounded compatibility reason to retain the field, it may only remain as a fail-closed expected/asserted state:

```text
caller assertion != trusted durable state
→ reject mismatch
```

It must never override durable truth.

### Result

```text
PASS — no speculative compatibility adapter or internal V1/V2 request family is justified.
```

---

## 10. Proof H — no safe production YAML parsing seam exists today

Current production code has:

```text
0 readers of openspec/delivery-groups/**
```

and the accepted repository does not directly declare a YAML parser dependency.

A direct runtime import proof for `js-yaml` from the current repository fails with:

```text
ERR_MODULE_NOT_FOUND
```

although YAML libraries may exist transitively inside unrelated tool dependency trees.

Therefore Apply must not:

```text
import an undeclared transitive package
hand-roll a general YAML parser
reach into managed OpenSpec's internal node_modules
create a second JSON coordination store solely to avoid parsing YAML
```

### Proposal direction

If implementation needs a production YAML parser, declare one minimal repository runtime dependency with proper package/lock truth. Exact package choice is a Proposal/Apply implementation detail; the contract is not tied to a library.

### Result

```text
PASS — parser dependency is an implementation concern, not a reason to create a new coordination store.
```

---

## 11. Canonical resolution contract to propose

The minimum Proposal-ready contract is:

```text
Input:
  exact repository root
  exact Delivery ID
  exact Change ID

Resolve:
  exact Delivery manifest
  exact single Change entry
  canonical ChangeState
  direct hard dependencies
  matching Owner activation provenance when state = active

Output:
  trusted canonical ChangeState

Consumers:
  status
  next → pure Policy
```

Fail closed on at least:

```text
missing Delivery manifest
manifest Delivery ID mismatch
missing / duplicate exact Change
invalid ChangeState
unknown / missing direct dependency target
active with any direct dependency not completed
active without matching activation-eligible Owner authority:
  decision = activate-change
  exact Delivery+Change identity
  exact scope = ["explore"]
active with only structural-valid but wrong-scope Owner authority
caller assertion mismatch if a compatibility assertion remains
```

The resolver must not mutate state.

---

## 12. Required behavioral proof matrix for Proposal / Apply

### A. Planned cannot self-upgrade

```text
durable planned
+
caller attempts active
→ trusted planned
→ Policy BLOCKED(change-not-active)
```

Preferred final request contract removes the authority-bearing caller state entirely.

### B. Valid Owner activation

```text
exact durable active
+
structural-valid Owner fact
+
decision = activate-change
+
exact Delivery + Change identity
+
exact scope = ["explore"]
+
direct dependencies completed
→ trusted active
→ Policy READY_ACTION(explore) when CurrentAction is null
```

### B2. Structurally valid wrong-scope activation fact fails closed

```text
exact durable active
+
structural-valid activate-change Owner fact
+
exact Delivery + Change identity
+
scope = ["checkpoint"]  // or any scope other than exact ["explore"]
→ activation provenance ineligible
→ trusted resolver MUST NOT yield lifecycle-enterable active
```

### C. Wrong Change identity

```text
activation for Change A
≠ authority for Change B
```

### D. Wrong Delivery identity

```text
activation in Delivery D1
≠ authority in Delivery D2
```

### E. Tamper / mismatch

```text
durable planned
caller asserts active
→ fail closed / no override
```

### F. Completed / cancelled remain non-active

Neither state may be promoted to active from historical activation evidence.

### G. Policy purity

`evaluatePolicyAndNextBoundary(...)` performs no filesystem/manifest/Git/Owner-decision IO.

### H. status / next consistency

Both surfaces report/consume the same resolved coordination state.

### I. D02 dependency enforcement

While the corrective Change is not `completed`:

```text
all four normal D02 Changes
→ dependency not satisfied
→ cannot become trusted active / lifecycle-enterable
```

After correction becomes `completed`, each quality Change may become activation-eligible under its own normal Owner-authorized boundary; the four quality Changes remain mutually independent.

---

## 13. Canonical OpenSpec ownership proof and expected delta

Reviewer finding `RE-004-001` does **not** reopen Proof C. Proof C remains accepted:

```text
structural-valid OwnerAuthorityFact
≠ activate-change provenance eligibility
```

The new issue is normative ownership: the accepted canonical authority spec still uses older broad wording that assigns decision/scope lifecycle recognition / eligibility to the later Policy contract, while this Explore has now proven that `activate-change` provenance must be recognized before Policy in order to derive a trusted canonical `ChangeState`.

### Existing normative statements that must be reconciled

Accepted:

```text
openspec/specs/lifecycle-authority-and-identity/spec.md
```

currently states, in the Owner authority requirement:

```text
`decision` and `scope` through structural validation only mean that the
wire fact is canonical; whether a decision/scope satisfies lifecycle-boundary
recognition / eligibility SHALL be decided by the later Policy contract.
```

The same ownership assumption appears again in the explicit-authorization scenario:

```text
whether the authority satisfies that boundary's Policy eligibility
is decided by the later Policy contract
```

and in the structural-validity scenario / deterministic-validation requirement:

```text
structural validity does not create Policy eligibility

structural validator SHALL NOT itself decide whether an Owner decision
is Policy-eligible for a lifecycle boundary
```

Those statements correctly keep the **structural validator** from minting semantic authority, but the phrase “later Policy contract decides recognition / eligibility” is now too broad for the Stable Core contract because two distinct decisions have been proven:

```text
A. activation-provenance recognition needed to derive canonical ChangeState

B. legal next-boundary calculation from already-canonical resolved facts
```

They must not be collapsed into one Policy-owned operation.

### Existing Policy-specific authority ownership that must remain unchanged

Accepted:

```text
openspec/specs/policy-and-next-boundary/spec.md
```

already owns a different, explicitly Policy-specific authority decision for terminal Owner correction:

```text
explicit Owner correction request
→ decision == revise-action
→ exact Delivery / Change
→ exact single requested revise-action scope
→ Policy decides correction eligibility after normal boundary consistency
```

That remains Policy-owned. This correction must not move `revise-action` Owner correction recognition into the trusted coordination resolver.

Likewise checkpoint authorization remains its separately owned CLI/host evaluator and is outside this correction.

### Minimal Stable Core ownership refinement

Freeze the ownership split as:

```text
OwnerAuthorityFact structural validator
→ wire / identity / shape canonicality only
→ no lifecycle-boundary authority eligibility

trusted Change coordination resolver
→ exact Delivery + Change durable coordination resolution
→ when durable state = active, recognize only the exact activate-change
  provenance required to derive trusted canonical ChangeState
→ validate direct hard dependency completion
→ no legal next-Action calculation

pure Policy
→ consumes canonical resolved ChangeState and other canonical Policy facts
→ owns legal next-boundary calculation
→ retains existing Policy-specific explicit Owner correction eligibility
  (for example revise-action where already specified)
→ performs no repository / manifest / Git / Owner-decision IO
```

This means the trusted resolver owns only **activation provenance recognition for coordination-state derivation**. It does not become a generic Owner-authority recognizer.

### Expected canonical OpenSpec delta

Proposal must explicitly refine existing canonical wording so contradictory ownership cannot remain. The expected delta is:

```text
lifecycle-authority-and-identity
→ retain OwnerAuthorityFact structural validation exactly as wire validity
→ replace the broad statement “later Policy owns lifecycle recognition / eligibility”
  with boundary-specific ownership:

  structural validator
  → never creates boundary eligibility

  boundary-owning downstream contract
  → recognizes decision/scope semantics for its exact boundary

→ explicitly state that trusted Change coordination resolution may recognize
  exact activate-change provenance before Policy solely to derive canonical
  ChangeState for exact Delivery + Change

→ explicitly preserve that Policy-owned authority decisions remain Policy-owned
  where the Policy contract defines them

foundation-cli-surface
→ status / next resolve the trusted Change coordination fact before reporting
  current Change state / constructing Policy input
→ caller changeState is removed as authority-bearing input, or if bounded
  compatibility proof requires retention, it is only a fail-closed assertion

policy-and-next-boundary
→ no activation-provenance IO / lookup / recognition is added
→ continue consuming canonical ChangeState as a Policy fact
→ continue owning legal next-boundary calculation
→ preserve existing explicit revise-action Owner correction eligibility
```

### Proposal guard

Proposal MUST NOT leave both of these statements true:

```text
authority spec:
all decision/scope lifecycle eligibility belongs to Policy

AND

CLI/resolver spec:
activate-change provenance is recognized before Policy
```

The first statement must be refined to boundary-specific ownership.

Proposal also MUST NOT “solve” the wording conflict by moving manifest parsing, activation-provenance lookup, or dependency resolution into Policy.

### Result

```text
PASS — canonical ownership is now reconciled at the proof level:
structural validity, activation-provenance recognition, and Policy legality
are distinct responsibilities with no generic authority subsystem.
```

---

## 14. Explicit non-goals

Do NOT build:

```text
state reconciliation engine
background synchronization
coordination registry
new lifecycle state machine
automatic activation
automatic Owner authorization
generic authority platform
new persistence database
second Delivery state store
duplicate OpenSpec lifecycle
soft / optional / conditional dependency graph
Git authority
promotion lifecycle
Policy filesystem access
ChangeStateV2 / CLI V2 / Policy V2
```

Do NOT fold D02 engineering-quality capabilities into this correction.

---

## 15. Explore conclusion

```text
PASS
```

The contract-completion gap is real, reproducible, and now bounded tightly enough for Proposal.

Minimum direction:

```text
existing Delivery manifest coordination truth
+
existing explicit Owner activation fact
  with exact activation eligibility:
  decision=activate-change + exact Delivery/Change + scope=["explore"]
+
existing hard dependsOn semantics
↓
small trusted resolver before Policy
↓
shared by status + next
↓
remove caller authority over changeState
↓
keep Policy pure
```

No new state/control-plane subsystem is justified.

Canonical ownership is also frozen for Proposal:

```text
structural validator
→ wire validity only

trusted coordination resolver
→ exact activate-change provenance recognition for canonical ChangeState

pure Policy
→ legal next-boundary over resolved canonical facts
→ retains its existing Policy-specific Owner correction eligibility
```

STOP at `review-explore`.
