# Explore

## 1. Problem

本 Change 要回答的不是“如何把整个 Flowkit 流程一次实现完”，而是更小、更基础的问题：

> 在已经冻结 canonical Delivery / Change / Standard Action identity 与 authority separation 的前提下，Flowkit Foundation 能否建立一套最小、确定、fail-closed 的 Action lifecycle domain contract，使一个 current Action 能从 `prepared` / `resumed` 到 `terminal`，并始终保持 single-current-Action invariant，同时不提前吞入 Run/Result persistence、Policy、OpenSpec integration、CLI 或 Git mutation authority？

Delivery 对本 Change 的正式目标为：

```text
定义 prepared、resumed、terminal、current Action identity 与 single-current-Action invariant。
```

正式 outputs：

```text
Action lifecycle domain contract
legal transition invariants
```

因此 Explore 的核心不是建立完整 execution runtime，而是证明：

```text
identity boundary
+ lifecycle state vocabulary
+ transition legality
+ single-current slot
```

可以独立成一个小 Change，并且能被后续 persistence / admission / resume / Policy Change 消费。

---

## 2. Current Facts

### 2.1 Detached environment

本次 Explore 在独立 Linux x64 detached 工作区执行：

```text
/mnt/data/flowkit-next-detached-012/repo
```

输入 Delivery snapshot：

```text
flowkit-next-delivery-20260824-01-foundation-lifecycle-kernel-a2f4bf9.zip
SHA-256 = 385cd4588a1817d51d4c7cdd916f4a5985f2b4adb44bced8bf7866f0b8945a39
```

exact runtime：

```text
Node      v22.23.2
pnpm      11.22.0
OpenSpec  1.10.0
Platform  Linux x86_64
```

runtime bundle SHA-256：

```text
node runtime
29331fa22523b7fce59965e46627ecbc87019ac74e0e6abf9f61284e0760f755

OpenSpec runtime
4fb0b870d9523daebda8becaf4202397da342bc39dde3961d8dd4392c72e2b68

flowkit-next Linux node_modules
96e1c2cd74b1bba7e706100f01ed149727453b03a22aefbffb7e5c7175b18406
```

### 2.2 Detached execution caveat

直接执行：

```text
pnpm typecheck
```

会触发 pnpm dependency status/install path，并尝试访问 npm registry；当前 detached sandbox 无网络，因此该入口不能作为本次离线稳定性证明。

恢复 exact Linux `node_modules` bundle 后，本次使用 exact Node 直接执行工具：

```text
node node_modules/typescript/bin/tsc --noEmit
node --import ./node_modules/tsx/dist/loader.mjs --test tests/unit/domain/*.test.ts
node node_modules/prettier/bin/prettier.cjs --check ...
```

结果：

```text
typecheck     PASS
domain tests  13/13 PASS
format check  PASS
```

这证明当前 source + Linux node_modules bundle 可以离线执行；它不证明普通 `pnpm <script>` 在无 store / 无 network 时就是稳定 detached launcher。

### 2.3 OpenSpec status

OpenSpec 1.10.0 初始真实状态：

```json
{
  "changes": []
}
```

本次使用 exact managed runtime 真实执行：

```text
node tools/openspec/1.10.0/bin/openspec.js \
  new change establish-action-lifecycle-domain-contract
```

真实生成：

```text
openspec/changes/establish-action-lifecycle-domain-contract/.openspec.yaml
```

内容：

```yaml
schema: spec-driven
created: 2026-08-25
```

随后真实 `openspec status` 仍为：

```text
proposal  ready
specs     blocked by proposal
design    blocked by proposal
tasks     blocked by specs, design
```

本 Explore 没有生成：

```text
proposal.md
design.md
specs/
tasks.md
```

`explore.md` 仍是 Flowkit-specific Explore extension artifact，不是 OpenSpec formal proposal truth。

### 2.4 Delivery / prerequisite state

Delivery：

```text
20260824-01-foundation-lifecycle-kernel
state = active
```

唯一直接 prerequisite：

