## Context

动机与边界见 proposal.md；决定性基线见 explore.md E01–E03。既有模型已区分 semantic Action identity 与 Run occurrence，具有完整 prepared/null 记录、直接父链和 Owner correction。缺口在于同名 prepared revise 被结构与 Policy 拒绝，而历史链又将普通 reuse READY 当作新 child 的合法性。

本 Change 跨 lifecycle、Policy 与 CLI/history 的授权消费，需明确设计。使用直接 OpenSpec 规划；没有本 Change 的 Flowkit Run 或独立 Reviewer verdict，不借 candidate build 取得管理自己的 authority。

## Goals / Non-Goals

**Goals:** 让已有 correction path 一致承载三个 revise 阶段的连续 prepared 新 occurrence；让 current、Owner、记录与历史读回可核对，保留旧字节及 descriptor compatibility。

**Non-Goals:** 不扩展普通同名 Author start、任何 Reviewer/Archive prepared 续跑、terminal PASS reopening、历史修复/迁移、锁或多 writer 协议、额外 Run 文件或恢复状态。业务实施、manager 更新、Git 与原项目 Run 分配仍按独立后续边界执行。

## Decisions

### D1：复用 prepared supersession，支持同名 revise

在 src/domain/action-lifecycle.ts 的既有 supersedePreparedAction 上撤销三个 revise 的 same identity 阻断。现有 target revise-family、prepared Author、same Delivery/Change、closed boundary 字段和 exact target 校验继续成立。target 已被限制为 revise，因此不能产生普通 apply→apply/propose→propose/explore→explore。

结构 seam 只给 prepared candidate，不创建 Owner、Run 或 eligibility。每个生产消费者先通过 Policy 的完整 prepared pair 与授权，再消费该结构边。普通 transitionCurrentAction(prepare) 保持不变。选择复用是因为现有 package/descriptor/finish 已携带所需身份；另建 resume state、第二套 start 或通用 retry API均无必要。

### D2：Policy 将复用和 correction 分支分开

src/domain/policy-and-next-boundary.ts 的 prepared structural enterability：

- 无 correction 且 same identity：保留 normal reuse READY，表示当前阶段。
- 有 correction：统一经 prepared supersession 检查；同名 revise 不再提前返回 false。
- exact preparedCurrentRunId/context/result linkage、prepared/author、四槽 null、active Change、reached-stage 与 decision=revise-action、same target、scope=[requestedAction]全部沿用。
- 其他普通 terminal、FAIL correction 和 Archive seam 保持原分支。

不会通过增加一个 READY 特例来绕过原校验。normal reuse 与新 occurrence 的 difference 由已有 correction 请求和事实表达，不加 durable flag。

### D3：链解析强制验证新增同名 revise edge

src/cli/current-run-chain.ts 对每条 parent→child edge，在默认 Policy fallback 之前识别：

    parent.lifecycleState == prepared
    AND parent/child semantic Action identity exact same
    AND child actionId 属于三个 revise

满足时必须使用 child.context.ownerAuthority 作为 explicit correction 输入，重新执行 parent exact prepared pair 的 Policy。null 或 wrong fact直接拒绝；即使默认 READY 已匹配，也不能回退到 reuse。只验证新增 same-revise edge，保持不同 identity correction、普通 prepared Author 既有历史 fixture及 bootstrap-history 的原读取合同。

这一更严格读取会拒绝此前仅由宽松解析接受的无授权/错误 scope同名 revise 边；不提供 grandfathering、修补文件或改写旧事实。原真实 Run 014→015 是不同 identity 的合法 Owner correction，属于需保持通过的兼容样本。

### D4：start/finish/inspect 重建同一条边

已有 action-commands.ts、prepared-owner-correction-start.ts、action-finish.ts、action-inspect.ts 均已调用 Policy 和 supersession；先复用，只有实际缺失的消费点才改代码。不得复制第二份 correction eligibility。

| 节点 | 输入与核对 | 可写内容 |
| --- | --- | --- |
| start | active canonical完整 tip、请求 Owner、既有 next sequence、package readiness；写前再次解析并比较 tip | 仅新 occurrence 的 action.md |
| descriptor-only inspect | descriptor 的 exact parent、绑定 Owner、Policy、结构、package/Guidance | 无 |
| finish | 新 descriptor、原绑定 authority、exact parent、候选/Proof closure与既有结果准入 | 仅新 context.json/result.json，create-once并读回 |
| complete inspect/status/next | 完整链和唯一最新 tip；不能将旧 prepared 当第二 current | 无 |

