# Explore — establish-run-result-persistence

> Status: revised under explicit Owner scope-correction authorization on 2026-08-25.  
> Goal: return this Change to the minimal Flowkit-next Author ↔ Reviewer durable handoff requirement and stop treating generic filesystem / multi-Agent / crash-recovery hardening as Proposal-readiness blockers.

## 1. Problem

Flowkit-next 已经完成：

1. `establish-lifecycle-authority-and-identity-contracts`
2. `establish-action-lifecycle-domain-contract`

当前 Core 已能表达 canonical Delivery / Change / Standard Action identity、Owner authority fact，以及单个 current Action 的：

```text
prepared
resumed
terminal
```

但 candidate runtime 还没有自己的 durable Run / Result persistence。

本 Change 的真实目标很小：

```text
Owner authorizes one Action
        ↓
Author or Reviewer executes that Action
        ↓
Run record becomes durable
        ↓
STOP
        ↓
next Author / Reviewer reads durable facts
        ↓
continues at the next authorized Action boundary
```

本 Change **不是**通用多-Agent orchestration、通用 filesystem persistence、自动恢复或分布式 Run registry。

---

## 2. Owner scope correction

Owner 明确冻结当前 Change 的产品边界：

> 在同一个 Delivery / Change 生命周期中，使 Author 与 Reviewer 能够按照 Action 顺序执行，并通过稳定的 `.flowkit/runs` Run record 传递执行事实、结果和下一边界。

当前主要使用模式：

```text
Author
  ↓
Action Run
  ↓
Reviewer
  ↓
Review Run
  ↓
Author
  ↓
Next Action
```

Owner 同时明确：

- 不以多-Agent 自动化为当前目标；
- 不以并发 Run writer 为当前目标；
- 不以 crash recovery / WAL / scheduler 为当前目标；
- 不接受任意 user-supplied RunId 作为 filesystem path；
- Run directory identity 由 Flowkit **受控生成**；
- traversal / separator / reserved-name 等历史 finding 保留为风险事实，但不得继续把本 Change 扩张成 general-purpose filesystem safety subsystem；
- 更高强度跨平台 filesystem hardening 后置到 Full Test 或 dedicated platform-hardening Change。

因此本次 revise-explore 的职责是：

```text
保留有效核心结论
+
收敛地址模型为 Flowkit-controlled canonical generation
+
降级非真实输入域的 proof burden
+
明确 Proposal-ready 的最小边界
```

---

## 3. Existing facts

### 3.1 Dependency / repository state

Delivery manifest 当前事实：

```text
establish-lifecycle-authority-and-identity-contracts = completed
establish-action-lifecycle-domain-contract          = completed
establish-run-result-persistence                    = active
```

本 Change 唯一 declared dependency 已满足。

当前 checkpoint：

```text
Git checkpoint: 1c8c2fb3aca904c522a49a8e4eda2a3545c18972
Snapshot: flowkit-next-delivery-20260824-01-foundation-lifecycle-kernel-1c8c2fb.zip
Snapshot SHA-256: 870d1a12a73d6367fce34a7ab036348cafcd2e01531af9847b0b046a87154758
```

### 3.2 Existing domain identity

现有 semantic `ActionIdentity`：

```text
DeliveryId + ChangeId + StandardActionId
```

现有 `CurrentAction`：

```text
ActionIdentity + ActionLifecycleState
```

前一个 Change 已明确：

```text
Run occurrence identity
!=
ActionIdentity
```

不得把 attempt / occurrence information 塞回 semantic ActionIdentity。

### 3.3 Existing Owner authority fact

现有 `OwnerAuthorityFact` 已经具有 exact validator，并能表达：

```text
ref
decision
deliveryId
optional changeId
sourceRef
scope
```

本 Change 复用这个 authority fact，不创建第二 authority schema。

### 3.4 Candidate runtime has no production persistence yet

当前 production source 还没有：

```text
Run persistence
Result persistence
serialization read/write
integrity validation
```

当前 `.flowkit/runs/**` 历史来自 Delivery 01 external orchestrator handoff；它们是重要 compatibility / product evidence，但不能被回写成“candidate Flowkit runtime 已经生成这些 Run”。

