## Context

见 `proposal.md`。当前 Core 已有：

- `ActionIdentity` / `CurrentAction` 与 `prepared | resumed | terminal` lifecycle；
- `ActionExecutionRole` / `OwnerAuthorityFact`；
- `RunOccurrence` / canonical runId；
- `RunContextRecord` / `RunResultRecord` 的 exact structural validation 与 Run↔Result linkage。

本 Change 只需要在这些已有事实之上增加一个 execution package 与纯 admission seam。Explore 036→040 以及 041 review-explore 已证明两个 freshness 条件必须同时存在：package state 必须等于 exact current Action state，package runId 必须等于 exact current Run occurrence runId。

## Goals / Non-Goals

**Goals:**

- 复用既有 canonical types，形成最小 closed ActionPackage。
- 固定 Standard Action → Author/Reviewer execution-role mapping。
- 用纯、fail-closed admission 校验 exact Action / state / Run occurrence / Result linkage / outcome authority slot。
- 保持 admission 与 persistence、Policy、resume/terminal orchestration 分离。

**Non-Goals:**

- 新 PackageId / ResultId、nonce、replay registry、locking/WAL。
- provider/Agent registry、transport protocol、scheduler 或 automatic-next。
- 修改 `previousRunId` 的 predecessor provenance 语义。
- 把 Run identity 嵌入 `CurrentAction` 或建立 global current-Run registry。
- Policy legality、terminal transition、resume/STOP composition、Verification orchestration。

## Decisions

### 1. ActionPackage 组合既有 canonical facts，不复制 domain model

新增一个 serialization-safe plain-data `ActionPackage` seam，其字段直接使用现有 `RunOccurrence`、`ActionIdentity`、`ActionExecutionRole`、`ActionLifecycleState`、`OwnerAuthorityFact` 与 `previousRunId` 表达。

同时新增一个最小纯 formation operation（实现名不作为 contract；例如 `formActionPackage`）：输入已经由现有 validator 接受的 exact `CurrentAction` 与 current `RunContextRecord`，先确认 context ActionIdentity == current identity、context lifecycleState == current state 且 state ∈ `prepared | resumed`，并确认 context role == 该 Standard Action 的 closed expected execution role，再把 context 的 runId/occurrence、expected role、authority/previousRunId 与 current state 冻结为 closed ActionPackage。任何 mismatch、terminal state 或 null lifecycle state 均返回 fail-closed failure；该 operation 不读取 persistence、不计算 Policy、不调用 executor。

ActionPackage 自身不需要独立 UUID：当前 single-writer/single-current-Action 模型已经通过 canonical Run occurrence 区分同一 semantic Action 的重复 execution。

**Alternatives considered:**

- 新增 PackageId / ResultId：拒绝。对当前 correlation 没有额外 contract 价值，只会产生第二套 identity。
- 把 `previousRunId` 改成 `inputRunId`：拒绝。它仍是 predecessor provenance，不等于完整 execution input。

### 2. current Run occurrence 作为 admission 的显式窄输入

admission 接受三类已验证输入：ActionPackage、exact `CurrentAction`、exact current `RunOccurrence`（或等价 canonical runId fact），再接收 candidate Result。

不修改 `CurrentAction` 去嵌入 Run identity，也不建立 registry。这样 freshness proof 可以使用第三个 Change 已有 Run identity，同时保持 action lifecycle contract 独立。

**Alternatives considered:**

- 只比较 ActionIdentity + lifecycle state：拒绝，039 proof 已证明旧同 Action occurrence 会漏过。
- 在 `CurrentAction` 中增加 runId：拒绝，会把 lifecycle 与 persistence identity 不必要地耦合。

### 3. execution-role mapping 使用 closed Standard Action mapping

用一个小型纯函数/closed mapping 返回 expected `ActionExecutionRole`。它只回答“谁执行该 Standard Action”，不回答“当前是否允许执行它”。

不创建 dynamic registry。

### 4. Result admission 为 pure fail-closed function

admission 按固定顺序验证：

1. package / current Action / current Run / candidate Result 结构合法；
2. package state 与 current state 均为 `prepared | resumed` 且相等；
3. ActionIdentity exact match；
4. package runId 与 exact current Run runId match；
5. candidate Result runId / ActionIdentity 与 package exact match；
6. package role 等于该 Standard Action 的 expected role；
7. Author/Reviewer outcome slot ownership 正确；
8. `verificationVerdict` 对 Standard Action 必须未适用。

成功只返回 admitted Result（或等价成功值）；失败返回 fail-closed 结果。函数不写 persistence、不 terminalize、不计算 Policy。

### 5. `nextBoundary` 仍是 opaque Result data

admission 只依赖现有 Result structural validity，不解释 `nextBoundary` 是否 legal。Policy Change 后续拥有 legal-boundary decision。

## Risks / Trade-offs

- **[Risk] exact current Run occurrence 由 caller 提供，caller 可能传错事实** → admission 对 package/current Run/Action 三方做 exact linkage；current-run fact 的获取/编排由后续 execution boundary 负责，不在这里创建 registry。
- **[Risk] role mapping 被误用成 Policy ordering** → API/测试只暴露 execution ownership，不提供 next-action decision。
- **[Trade-off] 不做 distributed replay protection** → 当前模型明确是 single-current-Action/single-writer；stale state + stale occurrence 两类已证明风险由 exact comparisons 关闭，分布式 replay 留在 non-goal。

## Migration Plan

无历史数据迁移。新增 domain seam 与单元测试即可；既有 Run/Result persistence bytes、canonical specs 和历史 Runs 不改写。
