## Why

固定 `action finish` 仍可确认成功的 Propose 或 Apply Result，随后对应 Review 却因规划未完成、必需规划文件缺失或候选文件哈希无效而无法开始。需要在首次写入 terminal 机器文件前拒绝这些不完整的新结果，同时保留 Review 对当前文件的独立复核。

## What Changes

- 对新 terminal Author `PASS` 的 `propose` / `revise-propose`，要求当前 Change 的 managed OpenSpec 规划已完成，并要求 `artifactHashes` 包含且验证 `proposal.md`、`design.md`、`tasks.md` 的精确项目根相对路径；其他已声明的合法规划路径继续逐项验证。
- 对新 terminal Author `PASS` 的 `apply` / `revise-apply`，在首次 terminal 机器文件写入前使用 `review-apply` 已有的候选文件哈希规则，拒绝缺失、无效或漂移的 `artifactHashes`。
- 保留现有 Review 入口复核、旧 Result 原始字节、Author `FAIL`、非 terminal、proof、Role、Policy 与 create-once 边界。后续文件漂移仍可阻止 Review；本 Change 不声明 finish 之后的文件不会变化。
- **BREAKING（仅无效的新成功提交）**：过去可能被 finish 接纳的上述不完整 terminal `PASS` Result 将提前被拒绝，并保留 prepared Run 供合法修正。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `stable-action-command-execution`: 将 Propose 与 Apply 的新成功 Result 候选材料准入移到 terminal 写入之前，并维持 Review 的独立重检。

## Impact

影响固定 `action finish` 的结果准入、对应的 `review-propose` / `review-apply` 交接测试，以及 `stable-action-command-execution` 规格。复用既有 managed OpenSpec observation 和哈希校验；不增加依赖、Run schema、Delivery 身份、历史迁移或自动 Review。