### 3.5 Stable Run topology is already visible in repository practice

当前真实仓库 topology：

```text
.flowkit/runs/
└─ <delivery-id>/
   └─ <change-sequence>-<change-id>/
      ├─ <YYYYMMDD>-<action-sequence>-<known-action-name>/
      ├─ <YYYYMMDD>-<action-sequence>-<known-action-name>/
      └─ ...
```

每个稳定 Action Run 当前由：

```text
action.md
context.json
result.json
```

构成。

本 Change SHOULD 对齐这个 durable repository surface，而不是创造第二棵 Run tree。

---

## 4. Required minimal contract questions

本 Explore 最终只需要清楚回答以下六个问题。

### Q1 — 一个 Action execution 如何得到唯一 Run occurrence？

同一个 semantic Action 可以在一个 Change 中出现多次，例如：

```text
013 review-explore
014 revise-explore
015 review-explore
```

013 与 015 的 semantic `ActionIdentity` 相同，但 execution occurrence 不同。

因此 Proposal MUST 建立一个独立、Change-scoped 的 Run occurrence identity。

最小方向：

```text
Run occurrence
= Flowkit-controlled generated occurrence
```

当前 repository 已经证明类似以下形式满足人/AI 可读性：

```text
YYYYMMDD-NNN-<known-action-name>
```

本 Explore 不要求 Proposal 把该 display string 当作唯一 domain type；但必须保证：

- occurrence 在同一 Change history 中可区分；
- occurrence 不修改 `ActionIdentity`；
- occurrence/address 由 Flowkit controlled inputs 生成；
- 不接受 arbitrary external path string 作为 Run directory authority。

### Q2 — Run record 保存哪些 durable facts？

最小 durable Run facts SHOULD 覆盖：

```text
Run occurrence identity
Delivery identity
Change identity
Action identity / known action
role: author | reviewer | verification when applicable
Action lifecycle state when applicable
explicit OwnerAuthorityFact when actually supplied
stable execution context needed by next actor
```

Owner authority 规则：

```text
present → persist exact validated fact
absent  → persist absence
never fabricate
```

### Q3 — Author 与 Reviewer 如何通过 Run 顺序交接？

最小 handoff：

```text
Author executes Action A
↓
write durable Run A
↓
STOP
↓
Reviewer reads Run A
↓
executes Review Action B
↓
write durable Run B
↓
STOP
↓
Author reads B
```

下一 actor 必须能够仅从 repository durable facts 得到：

```text
上一 Action 是什么
谁执行的
结果是什么
Reviewer verdict 是什么（如果该 Run 是 reviewer）
Owner authority fact 是什么（如果存在）
上一 Run 报告的 next boundary 是什么
```

但“next boundary 是否 legal”仍由后续 Policy Change 决定。

### Q4 — Run 如何写入并重新读取且事实不漂移？

本 Change 需要：

```text
validated record
→ serialize
→ repository write
→ repository read
→ parse
→ exact validation
→ same durable facts
```

必须 fail closed 的实际输入域包括：

```text
invalid JSON
missing required field
unexpected field when exact schema forbids it
invalid Delivery/Change/Action/role shape
Run ↔ Result identity mismatch
invalid embedded OwnerAuthorityFact
```

本 Change 不需要为任意 hostile filesystem string 建设通用 path API。

### Q5 — Change-scoped Run topology 是什么？

Canonical target：

```text
.flowkit/runs/
└─ <delivery-id>/
   └─ <change-sequence>-<change-id>/
      ├─ <flowkit-generated-run-occurrence>/
      │  ├─ action.md
      │  ├─ context.json
      │  └─ result.json
      └─ ...
```

其中 Run directory name 必须由 Flowkit 受控生成。

最小 address invariant：

> Flowkit-generated Run address MUST remain canonical, bounded, repository-relative, and must not accept arbitrary external path input.

当前 known-action + date + bounded sequence 输入域不会产生 traversal、separator、absolute path、UNC、Win32 reserved device basename 等 arbitrary caller-controlled name。

