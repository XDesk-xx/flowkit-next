## Why

Flowkit-next 已有 canonical Delivery/Change/Standard Action identity 与 authority 基础，但还没有能够表达“当前正在执行哪个 Action、处于 prepared/resumed/terminal 哪个阶段”的独立 domain contract。现在必须先冻结最小、fail-closed 且可序列化的 Action lifecycle 与 single-current-Action invariant，后续 Run/Result persistence、resume、Result admission 与 Policy 才能共享同一套结构事实，而不会把 Action 状态混入 Change state 或提前发明 Run/attempt identity。

## What Changes

- 新增独立 `ActionLifecycleState` closed vocabulary：`prepared | resumed | terminal`，与 Delivery/Change structural state 分离。
- 新增 canonical current Action domain shape；identity 复用既有 `DeliveryId + ChangeId + StandardActionId`，不创建第二个 Action key、RunId 或 attempt identity。
- 固定 single-current-Action slot 为 `CurrentAction | null`，结构上只允许 0 或 1 个 current Action。
- 固定最小 structural transition contract：首次 `prepared -> terminal` 合法；`prepared -> resumed`、`resumed -> resumed`、`resumed -> terminal` 合法；resume/terminal 必须匹配 exact same canonical semantic ActionIdentity。
- 固定 terminal absorbing / replacement 边界：同 identity 的 terminal Action 不得 resume、重复 terminal 或 re-prepare；只有不同 canonical ActionIdentity 才能在 terminal slot 上进行新的 structural prepare。
- 明确 structural transition legality 不等于 Policy eligibility；`terminal A -> prepare B` 只说明 lifecycle shape 可承载 replacement，不判断 B 是否为合法下一 Action。
- 对 unknown/malformed identity、unknown lifecycle state、non-terminal replacement 与 identity mismatch 全部 fail closed，并增加 targeted domain unit tests。
- 不在本 Change 实现 Run/Result persistence、RunId/attempt identity、ActionPackage、Result admission、external execution、Policy ordering/eligibility、OpenSpec adapter、CLI、mutation/Git checkpoint 或 automatic next。

## Capabilities

### New Capabilities
- `action-lifecycle`: 定义 current Standard Action 的 canonical identity、`prepared/resumed/terminal` lifecycle state、single-current slot 与 deterministic fail-closed structural transition invariants。

### Modified Capabilities

无。

## Impact

- 预计扩展 `src/domain/` 的 lifecycle domain types / validators / pure transition helpers，并通过 `src/domain/index.ts` 暴露稳定 import boundary。
- 预计新增 `tests/unit/domain/` targeted lifecycle tests；不修改现有 authority/identity requirements 的正式语义。
- 后续 `establish-run-result-persistence`、`establish-action-package-and-result-admission`、resume terminal boundary 与 Policy Change 将消费该 contract，但本 Change 不实现这些下游能力。
- 不改变 OpenSpec formal Change authority、Owner/Reviewer/Verification authority separation、Git authority 或 Archify derived-only boundary；Delivery 01 仍由 external authority 管理。
- 不引入新的 runtime dependency、registry、background process 或 candidate self-management。