```text
establish-lifecycle-authority-and-identity-contracts
state = completed
```

该 prerequisite 已归档，并已同步正式 spec：

```text
openspec/specs/lifecycle-authority-and-identity/spec.md
```

当前 Change 已根据本次 Owner 明确输入，由外部流程连接层持久化为：

```text
state = active
scope = explore
```

Owner fact reference：

```text
owner:78f2d96bf54dd7e6b4729a53d7f603480353624b4deaea174a172bec4fa80856
```

该持久化是 Delivery 01 的 external governance bridge，不声称 candidate Flowkit runtime 已具备 activate/explore lifecycle 能力。

### 2.5 Existing domain contract

当前 `src/domain` 已实现：

```text
SemanticId
DeliveryId
ChangeId
StandardActionId
ActorRole
ActionExecutionRole
AuthoritySource
OwnerAuthorityFact
DeliveryState
ChangeState
```

Standard Action catalog 精确为十个：

```text
explore
review-explore
revise-explore
propose
review-propose
revise-propose
apply
review-apply
revise-apply
archive
```

当前 `state.ts` 明确只包含：

```text
Delivery structural states
Change structural states
```

并且现有 test 明确证明：

```text
prepared / resumed / terminal
```

尚未被错误塞进 Change state。

因此本 Change 有真实、干净的 ownership boundary，可以新增 Action lifecycle，而不是重构已存在的错误 state machine。

### 2.6 Existing guidance contract

`AGENTS.md` 已冻结以下 semantics：

```text
prepared = Core preparation done, Action NOT complete
resumed  = pending Run restored, Action NOT complete
terminal = current Action admitted/completed
```

以及：

```text
prepare / exact resume
→ execute exactly one current Action
→ result admission
→ terminal
→ report next boundary
→ STOP
```

同时禁止：

```text
prepared/resumed 时提前当作 Action complete
terminal 后自动继续下一 Action
```

这给出了 lifecycle semantics，但尚未提供 domain API / transition invariant；本 Change 正是负责把这些文字边界收敛成可验证 contract。

---

## 3. Scope Boundary

### 3.1 In scope

本 Change 可以定义：

```text
1. ActionLifecycleState = prepared | resumed | terminal
2. current Action 的结构化 identity
3. single-current-Action slot invariant
4. prepare / resume / terminal 的结构 transition legality
5. identity-preserving transition rule
6. terminal absorbing rule
7. 非 terminal current Action 不得被另一个 Action 替换
8. unknown/malformed state 与 Action identity fail closed
9. pure deterministic lifecycle helpers / validators
10. targeted unit tests
```

### 3.2 Out of scope

本 Change不得实现：

```text
RunId / ResultId
Run / Result durable persistence
filesystem serialization
result admission payload schema
ActionPackage
external Agent execution
Policy legal-next-Action ordering
Owner decision eligibility recognition
Reviewer verdict evaluation
Verification routing
mutation declaration
Git checkpoint
OpenSpec adapter
CLI
automatic next
background execution
cross-platform whole-manager acceptance
```

### 3.3 Important ownership split

本 Change 的 structural lifecycle rule 与后续 Policy rule 必须严格分开。

例如：

```text
terminal Action A → prepare Action B（B 的 canonical semantic ActionIdentity 必须与 A 不同）
```

在本 Change 中只回答：

```text
“是否允许在旧 current Action 已 terminal 后，用另一个 canonical Action identity 占据 current slot？”
```

不回答：

```text
“B 是否是 OpenSpec / Review / Owner authority 下真正合法的下一 Action？”
```

后一个问题属于：

```text
establish-policy-and-next-boundary-contract
```

因此 lifecycle domain 可以允许 structural replacement，但不能建立 `explore → review-explore → ...` 的完整 Policy state machine。

---

## 4. Candidate Domain Shape

Explore 期间推荐的最小模型如下。

### 4.1 Action lifecycle state

```ts
type ActionLifecycleState = "prepared" | "resumed" | "terminal";
```

不增加：

```text
pending
running
completed
failed
cancelled
approved
passed
```

