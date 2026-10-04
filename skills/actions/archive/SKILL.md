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

## Admission and actual execution

新 Archive descriptor 固定 `archiveContractVersion: 2`。start 只核对 active Change、Policy/Role、唯一 Run 链、approved Review 的 exact effective Author candidate、projectOrdinal、Guidance 和原始证据身份。它不调用原生 validate/dry-run，不接收 applicableChecks，不复制或扫描 repository/dependencies、ignored data symlink 或 pnpm shim。项目 Verification 留在 Apply/Review/Full Test。

调用本次选定 manager 的 `flowkit action start --input <request.json>`，请求含 repositoryRoot、flowkitHome、deliveryId、changeId、actionId=archive、role=author。started 后调用一次 `flowkit change archive --repository-root <target> --delivery-id <deliveryId> --change-id <changeId> --input <request.json>`；封闭请求仅含相同 target 和 exact runId。该 Run 保存 version-2 prestate 和实际命令材料，每个 Run 至多执行一次 exact OpenSpec 1.10.0 archive。实际工具负责原生 validation/spec sync，之后只进行 persisted ordinal rename 和 coordination active→completed 窄写入。不从 scratch 推断后态，不手动移动 Change 或预写 completion。

原始 stdout/stderr 每流最多16MiB，超限保留真实前缀并记录失败；命令退出、停止及存储事实与实际前后态共同判断，非零 exit 不等于无副作用。prestate、实际 spec after、完整 suffix/raw mapping、命令和全部必要材料仍位于 artifacts，Run 始终只有 action.md/context.json/result.json。

## Closed outcome and finish

以 `flowkit action finish --input <request.json>` 提交真实结果。Author 只填 Author outcome；Reviewer 必须独立执行并只填本人真实 verdict，finish 不创建 Reviewer、Owner 或 Git authority。

按实际返回的 `archiveOutcome` 和全部 exact `archiveMaterialRefs` 完成相同 Run 的 `action finish`，保留已有 proofRefs 声明规则：

- `{kind:"completed"}`：Author PASS，nextBoundary=null 或 checkpoint；已读回真实归档、spec after 与 completed coordination。
- `{kind:"failed",effect:"no-mutation"|"rolled-back",retryable:true}`：Author FAIL/null；进程已停止，受控 source/spec/candidate/coordination/两个目标均与前态一致。rolled-back 还必须有正面回滚证明，单纯前后相等不能追认回滚。预存目标保持原 bytes。
- `{kind:"partial",effect:"recovery-required",retryable:false}`：Author FAIL/null；已产生或无法确认效果，Policy blocked(archive-recovery-required)。业务 partial 可保存完整 terminal 三文件，即使 coordination 无法读取也不猜 active；机器文件 partial 继续保持 incomplete，不能伪造完成。

只有 finish 的 effect=confirmed 表示 terminal 三文件和 canonical chain 已读回；它不自动表示业务 PASS。

## Retry and interrupted invocation

安全 terminal FAIL 后的新 Archive 必须使用新 occurrence，其 direct parent 是失败 Run。共享来源解析只穿过同 Change 连续已接纳安全 FAIL，取得原 approved review-apply 及其 direct successful Author；不跨 partial/PASS/未知/其他阶段，不跳 parent，不接受 fork、错 target 或不连续 sequence。普通 terminal prepare 仍吸收，专用 Archive retry seam 只消费 Policy 已确定的 ready archive。

安全失败后的候选若需修改，必须收到既有 Owner revise-action 的 exact target、单项 revise-propose/revise-apply scope；修订 Run 直接 parent 为失败 Run，可以修改候选，随后必须重新独立 Review。缺或错授权、普通 Author FAIL、partial/completed 均不被兜底。

丢失响应先用 closed target/runId 请求 `action inspect`，只读核对 frozen descriptor/Guidance、实际 effect 与 remaining。descriptor-only 且尚无 intent、前态精确匹配时才能首次调用；intent 无可验证结果时不重放。真实成功命令与一致后态可只补观察/rename/coordination/finish。已调用失败的同 Run 只 finish；terminal safe FAIL 用新 Run 重试，terminal partial 保持显式恢复交接。重投已完成 Run 只读，不再执行 OpenSpec。

旧完整 version-1 Run/correction/Archive 按原合同只读兼容；旧 started 交给匹配冻结 Guidance 的原 manager，新 manager 报 incompatible，不改写旧 bytes，不通过 metadata correction 补造 candidateGit。

## Candidate Git identity

artifactHashes、Explore SHA 和 proof SHA 始终绑定 raw bytes。新成功 Author finish 由 manager 生成 candidateGit version-1，逐路径保存 rawSha256、预期 blobOid、identity/仅 CRLF→LF conversion、有效 text/eol、settings/objectFormat 和相关 indexBasis。Review/Archive 共同核对原 binding，只接受绑定输入或已核实预期输出；不重新猜测历史 candidate。

普通 staging 投影必须考虑 index EOL。已有非 binary i/crlf/mixed 后启用 text=auto（含 eol 和继承 autocrlf=true/input）仍可保持 raw identity；新目的路径自身 absent/indexBasis 和属性独立计算，不搬用 source basis。显式 text 也不能无条件判定转换：raw 等于旧 index blob、clean 不同时，stat-cache 命中与仅 stat 变化的普通 add 输出可不同，成功候选前明确 unsupported。无索引 hash-object --path 不能单独证明 ordinary add；禁止 touch、refresh、renormalize、临时 add、写 Git 配置或自动 normalize 来规避。

不执行 active filter/encoding/ident；支持有界 EOL-only 安全转换，managed Run/proof/log、binary/-text 必须 raw==blob。checkpoint 独立消费 Owner exact paths：stage 前核对 raw 和预期 blob、相关属性须存在于拟写入树，stage 后核对 cached rules 与真实 index，commit 后核对实际 blob。Git 失败只交接 Git 剩余步骤，不重做 Archive。

## Complexity / scope-drift

No hidden next-Change activation is allowed. Normal Archive and same-candidate safe retry do not require a second Owner archive execution authorization.

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


## Terminal boundary

报告 exact Change/Run、真实 outcome/effect、archivePath/projectOrdinal、必要材料与 continuation fact 后 STOP。安全失败的 continuation 可为新 Archive 或 Owner 明确修订；partial 只交接显式恢复。成功完成来源供 Final 有界消费当前 trusted Archive PASS、必要失败父链和 approved Review，原五字段 changeCompletions 保持不变，不重新准入无关祖先。

Archive、Review approval 与 Verification 均不创建 Git、Delivery Full Test/Final 或下一 Action 权限。独立授权的 Change checkpoint 使用 [固定 Git 命令 HOW](../../delivery/repository-integration/references/host-call.md)，不自动 stage/commit/push。
