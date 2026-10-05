---
name: revise-apply
description: Resolve exact review-apply findings with minimum mutation and findings-relevant Mechanical Preflight, then STOP at review-apply.
metadata:
  author: flowkit
---

# Revise Apply Action Guidance

安全 failed Archive 后，只有 exact Owner revise-action、同 target 和单项本 Action scope 可开始修订；直接 parent 为失败 Run，允许候选改变，完成后必须独立 Review。partial/completed、错授权或普通 Author FAIL 不被该窄边兜底。

成功 Author finish 的 artifactHashes/Explore SHA 保持 raw 含义；manager 生成 candidateGit version-1，调用者只可传同值，duplicate 消费已保存身份，不重新计算历史。普通 staging 投影核对相关 indexBasis、有效 text/eol/settings 和预期 blob；active filter/encoding/ident、raw==旧 blob 而 clean 不同的 stat-cache 歧义均在成功候选前 unsupported，禁止 touch/refresh/renormalize/临时 add 或 normalize 规避。旧事实不回填 Git 投影。

普通 explore/revise-explore、propose/revise-propose、apply/revise-apply 的 exact terminal Author FAIL/null 可在明确 Owner revise-action 后修订：先核对真实失败 pair、current identity/role/state 与 nextBoundary=null，再按已到达阶段选择同阶段或此前 revise；授权必须同 target、单项 requested Action scope。三个 revise 自身失败也只能创建直接以失败 Run 为 parent 的同名新 occurrence，旧 terminal 三文件保持原 bytes。start 绑定 Owner/唯一 sequence，inspect/finish 重建同一边；裸 READY、缺/错授权、forward skip、PASS/UNKNOWN/Reviewer/Archive partial 不解锁。真实工作完成后新 PASS 指向自己的 Review，不继承旧 approval，不自动 Review/next；ordinal 与其他机器 readiness 继续适用。

Result facts 保持 65,536 UTF-8 bytes、depth=16（root=0），nodes 上限为 4,096，计根/容器/值、不计 key。请求 envelope 默认 65,536 bytes 先检查；caller facts 超限为 invalid-request + error.budget，manager 生成 candidateGit 后超限为 result-admission-rejected + effect/runId + budget，并在 context/result 首写前拒绝。诊断仅有 subject/dimension/limit/observed/measurement，不复制 facts；depth/nodes 提前停止报 lower-bound，完成序列化后的 bytes 报 exact。保留 descriptor/proof，真实修正后用同 Run finish，不删减 refs/hash、外置 candidateGit 或回写历史来凑预算。

## Authority

Flowkit/Policy has already decided `revise-apply`. This Guidance owns findings-relevant or explicitly Owner-scoped Author implementation mutation only.

It does not own Reviewer verdict, Verification truth, archive legality, next Action, Owner authority, Delivery Final, or Git authority.

## Required inputs

Read the exact Reviewer findings from `review-apply` when Review is the source; for an ordinary Author FAIL correction, read the exact failed Run/Result and Owner sourceRef/single Action scope instead. Also read approved Proposal chain, current candidate diff, and prior valid check facts.

## Revision convergence

For every finding:

```text
finding
→ exact affected implementation/test/artifact
→ minimum mutation
→ findings-relevant verification
```

Preserve already-approved implementation outside the finding.

Do not redesign unrelated scope, add opportunistic refactors, pull forward later Changes, or broaden a test fix into a production abstraction without proof.

If a finding exposes a Proposal/design contradiction rather than implementation defect, STOP and return to Proposal correction.

## Mechanical Preflight — internal phase

Reuse the minimum applicable D02 facts whose candidate/check/tool identity remains valid. Rerun only checks invalidated by the revision or required to prove the finding closed, plus directly applicable artifact/OpenSpec/diff/handoff checks.

Mechanical Preflight remains inside `revise-apply`; it is not a Standard Action or lifecycle state.

## Complexity / scope-drift

Explicitly report findings addressed, preservation of unaffected approved content, new content beyond findings, and complexity growth.

## Run / handoff

Continuation must preserve the latest delta plus all materially required uncommitted ancestor state. Use a cumulative payload or exact retrievable ancestor references; when files are deleted/renamed, carry exact removal information so reconstruction cannot retain stale bytes. Do not introduce a payload registry or continuation database.

Keep the three-file Run concise and provide exact revised diff/artifact identities plus real check outcomes.

## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<run-group>/proof/<run-id>/`，其中新 Run 的 `<run-group>` 为 `action start` 返回的编号 Run 分组（如 `001-<change-id>`），`proofRefs.changeId` 仍是语义 ID；历史语义目录按原路径读取，同一 Run 两种目录并存时停止。默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

已启动且仅有 `action.md` 的 Run 必须在原 `repositoryRoot` 用绑定同一 Guidance SHA 的兼容 manager 继续；Skill bytes 改变会触发 `package-drift`。不得复制 descriptor 到其他项目根冒充恢复，也不得补造 `context.json`/`result.json`。

