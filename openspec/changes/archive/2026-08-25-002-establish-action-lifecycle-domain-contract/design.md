## Context

参见 `proposal.md` 的 Why 与 `specs/action-lifecycle/spec.md`。当前仓库已经实现并测试 `DeliveryId`、`ChangeId`、`StandardActionId`、Owner authority 与 Delivery/Change structural state；`tests/unit/domain/state.test.ts` 还明确证明 Action lifecycle machinery 尚未存在。已批准的 `explore.md` 已通过 controlled model 固定 transition matrix，并解决了 `terminal A -> prepare A` 必须 reject、`terminal A -> prepare B` 必须要求 `B != A` 的 blocker。

本设计必须保持三个约束：第一，不把 Action lifecycle 合并进 `ChangeState`；第二，不因需要 repeat/resume 语义而提前引入 RunId/attempt identity；第三，structural transition legality 不能成为 Policy next-action authority。

## Goals / Non-Goals

**Goals:**
- 在现有 `src/domain` boundary 内新增一个小型、纯函数、serialization-friendly 的 Action lifecycle module。
- 复用既有 canonical semantic identity validators，避免第二套 Action identity truth。
- 通过单一 transition reducer 集中实现 transition matrix，避免不同 public helper 各自复制规则。
- 让 runtime malformed input 与 illegal transition 都 deterministic fail closed，并用 targeted tests 覆盖 approved Explore matrix。

**Non-Goals:**
- 不持久化 current Action，不定义 Run/Result wire format、RunId、attempt id 或 sequence。
- 不接收/验证 Result，不执行 external Agent，不建立 ActionPackage。
- 不判断 OpenSpec/Review/Verification/Owner facts 是否允许下一 Action；不编码 `explore -> review-explore -> ...` 顺序。
- 不修改现有 authority/identity formal requirements，不实现 CLI、OpenSpec adapter、mutation/Git checkpoint 或 automatic next。

## Decisions

### 1. 使用 `ActionIdentity + CurrentAction + ActionLifecycleState` 三个明确概念

新增 domain shape：

```ts
export const ACTION_LIFECYCLE_STATES = [
  "prepared",
  "resumed",
  "terminal",
] as const;

export type ActionLifecycleState =
  (typeof ACTION_LIFECYCLE_STATES)[number];

export interface ActionIdentity {
  readonly deliveryId: DeliveryId;
  readonly changeId: ChangeId;
  readonly actionId: StandardActionId;
}

export interface CurrentAction {
  readonly identity: ActionIdentity;
  readonly state: ActionLifecycleState;
}

export type CurrentActionSlot = CurrentAction | null;
```

`ActionIdentity` 只组合已经存在的三种 semantic identity；不新增 UUID、hash、RunId、attempt 或 sequence。`CurrentActionSlot` 用单 slot 直接表达 0/1 current Action，而不使用 array + length invariant。

**理由:** 该 shape 与 approved Explore 完全一致，后续 persistence 可以直接序列化普通数据，同时 occurrence identity 仍由后续 Run persistence Change 独立设计。

**拒绝的替代方案:** 把 `prepared/resumed/terminal` 加入 `ChangeState`；只用裸 `StandardActionId`；增加 `CurrentAction[]` registry；新增 action instance id。

### 2. 新增独立 `src/domain/action-lifecycle.ts`，不修改现有 state vocabulary

实现文件计划为：

```text
src/domain/action-lifecycle.ts
tests/unit/domain/action-lifecycle.test.ts
```

并只在：

```text
src/domain/index.ts
```

增加 re-export。

`state.ts` 继续只拥有 Delivery/Change structural states。Action lifecycle 单独成 module，从文件边界上防止两类状态被误视为同一个 state machine。

**理由:** 当前 `state.ts` tests 正在保护“没有 Action lifecycle machinery”的旧 boundary；本 Change 应通过新增 module 改变该能力，而不是污染已有 state literal contract。

**拒绝的替代方案:** 在 `state.ts` 同时维护 Delivery/Change/Action 三种 state 与 transition helper；创建更重的 lifecycle engine/package hierarchy。

### 3. 对 identity/state/current fact 提供 runtime validators，并按 semantic fields 比较 identity

module 提供最小 validator：

```text
isActionLifecycleState
isActionIdentity
isCurrentAction
```

`isActionIdentity` 复用现有：

```text
isSemanticId / isStandardActionId
```

或对应 canonical validators，不复制 regex/catalog。identity equality 必须逐字段比较：

```text
deliveryId
changeId
actionId
```

而不是 JavaScript object reference equality。

validator 不执行 trim、lowercase、alias resolution、默认字段补齐或 occurrence identity 生成。

**理由:** detached proof 已专门覆盖“语义相同但对象引用不同”的 same-identity 情形；按字段比较才能跨 JSON round-trip 保持稳定。

**拒绝的替代方案:** `a === b` 对象引用比较；复制一套 Standard Action catalog；通过 normalize 把 malformed fact 修成 canonical fact。

### 4. 使用一个 public pure reducer `transitionCurrentAction` 集中 transition truth

public transition API 采用单一 reducer，而不是同时暴露 `prepareCurrentAction` / `resumeCurrentAction` / `terminalCurrentAction` 三套可独立漂移的实现：

```ts
type ActionLifecycleEvent =
  | { readonly type: "prepare"; readonly identity: ActionIdentity }
  | { readonly type: "resume"; readonly identity: ActionIdentity }
  | { readonly type: "terminal"; readonly identity: ActionIdentity };

function transitionCurrentAction(
  current: unknown,
  event: unknown,
): CurrentAction | null;
```