因此 Proposal 不应设计 `opaque user string -> filesystem segment` 的通用协议。

### Q6 — 哪些能力明确不属于当前 Change？

见 Section 9 Explicit non-goals。

---

## 5. Minimal risk scan

### R1 — repeated Action occurrence collision

如果只用 `ActionIdentity` 作为 Run key，第二次 `review-explore` 会覆盖第一次。

**Required response:** independent Change-scoped Run occurrence identity.

### R2 — durable handoff facts drift

如果 role、action、Owner authority、result、next-boundary report 在 serialize/read 后发生漂移，下一 actor 会接错边界。

**Required response:** exact round-trip + validators + identity cross-check.

### R3 — Author / Reviewer / Verification verdict semantics collapse

必须继续区分：

```text
Author conclusion
Reviewer verdict
Verification verdict
```

普通中间 Change：

```text
reviewerVerdict = approved
verificationVerdict = null
```

是正常状态。

Persistence 只能忠实保存，不能把 reviewer approval 推导为 Verification PASS。

### R4 — persistence accidentally becomes Result admission or Policy

本 Change 不判断：

```text
Result candidate 是否允许被 Core admission
reviewerVerdict 是否足以推进某 boundary
apply -> revise-propose 是否 legal
Owner decision 是否满足 Policy
```

这些由后续 Change 负责。

### R5 — malformed machine record silently normalizes

Machine `context.json` / `result.json` 必须 strict parse/validate；无效 durable fact 不得 trim/guess/repair 后继续。

### R6 — repository topology drift

Runtime persistence SHOULD 使用现有 `.flowkit/runs/<delivery>/<change-root>/<occurrence>/` surface，不创造平行 truth tree。

### R7 — scope expansion into generic filesystem / orchestration subsystem

历史 findings 已证明 arbitrary path input 会产生大量 portability edge cases。

Owner 已纠正输入域：

```text
Run directory name is Flowkit-controlled generated data
not arbitrary user-supplied path input
```

因此本 Change 只证明 generator 输出满足 bounded direct-child invariant；不继续穷举 generic Win32 namespace / UNC / symlink / junction / reparse / multi-writer / distributed cases。

---

## 6. Proof performed

### Proof A — detached baseline

Exact detached environment remains:

```text
Node       22.23.2
OpenSpec   1.10.0
```

Current Explore boundary:

```text
production src/tests mutation       none
formal OpenSpec artifacts           0/4
action                               revise-explore only
```

Baseline validation remains required before Proposal.

### Proof B — repeated semantic ActionIdentity needs occurrence identity

Existing history contains repeated review Actions under one Change.

Example from completed second Change:

```text
013-review-explore
015-review-explore
```

Both map to the same semantic `ActionIdentity`, but are separate executions.

**Result:** PASS.

**Conclusion:** occurrence identity must be independent from ActionIdentity.

### Proof C — OwnerAuthorityFact is round-trip durable data

Existing 021 Explore already persisted a complete Owner activation fact:

```text
ref: owner:e48a1af6923c922b5f83368accbfdc7a477a804d5093659451fd571307b1b5b3
decision: activate-change
deliveryId: 20260824-01-foundation-lifecycle-kernel
changeId: establish-run-result-persistence
scope: [explore]
```

Existing validator + JSON round-trip proof succeeded.

**Result:** PASS.

**Boundary:** proves durable shape preservation, not Policy eligibility.

### Proof D — Run / Result handoff can preserve role and verdict separation

Existing stable Runs demonstrate distinct persisted fields:

```text
Author Run:
  author conclusion present
  reviewer verdict null
  verification verdict null

Reviewer Run:
  reviewer verdict present
  verification verdict null
```

The machine persistence contract can preserve these fields without assigning new semantics.

**Result:** PASS.

### Proof E — minimal fail-closed machine integrity is sufficient

Minimum proof target remains:

```text
valid record round-trip                 accept
truncated JSON                           reject
missing required identity field         reject
invalid role/action enum                 reject
invalid OwnerAuthorityFact              reject
Run ↔ Result occurrence mismatch         reject
unknown fields where exact schema applies reject
```

