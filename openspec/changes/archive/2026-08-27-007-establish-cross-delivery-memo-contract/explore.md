# Explore — establish-cross-delivery-memo-contract

## 1. Owner goal and bounded problem

当前 Foundation 已完成 lifecycle、Run/Result、single-Action execution 与 Policy。这个 Change 只解决一个旁路问题：

> 项目开发过程中会出现 **真实问题、风险、技术债、future idea 或 follow-up**，它们值得长期记住，但当前明确不应该进入正在执行的 Delivery / Change formal scope。Owner 需要能够明确授权把这类 concern 保存下来，未来主要在 Delivery Start 重新暴露并决定纳入、继续延后或 dismiss。

Memo 不是 backlog / issue tracker，也不是 OpenSpec truth。它必须保持 project-level、durable、non-blocking。

最小真实用例：

```text
current Standard Action / Delivery work
        │
        ├─ discover a concern that should NOT enter current Change
        │
        ├─ Owner explicitly authorizes “add this to Memo”
        │
        └─ persist project Memo

current Action continues unchanged
```

未来消费：

```text
Delivery Start
→ list open Memos
→ Owner chooses:
   include  → target Delivery/Change is established, then Memo promoted
   defer    → no mutation; Memo remains open
   dismiss  → Memo dismissed
→ Delivery Start continues
```

---

## 2. Existing facts that constrain the design

### 2.1 Memo MUST NOT become a Standard Action or Policy input

Current `StandardActionId` catalog contains exactly 10 lifecycle Actions and `isStandardActionId("memo") == false`.

Current Policy input is a closed `PolicyFacts` object. A synthetic extra `memos` field is rejected as `BLOCKED(invalid-policy-input)`; the same valid facts without that field still yield the normal legal Action.

Therefore the minimum contract is:

```text
Memo
≠ StandardActionId
≠ CurrentAction
≠ Run / Result
≠ nextBoundary
≠ Policy input
≠ Policy blocker
```

A Memo write MAY occur as a side effect of an Owner instruction while another Action is executing, but it MUST NOT create a separate Action/Run/STOP boundary.

### 2.2 Memo provenance and Owner authorization are different facts

The Memo itself is project-level. Its `source` provenance MAY be absent even when the concern was noticed while a Delivery is active.

Focused proof established:

- `source = null` round-trips as ordinary JSON;
- Delivery-only, Delivery+Change and Delivery+Change+Run provenance can all be represented without changing Memo identity;
- Change provenance without Delivery, or Run provenance without Change, is structurally incoherent and should fail closed.

However current canonical `OwnerAuthorityFact` requires `deliveryId`. A synthetic project-scoped authority fact with no `deliveryId` is rejected, while a Delivery-scoped fact using `decision=create-memo` and `scope=[memoId]` is structurally accepted.

Decision:

```text
Memo source provenance
→ MAY be null / Delivery / Delivery+Change / Delivery+Change+Run

Memo write authorization
→ reuse existing Delivery-scoped OwnerAuthorityFact
→ do NOT weaken or duplicate Foundation authority in this Change
```

The current minimum real use case is therefore Owner-authorized Memo mutation during an existing Delivery context or Delivery Start context. A completely standalone project-scoped Owner authority fact with no Delivery context is explicitly deferred; supporting it would require a separate authority-contract decision and is not necessary for the bounded use case.

### 2.3 `.flowkit` is the correct durable namespace, but Memo is a new fact type

Current `.flowkit/` contains `project.json` and durable `runs/`. Memo is neither OpenSpec truth nor Run history, so it must not be embedded into `RunResultRecord.facts` and later reconstructed by scanning historical Runs.

The minimal unique storage is:

```text
.flowkit/memos.json
```

This adds one project-level durable document and avoids a second index/database/registry.

---

## 3. Proof — one project JSON is enough for V1

The expected cardinality is intentionally bounded by explicit Owner authorization: AI/Author/Reviewer may suggest a Memo candidate, but they MUST NOT auto-persist arbitrary future improvements.

Therefore V1 does not need:

```text
.flowkit/memos/<memo-id>.json
index.json
database
registry
search index
priority queue
concurrent writer coordinator
```

A controlled filesystem proof showed that a single document can be replaced through a same-directory temporary file and rename while preserving the old document until replacement. This establishes implementation feasibility for ordinary single-writer repository use; it does NOT establish crash recovery, WAL, locking or concurrent-writer guarantees.

