## Why

Archify 当前通过固定图输出、operation、doctor、Final 与共享证据消费者成为交付前置，超出了 Flowkit 流程管理软件的责任。Owner 已选择让 Archify 退出交付合同；`002-review-explore` 已批准本 Change 的直接退役边界，现在应移除这组依赖，为后续管理软件分根避免搬迁即将退役的资产。

## What Changes

- **BREAKING**：删除 `delivery-architecture-finalization` 活动 operation、专属 Guidance、适配器、导出和仅服务该能力的产品资产，不保留 optional/skip/空成功占位。
- **BREAKING**：Start 固定产物由 manifest 加三个图收敛为 manifest，去掉 Archify checks 与 Previous-Actual 前置；保留其余当前 Start 内容验证、Git prestate 和独立提交权限。
- **BREAKING**：Final preparation/facts/record、required evidence/source、coordination 和 Integration 同步移除架构字段及来源调用，Final 直接接续真实 passed Full Test candidate。
- **BREAKING**：产品 managed tool 仅保留 exact OpenSpec；doctor 不再解析或报告 Archify，产品不再携带 Archify 专属 Skill/vendor。
- 保留历史 Run、archive、Delivery manifest 和图的原始 bytes/类型；新执行拒绝旧架构字段，历史读取不等于新合同接纳。不卸载用户独立 Archify runtime/Skill。
- 同步受影响的活动 specs、HOW、AGENTS/README 和测试；保留 650 行源码 gate、非架构失败检查及独立 Reviewer/Owner/Git 边界。

## Capabilities

### New Capabilities

无。使用现有能力归属，不新增平台或管理实体。

### Modified Capabilities

- `delivery-operation-execution-and-start-continuity`：四值 operation 集合、无图 Start、无架构 Final package。
- `architecture-and-canonical-diagram-continuity`：退役活动 Architecture Finalization 合同，保留历史与独立绘图边界。
- `delivery-finalization`：直接 Full Test → Final 接续、去架构的证据形状与确定性 projection。
- `repository-integration-and-next-base-continuity`：消费新 Final/必要证据时不要求或读取架构来源，既有 Git 合同不变。
- `managed-toolchain-resolution`：仅支持 OpenSpec，退役产品 Archify 依赖而不处理用户安装。
- `foundation-cli-surface`：doctor 仅保留 OpenSpec runtime/root diagnostics，不提供 Archify 入口。

## Impact

涉及 `src/domain/delivery-operation-execution.ts`、Start content、六个 Architecture 专属模块、Final/required-evidence/coordination/Integration 直接消费者、managed-tool/CLI 与导出；配置及资产涉及 `config/tools/toolchain.lock.json`、`skills/delivery/**`、`skills/tools/archify/`、`skills/vendors/archify/`。仅同步 `.agents/skills/**` 中确有活动架构依赖的条款，不让产品读取 bootstrap HOW。

决策依据为 [Explore](explore.md) 与独立 `20260908-002-review-explore` 的 approved verdict；59/59 是旧合同局部基线，不是本 Change 实现 PASS。Owner 的必要 proof 长期保留决定继续有效：材料在本项目 `.flowkit/artifacts/`，不只引用 `.tmp`，不覆盖旧执行。本次不新增产品保存机制，也不要求后续重演全部原始实验。

不纳入：manager/target 分根、Agent 宿主接通、Full Test 排除配置或 current-attempt 存储实现、取消 Start acceptedBaseCommit/clean、整仓 candidate 与完整证据链的通用简化、实际 Git 调用。这些保留给其余五个 planned Change；本次只取消架构直接依赖，不宣称完成整个 D05 解耦。

本轮只写计划、记录真实 `003-propose` 并交接独立 `review-propose`；不执行 Apply、绘图、卸载、历史迁移或 Git mutation。