This is the real durable-data integrity boundary required by the Author ↔ Reviewer loop.

### Proof F — Flowkit-controlled Run address generation bounds the filesystem input domain

Owner correction changes the question from:

```text
Can every arbitrary string become a safe portable RunId/path?
```

into:

```text
Can Flowkit generate one bounded direct-child Run directory from controlled values?
```

Controlled model:

```text
date        = canonical YYYYMMDD
sequence    = bounded positive Delivery Action sequence
knownAction = Standard Action name from the closed action vocabulary

segment = YYYYMMDD-NNN-knownAction
```

Properties:

- no caller-supplied slash/backslash path segment;
- no absolute/drive/UNC input channel;
- known action vocabulary cannot produce reserved device basename;
- generated segment is one direct child of exact Change root;
- malformed generator inputs reject before filesystem use.

**Result:** sufficient bounded model for Proposal readiness.

**Boundary:** this is not a general-purpose portable filesystem path API and does not claim symlink/junction/reparse or hostile repository mutation hardening.

Scope-correction controlled proof:

```text
verdict: PASS
repeated semantic Action -> distinct generated occurrence: PASS
POSIX direct-child generation: PASS
Windows direct-child generation: PASS
invalid controlled-generator inputs rejected: 5/5
OwnerAuthorityFact exact JSON round-trip: PASS
Author/Reviewer verdict separation: PASS
intermediate verificationVerdict = null preserved: PASS
nextBoundary preserved as data only: PASS
```

Execution-local proof identities:

```text
script SHA-256: 6f09b62d2b2373a4fda4e473e6976fd6e7035121aaf7e7c12e2bcad699fb0bc6
result SHA-256: 76726677027a87c7c88fa031271ef4f63c62dc8d086474c60440793bb18850ae
```

Raw proof files remain execution-local.

---

## 7. Historical filesystem findings retained but downgraded

Previous review cycles produced useful facts:

### RE-022-001

Identified that directly interpreting logical occurrence identity as arbitrary repository path input is unsafe.

Durable lesson retained:

```text
logical occurrence fact
must not be treated as arbitrary caller-controlled filesystem path
```

### RE-024-001

Identified Win32 reserved-device basename portability risk in a generic lexical segment model.

Durable lesson retained:

```text
Flowkit-generated canonical address must not generate obviously invalid platform names
```

### RE-026-001

Owner scope-correction input references `RE-026-001` as another filesystem/path-expansion finding. The exact durable reviewer Run/payload for 026 was **not supplied to this detached revise execution**, so this Explore does not fabricate its wording or claim an independent reviewer-finding closure.

Owner disposition is nevertheless explicit and authoritative for scope:

```text
RE-022 / RE-024 / RE-026 facts may be retained as design constraints
but generic filesystem hardening is not a Proposal-readiness blocker
```

### Historical proof evidence

Earlier controlled proofs remain valid evidence of why arbitrary path input is undesirable:

```text
initial proof:
  script SHA-256: 48329a8b86ad795212c6c2fc8b51b58ef427bdecf3b682e0100052a4c5b7a242
  result SHA-256: 87f1422c5a04108194b746609856846e4bc39f2f2e4430ec173d6bd40f752e29

RE-022 path-address proof:
  cases: 18
  script SHA-256: 4359268f6581d57ac523d7811fd454e20e3a4c23da1a44ef9a0c61497cbd99d3
  result SHA-256: 73cc2ff87bef163b6c0132a62685ab4f64ead89c34ba938c7f83e3864afe1035

RE-024 reserved-device proof:
  segment cases: 40/40
  reserved basenames covered: 22
  case-insensitive reserved checks: 9/9
  script SHA-256: d50442d32271056fbbd1b9f628a2913a92c68e1178a6646b9602db26613cde28
  result SHA-256: 522ad7c9a653b69407619d98edc8ad03258f3bef616a767c017f7a4727b3ec6f
```

These proofs are now **historical risk evidence**, not requirements to turn this Change into an exhaustive filesystem hardening subsystem.

Raw proof artifacts remain execution-local and do not enter stable-transfer packages.

---

