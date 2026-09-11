# 055 review-explore — invoke-git-at-workflow-boundaries

结论：approved。054 Explore 的目标、现行事实、决定性 proof 和非目标边界充分，可进入 Propose；无 finding、无阻断未知项。这不是批准新 Git 合同或实现验收，当前 clean/parent/count 规则仍是现行合同，不能在 Proposal 批准前直接绕过。

## 审查依据与事实

目标为 D05 最后一个 Change、projectOrdinal 38。核对 054 的显式 Owner 激活来源、manifest 唯一目标及 completed 依赖、053 archive / 052 approved 前序交接；当前 HEAD 与研究来源一致。既有 SHA 只定位此次源码，不作为 Start、安装或新 Git 操作授权。

76 个相关引用已逐项核对可读性、长度与摘要，覆盖 Explore、Run、原始命令材料、source-index 和相关主规范。当前正式 Change 只有 .openspec.yaml / explore.md；OpenSpec 1.10.0 的真实只读 status 确认 Proposal 尚未形成。活动 manifest 相对 HEAD 的语义差异只有本次 Change 激活、ordinal 与对应 Owner 来源；未修改生产、测试、Skills 或主规范。

源码对应清楚：integration execution :473/:475 约束 parent/count，:492 要求全仓 clean；失败分支 :297 读回实际 Git effects。现有 source 能力负责可信宿主授权/接受来源，不是原生远端平台；checkpoint evaluator 和 CLI 仍只读。

## 独立决定性复现

读取并检查 Author 两个 proof 脚本后，只重定向到 Reviewer 自有证据与 .tmp/d05-055-review-git 隔离仓库，真实重跑；未覆盖 054 输出。

- 当前 Integration 八场景均复现：clean 正常；无关 untracked / reuse dirty 被拒绝；两个 commit 被现行形状规则拒绝；原有范围外 staged 被 callback 的普通 commit 带入并 terminal；commit 响应丢失读回真实 HEAD 且不调用 provider；provider pending 不冒充成功；无权限没有 mutation callback。
- 原生 Git 十八条命令验证：按指定文件提交并保留无关文件、对不存在本地 remote 的 push 真实失败且 commit 保留、另一个明确的本地 bare remote push/ls-remote 实际对应、无额外回写 SHA commit；可发现范围外 index 条目并停止，不擅自 unstage。
- OpenSpec exact version 与当前 status 加上两项 proof，四个 Reviewer 命令均 exit 0。原始 stdout/stderr、时间、退出码与完整观察已保存在本轮 artifacts。
- proof 中的“通过”表示上述现行行为得到复现，不表示全仓 clean/范围问题已被修复。已保留 Author 初始 sandbox EPERM 失败及后续获准成功尝试；本轮依据已知限制获准直接在沙箱外执行。

Git mutation 只发生于隔离 fixture 与本地 bare remote。合成 Final/Owner/acceptance source 不声称真实独立 Review、Full Test 或 provider 接受。没有测试真实网络、凭据或 PR/merge，没有执行产品回归全集或实际 D05 Full Test；这些不属于此次决定性 Explore proof 的必需范围。

## 必要评估

当前步骤：独立 review-explore，验证 054 提出的改动为什么需要、由谁执行、适用范围及进入 Proposal 的充分性。

复杂度/最小性：沿用既有 Agent/宿主、Git helper 和可信来源能力。以实际授权范围代替全仓 clean，以本次明确操作代替无条件提交形状；已有失败只读确认可复用。无需 Provider Registry、通用策略 DSL、远端接受平台、事务日志或自动恢复。

new-content / scope drift：NONE。普通 Start 后 Git 节点 / Change checkpoint 与 Delivery Integration 的区分，是 D05 已选 Git 节点目标的必要边界；没有要求前两者取得 Final record，也没有扩大成 CLI Git 写命令或新 Action。

关键未知已经界定：范围外 index 必须在提交前处理，形状放宽不生成额外权限，部分结果不等于完整接受。剩余参数/closed result 的具体表达属于 Propose 收敛，不需要继续探索全部 provider 或 Git 策略。

## Proposal 交接提醒

1. 固定一个实际支持的 Agent/宿主调用方式及最小操作、target、branch/remote/ref、路径/复用对象约定；不能只删除 domain guard 而没有实际执行与范围核对。普通 commit/push 不强绑 Final 或 PR/merge，checkpoint evaluator / status / next / doctor 继续只读。
2. 明确提交范围如何与真实待提交 index 对照；范围外 staged 要报告并停止，不夹带、不擅自清空，也不把所有 dirty 自动当授权。真实冲突、目标漂移及覆盖风险仍需核对。
3. 将默认 parent/count/clean 的变更同步到相关 specs、operation/record/ref/validator 及 HOW；保留本次明确形状与对象来源检查，删除默认限制不授权额外 squash/rebase/多提交。
4. 明确已确认效果、未完成步骤与未知状态的最小交接。local ref、callback success 或 PR id 不证明远端接受；失败只读确认后 STOP，不盲重试、不自动回滚、不撤销 Final。通过既有工具/人工交接，不另建结果库。
5. Apply 需产生当前实现的新证据，包含无权限、范围外 staged、无关 dirty 保留、新建/复用、明确形状、真实结果读回、部分成功及分根实际宿主示例；不能把本轮合成 proof 当作产品接入或全平台验收。

## 当前方案与 STOP

Git 回归外部版本管理工具：在约定节点按 Owner 明确范围调用并核对真实结果；无关未提交文件不统一阻断，不强制额外固定点或固定提交数量；发生部分成功就如实交接，不自动续跑。严格 OpenSpec Action、已确认 Final、当前 Full Test 和必要材料完整性保持原边界。

下一交接为 propose，实际调用依既有 authority/host boundary。本轮仅保存 Reviewer Run/proof，不执行 Propose/Apply、实际仓库 Git、归档、D05 Full Test 或 Final。

Owner 决定来源沿用 054 context.json#ownerDecisionsRelevant 与 ownerSourceRef：D05 independent-bootstrap；必要材料默认保留 target artifacts，.tmp 可丢弃；历史和原始 bytes 不重写。保留 scope/角色/事实所有者，不把审查批准当作 Git 权限。
