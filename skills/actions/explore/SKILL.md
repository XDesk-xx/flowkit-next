---
name: explore
description: Execute the already-decided Flowkit explore Action with proof-first bounded investigation, first-Explore project ordinal persistence, concise handoff, and STOP discipline.
metadata:
  author: flowkit
---

# Explore Action Guidance

## Authority

Flowkit/Policy has already decided the exact current Action `explore`.
This Guidance owns HOW only. It does not decide activation, legality, next Action, Role, Owner authority, Reviewer verdict, Verification truth, Change completion, Delivery Final, or Git authority.

## Required inputs

本 Skill 与 `skills/tools/openspec/SKILL.md` 均相对 manager 安装根解析；项目事实与 OpenSpec 命令 cwd 使用 target repositoryRoot。target 同名 Skills/lock 不接管系统来源，系统文件缺失不回退到 target 或 bootstrap。

Establish the exact Delivery/Change context, Owner scope, repository base, OpenSpec facts, accepted references, explicit non-goals, and the exact current Delivery Change coordination entry.

Use `skills/tools/openspec/SKILL.md` only for subordinate OpenSpec tool mechanics. OpenSpec remains specification/artifact truth.

## First-Explore project ordinal materialization

This phase runs only after Flowkit/Owner has already made the exact Change's `explore` Action current/legal.

`semantic ChangeId` remains the canonical Change identity. `projectOrdinal` is only a durable project-wide monotonic sequence/archive-naming fact.

For the exact current Change coordination entry:

1. If a valid positive-integer `projectOrdinal` is already present, reuse it unchanged. Do not allocate again.
2. If `projectOrdinal` is absent, inspect durable already-assigned `projectOrdinal` facts from repository Delivery Change coordination entries.
3. Require every assigned fact used for sequencing to be a valid positive integer and require assigned ordinals to be unambiguous/unique. If durable facts are malformed, duplicated, contradictory, or otherwise insufficient to derive one next value safely, STOP fail-closed.
4. Derive the next value as `max(existing assigned projectOrdinal) + 1` and persist it exactly once on the exact current Change coordination entry.
5. Planned-only Changes do not reserve numbers. An explored Change that is later cancelled keeps its already-assigned ordinal consumed.

Do not derive or substitute `projectOrdinal` from Delivery manifest array position, Run sequence, `changeStartSequence`, completed/archive counts, physical Run-group prefixes, or archive-directory counting.

If no durable assigned ordinal baseline exists, STOP and require an explicit bounded bootstrap/Owner decision rather than inventing a number.

## Method

Proof before platform: prove only what can materially change the bounded contract; prefer the minimum decisive proof.

1. Separate observable `fact / assumption / unknown / future possibility`.
2. For every material uncertainty use `risk → question → minimum decisive proof → evidence → decision impact`.
3. Prefer focused source/spec inspection, controlled experiments, counterexamples, or bounded non-production fixtures.
4. Do not implement production behavior during Explore.
5. Reuse accepted contracts/tools before proposing new abstractions.
6. End with durable facts, required invariants, resolved contract-changing unknowns, explicit non-goals, limitations, smallest Proposal-ready direction, and `PASS / FAIL / UNKNOWN`.
7. Never convert UNKNOWN into PASS.

## Canonical artifact convergence

Treat canonical Explore as the current bounded proof/rationale for the Change, not as an append-only revision chronology.

Keep facts, counterexamples, failed proof, or prior observations only when they still materially explain the current invariant or limitation. Express such material as current rationale rather than as `Reviewer correction`, `Owner correction`, or revision-diary sections.

Execution/review chronology needed for durable continuation belongs on the existing Run surface only at the bounded level required by the existing concise Run contract. Prefer concise exact Run/finding references when deeper provenance is useful. Git preserves exact repository history.

File size and line count are diagnostic signals only. They may trigger a semantic duplication/convergence check but are not correctness Gates.

## Concept ownership / mutation-order checks

Use these checks proportionally, only when the Explore is introducing a new concept/mechanism or involves stateful mutation.

Before naming a new mechanism, ask whether the need already belongs to an existing capability/entity, operation, state, configuration, validation/proof mechanic, or Guidance/HOW. Introduce a new capability only when the existing ownership model cannot express the proven need.

For stateful or side-effecting designs, identify validation, the mutation/commit point, what happens on failure before and after commit, and whether retry/rollback/correction remains legal. Simple non-mutating work does not require artificial state-machine analysis.

## Complexity / scope-drift check

Explicitly check for unjustified new capability, authority, lifecycle semantics, acceptance requirement, compatibility surface, later-Change content, or control plane.

Do not create Registry/Router/Planner/Runtime/cache/new lifecycle/identity subsystem/counter service merely to make ordinal persistence or an edge case cleaner.

## Run / handoff

Use only the existing concise three-file Run surface by default:

```text
action.md
context.json
result.json
```

Persist decisions and material identities, not duplicated canonical artifacts or command transcripts.

Carry materially relevant Owner decisions that affect later judgment, including authorized material handling and retention boundaries, using concise exact references rather than the full conversation. Distinguish temporary Explore experiments, accepted decision basis, and current implementation acceptance evidence. Historical proof is not current implementation PASS, and raw experiments need not be retained permanently unless the current contract or explicit Owner boundary requires their bytes.

Keep these namespaces distinct in handoff when relevant:

```text
projectOrdinal
changeStartSequence
current Run sequence
physical Run-group prefix
```

## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

结束本 Run 前枚举其受控 proof 目录内的完整文件集合；每个文件都须在本 Run Result 的 `proofRefs` 中唯一声明 exact 路径、Delivery/Change/Run 归属、bytes、SHA-256 和用途，并核对原始 Git bytes。若目录有三个文件而只声明一个，应先补齐真实引用或保留未完成，不以 `.tmp` 副本、备份提交或后补摘要代替。后续 handoff 只选择当前判断需要的已声明引用，不删减生产 Run 的完整 `proofRefs`。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。今后新 Run 的三个 exact 文件路径由固定 `action start` 在开始前核对 Git 原始字节规则；每个新必要 proof 的 exact 路径在接纳前调用 `flowkit proof inspect --input <request.json>`，读回 bytes/SHA-256 与 Git 原始字节核对事实，再由 `action finish` 校验已声明引用。Agent 不导入内部 proof helper，也不提供 callback。结构化证据保留空白诊断，历史证据不追溯。

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

Successful Explore stops at:

```text
review-explore
```

Do not create Proposal content, Apply implementation, archive work, next-Change activation, Delivery finalization, or Git mutation.

STOP after the real Explore Result is materialized.
