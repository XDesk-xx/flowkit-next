## Why

Start 仍以 acceptedBaseCommit/全仓 clean 为前置，Final 仍在窄写后生成 Git 全仓投影并向 Integration 传递历史 Run 快照。044 已批准的 Explore 证明这些外围依赖不属于轻量 Delivery 协调职责，且已有目标窄写与当前 Full Test reader 可复用。

## What Changes

- **BREAKING**：Start 移除 acceptedBaseCommit、Git prestate receipt、candidateRef 与内嵌 fixed-point commit callback；保留 Owner 范围、目标冲突、真实 manifest 写入与读回。
- Final 从受控既有来源读取 required Changes 的 accepted archive/关联 approved review-apply，以及当前 Full Test；不重放祖先 admission，不复制 requiredEvidence 快照。
- **BREAKING**：Final 删除 finalizedCandidateRef 与旧 projection；完成状态、最小结果关联留在既有 manifest，支持跨会话读取，明确未写与已写未确认。
- 同步 Integration 的直接事实/validator/ref/source 消费；不使用 dummy SHA、空 evidence 或替代整仓摘要兼容。保留明确 Git 授权与实际对象/操作关系核验，Git 节点功能改进留下一 Change。
- 同步必要规格、测试及 Start/Final/Git HOW，保留 bootstrap/product 独立边界；不自动清理或转存证据。

## Capabilities

### New Capabilities

无；复用现有 operations、Run 保存读取、Full Test reader 与 coordination writer。

### Modified Capabilities

- `delivery-operation-execution-and-start-continuity`：Start/Final/Integration facts 与 Start 内容完成边界。
- `delivery-finalization`：相关完成事实消费、窄写、跨会话读取和失败语义。
- `repository-integration-and-next-base-continuity`：删除字段的直接消费者闭包，不把 Final 验收重新搬到 Git。

## Impact

影响 Start/Final domain、start-content、final-coordination、required-evidence、Integration validator/投影、相关测试/导出及必要 HOW。其他工程检查仍使用的 Git helper 不整模块删除；无新依赖、CLI Action 命令或 Run schema。

依据为 explore.md、044 result 的 proposalReminders 及 D05 计划“简化 Delivery 起止与完成确认”。必要材料按 Owner 已确认的 target artifacts 默认长期保留；历史 proof 不是本次实现 PASS，计划不依赖每份原始实验永久可用。

不实现下一 Change 的 PR/provider/Git 自动调用改进，不放宽 Action/Reviewer 或当前 Full Test 有效性，不恢复 Archify/外部 manager，不转换 D05 历史或执行 Git。本轮完成计划后交独立 review-propose。