Minimum document shape:

```ts
interface ProjectMemosDocument {
  readonly formatVersion: 1;
  readonly memos: readonly ProjectMemo[];
}
```

Document invariants:

- fixed path `.flowkit/memos.json`;
- missing file means an empty Memo collection;
- JSON only; no YAML representation;
- closed schema, fail closed on malformed/unknown fields;
- `memoId` unique and canonical semantic id;
- serialized `memos` sorted by `memoId` for deterministic diffs;
- invalid existing file MUST NOT be silently replaced with an empty document.

No generic transaction subsystem is required. Cross-platform replacement details remain an implementation concern verified by later platform acceptance; crash-recovery / multi-writer semantics are non-goals.

---

## 4. Memo record — minimum durable concern

Memo should represent a concern, not classify it.

Therefore one record covers:

```text
future idea
observed bug / issue
risk
technical debt
follow-up
possible improvement
```

V1 MUST NOT add `kind`, `priority`, `tag`, `assignee`, `dueDate`, comments or dependency graph.

Proposal direction:

```ts
interface ProjectMemo {
  readonly memoId: SemanticId;
  readonly state: "open" | "promoted" | "dismissed";
  readonly title: string;
  readonly note: string;
  readonly source: MemoSource | null;
  readonly createdByOwnerAuthorityRef: string;
  readonly resolution: MemoResolution | null;
}
```

Provenance is hierarchical:

```ts
type MemoSource =
  | { deliveryId: DeliveryId }
  | { deliveryId: DeliveryId; changeId: ChangeId }
  | { deliveryId: DeliveryId; changeId: ChangeId; runId: string };
```

`source = null` is fully valid and means only that the concern is project-level without claimed Delivery provenance. Source never makes the Memo part of that Delivery/Change scope.

Owner authority is referenced, not copied: the Memo stores the `OwnerAuthorityFact.ref` that authorized creation/resolution, while the authority fact itself remains owned by the existing authority layer.

---

## 5. Proof — three states are sufficient

Controlled transition proof covered the complete V1 state model:

```text
open --promote--> promoted
open --dismiss--> dismissed
open --defer----> open   // no mutation required
```

and:

```text
promoted → terminal
dismissed → terminal
```

No `deferred`, `reopened`, `re-promoted`, `archived` or history state is needed.

State/resolution consistency should be closed:

```text
open      → resolution = null
promoted  → resolution.kind = promoted
             + targetDeliveryId
             + targetChangeId
             + ownerAuthorityRef

dismissed → resolution.kind = dismissed
             + ownerAuthorityRef
```

`defer` deliberately has no API and no durable transition: doing nothing keeps the Memo `open`.

---

## 6. Owner-gated mutation without a new authority subsystem

Memo write operations require explicit Owner authority. V1 should reuse the existing structural `OwnerAuthorityFact` and define narrow eligibility tokens inside this capability:

```text
create:
  decision = create-memo
  scope    = [memoId]

promote:
  decision = promote-memo
  scope    = [memoId]
  authority Delivery/Change binds the concrete target

dismiss:
  decision = dismiss-memo
  scope    = [memoId]
```

Important separation:

- AI / Author / Reviewer MAY suggest a Memo candidate;
- they MUST NOT auto-create one;
- read/list operations require no Owner authority;
- Memo capability MUST NOT create Owner authority facts;
- Memo capability MUST NOT interpret Review/Verification/PASS as Owner authorization;
- source provenance does not need to match the authorization context;
- this Change does not make `deliveryId` optional in `OwnerAuthorityFact`.

The following standalone case remains deferred:

```text
no Delivery context exists
+ Owner wants to mutate project Memo
```

Solving that by weakening the canonical Owner authority type would expand Foundation authority for a non-blocking convenience feature and is not justified by the current minimum use case.

---

## 7. Consumption / interface boundary

The public capability only needs five operations:

```text
createMemo(...)
getMemo(memoId)
listOpenMemos()
promoteMemo(memoId, target)
dismissMemo(memoId)
```

Semantics:

### `createMemo`

- explicit eligible Owner authority required;
- duplicate `memoId` fails;
- source MAY be null;
- new record is always `open`;
- does not create a Run or change current lifecycle.

