## Why

A/B 已提供固定的 Action 与 Delivery/support 命令，但当前有效的自有 Delivery Skill 和部分接入指导仍要求直接调用内部模块、动态导入或回调。独立角色可能依旧生成临时生命周期程序；本 Run 的正式 proof 文件若未全部声明，也会到 Git checkpoint 才暴露冲突。C 按已批准的 Explore 收敛发行 HOW，保留真实角色判断、证据和权限边界。

## What Changes

- 逐项核对十个 Action Skill、Delivery Skills 及有效 references、自有 OpenSpec Tool Skill、README、`src/README.md`、onboarding、CLI help/示例、AGENTS 当前入口和直接冲突的现行 spec；保留已有正确指引，修正或退役仍指向旧宿主调用的当前指引。
- 正常操作的 HOW 统一指向同一选定安装的固定封闭数据命令，明确真实请求字段、可见目标、返回效果、部分成功和每个操作后的 STOP；Agent 仍负责识别 Owner 意图、角色和业务判断。
- 明确本 Run 正式 proof 目录内全部文件须在所属 Result 的 `proofRefs` 中声明并核对 bytes/SHA；后续 Action 的 handoff 仅携带当前判断需要的引用。可丢弃请求放 `.tmp`，不以备份提交代替正式 proof 声明。
- 保留独立 Review、适用验证、OpenSpec 权威、外部 Stable manager、历史 Run/proof 与 vendor 原始字节。C 不修改 B 的命令语义或 D 的 TypeScript/证据机器检查。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `action-guidance-execution`：使当前自有 Action HOW 与固定 Action 入口一致，并明确生产者的本 Run proof 完整声明和按需交接边界。
- `stable-delivery-support-command-execution`：使 Delivery、Git 等自有 HOW 与已发行的固定支持命令、实际数据请求和失败/读回语义一致。

## Impact

主要影响发行资产 `skills/actions/**`、`skills/delivery/**`、`skills/tools/openspec/SKILL.md`、`docs/onboarding.md`、`README.md`、`src/README.md`、CLI help/有效示例与 `AGENTS.md` 中仍描述旧路径的当前条款；只修改确有差异的文件。`.agents/skills/**` 是本 Delivery 仍使用的独立 bootstrap 执行指引，生产源码不读取它们，本 Change 不让候选 HOW 取代该来源。`skills/vendors/openspec/**`、历史 `.flowkit/**`、归档 Change 和 B 的本地备份不迁移、不重签。机器强制的 proof 目录闭合集、语言与权限规则留给 D。
