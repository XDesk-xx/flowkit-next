## Why

当前 Flowkit 已能冻结 exact current Action、Run occurrence、role 与 authority facts，但 `ActionPackage` 仍没有与该 Action 可信绑定的 canonical HOW identity。D03 需要在不引入 Skill Registry / Router / Agent Runtime 的前提下，把 already-decided `StandardActionId` 与 exact repository-owned Action Guidance 绑定起来，使一次 bounded execution 的 HOW 也进入 existing ActionPackage identity chain。

## What Changes

- 新增 trusted Action Guidance resolution contract：从 host-owned repository root 与 already-decided `StandardActionId` deterministic 解析 `skills/actions/<actionId>/SKILL.md`，形成 canonical path + exact content identity；missing、non-regular、wrong-Action 或其他非 canonical entry 均 fail closed。
- Flowkit-managed production Action Guidance 不得 fallback 到 `.agents/skills/**`；`.agents/skills/**` 在 D03/D04 期间继续只作为 flowkit-next 自身 Author / Reviewer 的独立 bootstrap execution plane，不发生 self-hosting takeover。
- 扩展 closed `ActionPackage` contract，使其冻结 exact `GuidanceRef`，同时保持 durable `RunContextRecord` / `context.json` 与既有三文件 Run surface 不变。
- Guidance identity 纳入 existing `ActionPackageRef` projection；`ApplicableCheckExecutionInput.executionInputRef` 继续通过既有 `actionPackageRef` 链自然继承变化，不建立第二套 execution identity。
- single-Action invocation 在 exact current Action 已决定后、Agent callback 执行前完成 trusted Guidance resolution 与 package formation；Guidance 不获得 next Action、Role、Owner authority、Policy legality、Reviewer verdict 或 Verification truth 权限。
- 本 Change 只建立 binding / package contract 与对应测试，不迁移最终 Author / Reviewer Guidance bodies；`converge-author-action-guidance` 与 `converge-reviewer-action-guidance` 仍分别拥有后续 HOW convergence。

## Capabilities

### New Capabilities

- `action-guidance-execution`: 定义 already-decided Standard Action 到 canonical repository-owned Action Guidance 的 trusted deterministic binding、exact content identity、fail-closed resolution 与 execution-boundary semantics。

### Modified Capabilities

- `action-package-and-result-admission`: 扩展 ActionPackage requirement，使 exact Guidance identity 成为 closed execution package 与 existing ActionPackage identity 的一部分，同时不改变 durable RunContext persistence contract。

## Impact

- 主要影响 `src/domain` 中 Action Guidance resolution、ActionPackage formation/validation 与 single-Action invocation seam，以及 `ApplicableCheck` 对 ActionPackage 的 clone/hash projection。
- 更新对应 domain / integration tests，直接覆盖 wrong-Action substitution、missing/non-regular canonical entry、content drift、RunContext separation、ActionPackageRef / executionInputRef propagation。
- 不新增 external dependency，不修改 `context.json` / `result.json` durable schema，不新增 Standard Action、lifecycle state、Run artifact、Skill Registry、Guidance Registry、Router、Planner、Runtime 或 cache subsystem。
- 不在本 Change 中创建最终 `skills/actions/**` Author / Reviewer Guidance bodies，也不删除、变薄或替换 `.agents/skills/**` bootstrap execution plane。