原因：这些词要么重复已有 semantics，要么属于 execution result / review / verification，而不是本 Change 的 Action lifecycle state。

### 4.2 Current Action identity

current Action 不应只有裸 `StandardActionId`。

推荐使用结构 identity：

```ts
interface ActionIdentity {
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
  readonly actionId: StandardActionId;
}
```

理由：

```text
actionId = action kind
changeId = lifecycle target
DeliveryId = ownership scope
```

这三个字段来自已经冻结的 canonical semantic identity vocabulary。

不在本 Change 新增：

```text
numeric action key
UUID action instance id
opaque hash id
RunId
attempt id
sequence number
```

Action occurrence / execution attempt 的 durable identity 应由后续 Run persistence Change 定义。

### 4.3 Current Action slot

推荐 conceptual shape：

```ts
interface CurrentAction {
  readonly identity: ActionIdentity;
  readonly state: ActionLifecycleState;
}

type CurrentActionSlot = CurrentAction | null;
```

该 shape 直接从结构上保证：

```text
0 or 1 current Action
```

而不是维护：

```text
CurrentAction[]
```

再额外校验 array length。

single-current-Action 是 domain shape invariant，而不应该依赖调用方自律。

### 4.4 Minimal structural transitions

推荐 transition matrix：

| Current | Operation | Target identity | Result | Structural verdict |
|---|---|---|---|---|
| empty | prepare | canonical A | A/prepared | allow |
| prepared A | resume | A | A/resumed | allow |
| resumed A | resume | A | A/resumed | allow |
| prepared A | terminal | A | A/terminal | allow |
| resumed A | terminal | A | A/terminal | allow |
| prepared A | prepare | B | — | reject |
| resumed A | prepare | B | — | reject |
| prepared/resumed A | resume | B | — | reject |
| prepared/resumed A | terminal | B | — | reject |
| terminal A | resume | A/B | — | reject |
| terminal A | terminal | A/B | — | reject |
| terminal A | prepare | canonical A | — | reject |
| terminal A | prepare | canonical B where B != A | B/prepared | structurally allow; Policy later decides B |

### 4.5 Why `prepared → terminal` must be legal

首次 prepare 后，正常执行路径是：

```text
prepare
→ execute current Action
→ result admission
→ terminal
```

这条路径没有发生 resume。

如果强制：

```text
prepared → resumed → terminal
```

就必须人为制造一次并不存在的 resume event，违反事实语义。

因此：

```text
prepared → terminal
```

必须是合法 transition。

### 4.6 Why `resumed → resumed` should be legal

考虑真实故障：

```text
prepared
→ process restart
→ resumed
→ process restart again before terminal
→ exact resume again
```

如果 `resumed` 是正式 lifecycle state，但 `resumed → resumed` 被禁止，那么第二次真实恢复将无法表达。

因此只要本 Change把 `resumed` 作为持久可观察 state，就应允许 exact same identity 的：

```text
resumed → resumed
```

它表示重复恢复同一个 pending current Action，不表示执行了第二个 Action。

### 4.7 Terminal must be absorbing for the same current Action

terminal semantics 是：

```text
current Action admitted/completed
```

因此同一个 Action identity 进入 terminal 后：

```text
resume terminal
terminal terminal again
prepare the same terminal Action identity again
```

都应 fail closed。

这可以避免 domain 层接受明显的 duplicate completion 语义。

后续 exact Result admission Change 仍需要自己验证 Result 的真实身份与重复提交；本 Change 的 absorbing rule 不是 Result admission 的替代品。

### 4.8 Replacing a terminal current Action

为了不引入额外 `idle/completed/cleared` lifecycle state，推荐允许：

```text
terminal A
→ prepare B, where canonical semantic ActionIdentity(B) != ActionIdentity(A)
```

作为 current slot 的原子 replacement。

本 Change只验证：

```text
A 已 terminal
B identity canonical
B canonical semantic ActionIdentity 与 A 不同
current slot 始终只有一个
```

它不验证：

```text
B 是否为合法 next Action
B 是否已经获得 Owner authority
B 是否被 OpenSpec 状态允许
```

