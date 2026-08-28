# Explore

## 1. Problem

`flowkit-next` 已完成 Delivery Start，但当前仓库仍只有初始化骨架，还没有 Foundation lifecycle domain implementation。

本 Change：

```text
establish-lifecycle-authority-and-identity-contracts
```

必须在进入 Proposal 前证明一件事：

> Flowkit-next 能否用一套最小、单一、fail-closed 的 authority / identity vocabulary，支撑后续 Action lifecycle、Run persistence、Policy、OpenSpec integration 与 Git checkpoint，而不恢复旧 Flowkit 的双重 Change identity、authority duplication 或 group lifecycle。

本 Explore 只回答 domain contract 的可行边界，不实现 production code。

---

## 2. Current Facts

### Git / Delivery

```text
Delivery:
20260824-01-foundation-lifecycle-kernel

entry HEAD:
23ca52715df7c52738edeb59206f496c7bf2d2a9

Change:
establish-lifecycle-authority-and-identity-contracts

group:
foundation

dependsOn:
[]

state before activation:
planned

state after Owner activation:
active
```

Owner activation ref：

```text
owner:1593d4fbe636d0afc08711794647464fff0df0496b316795f823299fcb18fe6e
```

### OpenSpec

OpenSpec 仍是正式 Change contract authority。

当前只建立 Change scaffold：

```text
openspec/changes/establish-lifecycle-authority-and-identity-contracts/.openspec.yaml
```

当前没有：

```text
proposal.md
design.md
specs/
tasks.md
```

`explore.md` 是 Flowkit 相对 OpenSpec 增加的 Explore artifact，不是 OpenSpec 原生 artifact，也不改变 OpenSpec 的 proposal/design/spec/tasks authority。

### Current repository implementation

当前：

```text
src/README.md
tests/README.md
```

证明 production implementation 与 formal tests 尚未建立。

因此本 Change 不能假设现有 lifecycle runtime、Policy、Run persistence 或 CLI 已存在。

### Current Flowkit-next identity model

`openspec/config.yaml` 与 Delivery manifest 已固定：

```text
Change identity
= semantic id

group
= organization metadata only
```

所以不得恢复：

```text
key + id
A1/B1/C1 作为 canonical Change identity
group lifecycle
```

### Historical Flowkit evidence

旧 `XDesk-xx/flowkit@110c2a24...` 中：

```text
ChangeSummary / Change
→ 同时存在 key + id

Role
→ owner | author | reviewer

Standard Action execution
→ author / reviewer

OwnerDecisionRecord
→ create-delivery / create-change / activate-change / authorize-*

Verification
→ 独立 evidence authority
```

这些只能作为历史参考。

可以保留的方向：

```text
Owner decision 是显式 durable fact
Owner / Author / Reviewer / Verification 分离
```

不能原样迁移的方向：

```text
Change key + id 双重 identity
```

---

## 3. Scope Boundary

### In scope

本 Change 可以进入 Proposal 冻结：

```text
Owner authority vocabulary
Actor / execution role vocabulary
Delivery semantic identity / reference
Change semantic identity / reference
Action semantic identity vocabulary
Owner decision reference vocabulary
authority separation invariants
Delivery / Change 最小结构状态 vocabulary
fail-closed literal / identity validation
```

必须保持：

```text
Owner ≠ Author ≠ Reviewer ≠ Verification

Review approved
≠ Owner authorization

Verification PASS
≠ Owner authorization

Action terminal
≠ Git checkpoint authorization
```

### Out of scope

明确不属于本 Change：

```text
prepared / resumed / terminal Action lifecycle
single-current-Action invariant
Run / Result persistence
ActionPackage / result admission
Policy semantic eligibility
next-boundary calculation
mutation declaration
Git checkpoint implementation
managed toolchain resolution
OpenSpec adapter
CLI
automatic next
Agent / Skill registry
```

这些分别属于后续 planned Changes。

`AGENTS.md` 的动态状态清理也不在本 Explore 中执行；不得借本 Change 建立第二套 lifecycle truth。

---

## 4. Risk Scan

