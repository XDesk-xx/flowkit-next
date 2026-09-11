# 046 Review Propose — simplify-delivery-coordination

结论：changes-requested。独立审查 045-propose；以 044-approved Explore 为边界。存在 1 项计划合同缺口，尚不能进入 Apply；不是否定已接受的解耦方向。

## R046-01 / P1：跨会话消费无法区分成功 Final 与写后未确认

定位：

- design.md:47-55：manifest 是唯一 Final record 来源；reader 只从 project/manifest 重建完成记录，成功 terminal 却要求写后读回及当前 attempt/输入复验。
- design.md:61-65：后置检查失败留下 completed，mutationStatus 仅为本次返回诊断，不持久保存确认差异。
- design.md:69：Integration 改为只从该 manifest 取得 Final record。
- delta delivery-finalization/spec.md:33-53，以及 repository-integration-and-next-base-continuity/spec.md 首项 Requirement；tasks 3.3/3.4/4.1。

合同允许的两条路径：

| 路径 | 写入后发生的事 | 持久可读输入 | 本次 Final 结果 |
| --- | --- | --- | --- |
| A | 读回及当前测试复验成功 | project + completed manifest + 五项相同关联字段 | terminal |
| B | rename 成功后，当前测试输入发生变化，或后置读回失败 | 同一 project + 同一 completed manifest + 同样关联字段 | written-unconfirmed，record=null |

这里不是实现故障注入结果，而是按 Proposal 写入顺序和闭合字段域作出的语义反例。B 的当前测试变化并不改写这些 manifest 字段；即使采用瞬时读回错误，下一会话也无法从相同磁盘记录知道当次是否完成后置验收。ownerAuthorityRef/sourceRef 来自写前授权，不是写后成功确认。

因此，满足设计中固定输入的 reader 无法同时将 A 识别为已确认完成、将 B 保留为未确认。若均返回 completed，Integration 就能把明确未产生成功 Final record 的 B 提升为可消费完成事实；若一律 unconfirmed，正常成功的 A 也无法跨会话使用。仅增加返回 enum、说明“不是新的测试 PASS”或重算局部 hash 不补充这项区分依据。

最小修正：在本 Proposal 中闭合实际完成的确认依据/提交点、必要的最小持久关联和 reader/Integration 的消费条件；明确仅写入 completed 但未确认的结果不能自动取得成功 Final 资格。补齐 rename 后读回失败、写后输入漂移，再以全新会话读回并调用 Integration preparation 的验收场景，同时证明正常成功仍可跨会话消费。具体有界实现由 Author 收敛；不要求全链复验、全仓 SHA、通用恢复系统、第二结果数据库或自动回滚，也不重开已完成 Changes。

此项对应 044 reminder 2 的既有边界，并连到 reminder 3 的直接消费者；不是新增 Change 或机会性扩展。

## 其余审查判断

- Start 删除 acceptedBaseCommit/clean/Git receipt/内嵌 commit，保留规划真实来源、固定目标、覆盖/归属/漂移检查；19 项未勾任务包含真实 unborn Git 和 dirty 对照，方向及验收路径清楚。
- required Change 集合仍来自 manifest；可信 host 选取唯一 archive/直接 approved review-apply，核对相关三文件、来源/角色/链接/完整性，来源缺失明确拒绝。全祖先 admission 不再由 Final 重演；普通 caller 不能自签完成。这是有界来源依赖，不要求建立 Registry。
- 当前 Full Test 的 attempt、真实完整 PASS、输入/材料完整性及失败不回用旧 PASS 保持；持久保留不等于永久有效。
- Integration 删除旧 Final 全包/requiredEvidence/finalizedCandidateRef 的直接闭包有明确字段、ref、validator 与 Git 操作负例；完整 Git 节点改进留下一 Change。R046-01 修复前不能把这一消费者单独视为 Apply-ready。

当前步骤解释：本轮只审规划是否忠于 approved Explore、可实现且可验收，没有改 Author artifacts 或运行新实现。

复杂度/最小性：沿用 operations、局部 source-range writer、现有 Run owner 与 Full Test reader；无新平台、泛化 adapter、自动恢复或长期额外快照。缺口是现有完成语义尚未闭合，不是需要扩大架构。

新内容/范围漂移：未发现独立 scope drift。HOW/导出/fixtures/Integration 的必要同步属于本次删除字段的闭包。

## 当前证据与限制

本轮自有 verify-review.mjs 核对 23 个必要来源/规划/原始输出引用，bytes/SHA 均一致；三个 delta 的 12 MODIFIED、1 ADDED、1 REMOVED 标题与主规格对应，19 项任务均未勾。逐项人工审读 proposal/design/tasks/三份 delta、当前主规格及相关源码/Owner 交接。

OpenSpec 1.10.0 的 version/status/strict validate 均 exit 0，规划结构完整。首次 sandbox spawn EPERM 保留在 attempt-01；经批准原样在 attempt-02 完成，只变更输出 attempt。结构有效不是语义批准，不采纳工具输出中的自动 Apply 建议。

本轮没有新实现、生产测试、Linux 验收、实际 D05 Formal Full Test/Final、Archive 或 Git mutation；上述反例是合同分析，不冒称 runtime reproduction。Reviewer 自有材料位于本 Run proof 目录，正式执行仍使用独立 bootstrap Skill，不消费 candidate Reviewer HOW。

## 交接 / STOP

交 Author revise-propose，针对 R046-01 在原规划中最小收敛后再独立 review-propose；不执行 revise/apply，不覆盖 045 或 044。必要材料按 Owner 已确认的 target artifacts 默认长期保留。Review verdict、OpenSpec 结构校验均不产生 Owner/Git authority。