这些全部留给后续 Policy / integration boundary。

---

## 5. Risk Scan

| Risk | Level | Explore question | Required boundary |
|---|---|---|---|
| scope expansion | HIGH | 是否会把 Run/Policy/CLI 一起吞入 | lifecycle 只做 pure domain contract |
| identity duplication | HIGH | 是否需要 Action instance id / key | 复用 DeliveryId + ChangeId + StandardActionId；Run occurrence 后置 |
| authority conflict | HIGH | transition helper 是否会变成 Policy | structural legality 与 Policy next-action eligibility 分离 |
| single-current violation | HIGH | 是否可能同时有两个 non-terminal Action | current slot 结构上 0/1；non-terminal 不可替换 |
| resume semantics | HIGH | resumed 是否能再次 resume | exact same identity 允许 resumed→resumed |
| terminal duplication | HIGH | terminal 是否能重复 admission | terminal 对同 identity absorbing |
| first-run distortion | HIGH | 是否强制首次执行走 resume | prepared→terminal 必须合法 |
| persistence leakage | MEDIUM | 是否提前定义 RunId/timestamps/result | 明确排除 |
| OpenSpec authority leakage | MEDIUM | explore 是否提前生成 proposal truth | scaffold only + explore extension |
| future consumer compatibility | HIGH | persistence/admission/policy 是否能消费 | 使用稳定 semantic ids + pure state contract |
| environment proof inflation | MEDIUM | Linux source checks 是否等于 whole-manager acceptance | 明确只证明当前 detached Explore 能执行 |
| production mutation during Explore | HIGH | 是否实现了代码 | 禁止；仅 scaffold/authority/explore/evidence |

---

## 6. Proof Performed

### Proof A — Detached Environment / Baseline Executability

**Question**

当前传递包与 Linux runtime 是否足以在 `/mnt/data` 中真实执行本 Change Explore，而不是依赖宿主机隐藏环境？

**Method**

使用用户提供的：

```text
Node 22.23.2 Linux runtime
OpenSpec 1.10.0 Linux runtime
flowkit-next Linux node_modules bundle
```

恢复后，用 exact Node 执行 typecheck / tests / format check 与 OpenSpec CLI。

**Evidence**

```text
typecheck     PASS
domain tests  13/13 PASS
format check  PASS
OpenSpec      1.10.0
```

**Evidence Boundary**

证明当前 source snapshot + exact Linux dependencies 可以离线完成 Explore 所需 source inspection、test 与 OpenSpec scaffold。

**Does NOT prove**

```text
Windows acceptance
whole-manager acceptance
future Flowkit CLI
pnpm script launcher without network/store
```

**Result**

```text
PASS
```

---

### Proof B — Prerequisite / Ownership Closure

**Question**

本 Change 是否依赖尚未完成的 lifecycle/identity foundation？

**Method**

对照 Delivery manifest、已归档 Change、正式 lifecycle-authority-and-identity spec 与当前 source/tests。

**Evidence**

唯一直接 prerequisite：

```text
establish-lifecycle-authority-and-identity-contracts = completed
```

已存在并测试：

```text
DeliveryId
ChangeId
StandardActionId
roles
authority source
OwnerAuthorityFact
Delivery/Change structural state
```

当前 tests 还明确证明 Action lifecycle 尚未存在。

**Evidence Boundary**

证明本 Change 可以独立拥有 Action lifecycle contract，不需要先实现 persistence/Policy/CLI。

**Result**

```text
PASS
```

---

### Proof C — State Vocabulary Non-collision

**Question**

`prepared/resumed/terminal` 是否会与 Delivery / Change structural state 或 review/verification vocabulary 冲突？

**Method**

检查 `src/domain/state.ts`、正式 spec 与现有 tests。

**Evidence**

Delivery states：

```text
active | completed | cancelled
```

Change states：

```text
planned | active | completed | cancelled
```

现有 test 明确拒绝：

```text
prepared / resumed / terminal
```

作为 Change structural state。

