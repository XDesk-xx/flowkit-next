## Why

现有代码把 manager 的系统 Guidance/工具 lock 与 target 项目放在同一个根解析，普通项目因此被迫复制 Flowkit 资产，同名项目文件还能改变系统解析结果。已批准的 `008-explore → 009-review-explore` 确认：分开安装资产根与项目工作根即可解决该问题，无需新建管理平台。

## What Changes

- manager 从自身安装定位代码、系统 Guidance 和 OpenSpec exact 版本约定；target 的代码、OpenSpec、协调状态、Runs、必要 artifacts、测试配置和工作文件留在 target。
- **BREAKING**：系统资产不再从 target `skills/**` 或 `config/tools/toolchain.lock.json` 解析；低层资产解析及直接调用接口改为显式 manager 归属，不保留同根 fallback。CLI 的 `repositoryRoot` 字段仍表示 target，既有请求和命令集合不扩张。
- OpenSpec executable 仍来自 `FLOWKIT_HOME/tools`，只读命令 cwd/returned-root 校验指向 target；所需工具缺失按原诊断处理，不在无关路径检查工具。
- Action 与四个 Delivery operation 的 Guidance prepare/read 同步分根，保留固定路径、内容绑定、既有权限和生命周期语义。
- 定义最小可安装发行内容，实际安装后在无 Flowkit 开发布局的项目上验收，并验证安装移位、同名资产冲突与项目数据归属。
- 同步活动 HOW、README 与 AGENTS 中安装身份/根归属的冲突说明；D05 自开发继续独立 bootstrap，不迁移旧 Runs 或恢复外部 manager。

## Capabilities

### New Capabilities

无。使用既有 resolver、Guidance、OpenSpec observation 和 CLI/发行能力。

### Modified Capabilities

- `managed-toolchain-resolution`：工具约定由 manager 安装持有，target 同名 lock 不参与解析。
- `action-guidance-execution`：Action Guidance 相对 manager 安装根解析与消费，不从 target/bootstrap fallback。
- `delivery-operation-execution-and-start-continuity`：四个 operation 的 Guidance prepare/read 使用同一 manager 安装来源；项目事实根不变。
- `openspec-thin-integration`：manager 工具 identity 与 target child cwd 分离，维持 exact-root 和两种只读观察。
- `foundation-cli-surface`：安装入口拥有系统资产根，提供最小独立安装布局，target 不依赖 Flowkit scripts/lock/Skills。

## Impact

影响 managed resolver、Action/Delivery Guidance、single Action 调用接点、四个 Delivery operation 的直接调用、OpenSpec adapter、CLI 入口、package 发行配置及对应测试/HOW。无需新生产依赖、Registry、配置发现器或身份数据库；不改 ActionPackage/Run/Result/Policy schema。

不包含 Action 宿主接入、current 自动定位、Full Test 命令/范围/保存协议、Start 去 commit 条件、Final 简化、Git 调用、Archify 或历史迁移。它们保持 D05 后续 Change 的既定归属。

Owner 材料边界沿用：必要 proof 在 target `.flowkit/artifacts/` 默认长期保存，`.tmp` 只存可丢弃材料；原始日志不执行源码格式 gate。已接受依据是 Explore 结论与 `009-review-explore`，不是长期依赖每份原始实验，更不是未来 Apply 的验收 PASS。本轮只生成计划，完成后独立 `review-propose` 并 STOP。
