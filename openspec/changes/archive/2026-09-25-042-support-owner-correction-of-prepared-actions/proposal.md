## Why

真实项目中，Author 的 `apply` 已开始并留下合法 `prepared` Run，但人工 UI 验收前发现需要回到 Proposal。当前 Policy 拒绝对 prepared Action 的 Owner correction，生命周期也不能进入不同的 revise Action；Owner 因此无法在保留已做工作与真实未完成状态的同时纠正方向。

## What Changes

- 允许 active Change 的当前 `prepared` Author Action 在精确 `revise-action` Owner 授权下，选择当前阶段或更早阶段的既有 revise Action；同阶段 revise 也合法。无 correction 时仍继续原 prepared Action。
- 定义有界的 prepared-to-revise supersession：保留旧 Run、Result、proof 原字节和 null outcome；新 revise 使用新 occurrence、`previousRunId` 与精确 Owner authority，成为唯一当前 tip。`prepared/terminal` 状态集不变。
- 约束 Action 开始顺序与失败处理：校验和准备失败不替换旧 current；新 occurrence 部分写入时保留 partial、报告并停止，不自动恢复或补成功。新 revise 完成后仍按正常独立 Review 边界继续。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `policy-and-next-boundary`：扩展 prepared Author 的 exact Owner correction eligibility 和 READY structural enterability。
- `action-lifecycle`：增加不改变状态集的有界 prepared supersession structural transition。
- `single-action-execution-terminal-boundary`：定义授权目标的准备、提交和失败顺序。
- `run-result-persistence`：定义旧 prepared Run 与新 Owner-linked revise occurrence 的不可覆盖链和唯一 current tip。

## Impact

涉及 Policy、Action lifecycle、Agent Action start 与 canonical Run-chain 读取，以及相应单元/集成测试。LearningPlatform `20260924-089-apply` 仅是只读问题基线；本 Change 不修改它、不自动重演工作、不新增 Owner 授权类型或 Git 权限，也不让 candidate CLI 接管当前 Delivery。
