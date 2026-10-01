# Explore: canonical prepared proof at managed checkpoint

## 问题与当前边界

Delivery 07 的 Change F 修复一个限定的兼容缺口：完整 `prepared` Run 已因合法 Owner correction 或同 Action continuation 成为 canonical 链中的非 tip 前驱，其真实 proof 第一次进入 managed Change Git checkpoint 时，现有校验仍因 `context.lifecycleState !== "terminal"` 拒绝。历史 LearningPlatform 089→090、092→093 是问题来源；本次不写该项目的 Run、Proof 或 Git。

F 只修改 managed checkpoint 对新 proof 的准入。当前 terminal owner 分支、Run/Result 原始字节、唯一声明、path/bytes/SHA、Git index 与 worktree 字节一致性保持。E 仍在 F 完成后做独立安装、新目标/新会话和端到端发行验收；现有 E 依赖与范围无需在本次 Explore 预先修订。

## 有界证据

当前源码 `src/internal/managed-evidence-checkpoint.ts` 的 `declaredProof` 直接要求 terminal，却不读取完整 Run 链；`requireNewManagedEvidenceBytes` 在精确 Git index 新增路径上调用它。`src/cli/current-run-chain.ts#resolveRunChain` 已有完整链、唯一后继、Role、prepared null outcome、Owner correction / Policy edge 检查；可复用这套判定，不能另建状态机。

隔离 Git fixture 的命令、源码、原始输出和退出状态保存在本 Run 的 `bounded-probe-*` proof。它验证 terminal proof 在当前 checkpoint 校验中通过；同一合法 prepared owner 的 proof 被当前 checker 拒绝。fixture 还证明 canonical 链接受 Owner-linked `revise-propose` 与同 Action `apply` continuation，并拒绝无授权 correction、fork 与 prepared 伪 PASS。fixture 不是独立 Review，也不是修复后的测试 PASS。

| 决策点 | Explore 结论 |
|---|---|
| prepared proof 的合法性来源 | 复用 canonical Run 链及 Policy edge；owner 必须是完整三文件、非 tip、有唯一合法后继。 |
| 单个 proof 的真实性 | 保持 Result 中唯一 `proofRefs` 声明、归属及 path/bytes/SHA，保持 index 与 worktree exact bytes；缺失、重复或漂移拒绝。 |
| checkpoint 的持久闭包 | prepared 的合法后继必须在本次提交候选 Git 树内可见：已在 HEAD 或同一待提交 index 中，且用于链判定的 bytes 与该树一致。只在工作区看到后继不足以证明 checkpoint 保存了合法链。 |
| 当前 prepared tip / partial / fork | 仍拒绝。单独 `action.md` 不构成完整 Run，prepared tip 不因 future continuation 可能发生而提前准入。 |
| terminal 分支 | 保持既有行为与覆盖，不能为迁就 prepared 重新解释历史 terminal proof。 |

## Proposal-ready 最小合同

1. 对首次进入 managed Change checkpoint 的 proof，先保留现有 exact index、path 与 Result 声明校验。terminal owner 走既有分支；prepared owner 走额外的 canonical 链准入。
2. prepared owner 的 context/result 必须完整、身份一致，四个 outcome/next 槽为 null；链中它不是 tip，且只有一个完整、合法的直接后继。完整链必须保持唯一 Explore 根、同 Delivery/Change、无断链/fork/重复 identity 或 sequence，边由现有 Policy 判定，Owner correction 必须匹配真实已保存 authority。
3. 该链的必要 Run 文件及 proof owner Result 在本次 checkpoint 的 HEAD+index 候选树中可核对；不能借未提交工作区文件为 checkpoint 创建虚假合法性。必要数据缺失或 Git 对象/工作区 bytes 冲突时，提交前 fail closed，保留已形成的 index 副作用并按现有 Git host 结果报告。
4. 用 089→090 和 092→093 型有界 fixture 做正例，同时覆盖 terminal 回归、prepared tip、partial、fork、非法 edge、伪 verdict、缺/重复声明、bytes/SHA mismatch 及未进入候选树的后继。Apply 再产生当前实现验收证据。

不迁移或改写历史 Run/Proof；不对所有历史 proof 扫描；不让 candidate 接管 D07；不让 checkpoint 创建 Owner 授权、补写 Run、自动执行下一 Action 或扩大 E 的目标。需要 Git 候选树读取的具体最小实现位置在 Proposal 中定案，避免引入第二套 Run-chain 规则。

**Explore 结论：PASS。** F 可按上述边界进入独立 `review-explore`。E 当前无已证实的规划错误，待 F 完成后按现有依赖进行自身 Explore。这里的 PASS 只表示问题和 Proposal 边界已被证据限定，不表示修复已实现、Reviewer 已批准或 Git checkpoint 已获授权。
