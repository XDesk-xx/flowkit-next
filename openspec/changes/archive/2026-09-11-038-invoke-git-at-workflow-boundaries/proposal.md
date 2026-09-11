## Why

D05 已将 Start/Final 与架构、全仓产品摘要解耦，但 Git Integration 仍无条件要求固定 parent/count 和全仓 clean；054 Explore、055 独立审查还确认，限定 git add 路径并不能防止夹带已有范围外暂存内容。本 Change 将 Git 收敛为按 Owner 明确操作执行的外部工具节点，补齐实际宿主范围核对和部分成功交接。

## What Changes

- 固定受支持接入为已有 Agent 的终端执行能力及随 manager 交付的最小 Node 宿主参考模块；普通 checkpoint/push 与 Delivery Integration 分开，CLI status/next/doctor 和 checkpoint evaluator 仍只读。
- **BREAKING**：Integration 的 create-new 操作显式绑定提交路径、消息及可空的 Owner 指定提交形状；取消无条件全仓 clean 和单普通 commit 约束，同步 source、package、record/ref/validator 和 HOW。复用仍绑定授权 exact 对象，不新增提交。
- 实际 commit 前核对整个 index，范围外 staged 或真实冲突须先报告并 STOP，不夹带、不擅自 unstage；无关未暂存/未跟踪内容保留。
- 复用现有 Git helper 和真实来源；失败只读确认已发生效果。未完成 PR/merge 允许有界人工交接，不假报 terminal，不盲重试或回写 SHA 再 commit。
- 当前已确认 Final、必要相关材料完整性、Owner Git 权限与独立 OpenSpec Action 均保持。不存在“放宽规则就授权额外 squash/rebase/多提交”。

## Capabilities

### New Capabilities

无。沿用既有 Git/Integration 能力，不创建通用 Git 管理子系统。

### Modified Capabilities

- `repository-integration-and-next-base-continuity`：明确普通 Git 节点宿主、提交范围、按授权形状、真实远端读回和部分成功交接。
- `delivery-operation-execution-and-start-continuity`：同步 Integration closed checkpointOperation 及其来源绑定；其他 Delivery operations 不变。

## Impact

- 相关 integration execution/operation/source/ref/Git helper、直接 exports/validators 与 focused tests；必要时按职责拆分，src/tests 遵守现有 650 行 gate，不压行或放宽。
- `skills/delivery/repository-integration/SKILL.md` 及其最小宿主 reference，Start/Final/Action HOW 仅补普通 Git 节点的必要引用，不改它们的生命周期。必要仓库 AGENTS HOW 同步在 Apply 执行，本轮不改。
- 不新增依赖、Provider Registry、策略 DSL、远端平台、结果库、Git Run、自动循环、历史迁移或安装服务；不改 Full Test 配置、Archify、OpenSpec/Policy/Run schema。
- 依据：当前 `explore.md` 与 055-review-explore#proposalReminders。Explore 实验仅为已接受决策依据，Apply 另产当前实现验收，覆盖 Windows 实际 Git、Linux 适用回归及 manager/target 分根宿主示例；真实公网 PR 不作为必须支持的原生 provider。