### `getMemo`

- read-only;
- returns one validated Memo or not-found;
- no authority required.

### `listOpenMemos`

- read-only;
- returns only validated `state=open` records in deterministic `memoId` order;
- primary future Delivery Start consumption seam;
- presence of open Memo MUST NOT block Delivery Start or Policy.

### `promoteMemo`

Ordering is deliberately one-way:

```text
Owner decides include
→ normal Delivery/OpenSpec planning establishes concrete target Delivery + Change
→ promoteMemo records that target
```

Memo MUST NOT create the target Delivery/Change. This capability validates the canonical target identity supplied by the caller; filesystem/OpenSpec existence discovery belongs to future Delivery/OpenSpec integration and is not introduced here.

### `dismissMemo`

- explicit eligible Owner authority required;
- only `open → dismissed` is legal.

There is no `deferMemo` API.

---

## 8. Isolation requirements

This Change should be implementable without modifying the two large existing kernels:

```text
run-result-persistence.ts      588 lines
policy-and-next-boundary.ts    438 lines
```

Preferred implementation boundary:

```text
new memo domain module
+ new memo persistence module (or one small module if simpler)
+ index export
+ focused tests
```

Required zero-coupling claims:

- no Policy import of Memo;
- no Memo field in `PolicyFacts`;
- no new Standard Action;
- no Action lifecycle state/event;
- no Run/Result schema change;
- no ActionPackage change;
- no scheduler / queue / automatic Delivery planning;
- no automatic OpenSpec Change creation;
- no mutation/checkpoint authority redesign.

Because Delivery manifest marks this Change `architectureImpact: true`, Proposal/Apply should also update repository guidance / derived architecture to show the project-level Memo sidecar, but Archify remains derived and non-authoritative.

---

## 9. Proof summary

Focused repository/runtime proof established:

1. `memo` is not and need not become a Standard Action;
2. Memo does not belong in Policy input and must remain non-blocking;
3. `source = null` works for project-level concern provenance;
4. hierarchical Delivery/Change/Run source can be represented without changing Memo identity;
5. existing project-scoped OwnerAuthorityFact without `deliveryId` is invalid, so this Change should reuse Delivery-scoped authority rather than weaken authority core;
6. one `.flowkit/memos.json` can cover the bounded single-writer V1 and needs no index/database;
7. `open / promoted / dismissed` plus no-op defer fully covers the requested consumption lifecycle;
8. existing 63 domain tests, typecheck, format and 6/6 canonical OpenSpec specs pass before this Change introduces production code.

Scratch proof artifacts are external investigation only and are not part of the durable repository transfer.

---

## 10. Proposal-ready boundary

### Required invariants

- Memo is project-level durable concern state at `.flowkit/memos.json`.
- Memo may represent either an idea or a real observed issue without taxonomy.
- Memo source provenance MAY be null and never promotes the concern into current formal scope.
- create/promote/dismiss require explicit Owner authority; read/list do not.
- reuse existing Delivery-scoped `OwnerAuthorityFact`; do not introduce a project authority variant in this Change.
- `open / promoted / dismissed` is the complete state set; defer is no-op.
- promote only records an already-established target; it never creates Delivery/Change/OpenSpec artifacts.
- Memo never affects Policy, Standard Action lifecycle, Run/Result or next-boundary calculation.

### Explicit non-goals

- issue tracker / backlog system;
- priority / tags / assignee / due date;
- comments / history log / dependencies;
- search/index/database;
- automatic Memo discovery or AI auto-persistence;
- standalone project-scoped Owner authority with no Delivery context;
- scheduler / notifications / reminders;
- automatic Delivery/Change creation;
- OpenSpec truth replacement;
- concurrent writers, WAL, locking or crash-recovery subsystem;
- CLI surface (later Change);
- Git checkpoint/mutation authority redesign (next Change).

### Minimum Proposal direction

Create one new formal capability, preferably `cross-delivery-memo`, with no modification to Policy/lifecycle/persistence canonical capabilities. Implementation should remain a small project-level sidecar and must not grow the existing 588/438-line kernels.

## Explore conclusion

`PASS`

The minimum real use case is bounded and the key contract-changing unknowns are resolved. Remaining unknowns are either implementation details or explicitly deferred domains. The Change is ready for independent `review-explore`; Proposal MUST NOT be created before that review.
