## Why

完整的 prepared revise Author Run 已保存结果，却无法在明确 Owner 授权下启动同阶段的新 occurrence，导致多轮 Apply 停在可查询、不可继续的状态。同时，历史链把 prepared reuse 的默认 READY 当成同名后继权限，可能跳过 Owner 核对；两处需要采用一致的续跑合同。

## What Changes

- 允许 active Change 的完整、合法 prepared Author Run 经匹配的现有 revise-action Owner authority 创建新的同阶段 revise occurrence；新增 same identity 边仅覆盖 revise-explore、revise-propose、revise-apply。
- 保留旧三文件、Proof、prepared state 和 null outcome；新 Run 使用独立 occurrence、直接 previousRunId 和既有唯一序号分配。允许连续多轮，但每次 invocation 仍只处理一个 Action并 STOP。
- start、finish、inspect 与历史链共同核对 exact parent、Owner 和 Policy/结构边；默认 prepared reuse 查询不授权新 occurrence。
- **BREAKING**：同名 prepared revise 后继的历史读回必须验证匹配的 Owner correction；此前链解析接受的无授权或错误 scope 边将被拒绝，不修改旧 bytes，也不增加迁移例外。普通 prepared Author 的既有历史读取 fixture 保持兼容，固定入口不新增普通同名 Action start。
- 保留现有 Guidance bytes，使升级候选仍可只读检查原完整 prepared Run；terminal PASS 仍执行原候选准入并交给独立 Review。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- action-lifecycle：有界 prepared supersession 支持同名 revise 的新 occurrence，维持 single-current 和 closed states。
- policy-and-next-boundary：区分 normal prepared reuse 与 exact Owner correction 后的新 occurrence，结构可进入性支持三个同名 revise。
- run-result-persistence：同名 prepared revise 后继必须具有合法 correction edge、唯一直接父链和不可变前序。
- stable-action-command-execution：固定 start/finish/inspect 一致处理多轮 prepared 续跑，并保持旧 descriptor Guidance 兼容。

## Impact

预计影响现有 Action lifecycle、Policy、current-run-chain 及既有 CLI 重建消费者；复用 OwnerAuthorityFact、RunContextRecord 和 ActionPackage，不新增依赖、字段、Standard Action、Owner decision、状态、命令或通用 retry engine。必要说明置于 specs/onboarding，产品 skills/actions 原字节保持不变。

范围依据为 explore.md 的 E01–E03、Owner 对窄续跑修复的明确要求及现有主合同。Explore 证据是拒绝路径的基线，不是实现 PASS；当前直接 OpenSpec Propose 不建立 Flowkit Run，也不声称独立 Reviewer 批准。

本 Change 不修改 LearningPlatform 或创建其 Run 016，不实现 B 的业务功能，不扩大容量修复，不自动执行 Review、Archive、commit/push 或更新 manager。manager 安装与原项目续跑按各自后续边界执行。