| Risk | Result | Why |
|---|---|---|
| Scope expansion / missing prerequisite | YES | authority vocabulary 很容易吞入 Action lifecycle、Policy、persistence |
| Cross-time facts | LOW | 本 Change 主要定义 identity/authority，不需要未来 Run/Review fact 在 entry 时存在 |
| Schema / persistence migration | LOW | flowkit-next 尚无 production persistence schema；但历史旧模型不可直接迁移 |
| Self-hosting / writer changes itself | NO | 本 Change 不替换当前 external Delivery manager |
| Authority duplication | YES | Owner / Reviewer / Verification / OpenSpec / Git 容易被错误合并 |
| Generic reusable subsystem | YES | identity / authority vocabulary 会被全部后续 Foundation Changes 消费 |
| Activation persistence | YES | Change active fact 必须留在 Delivery manifest；不能只存在 chat |
| Candidate/formal-fact mutation affects existing consumers | YES | Delivery manifest activation 与 OpenSpec Change scaffold 是正式输入 |
| Verification selection → physical target closure | NO | 尚无 production implementation；Proposal 后 targeted tests 才适用 |
| External tool performs real mutation | YES | OpenSpec Change scaffold 属外部工具语义；需 exact 1.10.0 本地 runtime 校验 |
| Performance claim | NO | 本 Change 不声称性能收益 |

---

## 5. Applicable Proofs

### Proof A — Scope / Prerequisite Closure

**Question**

完成 authority / identity contract 是否依赖尚未授权的 Action lifecycle、Policy、Run persistence 或 CLI？

**Acceptance Boundary**

能够进入 Proposal，并把本 Change 限定为最小 domain vocabulary / validation，不要求后续 subsystem 先存在。

**Method**

读取：

```text
openspec/delivery-groups/20260824-01-foundation-lifecycle-kernel.yaml
openspec/config.yaml
architecture/.../planned.architecture.json
src/README.md
tests/README.md
```

并对照 planned Change dependency chain。

**Evidence**

- 当前 Change `dependsOn=[]`。
- 下一 Change `establish-action-lifecycle-domain-contract` 明确依赖本 Change。
- Planned architecture 把 Lifecycle Domain、Policy、Execution、Persistence 分成独立组件。
- 当前 repo 没有 production implementation，因此不存在必须兼容的内部 runtime contract。

**Evidence Boundary**

覆盖 Proposal 的 scope/prerequisite 判断；不证明未来 implementation 已正确。

**Gap**

实现后的 targeted tests 尚未执行，因为当前 Action 是 Explore。

**Result**

```text
PASS
```

**Implication**

Proposal 可以冻结 authority/identity contract，但不得吞入 Action lifecycle / Policy / persistence。

---

### Proof B — Canonical Change Identity

**Question**

Flowkit-next 是否仍需要旧 Flowkit 的 `key + id` 双重 Change identity？

**Acceptance Boundary**

Proposal 可以选择 semantic `changeId` 作为唯一 canonical Change identity，且不破坏当前 Delivery / OpenSpec facts。

**Method**

比较：

```text
flowkit-next openspec/config.yaml
flowkit-next Delivery manifest
```

与历史：

```text
XDesk-xx/flowkit@110c2a24...
src/domain/types.ts
src/domain/a1-types.ts
```

**Evidence**

当前 flowkit-next 已明确：

```text
Change identity = semantic id
group = organization metadata only
```

旧 Flowkit 才存在：

```text
key + id
```

当前 Delivery 的所有 dependency、Change path、OpenSpec Change directory 均已经使用 semantic id。

**Evidence Boundary**

覆盖当前 Delivery 及后续 planned Change 的 canonical identity contract。

**Gap**

尚未实现 TypeScript validator；由 Proposal / Apply 后 targeted tests 验证。

**Result**

```text
PASS
```

**Implication**

Proposal 必须禁止：

```text
key alias
A1/B1 identity
group-as-identity
```

---

### Proof C — Authority Separation

**Question**

Owner、Author、Reviewer、Verification 是否可以统一为一个 Role / 状态来源？

**Acceptance Boundary**

Proposal 能冻结明确的 authority separation，并避免任何 terminal/review/test 状态自动创造 Owner authority。

**Method**

读取：

```text
openspec/config.yaml
Delivery contract
```

并对照历史：

```text
src/domain/types.ts
src/domain/actions.ts
src/domain/a1-types.ts
```

**Evidence**

历史实现已经显示：

```text
Standard Action execution role
→ author / reviewer

OwnerDecisionRecord
→ 单独记录 Owner decisions

Verification
→ 独立 domain evidence
```

当前 flowkit-next Delivery 又明确要求：

```text
Owner ≠ Author ≠ Reviewer ≠ Verification
```

**Evidence Boundary**

覆盖 domain authority vocabulary 与 Proposal invariants。

**Gap**

Policy 如何消费这些 authority facts 属后续 Change，不在本 Proof 中证明。

**Result**

```text
PASS
```

**Implication**

Proposal 不得使用：

```text
Review PASS → Owner authorization
Verification PASS → mutation authority
Action terminal → checkpoint authority
```