Review / Verification 也已被 formal spec 定义为独立 authority/evidence，而不是 Action lifecycle state。

**Evidence Boundary**

证明可以新增独立 `ActionLifecycleState`，而不需要改写 Delivery/Change state contract。

**Result**

```text
PASS
```

---

### Proof D — Transition Matrix Controlled Model

**Question**

最小 transition rules 是否自洽，并能同时满足首次执行、重复 resume、single-current 与 terminal absorbing？

**Method**

在 repository 外部创建 explore-only reference model：

```text
/mnt/data/flowkit-next-detached-014/proof/action-lifecycle-model-proof.mjs
```

它不是 production code，不写入 `src/` / `tests/`。

执行 13 个正反例，包括：

```text
empty -> prepare A
prepared A -> terminal A
prepared A -> resumed A
resumed A -> resumed A
resumed A -> terminal A
terminal A -> prepare A reject
terminal A -> prepare B
prepared B -> prepare A reject
prepared B -> resume A reject
prepared B -> terminal A reject
terminal B -> resume B reject
terminal B -> terminal B reject
unknown action -> prepare reject
```

**Evidence**

全部观察符合预期。

Evidence SHA-256：

```text
action-lifecycle-model-proof.mjs
1c1af8bd80c0f5fff2dbe03ecff5e9c0daa9110b06b49817e6180903d011d85a

action-lifecycle-model-proof.json
f39660d5a797495a90765e1f61ee8834fdeeff03ad0304883f6a110626487c94
```

Revision note (`RE-013-001`): 012 的原 controlled proof 只有 12 个 case，未覆盖 `terminal A -> prepare A`。013 reviewer 将该缺口判定为 blocking；014 revise-explore 没有删除原结论，而是收紧 transition invariant，并用上面的第 13 个 negative case 明确证明 same-identity re-prepare fail closed。该修订不引入 RunId / attempt identity。

**Evidence Boundary**

证明 proposed contract shape 在逻辑上闭合。

**Does NOT prove**

```text
production implementation correctness
serialization
Run persistence
Policy ordering
Result admission
```

**Result**

```text
PASS
```

---

### Proof E — Single-current-Action Shape

**Question**

single-current-Action 是否需要 registry/list/global scan 才能保证？

**Method**

比较：

```text
CurrentAction | null
```

与：

```text
CurrentAction[] + “最多一个” runtime invariant
```

并对照 Delivery acceptance：

```text
Exactly one current Action can be prepared/resumed/executed to terminal
```

**Evidence**

单 slot shape 在数据结构层直接限制：

```text
0 or 1 current Action
```

且 non-terminal replacement rule 防止：

```text
prepared A + prepared B
resumed A + prepared B
```

被结构 transition 接受。

**Evidence Boundary**

证明不需要 dynamic registry 来表达 single-current invariant。

**Gap**

跨进程 durable single-current integrity 仍属于后续 Run persistence；本 Change 只能提供 pure domain invariant。

**Result**

```text
PASS
```

---

### Proof F — Identity Boundary / No Premature Run Identity

**Question**

current Action 是否需要现在就新增 Action instance UUID / RunId，才能支持 repeated Standard Action？

**Method**

对照：

```text
StandardActionId = action kind
Current Action = currently selected action in one Delivery/Change scope
Run persistence = next Change
```

并分析 repeat case：

```text
review-explore
→ revise-explore
→ review-explore again
```

**Evidence**

当前 slot 只需要识别“现在执行哪一个 Action kind、属于哪个 Delivery/Change”。

不同执行 occurrence 的 durable distinction 在 terminal 后会由后续 Run history 负责；在本 Change提前引入 RunId 会让 lifecycle domain 反向依赖 persistence design。

**Evidence Boundary**

证明本 Change可以复用现有 canonical semantic identity，而无需创建第二套 Action occurrence truth。

**Result**

```text
PASS
```

---

### Proof G — Structural Lifecycle ≠ Policy

**Question**

允许 `terminal A -> prepare B` 是否会让本 Change 变成下一 Action Policy？

