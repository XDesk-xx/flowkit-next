---
name: archive
description: Execute the already-decided Flowkit archive Action with canonical OpenSpec convergence, persisted projectOrdinal naming, completion/continuity materialization, handoff, and STOP.
metadata:
  author: flowkit
---

# Archive Action Guidance

## Authority

Flowkit/Policy has already supplied the exact current legal Action `archive`.

At archive entry the Change is still `active`.
This Guidance MUST NOT decide archive legality and MUST NOT require a pre-existing `completed` Change state.

`completed` is a post-archive materialization fact owned by the existing Flowkit lifecycle/coordination contract.

This Guidance does not decide the next Change, activate another Change, perform Delivery Final, or own Git authority.

## Required inputs

本 Skill 与 `skills/tools/openspec/SKILL.md` 均相对 manager 安装根解析；项目事实与 OpenSpec 命令 cwd 使用 target repositoryRoot。target 同名 Skills/lock 不接管系统来源，系统文件缺失不回退到 target 或 bootstrap。

Establish the exact current Delivery ID/manifest, semantic ChangeId, exact Change coordination entry, already-authorized `archive` Action, accepted terminal review/apply facts, current OpenSpec status/delta state, and handoff/continuity requirements.

Use `skills/tools/openspec/SKILL.md` for subordinate OpenSpec mechanics.

## Consume the persisted project Change ordinal

`semantic ChangeId` remains canonical Change identity. `projectOrdinal` is only a durable project-wide monotonic sequence/archive-naming fact that must already have been assigned during first actual Explore.

For the exact current Change coordination entry:

1. Require exactly one semantic ChangeId match.
2. Require an existing valid positive-integer `projectOrdinal` on that exact entry.
3. Verify assigned projectOrdinal facts are not duplicated/contradictory in durable Delivery Change coordination data relevant to this repository. If the current value is missing, malformed, duplicated or inconsistent, STOP fail-closed before archive target materialization.
4. Reuse the persisted value unchanged. Archive MUST NOT allocate, increment, compact, repair, or recompute it.
5. Format the persisted value with at least three digits for the archive name.

Never derive or substitute the archive ordinal from Delivery manifest array position, Run sequence, `changeStartSequence`, completed-Change count, archive-directory count, physical Run-group prefix, or any archive-time count.

## Archive target

Materialize:

```text
YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>
```

For current Change `converge-author-action-guidance` with persisted `projectOrdinal: 21`, the target uses `021` regardless of Run numbering.

Do not stack another date prefix.

## Package-bound archive preparation

Archive readiness is real self-check HOW, not a new Action or lifecycle state. It runs inside the already-decided `archive` invocation only after the exact canonical Guidance identity is frozen into the exact ActionPackage and before archive mutation begins.

Check at minimum, when materially applicable:

- the accepted `review-apply` after `apply` / `revise-apply` still corresponds to the exact candidate bytes;
- no post-review repository/canonical byte drift invalidated that acceptance;
- the exact Change is still the active archive target and its persisted projectOrdinal remains valid;
- OpenSpec planning/tasks/delta-sync and archive-target collision/identity facts are ready;
- an isolated canonical-convergence dry-run succeeds and the resulting converged candidate passes affected domain verification plus any materially applicable engineering gates before real archive mutation;
- completion-transition readiness is satisfied without requiring a pre-existing `completed` state;
- handoff/removal facts needed for continuation are complete;
- no known correction blocker remains.

Treat post-convergence verification as part of preparation, not as a post-mutation cleanup check. The dry-run MUST exercise the canonical bytes that archive would actually materialize. A verification failure that proves repository/canonical bytes must change is a correction blocker even when OpenSpec structural validation itself passes.

If readiness is blocked by an environment-only condition and candidate bytes remain unchanged, STOP without archive mutation and allow same-candidate retry. If readiness finds a correction requiring repository/canonical byte mutation, including a post-convergence verification failure, STOP before archive mutation and return to the existing Owner-controlled correction path; changed bytes require a fresh `review-apply` before archive can be attempted again.

