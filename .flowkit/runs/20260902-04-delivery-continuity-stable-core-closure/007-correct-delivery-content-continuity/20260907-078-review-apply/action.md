# Review Apply 078 — 077 修订独立复审

Owner 请求：`根据最新run，review-apply`。输入 `20260907-077-revise-apply`；对照 `076-review-apply` 的 7 项 finding 与 `074-review-propose` 批准计划。Change `correct-delivery-content-continuity`，`projectOrdinal: 32`。

结论：`changes-requested`。4 项闭合，3 项部分修正但仍阻断；沿用原 finding ID，不新开 Change，不重做 Proposal，不执行下一 Action。

## 精确输入与已闭合项

077 三文件及 16 项 revision artifact 绑定匹配。与 076 相比只有申报的 16 文件变化，无未申报差异；Proposal/design/tasks/七份 delta specs 及其余上轮产物保持。当前 candidate 与 1468 个受保护文件的字节快照见 context。

- `D04-RA007-001`：闭合。surface/commit 各用 defensive copy；独立 scope 扩权反例为零 commit 调用，内部原授权保持。
- `D04-RA007-004`：闭合。独立授权/acceptance source 绑定 exact 操作与前后事实；聚焦测试覆盖 caller variant 替换、无来源历史替换拒绝，以及有明确来源的不同历史通过。只承认已批准可信 host 接缝，不声称未来跨会话接入已完成。
- `D04-RA007-005`：闭合。两条 create-new 路径均核验完整唯一 parent；独立重现“第二 parent 已在历史内、rev-list count 仍为 1”的原反例，现在正确拒绝。
- `D04-RA007-007`：闭合。reuse 不再要求 commit callback，实际 fixture 通过；Guidance 无条件新建指令已按 variants 收敛。

## 未闭合 findings

### D04-RA007-002 [P1] Start 仍未验证 validation 的真实成功结论与完整检查输入

位置：`src/internal/delivery-start-content.ts:208`。

已改善：新增 reader 会拒绝缺失来源，并核对 project/Delivery/base/planning、四槽 refs 及实际 artifact bytes/hash。

当前反例：在新建隔离 fixture 中真实执行 Node 检查，exitCode=1、stdout='validation failed\n'；reader 返回该真实失败结果 bytes，Agent surface 引用相同 hash/bytes，Start 仍返回 terminal。当前 host 只核对材料身份，既未检查执行结果是否通过，也未核对本次要求的完整检查/工具输入。

合同影响：读取了真实 bytes 不等于获得真实验证 PASS，未通过或不完整的检查材料仍可成为 contentCompletion。 依据：design D3；Start delta: validated 标记不能充当证明；tasks 3.1。

最小修正：在既有窄验证 owner/source 边界核对本次实际成功结论和完整要求检查及其输入/输出，失败、材料不足、错输入均拒绝。不能只让 reader 提供匹配的 metadata 或一个自填 PASS 标签；不需要通用 evidence 平台。补实际成功/失败和完整性正反例。

### D04-RA007-003 [P1] Final Run 证据仍缺 admission 校验，且把必要链限制在同一 Change

位置：`src/internal/delivery-required-evidence-source.ts:110`；关联 `src/internal/delivery-required-evidence-source.ts:116`、`src/internal/delivery-required-evidence-source.ts:269`、`src/domain/action-package-result-admission.ts:217`。

已改善：archive=FAIL 已拒绝；完整 Full Test/Architecture outcome 必须有效、匹配实际输入且包含于 source artifacts，无关 outcome bytes 已拒绝。

当前反例：仅改隔离 fixture 持久化 archive result 的 verificationVerdict 为 passed，保持 authorConclusion=PASS 和其余字段；既有 admitActionResult 对同一结果返回 null，但新 evidence derive、Final preparation 以及实际 invokeDeliveryFinalOperation 仍成功 terminal。另一个反例提供 archive/review 的完整 previous 链及来自 dependency-change 的必要 Run，源返回的各 identity/link 明确且该依赖结果通过 canonical structural admission，parseRun 因强制所有 Run.changeId==当前 closure.changeId 返回 null。