函数在 runtime 先验证 current/event shape，再执行唯一 transition matrix。返回值约定：

```text
CurrentAction = accepted next lifecycle fact
null          = malformed input or structurally illegal transition
```

该 reducer 必须是 pure：reject 时不得 mutate 输入，调用方只能在返回非 null 时替换自己的 current slot。valid transition 从不产生 empty slot，因此 `null` 不与任何合法 next state 冲突。

**理由:** 当前 domain 已使用 `T | null` 表达 fail-closed conversion；沿用该风格比建立新的 error framework 更小。单 reducer 使所有 operation 共享同一 identity/state check，并使完整 matrix 可用 table-driven tests 锁定。

**拒绝的替代方案:** 三个互不共享 invariant 的 public mutation helper；throw 作为普通 invalid transition 控制流；在本 Change 建立 Policy-style blocked diagnosis/error taxonomy。

### 5. reducer 严格实现 approved transition matrix，不增加 idle/clear/reopen event

唯一 accepted transitions：

| current | event | target | next |
|---|---|---|---|
| empty | prepare | canonical A | `A/prepared` |
| `prepared A` | resume | A | `A/resumed` |
| `resumed A` | resume | A | `A/resumed` |
| `prepared A` | terminal | A | `A/terminal` |
| `resumed A` | terminal | A | `A/terminal` |
| `terminal A` | prepare | canonical B, `B != A` | `B/prepared` |

其余全部返回 `null`，尤其：

```text
prepared/resumed A -> prepare B
prepared/resumed A -> resume/terminal B where B != A
terminal A -> resume A/B
terminal A -> terminal A/B
terminal A -> prepare A
```

不增加：

```text
idle
clear-terminal
reopen
completed
failed
cancelled
```

**理由:** 这是 014 revise + 015 reviewer 已独立证明的最小 closed matrix；新增状态/event 都会改变 approved proposal boundary。

### 6. `terminal A -> prepare B` 只做 structural replacement，不消费 authority/Policy facts

reducer 只检查：

```text
current.state === "terminal"
B is canonical
B != A by semantic fields
```

它不接收：

```text
OwnerAuthorityFact
Review verdict
Verification evidence
OpenSpec status
next-boundary decision
```

因此它无法、也不得宣称 B 是合法 next Action。后续 Policy/CLI 在调用 reducer 前负责决定是否有资格发起 prepare；本 module 只保护 slot structural safety。

**理由:** 将 eligibility 输入排除在 API 之外，是防止本 Change 偷吃后续 Policy scope 的最直接边界。

**拒绝的替代方案:** 在 reducer 内硬编码 Standard Action 顺序；因为当前 Action terminal 就自动选择/prepare next Action。

### 7. tests 以 approved proof matrix 为核心，并保留 existing state separation regression

`tests/unit/domain/action-lifecycle.test.ts` 至少覆盖：

```text
empty -> prepare A
prepared A -> terminal A
prepared A -> resumed A
resumed A -> resumed A
resumed A -> terminal A
terminal A -> prepare A reject
terminal A -> prepare B allow when B != A
prepared/resumed replacement reject
resume/terminal identity mismatch reject
terminal resume/terminal reject
unknown state reject
unknown ActionId reject
malformed identity reject
semantic object-copy same identity behaves as same A
```

同时更新现有 state test 的最后一个断言，使它继续证明 `state.ts` 自身不拥有 Action lifecycle literals/transition machinery，而不是错误地断言整个 domain package 永远不存在 Action lifecycle capability。

**理由:** 当前 `state.test.ts` 的 regression 是对旧仓库能力缺失的证明；Apply 后应把它收窄为 module separation invariant，而不是删除边界测试。

## Risks / Trade-offs

- **[Risk]** `CurrentAction | null` 的 reject 返回没有携带诊断原因 → **Mitigation:** 本 Change 只负责 structural lifecycle；详细 blocked diagnosis 属于后续 Policy。tests 锁定每个 fail-closed case，调用方只在 non-null 时 commit next fact。
- **[Risk]** public reducer 接受 `unknown` 会比纯 TypeScript typed API 更宽 → **Mitigation:** 这是为了让 JSON/persistence 等未来 runtime input 在 domain boundary 真实 fail closed；内部成功路径仍返回强类型 `CurrentAction`。
- **[Risk]** terminal slot 保留旧 Action，而不是 clear 到 null → **Mitigation:** terminal 是可观察 completion boundary；下一 Action 用 atomic different-identity prepare replacement，避免增加 idle/clear truth。
- **[Risk]** structural prepare B 可能被调用方误当成 Policy approval → **Mitigation:** reducer API 不接收任何 authority/Policy facts，spec/design/tests 明确该 transition 只证明 structural legality。
- **[Risk]** 后续 Run persistence 可能需要 occurrence identity → **Mitigation:** 本 Change 只冻结 current semantic Action identity；Run/attempt identity 可以作为下游 durable record 的独立字段，不反向改变这里的 Action kind/target identity。

## Migration Plan

这是 Foundation 的增量 domain capability，没有既有 production Action lifecycle data 需要迁移。Apply 时新增 `action-lifecycle.ts` 与对应 test，更新 `src/domain/index.ts` re-export，并把现有 state separation test 收窄到 module boundary；不修改 runtime dependencies。若 targeted verification 失败，可回退这些文件级 mutation，而不影响已归档 authority/identity capability 或 OpenSpec truth。
