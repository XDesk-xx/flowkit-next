# Review Apply 081 — 基于 080 补审 079

Owner 明确授权：`那现在就是 owner 授权 在080 基础上 补审，审查 079`。精确输入为 `20260907-079-revise-apply`，沿用 `074-review-propose` 批准合同，补充 `080-review-apply` 的审查范围。Change `correct-delivery-content-continuity`，`projectOrdinal: 32`。

结论：`changes-requested`。原 `001–007` 保持闭合，新增两个阻断 finding。079 候选与 080 审查时一致；080 三文件原样保留。本次结论修正该候选当前整体 approval/archive readiness，不废弃历史检查及已闭合项。

## 新增 findings

- `D04-RA007-008 / P2`：Integration preparation 仍无条件要求 accepted base 同为 HEAD/target 的 ancestor（`delivery-repository-integration-execution.ts:230–235`）。新建 Git fixture 中，仅将 HEAD 或 target 换成同 tree 的不同历史对象，再以匹配的明确操作/prestate/source 重新 preparation，内容不变且独立授权校验通过，仍在读取来源前返回 null。违反 Integration delta 的 accepted-base provenance 条款及 design D6/tasks 5.4。应核验 exact base object/可信接受来源，取消通用共同祖先门槛；保留具体操作 topology、旧 invocation prestate 漂移和内容/证据拒绝。
- `D04-RA007-009 / P2`：对象字段顺序仍影响 Start/Integration 的语义比较。只重排相同 artifact ref 字段，Start 从 terminal 变为内容拒绝；只重排相同 reuse-existing operation，Integration preparation、record、acceptance source 拒绝，且两个结构有效同值 package 派生不同 Integration ref。落点为 Start 的 `sameArtifactRefs`、Integration source 的 `sameOperation` 及 ref/record 消费者。按 D3/D6/D7 和固定 projection 合同统一重建已有语义字段；保留真实值、未知字段与有序数组差异的拒绝。不是新增 canonical-JSON 框架，也不重开已修好的 Final requiredEvidence finding 006。

Exact source 行号/hash、决定性观察及最小回归要求见 context；两类缺口均可在当前批准 Change 内修正，无需返回 Explore/Proposal 或另建 Change。

## 验证与保持

本轮独立重跑 080 原脚本的 15 项诊断，以及六文件 39/39 回归（零失败/skip）；typecheck、OpenSpec 1.10.0 当前 Change strict、git diff check 通过。081 新诊断成功复现上述缺陷及正例，不能解释成产品合同 PASS。原 7 项闭合保持，其中 005 的具体操作 parent 检查与 006 的 Final 固定投影不受新 findings 否定。

1480 个受保护文件在检查前后 hash 快照相同；079/080 candidate、上游 Run 与计划绑定匹配。本次没有重跑完整 domain/acceptance/build/gates/Linux，不将 080 历史真实检查冒充本轮执行。所有 Git mutation 仅在新建隔离 fixture，未操作项目 Git。模拟 managed-tool/source fixture 只验证产品接缝，不代表真实 D04 Formal Full Test。

临时诊断曾有历史 Result 字段、内部导入和测试路径的接线错误；按调试 Skill 定位后仅修正 .tmp/命令，完整重跑，失败尝试未记为 PASS。Owner 已授权原始 Explore proof 移至 .tmp 且不长期保留，相关结论保持；本次不增加永久保存临时 proof 的义务。

复杂度：两个既有合同遗漏的有界修正，无新层/Registry/平台。范围漂移：`NONE`。D05 roots/host/恢复项及 D04 真实 Full Test 前外部证据保存/取回 proof 仍保留原有未来边界。

## 交接 / STOP

按独立 `.agents/skills/review-apply/SKILL.md` 执行，不使用 candidate Review Apply Guidance 自证；此记录是实际独立 D04 bootstrap Review，不冒充 canonical Runtime admission。

当前 `archiveAllowed=false`；正常交接事实为 `revise-apply`。仅新增 081 三文件及可丢弃诊断，不改 Author/历史 Run，不自动修订、archive、Full Test、commit 或执行下一 Action。STOP。