A valid `review-apply` acceptance makes normal archive execution ready through existing Policy. Do not require a second Owner archive execution authorization.

## Canonical convergence

在固定 `action start` 已返回 `effect: "started"` 且完成前述隔离 convergence/preflight 后，调用本次选定 manager 安装的 `flowkit change archive --repository-root <target> --delivery-id <deliveryId> --change-id <changeId> --input <request.json>`。封闭请求只含 `repositoryRoot`、`flowkitHome`、`deliveryId`、`changeId` 和该次 start 返回的 exact `runId`；可见目标必须与请求一致。该命令在内部执行 exact OpenSpec validate/archive、canonical spec sync、使用已持久化 projectOrdinal 重命名归档目标并写入完成协调事实；Agent 不预先手动移动 Change 或自行写 completion。

核对退出码、JSON `status`/`effect`、`archivePath`、`projectOrdinal`、`runId` 与 target 实际状态。仅 `status="completed"` 且 `effect="archive-and-coordination"` 并读回归档及完成事实后，才用 `action finish` 记录真实 archive Result。`incomplete`、`openspec-unknown`、`archived` 或 `coordination-unknown` 均保留已确认效果和未知部分，停止并交接，不重复运行 OpenSpec archive 或盲重试。

Do not fork OpenSpec semantics or redesign accepted production behavior during archive.

## Completion / continuity materialization

After successful archive movement/convergence, update only existing Flowkit completion/continuity/handoff facts required by the accepted lifecycle.

This is where the Change may become `completed`; never require that state before archive.

No hidden next-Change activation is allowed.

## Complexity / scope-drift

Do not introduce production redesign, new lifecycle state, ordinal allocator/counter service, Registry/Router/Planner/Runtime, historical mass rename, automatic next Change, or automatic Git action.

## Run / handoff

Continuation must preserve the latest delta plus all materially required uncommitted ancestor state. Use cumulative payloads or exact retrievable ancestor references and carry exact removal information when needed; do not introduce a payload registry/database.

Keep the three-file Run concise and record exact archive path, persisted projectOrdinal, spec-sync result, completion/continuity facts, and material artifact/hash identities.

Keep `projectOrdinal`, `changeStartSequence`, current Run sequence and physical Run-group prefix distinct.

## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<run-group>/proof/<run-id>/`，其中新 Run 的 `<run-group>` 为 `action start` 返回的编号 Run 分组（如 `001-<change-id>`），`proofRefs.changeId` 仍是语义 ID；历史语义目录按原路径读取，同一 Run 两种目录并存时停止。默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

已启动且仅有 `action.md` 的 Run 必须在原 `repositoryRoot` 用绑定同一 Guidance SHA 的兼容 manager 继续；Skill bytes 改变会触发 `package-drift`。不得复制 descriptor 到其他项目根冒充恢复，也不得补造 `context.json`/`result.json`。

结束本 Run 前枚举其受控 proof 目录内的完整文件集合；每个文件都须在本 Run Result 的 `proofRefs` 中唯一声明 exact 路径、Delivery/Change/Run 归属、bytes、SHA-256 和用途，并核对原始 Git bytes。若目录有三个文件而只声明一个，应先补齐真实引用或保留未完成，不以 `.tmp` 副本、备份提交或后补摘要代替。后续 handoff 只选择当前判断需要的已声明引用，不删减生产 Run 的完整 `proofRefs`。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。今后新 Run 的三个 exact 文件路径由固定 `action start` 在开始前核对 Git 原始字节规则；每个新必要 proof 的 exact 路径在接纳前调用 `flowkit proof inspect --input <request.json>`，读回 bytes/SHA-256 与 Git 原始字节核对事实，再由 `action finish` 校验已声明引用。Agent 不导入内部 proof helper，也不提供 callback。结构化证据保留空白诊断，历史证据不追溯。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