每次 start 请求要提交覆盖本轮的真实 Owner fact；宿主可使用已明确覆盖连续续跑的现有授权，不反复索要同一权限，也不因为父 record 有 fact自动继承。finish 使用 descriptor 中原 fact，不能替换或从聊天重新猜测。

start 只有 descriptor 时，Foundation仍按既有 incomplete 规则停止；完整新 Run的 current 只在保存/读回后成立。竞争 child、stale tip、占用 sequence、partial files 保持原行为；不新增并发协议。对旧完整 Run进行变更式 finish仍触发 duplicate-finish-conflict；相同 Result幂等读回仍有效。

### D5：保留 Guidance 与原结果准入

本次不改 skills/actions/** bytes；解释可放 docs/onboarding.md。既有 descriptor对 Guidance SHA 的绑定保持有效，不改变版本或补写旧 package。验证 source/候选打包中 Guidance hash与修复前相同，并通过匹配 manager对旧完整 prepared fixture及真实 Run 015的只读兼容检查。

后续每轮采用自己的 Run ID、Proof归属和当前 artifact/candidate/check evidence。旧 prepared proof可按现有引用合同使用相关材料，但不能替代本轮真实工作或生成 PASS。terminal Author PASS仍遵守现有 planning/artifactHashes/candidateGit/Git-byte/Proof closure准入；后续独立 Review绑定最新 Author candidate。CLI fixture中的合成角色与结论只是 Verification，不构成实际独立 Review批准。

### D6：验证与来源收敛

| 合同 | 来源 | 必要验证 |
| --- | --- | --- |
| 同名结构与 Policy eligibility | Owner窄续跑要求、Explore E01、原 prepared correction 主规格 | 六个 Author × 三个 revise target矩阵；三个同名 revise可进入，其他原结果保持 |
| child exact authority与唯一链 | Explore E02、原 immutable successor 主规格 | 三个 revise × 缺失/匹配/错误 scope；连续 R1→R2→R3；wrong parent/fork/sequence拒绝 |
| fixed command一致性 | Explore E03、原 start/finish/inspect和create-once合同 | 隔离 fixture的新 descriptor、独立进程 inspect/finish/query；最新 Author才允许 Review start |
| bytes与安装兼容 | Owner保留旧记录要求、Explore E03 | 每轮旧三文件/Proof hash不变；Guidance hash不变；旧合法 complete prepared仍可读 |

扩展现有 fixtures，不建立通用测试框架。执行适用 domain、CLI/安装 acceptance、typecheck/build/quality 和严格 OpenSpec检查；结果作为 Apply新证据，不把 Explore探针作为实现 PASS。独立 Review和 Formal Full Test保持各自边界。

## Risks / Trade-offs

- [只改 Policy或结构造成假 READY] → 对 start/finish/inspect/链执行同一多轮 fixture，并保留结果/Guidance重建校验。
- [历史默认 reuse绕过授权] → 在新增 same-revise edge上无 fallback 地验证 child fact；补缺失、wrong scope/decision/target反例。
- [保留普通 prepared历史兼容被误解为新 start权限] → 限定链的严格新分支为 same-revise；fixed start对普通同名无论是否传 Owner仍拒绝。
- [部分开始被当作旧 tip可继续] → 保留 descriptor/partial，读回 incomplete并STOP；不删除或复写。
- [更新 prose破坏旧 descriptor] → Guidance byte冻结于本次修复；构建/package测试显式比对，原件只读核对。
- [降级到旧 manager后无法承认新合法链] → 安装/恢复选择作为独立 Owner操作；已创建新同名 prepared successor的 target不自动降级或重放。

## Migration Plan

无需数据迁移、旧 Run回写或新字段。Apply在隔离 target验证候选并保留旧 bytes；只有后续明确 Git/manager更新边界才打包安装固定 manager。本 Change规划及实施不自行创建原项目 Run 016。

更新后先用固定 manager只读核对原 target的 status/next/inspect，再在原项目按当时真实 current、授权和 occupancy开始下一 occurrence。若原 tip或所需 runtime/Guidance不匹配，保留诊断并停止；不以当前聊天的“016”覆盖真实编号。若已经形成新版才支持的链，旧 manager不是可盲目回退的替代；不得为降级删除 successor。