**Method**

将两层问题拆开：

```text
Layer 1: slot safety / lifecycle structure
Layer 2: legal next Action eligibility
```

**Evidence**

Layer 1 只需要知道：

```text
old current is terminal
new identity is canonical
new identity != old terminal canonical semantic ActionIdentity
```

Layer 2 才需要知道：

```text
OpenSpec status
Review verdict
Verification evidence
Owner authority
mutation boundary
Delivery rules
```

而这些事实尚未由本 Change拥有。

**Evidence Boundary**

证明 structural replacement 可以存在，但 helper/API 命名与 docs 必须明确它“不决定 B 是否 legal next”。

**Result**

```text
PASS
```

---

### Proof H — OpenSpec Authority Boundary

**Question**

本次 Explore 是否需要提前创建 Proposal / Design / Specs / Tasks 才能成立？

**Method**

使用 exact OpenSpec 1.10.0 只真实执行：

```text
new change establish-action-lifecycle-domain-contract
status --change establish-action-lifecycle-domain-contract
```

然后只写 Flowkit-specific：

```text
explore.md
```

**Evidence**

OpenSpec status 保持：

```text
0/4 formal artifacts complete
proposal ready
specs/design/tasks blocked
```

**Evidence Boundary**

证明 Explore 不复制 OpenSpec planning lifecycle authority。

**Result**

```text
PASS
```

---

### Proof I — No Production Implementation During Explore

**Question**

本次 Explore 是否错误地实现了 production lifecycle code？

**Method**

将 controlled model 放在 repo 外部 proof directory；repo 内只允许：

```text
OpenSpec scaffold
explore.md
external-governance activation persistence
```

不修改：

```text
src/
tests/
package.json
pnpm-lock.yaml
architecture/
```

**Evidence Boundary**

证明当前交付仍处于 Explore capture，而不是偷偷 Apply。

**Result**

```text
PASS
```

---

## 7. Rejected Approaches

### 7.1 把 Action lifecycle 塞进 Change state

拒绝：

```text
Change.state = prepared/resumed/terminal
```

原因：Change lifecycle 与 current Standard Action execution lifecycle 是两层不同 truth；前一 Change 已正式冻结 Change states。

### 7.2 新建 `ActionKey` / numeric sequence 作为第二身份

拒绝。

本 Change使用已有：

```text
DeliveryId + ChangeId + StandardActionId
```

execution occurrence identity 留给 Run persistence。

### 7.3 强制 `prepared → resumed → terminal`

拒绝。

首次执行没有 resume 事实，不能为了 state machine 对称性制造假 resume。

### 7.4 禁止 `resumed → resumed`

拒绝。

真实 current Action 在 resume 后再次中断时仍必须可 exact resume；否则 resumed 作为 state 不具备 crash-safe semantics。

### 7.5 terminal 后允许 resume

拒绝。

terminal 已表示当前 Action admitted/completed；再次 resume 会破坏 completion boundary。

### 7.6 terminal 重复 terminal 当作无害 idempotency

默认拒绝。

duplicate Result admission 是否可做 idempotent dedupe，应由后续 Result admission contract 根据 exact Result identity 决定；本 Change不应把重复 terminal 自动当成功。

### 7.7 在本 Change 编码完整 Standard Action 顺序

拒绝：

```text
explore → review-explore → revise-explore → ...
```

完整 legal boundary 依赖 OpenSpec/Review/Owner/Verification 等 facts，属于 Policy Change。

### 7.8 把 current Action 做成 list / registry

拒绝作为默认模型。

Foundation 要的是 single-current；单 slot 更小、更直接、更 fail-closed。

### 7.9 在 Action state 中加入 result outcome

拒绝：

```text
terminal-success
terminal-failure
approved
rejected
passed
failed
```

这些属于 Result / Review / Verification，不应污染 Action lifecycle vocabulary。

---

## 8. Feasible Proposal Boundary

当前 proof 足以支持 Proposal 冻结以下内容：