结束本 Run 前枚举其受控 proof 目录内的完整文件集合；每个文件都须在本 Run Result 的 `proofRefs` 中唯一声明 exact 路径、Delivery/Change/Run 归属、bytes、SHA-256 和用途，并核对原始 Git bytes。若目录有三个文件而只声明一个，应先补齐真实引用或保留未完成，不以 `.tmp` 副本、备份提交或后补摘要代替。后续 handoff 只选择当前判断需要的已声明引用，不删减生产 Run 的完整 `proofRefs`。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。今后新 Run 的三个 exact 文件路径由固定 `action start` 在开始前核对 Git 原始字节规则；每个新必要 proof 的 exact 路径在接纳前调用 `flowkit proof inspect --input <request.json>`，读回 bytes/SHA-256 与 Git 原始字节核对事实，再由 `action finish` 校验已声明引用。Agent 不导入内部 proof helper，也不提供 callback。结构化证据保留空白诊断，历史证据不追溯。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

## Agent 顺序执行与 canonical Run

读取本次 manager 安装的 exact Guidance，并以当前稳定 manager 的 `status` / `next` 确认单个合法 Action 和 Role。当前发行的固定记录入口只处理一次机械开始或结束，不执行 OpenSpec、编码、Review、测试、下一 Action 或 Git。

1. 准备 JSON 输入：`repositoryRoot`、`flowkitHome`、`deliveryId`、`changeId`、exact `actionId`、实际 `role`。仅当 Policy 已确认当前 prepared/terminal 对应阶段且收到明确 Owner revise 指令时附 `ownerAuthority`，其中 `sourceRef` 对应真实 Owner 输入；普通 Action 不附该字段。Archive version 2 的 start 只核对 Flowkit admission，不接收项目 checks；原生 task/spec/目标判断在 started Run 内进行。
2. 调用 `flowkit action start --input <request.json>`。只有返回 `effect: "started"` 且 exact `runId`、目录可读回后，才开始本次实际工作。任何 `blocked`、`not-written`、`written-unconfirmed` 均停止并保留真实 bytes。新开始 descriptor 已绑定当前 Guidance、package、prepared context、前序和 Owner fact；不得自填 Run 编号、GuidanceRef、ActionPackage 或回调。
3. 按本 Action 的上文合同完成实际角色工作。必要材料在产生时保存到受控 proof 目录；可调用 `flowkit proof inspect --input <request.json>` 取得当前文件 bytes/SHA-256/Git 原始字节事实。该结果不证明内容真实、测试 PASS 或 Reviewer verdict。无必要新材料时使用空 `proofRefs`，不建空目录。
4. 形成真实 `RunResultRecord`，以 `flowkit action finish --input <request.json>` 提交 `repositoryRoot`、`flowkitHome`、`deliveryId`、`changeId`、开始返回的 `runId`、实际 `role`、`terminal` 与 `result`。finish 从已存 descriptor 和当前可信事实重建，不接收另一份 Owner fact 或内部 package。Author 只填 Author outcome，Reviewer 必须独立执行并只填本人真实 verdict；Verification、Owner 与 Git 权限均不由 finish 创建。
5. 仅 `effect: "confirmed"` 表示本次三文件和 canonical chain 已读回，不表示业务 PASS。partial、冲突或未确认写入均保持原样，不覆盖或自动重做工作。Reviewer 的真实 `rejected` 使用 `nextBoundary: null`，可保存为 terminal；新进程查询得到 `blocked(review-rejected)` 后 STOP。仅收到同阶段明确 Owner `revise-action` 指令才允许新的对应 revise Run，不改写旧 verdict。
6. 独立调用 `flowkit status` / `flowkit next --input <query.json>` 读回本次结果与后续合法边界，然后 STOP；不得自动执行下一 Action。

请求 JSON 使用 `--input -` 时从 stdin 读取，最多 65,536 UTF-8 bytes。命令行显式 `--repository-root`、`--delivery-id`、`--change-id` 如提供，必须与 JSON target 一致。命令拒绝重复 JSON key、未知字段、caller 自填 lifecycle/sequence 与可执行输入。历史完整 Run 保持原字节；旧未知 partial 不由此入口接管。

## Terminal boundary

Stop at `review-apply`. Do not archive/activate/finalize/Git mutate.

STOP after the revised Apply Result.

## 代码 gate 与 Git checkpoint

代码质量保持 bounded formatting、lint 与适用行数要求；Git whitespace/禁止入库内容分别诊断，不混作 Full Test 代码 verdict。历史 proof、测试输入、原始日志的空白不自动阻断 checkpoint，不要求重复豁免，不逐 Change 加 attributes 或重写已接受材料。核对本次授权、范围、真实冲突及 Git 结果；此 HOW 不创建提交权限。Full Test 使用项目独立范围与当前 attempt，不继承普通 Action 的 candidate/reuse。