## 8. Proposed minimal direction for Proposal

### 8.1 Run occurrence identity

Proposal SHOULD define a dedicated Run occurrence model that:

- is distinct from semantic `ActionIdentity`;
- is unique enough within one Change history to distinguish repeated Actions;
- is generated by Flowkit from controlled values;
- maps deterministically to one canonical Change-scoped Run directory;
- does not expose arbitrary filesystem segment authority to external callers.

Exact domain representation remains a Proposal decision.

### 8.2 Stable machine Run / Result records

Current stable surface remains centered on:

```text
action.md
context.json
result.json
```

For candidate runtime persistence, Proposal SHOULD prioritize machine semantics in:

```text
context.json
result.json
```

`action.md` remains the stable human/AI Action descriptor used by the current handoff contract; this Change does not need to invent `action.json` or an ActionPackage schema.

### 8.3 Run durable facts

`context.json` should be able to preserve the minimum continuation facts:

```text
Run occurrence
Delivery / Change / Action
role
lifecycle state when applicable
explicit authority fact when present
input/previous Run references when required by the Action
```

### 8.4 Result durable facts

`result.json` should preserve outcome facts without collapsing roles:

```text
Author conclusion             optional by role
Reviewer verdict              optional by role
Verification verdict          optional by role
result/output facts
reported next boundary        when produced
blocking/diagnostic facts      when produced
```

Persistence stores these facts; later Policy decides legality.

### 8.5 Read / write

Minimum capability:

```text
create/write one Run record
read one Run record
validate exact shape
write/read Result
cross-check Run occurrence / Action identity linkage
list/read Change-scoped Run history as needed for sequential handoff
fail closed on malformed durable bytes
```

No global scheduler/index/registry is required.

---

## 9. Explicit non-goals

The following MUST NOT become Proposal-readiness blockers for this Change:

```text
multi-Agent concurrency
parallel Run writers
Run locking
scheduler
automatic-next orchestration
crash recovery
WAL
database-backed Run registry
distributed / cross-machine Run synchronization
arbitrary user-supplied RunId
general-purpose filesystem path API
symlink / junction / reparse-point hardening
UNC-path support
exhaustive Windows namespace hardening
global Run discovery/indexing
Verification orchestration
Owner promotion automation
background daemon
automatic Author / Reviewer loop
automatic takeover of half-executed Agent
```

Also still outside this Change because owned by later planned Changes:

```text
ActionPackage
exact Result admission
Policy legal-boundary calculation
cross-stage repair legality such as apply -> revise-propose
OpenSpec adapter
Flowkit CLI
mutation authority
Git checkpoint authority
Delivery Full Test
cross-delivery Memo capability
```

---

## 10. Owner authority / cross-stage repair fact boundary

Owner requires that future workflows can preserve an explicit decision such as:

```text
apply blocked
↓
Owner authorizes revise-propose
↓
next Author sees that authorization
```

This Change only needs to make that Owner authority fact durable and readable.

It MUST NOT decide whether the return is legal. That belongs to Policy.

Thus:

```text
Persistence = preserve explicit Owner decision fact
Policy      = determine whether that fact authorizes the requested boundary
```

---

## 11. Verification direction

Apply verification should stay proportional to the actual product boundary.

### 11.1 Occurrence / topology

```text
repeated same ActionIdentity produces distinct Run occurrences
Flowkit-generated occurrence maps to one direct child under Change root
invalid generator inputs reject
Run history groups under Delivery / Change
historical sibling Change roots remain untouched
```

### 11.2 Round-trip

```text
Run write → read preserves exact durable facts
Result write → read preserves exact durable facts
role preserved
action preserved
OwnerAuthorityFact preserved when present
reported next boundary preserved as data
Author/Reviewer/Verification verdict fields remain semantically distinct
verificationVerdict = null remains valid for intermediate Change Runs
```

### 11.3 Integrity

```text
truncated JSON reject
missing required fields reject
invalid enum/identity reject
invalid authority fact reject
Run ↔ Result mismatch reject
unexpected fields reject where exact schema is declared
```

### 11.4 Scope guard