## Agent 顺序执行与 canonical Run

读取本次 manager 安装的 exact Guidance，并以当前稳定 manager 的 `status` / `next` 确认单个合法 Action 和 Role。当前发行的固定记录入口只处理一次机械开始或结束，不执行 OpenSpec、编码、Review、测试、下一 Action 或 Git。

1. 准备 JSON 输入：`repositoryRoot`、`flowkitHome`、`deliveryId`、`changeId`、exact `actionId`、实际 `role`。仅当当前 prepared Author Run 经 Owner 明确 correction 时附 `ownerAuthority`，其中 `sourceRef` 对应真实 Owner 输入；普通 Action 不附该字段。`archive` 另附非空 `applicableChecks: [{id,reason}]`；Agent 按本次实际影响声明适用性，`id` 必须对应 target 已配置的 `package.json` script 或 `config/verification/full-test.json` check。固定命令先做隔离 convergence，再执行所选检查；未配置、歧义或失败均不开始 archive。
2. 调用 `flowkit action start --input <request.json>`。只有返回 `effect: "started"` 且 exact `runId`、目录可读回后，才开始本次实际工作。任何 `blocked`、`not-written`、`written-unconfirmed` 均停止并保留真实 bytes。新开始 descriptor 已绑定当前 Guidance、package、prepared context、前序和 Owner fact；不得自填 Run 编号、GuidanceRef、ActionPackage 或回调。
3. 按“Canonical convergence”节调用一次固定 `change archive` 并核对其效果，再完成本 Action 的结果整理。必要材料在产生时保存到受控 proof 目录；可调用 `flowkit proof inspect --input <request.json>` 取得当前文件 bytes/SHA-256/Git 原始字节事实。该结果不证明内容真实、测试 PASS 或 Reviewer verdict。无必要新材料时使用空 `proofRefs`，不建空目录。
4. 形成真实 `RunResultRecord`，以 `flowkit action finish --input <request.json>` 提交 `repositoryRoot`、`flowkitHome`、`deliveryId`、`changeId`、开始返回的 `runId`、实际 `role`、`terminal` 与 `result`。finish 从已存 descriptor 和当前可信事实重建，不接收另一份 Owner fact 或内部 package。Author 只填 Author outcome，Reviewer 必须独立执行并只填本人真实 verdict；Verification、Owner 与 Git 权限均不由 finish 创建。
5. 仅 `effect: "confirmed"` 表示本次三文件和 canonical chain 已读回，不表示业务 PASS。partial、冲突或未确认写入均保持原样，不覆盖或自动重做工作。Reviewer 若实际判断为 `rejected`，当前固定 finish 会在 machine 文件写前返回 unsupported/incomplete；如实报告该判断与未完成记录，不能改写为 `changes-requested` 或声称 terminal。
6. 独立调用 `flowkit status` / `flowkit next --input <query.json>` 读回本次结果与后续合法边界，然后 STOP；不得自动执行下一 Action。

请求 JSON 使用 `--input -` 时从 stdin 读取，最多 65,536 UTF-8 bytes。命令行显式 `--repository-root`、`--delivery-id`、`--change-id` 如提供，必须与 JSON target 一致。命令拒绝重复 JSON key、未知字段、caller 自填 lifecycle/sequence 与可执行输入。历史完整 Run 保持原字节；旧未知 partial 不由此入口接管。

## Terminal boundary

After archive completion/materialization:

```text
STOP
```

Do not activate another Change, finalize the Delivery, or commit/push/merge unless a separate legal boundary supplies those actions.

独立授权的 Change checkpoint 可按本安装 [固定 Git 命令 HOW](../../delivery/repository-integration/references/host-call.md) 调用 `git checkpoint`，消费既有 evaluator 与真实 Owner 来源；不要求 Final/Integration，不把 Git 变成 archive 的一部分。
