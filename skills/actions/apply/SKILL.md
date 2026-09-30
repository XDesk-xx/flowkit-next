---
name: apply
description: Execute the already-decided Flowkit apply Action by implementing the exact approved Proposal with minimum mutation, internal Mechanical Preflight, bounded handoff, and STOP at review-apply.
metadata:
  author: flowkit
---

# Apply Action Guidance

## Authority

Flowkit/Policy has already decided the exact current Action `apply`.
This Guidance owns HOW only. It does not decide Reviewer verdict, Verification PASS, next Action, Owner authority, archive legality, Delivery Final, or Git authority.

## Required inputs

本 Skill 与 `skills/tools/openspec/SKILL.md` 均相对 manager 安装根解析；项目事实与 OpenSpec 命令 cwd 使用 target repositoryRoot。target 同名 Skills/lock 不接管系统来源，系统文件缺失不回退到 target 或 bootstrap。

Read the exact approved Proposal/design/spec/tasks, latest approving `review-propose`, exact repository candidate/base, controlling Owner scope, applicable existing seams, and explicit non-goals.

Use `skills/tools/openspec/SKILL.md` for subordinate OpenSpec apply/task mechanics.

## Implementation convergence

1. Every material mutation must trace to an approved requirement, task, design decision, or necessary verification need.
2. Reuse existing contracts/utilities/D02 facts/repository tooling before adding structure.
3. Implement the complete approved behavior with the smallest coherent diff.
4. Do not pull forward later Changes, silently narrow requirements, opportunistically refactor, or create internal version families.
5. Mark tasks complete only after their specified behavior is implemented and verified.
6. If implementation reveals a real design contradiction, STOP and return to the normal correction path.

## Mechanical Preflight — internal phase

Mechanical Preflight is part of `apply`; it is NOT a Standard Action, Reviewer, Verification authority, or lifecycle stage.

Reuse the minimum applicable D02 facts/checks:

```text
Lightweight Gate
Structural Dependency Health
Repository Entropy Hygiene
Applicable Check facts
```

Also check directly applicable artifact existence, OpenSpec strict validation, task completeness, handoff completeness, actual diff availability, and forbidden generated/runtime artifacts.

Reuse same-candidate PASS facts only when candidate/check/tool identity remains materially valid.

## Complexity / scope-drift check

Explicitly assess new capability, authority, lifecycle semantics, Standard Action, compatibility surface, later-Change content, and control plane.

## Run / handoff

Continuation must preserve the latest delta plus all materially required uncommitted ancestor state. Use a cumulative payload or exact retrievable ancestor references; when files are deleted/renamed, carry exact removal information so reconstruction cannot retain stale bytes. Do not introduce a payload registry or continuation database.

Keep the three-file Run concise. Handoff exact changed artifact/diff identities and real check outcomes needed for independent `review-apply`.

## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。今后新 Run 的三个 exact 文件路径在开始前检查；新必要 proof 的 exact 路径在接纳前用本次 manager domain.assertManagedEvidenceGitBytes 核对，作为 checkProof 的第四个参数传入。结构化证据保留空白诊断，历史证据不追溯。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

## Agent 顺序执行与 canonical Run

读取本次 manager 安装的 exact Guidance，并以当前稳定 manager 的 `status` / `next` 确认单个合法 Action 和 Role。当前发行的固定记录入口只处理一次机械开始或结束，不执行 OpenSpec、编码、Review、测试、下一 Action 或 Git。

1. 准备 JSON 输入：`repositoryRoot`、`flowkitHome`、`deliveryId`、`changeId`、exact `actionId`、实际 `role`。仅当当前 prepared Author Run 经 Owner 明确 correction 时附 `ownerAuthority`，其中 `sourceRef` 对应真实 Owner 输入；普通 Action 不附该字段。`archive` 另附已配置适用检查的 `applicableChecks: [{id,reason}]`，至少包含 `test:domain`，由 Agent 对适用性负责。
2. 调用 `flowkit action start --input <request.json>`。只有返回 `effect: "started"` 且 exact `runId`、目录可读回后，才开始本次实际工作。任何 `blocked`、`not-written`、`written-unconfirmed` 均停止并保留真实 bytes。新开始 descriptor 已绑定当前 Guidance、package、prepared context、前序和 Owner fact；不得自填 Run 编号、GuidanceRef、ActionPackage 或回调。
3. 按本 Action 的上文合同完成实际角色工作。必要材料在产生时保存到受控 proof 目录；可调用 `flowkit proof inspect --input <request.json>` 取得当前文件 bytes/SHA-256/Git 原始字节事实。该结果不证明内容真实、测试 PASS 或 Reviewer verdict。无必要新材料时使用空 `proofRefs`，不建空目录。
4. 形成真实 `RunResultRecord`，以 `flowkit action finish --input <request.json>` 提交 `repositoryRoot`、`flowkitHome`、`deliveryId`、`changeId`、开始返回的 `runId`、实际 `role`、`terminal` 与 `result`。finish 从已存 descriptor 和当前可信事实重建，不接收另一份 Owner fact 或内部 package。Author 只填 Author outcome，Reviewer 必须独立执行并只填本人真实 verdict；Verification、Owner 与 Git 权限均不由 finish 创建。
5. 仅 `effect: "confirmed"` 表示本次三文件和 canonical chain 已读回，不表示业务 PASS。partial、冲突或未确认写入均保持原样，不覆盖或自动重做工作。Reviewer 若实际判断为 `rejected`，当前固定 finish 会在 machine 文件写前返回 unsupported/incomplete；如实报告该判断与未完成记录，不能改写为 `changes-requested` 或声称 terminal。
6. 独立调用 `flowkit status` / `flowkit next --input <query.json>` 读回本次结果与后续合法边界，然后 STOP；不得自动执行下一 Action。

请求 JSON 使用 `--input -` 时从 stdin 读取，最多 65,536 UTF-8 bytes。命令行显式 `--repository-root`、`--delivery-id`、`--change-id` 如提供，必须与 JSON target 一致。命令拒绝重复 JSON key、未知字段、caller 自填 lifecycle/sequence 与可执行输入。历史完整 Run 保持原字节；旧未知 partial 不由此入口接管。

## Terminal boundary

Successful Apply stops at:

```text
review-apply
```

Do not perform Reviewer work, archive, next-Change activation, Delivery finalization, or Git checkpoint/push/merge.

STOP after the real Apply Result is materialized.
## 代码 gate 与 Git checkpoint

代码质量保持 bounded formatting、lint 与适用行数要求；Git whitespace/禁止入库内容分别诊断，不混作 Full Test 代码 verdict。历史 proof、测试输入、原始日志的空白不自动阻断 checkpoint，不要求重复豁免，不逐 Change 加 attributes 或重写已接受材料。核对本次授权、范围、真实冲突及 Git 结果；此 HOW 不创建提交权限。Full Test 使用项目独立范围与当前 attempt，不继承普通 Action 的 candidate/reuse。