---

### Proof D — Activation Persistence

**Question**

Owner 激活 Change 的事实是否只存在于聊天 / Run，还是已经成为 Delivery-local durable fact？

**Acceptance Boundary**

本次 Change 激活在新的会话 / payload overlay 后仍可由正式 Delivery manifest 恢复。

**Method**

将 exact Change：

```text
planned → active
```

写入：

```text
openspec/delivery-groups/20260824-01-foundation-lifecycle-kernel.yaml
```

并记录 deterministic Owner activation ref。

**Evidence**

Payload 同时传递：

```text
Delivery manifest active state
Owner activate-change decision
OpenSpec Change scaffold
Run context/result
```

**Evidence Boundary**

覆盖当前 Delivery 的 activation persistence。

**Gap**

不声称这是 future Delivery 的 generic activation implementation；Candidate Policy / persistence 尚未实现。

**Result**

```text
PASS
```

**Implication**

本 Explore 可以继续作为 active Change 的 Author artifact；不得把这个 bootstrap persistence 夸大为 Stable Flowkit runtime capability。

---

### Proof E — Generic Next-consumer Boundary

**Question**

本 Change 的 identity / authority vocabulary 是否足够小，可以被下一个 Action-lifecycle Change 使用，而不会把下一个 Change 的 semantics 提前固化？

**Acceptance Boundary**

Proposal 能提供共享 vocabulary，同时让下一 Change 自己定义：

```text
prepared
resumed
terminal
single-current-Action
```

**Method**

对照：

```text
establish-lifecycle-authority-and-identity-contracts
establish-action-lifecycle-domain-contract
```

的 Delivery goals / dependencies / planned outputs。

**Evidence**

第一个 Change 输出限定为：

```text
authority / identity domain contract
role separation invariants
```

第二个 Change 单独拥有：

```text
Action state vocabulary
legal transition invariants
single-current-Action invariant
```

**Evidence Boundary**

覆盖 planned next-consumer 的 contract separation。

**Gap**

下一 Change 尚未实现，因此不能证明最终 API ergonomics 或代码级 genericity。

**Result**

```text
PASS
```

**Implication**

本 Proposal 只定义 Action identity / role vocabulary 所需最小字段，不定义 Action lifecycle state machine。

---

### Proof F — External OpenSpec Mutation Boundary

**Question**

本次 Explore 是否需要伪造 OpenSpec proposal/design/spec/tasks 才能成立？

**Acceptance Boundary**

只建立 OpenSpec 1.10.0 Change scaffold，并保留 Flowkit 自己的 `explore.md`，不提前生成任何 OpenSpec formal proposal artifacts。

**Method**

使用锁定的 managed runtime：

```text
${FLOWKIT_HOME}/tools/openspec/1.10.0/bin/openspec.js
```

从 `23ca52715df7c52738edeb59206f496c7bf2d2a9` detached repository 恢复边界开始，只带入已经授权的 Delivery activation fact 与 001/002 durable Run history；移除未被 Reviewer 接纳的旧 scaffold 后，真实执行：

```text
TZ=Asia/Shanghai node ${FLOWKIT_HOME}/tools/openspec/1.10.0/bin/openspec.js \
  new change establish-lifecycle-authority-and-identity-contracts
```

随后用同一 managed runtime 执行：

```text
openspec status --change establish-lifecycle-authority-and-identity-contracts
```

**Evidence**

Exact managed OpenSpec identity：

```text
version = 1.10.0
new-change exit code = 0
```

真实 CLI stdout：

```text
Created change 'establish-lifecycle-authority-and-identity-contracts' at openspec/changes/establish-lifecycle-authority-and-identity-contracts/
Schema: spec-driven
Next: openspec status --change establish-lifecycle-authority-and-identity-contracts
```

CLI 真实生成：

```yaml
schema: spec-driven
created: 2026-08-24
```

生成物 SHA-256：

```text
5f408ebe6a8c4d9c4c5e85f9e84c9ac47aa1192c4424a5f5f2224781c6f85fd7
```

`openspec status` 继续证明当前仍只有 Change scaffold：

```text
Progress: 0/4 artifacts complete
[ ] proposal
[-] specs (blocked by: proposal)
[-] design (blocked by: proposal)
[-] tasks (blocked by: specs, design)
```

Flowkit 额外保留：

```text
explore.md
```

没有生成：

```text
proposal.md
design.md
specs/
tasks.md
```

**Evidence Boundary**