Source/test audit MUST confirm absence of:

```text
scheduler
lock manager
WAL/database
multi-Agent coordination
automatic retry/recovery
generic filesystem path API
Policy
ActionPackage admission
CLI
OpenSpec adapter
Git checkpoint
```

### 11.5 Cross-platform

Current Change only needs a canonical generated address model that does not emit obviously non-portable arbitrary names.

Whole-manager Windows/Linux filesystem acceptance remains later Full Test / dedicated hardening territory.

---

## 12. Limitations

This Explore does not prove or claim:

- multi-process writer correctness;
- crash/power-loss recovery;
- WAL/journal semantics;
- symlink/junction/reparse containment;
- exhaustive Win32 namespace safety;
- arbitrary user-provided RunId safety;
- distributed Run synchronization;
- exact Result admission;
- Policy legality;
- automatic resume/next Action execution;
- Delivery Full Test readiness.

These are not Proposal-readiness prerequisites under the Owner-corrected scope.

---

## 13. Post-revision validation

Exact detached checks after scope correction:

```text
typecheck                              PASS
domain tests                           25/25 PASS
Prettier format check                  PASS
OpenSpec version                       1.10.0
OpenSpec formal artifacts              0/4
action-lifecycle canonical spec        strict PASS
lifecycle-authority-and-identity spec  strict PASS
production src/tests mutation          NONE
```

The active Change remains pre-Proposal. No `proposal.md`, delta specs, `design.md`, or `tasks.md` were created.

---

## 14. Scope-correction outcome

The previous Explore had started to over-focus on a generic filesystem threat model. The Owner correction is accepted as an **invalid-boundary / scope-expansion correction**.

The revised boundary is:

```text
Flowkit controls Run occurrence generation
        ↓
Flowkit controls repository address generation
        ↓
Persistence writes/reads exact Change-scoped durable facts
        ↓
Author / Reviewer can hand off without conversation memory
        ↓
STOP
```

Generic filesystem hardening is no longer allowed to recursively expand this Change.

---

## 15. Explore conclusion

### Verdict

```text
PASS
```

### Required questions answered

1. **一个 Action execution 如何得到唯一 Run occurrence？**  
   A dedicated Change-scoped occurrence, generated by Flowkit and distinct from semantic ActionIdentity.

2. **Run record 保存哪些 durable facts？**  
   Delivery/Change/Action occurrence, role, lifecycle/context facts, explicit authority when present, and stable result linkage.

3. **Author 与 Reviewer 如何通过 Run 顺序交接？**  
   Each actor writes one durable Run, stops, and the next actor reads the previous Run rather than relying on chat history.

4. **Run 如何写入并重新读取且事实不漂移？**  
   Strict serialize/write/read/parse/validate round-trip with identity/linkage checks and fail-closed malformed data.

5. **Change-scoped Run topology 是什么？**  
   `.flowkit/runs/<delivery>/<change-root>/<flowkit-generated-occurrence>/...` aligned with existing repository practice.

6. **哪些能力明确不属于当前 Change？**  
   Multi-Agent, concurrency/locking, crash recovery/WAL, arbitrary RunId/path API, exhaustive platform hardening, Result admission, Policy, CLI and orchestration are explicitly excluded.

### Proposal readiness

Under the Owner-corrected scope, no known blocker remains that prevents proposing the minimal Author ↔ Reviewer durable Run/Result persistence contract.

Historical path findings remain useful constraints, but they are no longer justification for expanding this Change into a generic filesystem persistence subsystem.

### Next boundary

```text
review-explore
```

Reviewer SHOULD primarily challenge:

1. whether occurrence identity is sufficient for repeated Actions without changing ActionIdentity;
2. whether stable Run/Result round-trip preserves Author/Reviewer/Owner facts without semantic drift;
3. whether role/verdict separation remains exact;
4. whether the proposed repository topology matches the real sequential Author ↔ Reviewer handoff;
5. whether any hidden Result admission / Policy / orchestration behavior has leaked into scope;
6. whether Flowkit-controlled address generation is sufficiently bounded for this Change without reopening arbitrary filesystem input as a target.