合同影响：可解析的 Run bytes 仍被当作 accepted execution；同时完整合法跨 Change 前置链无表达/消费路径。把 fixture JSON 写到磁盘并不补足真实执行/admission 验收。 依据：design D4；Final delta: 必要证据是 Final 的有限前置快照而非可选清单；tasks 4.2；tasks 7.1。

最小修正：复用现行 Run/address/admission 规则并验证真实 accepted source，不仅检查两个 anchor 的 PASS/approved 字段；按每个必要 Run 自身受控 identity/address 读取合法跨 Change 链，并由可信 owner 绑定 anchors/链终点，拒绝遗漏/截断。补真实执行并持久化的 canonical Run、非法 outcome slot、跨 Change 必要链接测试，不扫描全部历史或新建 Run schema。

### D04-RA007-006 [P2] 固定投影已修复，但 requiredEvidence 重验仍依赖属性插入顺序

位置：`src/internal/delivery-required-evidence-source.ts:360`；关联 `src/domain/delivery-repository-integration-execution.ts:281`。

已改善：Final derive/clone 已逐层固定 requiredEvidence 字段，嵌套 property reorder 保持相同 Final ref，golden test 通过。

当前反例：从当前实际 fixture source 派生 evidence 后，仅递归重排对象属性，保留所有值、artifact refs 和有序数组；两个 package 的 Final ref 相等。但 revalidateDeliveryRequiredEvidenceSource 对原 evidence 返回 true，对重排版本返回 false，因为仍直接比较 JSON.stringify(derived) 和 JSON.stringify(evidence)。Integration preparation/accepted-object 会消费该重验结果。

合同影响：同一合法闭合事实虽保持相同 identity，却仍会在后续来源重验/Integration 被误拒；原 finding 要求的 derive、clone、revalidation/admission 一致尚未闭合。 依据：Final delta: Validator 与 Integration 重建相同固定投影；design D5/D6；tasks 4.4；076 D04-RA007-006 minimumCorrection。

最小修正：来源重验同样使用现有固定语义投影或等价语义比较，保留有序数组和值/bytes 变化的拒绝；补 Final property reorder 后继续走来源重验及 Integration 的贯通测试。

## 验证、最小性与 STOP

独立执行 typecheck、format、diff check、exact OpenSpec 1.10.0 当前 Change strict 均通过；strict 只证明结构。聚焦测试 36/36、native Windows domain 263/263、acceptance 5/5，均零失败/skip。测试启动时的 sandbox spawn EPERM 不是产品失败，已在沙箱外原命令重跑取得上述结果。

反例命令：`node --import tsx .tmp/review-apply-078-proof.mjs`，最终 exit 0 表示 8 项反例/对照观察断言成立，不代表产品验收 PASS。Start 检查确实执行并返回 exit 1；Final 使用受控 fixture 与显式模拟的外部工具。所有项目外执行效果仅在新建临时 fixture；未修改项目 Git、Author 产物或旧 Run。临时脚本不建立永久 proof 保存义务。Linux/build/dependency/entropy 本轮未重跑，077 的相关结果保留为 Author 报告，不混作独立复审 PASS。

本步只复审修订收敛。新增窄 source 接缝、固定 clone 与测试拆分属原批准范围，16 文件最大 645 行；`scope drift: NONE`，未见 Registry/证据平台或无关重构。残留 3 项均为既有验收义务，要求 Author 在同一 Change 继续最小 `revise-apply` 并补真实正反例；没有发现必须返回 Proposal 的合同缺陷。

Owner 已授权原始 Explore proof 移到 `.tmp` 且不长期保留，本轮不重开该争议、不要求恢复旧材料。当前 Start/Final 必需验证义务不因此豁免。

本轮使用独立 `.agents/skills/review-apply/SKILL.md` 及 debugging-and-error-recovery 的反例定位方法；不以 candidate Review Apply Guidance 自证。外部 flowkit 不可用，结果标记为独立 D04 bootstrap，不冒充 canonical Runtime admission 或 Formal Verification verdict。

下一交接：`revise-apply`；`archiveAllowed=false`。未授予新 Owner/Git authority，未自动继续。STOP。
