# 044 review-explore

## 结论

审查对象：`20260909-043-explore` / `simplify-delivery-coordination` / projectOrdinal 37。

Verdict：**approved**，无 finding，无阻断性未知，具备进入 Propose 的条件。批准的是有界 Explore 结论，不是新实现、Verification/Full Test PASS、Delivery Final 或 Git authority。

## 证据与事实判断

- 已核对 manifest 当前激活、Owner sourceRef、两项依赖 completed、042 archive/041 accepted review 与当前相关主规范。OpenSpec 1.10.0 只读查询显示唯一活动 Change 为本 Change，尚无 tasks；没有把最大的目录号当作执行授权。
- 独立重跑 043 方法，只有输出目录参数改为本轮自有 attempt；7 项观察及 7 份源码身份与 Author 记录一致。31 个相关引用的 bytes/hash 已核对。首次 Reviewer sandbox EPERM 与获准原样重跑均保留。
- Start clean 对照可形成 package，dirty/null HEAD/不同 HEAD 的 callback 对照被拒绝；源码另证 content completion、validation 与 commit callback 中的 Git 依赖。因此只改 HOW 或令 acceptedBaseCommit optional 不足以解耦。
- Final 的状态写入先于 Git candidate 派生；required-evidence-source 对传入必要链逐个重建 package/admission 并沿 previousRunId 追溯。Explore 对这些事实表述准确，没有宣称扫描了全部原始 proof，也没有把源码顺序当成已经注入写后失败。
- 实际内部 writer 对已改变的目标 prestate 拒绝并保留变化；正常写入保持受检注释/非目标尾部。这证明可复用的局部写入 seam，不是并发事务/全入口 Final 成功证明。
- Integration 的 prepare、record/ref、pre/post object 验证均直接消费 finalizedCandidateRef / requiredEvidence；Explore 已将必要同步纳入当前 Change，未把全部 Git transport/PR/merge 改进提前纳入。

## 最小性与范围

当前步骤：独立 review-explore，审查真实问题、可复用能力、必要生产者/消费者边界与 Proposal readiness。

复杂度 / 最小性：复用既有 operation、项目/manifest/OpenSpec/Run 事实读取、当前 Full Test reader 与 source-range writer。删除外围重复证据快照和 Git 身份连锁，不新增 Registry、完成事实数据库、EvidenceStore、Delivery Run 或自动恢复平台，方向足够小。

新内容 / scope drift：**NONE**。Start 内容 receipt、Final 写后失败语义、直接 Integration 适配均为本 Change 目标所必需。严格 Action 链和 Full Test 当前尝试规则保持；后续 Git 调用 Change 不提前实现。Memo 仍是未来考虑项，不追加新的 Start SHA 准入。

## Propose 必须落定的既有边界

以下是 Explore 已确定方向的合同细化，不是新增 finding 或额外 Change：

1. 完成事实从现有受控来源定位，明确 required IDs、唯一 archive 终点、关联 approved review-apply、项目/Delivery/Change/Role/verdict/linkage 和必要材料校验；不能把 caller 布尔值、hash 或 `readDurableRun` 的结构合法本身当作已接纳来源。无需外围再跑所有祖先 admission，也不得为省事削弱 Action 自身完整性。
2. 固定 Start/Final 的最小输入、返回/持久事实与跨会话读回；明确未写入、已写入但未确认的区别，以及写后当前输入/材料失效的报告方式。保留真实目标冲突与非目标 bytes，不自动回滚或新建恢复状态机。
3. 在同一 Proposal 同步被删除字段的直接 Integration validator/ref/source 消费者；不能用 dummy SHA、空 evidence 或新增整仓 hash 冒充兼容。Git 具体授权、操作与结果核对保持其自身边界，后续调用功能另行推进。

## 验证限制与交接

本次为 Windows Node 22.23.2 的有界 callback/内部 writer proof 和源码核对；没有 native unborn Git 全入口、完整 Final、Linux 新实现或正式 D05 Full Test 验收。上述行为应在 Apply 按批准合同验证；当前无需为显式非目标补做穷举实验。

前后 tracked/nonignored untracked 文件与删除标记摘要、HEAD 相同（仅排除本轮 Reviewer Run/proof），Author production/tests/specs/Skills/manifest/历史未被本轮修改。

后续边界为 `propose`，本轮不执行。当前方案简言之：Start 只建立交付上下文并检查自身目标冲突；Final 读取 required Changes 的可信完成事实和当前有效测试，再窄写完成状态；Git 独立授权，证据留在原有 target artifacts，既不复制成外围通行证，也不做历史清理。保存本次结果后 STOP。
