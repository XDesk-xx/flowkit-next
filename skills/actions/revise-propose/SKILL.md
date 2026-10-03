---
name: revise-propose
description: Resolve exact review-propose findings or an explicit Owner-scoped planning correction while preserving approved Explore and unaffected Proposal content, then STOP at review-propose.
metadata:
  author: flowkit
---

# Revise Propose Action Guidance

## Authority

Flowkit/Policy has already decided `revise-propose`. This Guidance owns findings-relevant or explicitly Owner-scoped Author planning mutation only.

## Required inputs

Read exact Reviewer findings or the exact current Owner-scoped correction, current Proposal/design/spec/tasks, approved Explore/review chain, and unaffected Proposal semantics that must remain stable. Carry materially relevant Owner decisions and material handling/retention boundaries through concise exact references, without copying the full conversation.

## Revision convergence

Resolve each finding with the smallest formal change that removes the defect.

Preserve approved Explore boundary, unaffected Proposal semantics, non-goals, and accepted capability count.

Converge affected Proposal/Design/spec/task claims in place. Replace or remove superseded planning text instead of appending review/revision chronology. Keep historical proof only when it still materially explains the current design, expressed as current rationale; otherwise rely on concise exact Run/finding or cross-artifact references for provenance.

Do not make Proposal permanently depend on temporary Explore experiments by default. Keep accepted decision basis distinct from current implementation acceptance evidence; historical proof cannot establish a current implementation PASS.

Do not opportunistically redesign, add unrelated improvements, expand compatibility surfaces, or turn wording corrections into new subsystems.

Rerun only planning/OpenSpec proof made relevant by the revision. If the finding proves the approved design itself is insufficient rather than imprecise, STOP and return to the appropriate earlier correction boundary.

## Complexity / scope-drift

Compare revised artifacts with prior Proposal and state whether new capability/content was introduced beyond findings.

## Run / handoff

Keep the three-file Run concise and bind to exact finding IDs, bounded revision outcomes/reasoning required for continuation, and revised planning artifact identities. Do not restate the full Proposal/Design or proof transcript in Run prose.

## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<run-group>/proof/<run-id>/`，其中新 Run 的 `<run-group>` 为 `action start` 返回的编号 Run 分组（如 `001-<change-id>`），`proofRefs.changeId` 仍是语义 ID；历史语义目录按原路径读取，同一 Run 两种目录并存时停止。默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

已启动且仅有 `action.md` 的 Run 必须在原 `repositoryRoot` 用绑定同一 Guidance SHA 的兼容 manager 继续；Skill bytes 改变会触发 `package-drift`。不得复制 descriptor 到其他项目根冒充恢复，也不得补造 `context.json`/`result.json`。

结束本 Run 前枚举其受控 proof 目录内的完整文件集合；每个文件都须在本 Run Result 的 `proofRefs` 中唯一声明 exact 路径、Delivery/Change/Run 归属、bytes、SHA-256 和用途，并核对原始 Git bytes。若目录有三个文件而只声明一个，应先补齐真实引用或保留未完成，不以 `.tmp` 副本、备份提交或后补摘要代替。后续 handoff 只选择当前判断需要的已声明引用，不删减生产 Run 的完整 `proofRefs`。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。今后新 Run 的三个 exact 文件路径由固定 `action start` 在开始前核对 Git 原始字节规则；每个新必要 proof 的 exact 路径在接纳前调用 `flowkit proof inspect --input <request.json>`，读回 bytes/SHA-256 与 Git 原始字节核对事实，再由 `action finish` 校验已声明引用。Agent 不导入内部 proof helper，也不提供 callback。结构化证据保留空白诊断，历史证据不追溯。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

## Agent 顺序执行与 canonical Run

读取本次 manager 安装的 exact Guidance，并以当前稳定 manager 的 `status` / `next` 确认单个合法 Action 和 Role。当前发行的固定记录入口只处理一次机械开始或结束，不执行 OpenSpec、编码、Review、测试、下一 Action 或 Git。

1. 准备 JSON 输入：`repositoryRoot`、`flowkitHome`、`deliveryId`、`changeId`、exact `actionId`、实际 `role`。仅当 Policy 已确认当前 prepared/terminal 对应阶段且收到明确 Owner revise 指令时附 `ownerAuthority`，其中 `sourceRef` 对应真实 Owner 输入；普通 Action 不附该字段。`archive` 另附已配置适用检查的 `applicableChecks: [{id,reason}]`，所选 ID 必须在 target 已配置且不歧义，由 Agent 对适用性负责。
2. 调用 `flowkit action start --input <request.json>`。只有返回 `effect: "started"` 且 exact `runId`、目录可读回后，才开始本次实际工作。任何 `blocked`、`not-written`、`written-unconfirmed` 均停止并保留真实 bytes。新开始 descriptor 已绑定当前 Guidance、package、prepared context、前序和 Owner fact；不得自填 Run 编号、GuidanceRef、ActionPackage 或回调。
3. 按本 Action 的上文合同完成实际角色工作。必要材料在产生时保存到受控 proof 目录；可调用 `flowkit proof inspect --input <request.json>` 取得当前文件 bytes/SHA-256/Git 原始字节事实。该结果不证明内容真实、测试 PASS 或 Reviewer verdict。无必要新材料时使用空 `proofRefs`，不建空目录。
4. 形成真实 `RunResultRecord`，以 `flowkit action finish --input <request.json>` 提交 `repositoryRoot`、`flowkitHome`、`deliveryId`、`changeId`、开始返回的 `runId`、实际 `role`、`terminal` 与 `result`。finish 从已存 descriptor 和当前可信事实重建，不接收另一份 Owner fact 或内部 package。Author 只填 Author outcome，Reviewer 必须独立执行并只填本人真实 verdict；Verification、Owner 与 Git 权限均不由 finish 创建。
5. 仅 `effect: "confirmed"` 表示本次三文件和 canonical chain 已读回，不表示业务 PASS。partial、冲突或未确认写入均保持原样，不覆盖或自动重做工作。Reviewer 的真实 `rejected` 使用 `nextBoundary: null`，可保存为 terminal；新进程查询得到 `blocked(review-rejected)` 后 STOP。仅收到同阶段明确 Owner `revise-action` 指令才允许新的对应 revise Run，不改写旧 verdict。
6. 独立调用 `flowkit status` / `flowkit next --input <query.json>` 读回本次结果与后续合法边界，然后 STOP；不得自动执行下一 Action。

请求 JSON 使用 `--input -` 时从 stdin 读取，最多 65,536 UTF-8 bytes。命令行显式 `--repository-root`、`--delivery-id`、`--change-id` 如提供，必须与 JSON target 一致。命令拒绝重复 JSON key、未知字段、caller 自填 lifecycle/sequence 与可执行输入。历史完整 Run 保持原字节；旧未知 partial 不由此入口接管。

## Terminal boundary

Stop at `review-propose`. Do not begin Apply/archive/finalization/Git work.

STOP after the revised Proposal Result.