```text
1. ActionLifecycleState 的 closed literals：prepared / resumed / terminal
2. Current Action identity 复用 DeliveryId + ChangeId + StandardActionId
3. single CurrentAction slot（0 or 1）
4. prepare 只允许 empty 或 terminal slot
5. resume 只允许 prepared/resumed 且 exact same identity
6. terminal 只允许 prepared/resumed 且 exact same identity
7. prepared → terminal 合法
8. prepared → resumed 合法
9. resumed → resumed 合法
10. resumed → terminal 合法
11. terminal 对 same current Action absorbing
12. non-terminal current Action 不可被不同 Action 替换
13. terminal → prepare same canonical semantic ActionIdentity 必须 reject
14. terminal → prepare different canonical next identity 只表示 structural allow，不表示 Policy eligibility
15. unknown/malformed action/state fail closed
16. pure deterministic helpers + targeted unit tests
```

Proposal 必须继续明确非目标：

```text
Run/Result persistence
RunId / attempt identity
ActionPackage
Result admission
external Agent execution
Policy next Action ordering
Owner authority eligibility
Review/Verification decision logic
OpenSpec adapter
CLI
mutation/Git checkpoint
automatic next
```

---

## 9. Open Decisions for Proposal

这些不是 blocker，但 Proposal / Design 需要选定具体 API 形状。

### OD-1 — Type naming

推荐在以下两种中选一个，不保留重复 truth：

```text
ActionIdentity + CurrentAction + ActionLifecycleState
```

或：

```text
CurrentActionIdentity + CurrentActionState
```

语义应保持相同。

### OD-2 — Transition API shape

可选：

```text
prepareCurrentAction
resumeCurrentAction
terminalCurrentAction
```

或单一 pure reducer：

```text
transitionCurrentAction(current, event)
```

优先选择最容易 fail closed、最不容易让调用方绕过 identity check 的形式。

### OD-3 — Terminal replacement representation

推荐：

```text
prepare(newIdentity)
```

在 current 为 terminal 时原子 replacement。

不推荐额外新增：

```text
clear-terminal
idle
released
```

除非 Proposal 能证明后续 consumer 真的需要额外 lifecycle truth。

### OD-4 — Error surface

需要在 Proposal/Design 决定 invalid transition 返回：

```text
null / Result-like tagged error / throw
```

但错误必须 deterministic，且不得静默 normalize identity/state。

---

## 10. Overall Explore Conclusion

```text
PASS
```

理由：

```text
prerequisite closed
scope bounded
identity vocabulary already exists
Action states do not collide with Change states
single-current can be expressed without registry
transition matrix is logically closed
repeated resume semantics can be represented
terminal boundary can remain absorbing
Run/Result/Policy can remain downstream
OpenSpec formal authority remains intact
no production implementation was required
```

因此：

```text
establish-action-lifecycle-domain-contract
```

已经具备进入 `review-explore` 的 proof basis。

该 PASS 只表示：

```text
“可以安全提出这个 Change 的 Proposal boundary”
```

不表示：

```text
Proposal approved
implementation complete
Verification PASS
Delivery accepted
Flowkit runtime stable
whole-manager detached acceptance complete
```

---

## Reviewer Handoff

Reviewer 应重点核对：

```text
1. 是否错误把 Action lifecycle 合并进 Change state
2. current Action identity 是否引入了不必要的第二身份 / RunId
3. single-current 是否真的由 domain shape / transition 保证
4. prepared → terminal 是否被保留
5. resumed → resumed 是否覆盖重复中断后的 exact resume
6. terminal 是否保持 absorbing，包括 terminal A → prepare A 必须 reject
7. terminal → prepare B 是否同时要求 B != A，并被严格描述为 structural allow，而非 Policy approval
8. 是否提前实现了 Run/Result persistence、Policy、OpenSpec adapter 或 CLI
9. explore.md 是否仍是 Flowkit extension，而不是 OpenSpec proposal truth
10. detached proof 是否被错误夸大为 whole-manager acceptance
11. pnpm script 的 network/store caveat 是否被如实保留
12. repo 内是否没有 production code/test Apply mutation
```
