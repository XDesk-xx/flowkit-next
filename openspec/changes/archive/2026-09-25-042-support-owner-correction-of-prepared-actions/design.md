## Context

见 [proposal.md](proposal.md)。已批准 Explore 对真实 `prepared apply` Run 做只读复现：现有 Policy 将 Owner 请求拒为 `unsupported-owner-correction`，普通 `prepare` 也拒绝替换。Run 的 `previousRunId`、新 child 的 `ownerAuthority` 和唯一 tip 足以表达前向替代，尚无新增 lifecycle state 的必要。

## Goals / Non-Goals

**Goals:** 把一次显式 Owner 修正绑定到同一 active Change 的 prepared Author Run、合法 revise target、唯一新 occurrence 和可审计的新 current tip；失败时不改写旧事实。

**Non-Goals:** 通用 cancel/recovery 平台、修改历史 Run、自动执行下一 Action、跨项目修复 LP 089、把 Owner 决定编码为 Reviewer verdict。

## Decisions

### 1. Policy 先决定，独立的结构性 supersession 再进入新 Action

保留普通 `prepare` 对任何 prepared slot 的拒绝。上游 canonical chain 先选出唯一 current tip，并把 `preparedCurrentRunId`、该 tip 的 `preparedRunContext`/`preparedResult` 同时交给纯 Policy seam。Policy 核对三者同一 runId、context/result 的 ActionIdentity 与 CurrentAction、`prepared/author` 和四个 null outcome/next 槽；缺项或错配统一为 `invalid-policy-input`，先于 correction 判定。无 correction 的 prepared 续行不要求这些额外输入。随后 Policy 验证 active Change、`revise-action`、Delivery/Change、单一 scope 与 stage matrix；prepared Reviewer、archive、错误 target 均拒绝。只有 `READY_ACTION(revise-*)` 连同同一 authority 才允许调用有界的 prepared supersession transition。该 transition 仅检查 canonical identities、当前为 prepared Author、目标不同且是 revise-family；它不自行授予 Owner 权限。Action start 必须复核 Policy 决定与 transition 的 exact target/authority，不可只凭一个独立布尔值。

备选是新增 `cancelled` state 或让普通 `prepare` 接受 prepared slot；前者会扩张所有 Run/Policy 状态校验，后者会让未授权替换也变得 structurally 可行。现有双状态加专用 transition 已满足已批准证据。

### 2. 新 child 记录替代，旧 prepared 记录保持原样

新 revise occurrence 的 `previousRunId` 指向旧 prepared current Run，context 保存精确 Owner authority。新 `action.md` 保存真实 start 与 ActionPackage；成功后写同一 occurrence 的 context/result。读取链仅在该 edge 满足 prepared Author、exact correction、唯一 successor、可读完整旧 Run 时接受新 tip；旧 Run 仍为 `prepared`、outcome 为 null，原三文件与 proof 字节不变。只从当前 tip 继续计算后续 Review，不从旧 prepared Result 推断成功。

备选是把旧 Run 改成 terminal/cancelled 或以独立 sidecar 标记废弃；这会改写真实执行状态或建立第二份 truth。

### 3. 开始顺序与部分失败

读取并验证完整旧链和授权 → Policy READY → 形成 exact 新 occurrence/context/GuidanceRef/ActionPackage → 检查目标目录与 source integrity → create-once 写新 `action.md` → 读回 → 才开展业务工作。写新开始前任何失败保留旧 current，不生成可见 child。开始写入后若读回、业务工作或 context/result 保存失败，保留 partial 或真实 prepared 记录并 STOP；后续查询报告 exact incomplete/blocked 位置，不通过猜测回退到旧 Action，也不自动补成 terminal。只有新记录完整并经 chain readback，才报告新 current 已形成。

同阶段 `prepared apply → revise-apply` 与回退 `prepared apply → revise-propose/revise-explore` 使用同一顺序。完成新 revise 后按既有 `review-*` 边界交给独立 Reviewer；先前 apply 工作与旧自动检查只作来源事实，不替代新 Proposal/Apply 验收。

## Risks / Trade-offs

- [旧 prepared Run 与新 child 同时可见可能被误读为两个 current] → current 只取经 exact edge 校验后的唯一 tip，UI/CLI 明示前序保留和新 Owner authority。
- [新开始 partial 无法安全自动判断实际工作程度] → 保留 partial 并 STOP，要求人工核对；不清理、不重放、不伪造结果。
- [授权随意复用可能打开多分支] → authority 精确绑定本次 requested revise target；canonical chain 只接受唯一后继与新 occurrence。

## Migration Plan

无需历史 Run 迁移。新版本仅对未来显式 Owner correction 生效；未带 correction 的 prepared Run 继续原 Action。通过 bounded fixtures 覆盖 LP 089 等价形态，但不修改 LP 原件。