覆盖 Reviewer `NEXT-RE-001` 要求的 exact OpenSpec 1.10.0 real-execution provenance，并覆盖本 Explore artifact / OpenSpec authority boundary。

**Gap**

无。当前 Proof 只证明 Change scaffold 的真实 OpenSpec 1.10.0 mutation provenance；不声称 Proposal/Design/Specs/Tasks 已存在。

**Result**

```text
PASS
```

**Implication**

`NEXT-RE-001` 的 Author-owned blocker 已关闭：`.openspec.yaml` 现在绑定到真实 managed OpenSpec 1.10.0 `new change` execution，而不是 source inspection / manual bytes。Reviewer 仍应把 `explore.md` 作为 Flowkit Explore extension artifact 审阅，不能把它误认成 OpenSpec proposal truth。

---

## 6. Rejected Approaches

以下方案已否定：

### 6.1 恢复 `key + id`

拒绝：

```text
key: A1
id: establish-...
```

作为双重 canonical identity。

原因：当前 flowkit-next 已冻结 semantic id-only。

### 6.2 把 group 变成 lifecycle node

拒绝：

```text
Delivery → Group → Change
```

原因：

```text
group
= metadata
≠ activation/review/archive/checkpoint target
```

### 6.3 Owner 作为 Standard Action executor

拒绝让 Owner 执行 Author / Reviewer Standard Action。

Owner 提供 authority facts；Author / Reviewer 执行 Action。

### 6.4 Verification 产生 Owner authority

拒绝：

```text
Verification PASS
→ authorize Apply / Archive / checkpoint
```

Verification 只是 correctness evidence。

### 6.5 在本 Change 实现完整 Action lifecycle

拒绝提前加入：

```text
prepared
resumed
terminal
current Action
```

这些属于下一个 Foundation Change。

### 6.6 把 `explore.md` 当 OpenSpec 原生 artifact

拒绝。

`explore.md` 是 Flowkit-specific Explore output；OpenSpec 正式 proposal/design/spec/tasks authority 不变。

---

## 7. Feasible Proposal Boundary

现在已经有足够 proof 进入 Proposal 冻结以下内容：

```text
1. semantic Delivery / Change / Action identity vocabulary
2. semantic Change id only
3. group metadata only
4. Owner authority reference / decision vocabulary
5. Author / Reviewer execution role vocabulary
6. Verification independent evidence authority
7. Owner / Author / Reviewer / Verification separation invariants
8. Delivery / Change 最小结构状态 vocabulary
9. fail-closed validation for malformed / unknown literals
10. targeted unit tests for the new domain contract
```

Proposal 必须继续明确非目标：

```text
Action lifecycle state machine
Run/Result persistence
Policy eligibility
next boundary
CLI
OpenSpec adapter
Git checkpoint implementation
automatic next
generic Agent platform
```

---

## 8. Open Decisions

Proposal 仍需选择一个最小形式：

### OD-1 — Role type shape

二选一并保持单一模型：

```text
Option A:
ActorRole = owner | author | reviewer
ActionExecutionRole = author | reviewer
```

或：

```text
Option B:
Role = owner | author | reviewer
helper / type exclusion 保证 owner 不执行 Standard Action
```

不能同时保留两套等价 truth。

### OD-2 — Identity reference representation

Proposal 需要决定：

```text
plain semantic string
```

与：

```text
branded / validated semantic reference
```

之间的最小实现方式。

要求：

```text
fail closed
不引入 registry
不引入 opaque numeric key
```

### OD-3 — AGENTS stale dynamic text

当前发现初始化期动态状态陈述仍可能存在。

本 Change 默认：

```text
不修改 AGENTS.md
```

若未来要清理，应作为 guidance hygiene 的显式 mutation，而不是把 AGENTS 建成 lifecycle truth。

---

## Reviewer Handoff

Reviewer 必须检查：

```text
1. Risk Scan 是否完整
2. Proof A–F 的 Evidence Boundary 是否覆盖各自 Acceptance Boundary
3. 是否把当前 Delivery bootstrap PASS 夸大为 Stable runtime PASS
4. 是否错误恢复 key + id
5. 是否把 group 变成 lifecycle node
6. 是否把 Owner / Reviewer / Verification authority 合并
7. 是否提前吞入 Action lifecycle / Run persistence / Policy
8. explore.md 是否保持 Flowkit extension，而不是 OpenSpec formal truth
9. 是否存在未经授权的 production mutation
10. NEXT-RE-001 是否已由真实 OpenSpec 1.10.0 new-change provenance 关闭
```

期望下一 boundary：

```text
review-explore
```

本 Explore 不自动进入 Proposal。
