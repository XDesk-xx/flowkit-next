---
name: archive
description: Independent D03/D04 flowkit-next bootstrap archive wrapper that consumes persisted projectOrdinal naming/handoff/STOP around existing OpenSpec archive mechanics without consuming candidate product Guidance.
metadata:
  author: flowkit
---

# Bootstrap Archive Wrapper

## Scope

This file exists only for flowkit-next's independent D03/D04 self-development plane.

It is not the product archive Guidance and MUST NOT read, execute, or delegate to `skills/actions/archive/SKILL.md`.

Flowkit/Policy has already supplied the exact legal Action `archive`.

## Composition

```text
exact current Change coordination entry
↓
consume persisted projectOrdinal
↓
existing .agents/skills/openspec-archive-change mechanics
↓
Flowkit completion / handoff facts
↓
STOP
```

## Persisted project ordinal

`semantic ChangeId` remains canonical Change identity. `projectOrdinal` is only the durable project-wide monotonic sequence/archive-naming fact previously assigned during first actual Explore.

Read the exact current Delivery manifest and exact Change coordination entry:

```text
openspec/delivery-groups/<delivery-id>.yaml
```

Require:

1. exactly one exact semantic ChangeId match;
2. an existing valid positive-integer `projectOrdinal` on that exact Change;
3. no duplicate/contradictory assigned projectOrdinal fact in durable repository Delivery Change coordination data.

STOP fail-closed on missing, malformed, duplicated, contradictory or otherwise inconsistent ordinal facts.

Archive MUST NOT allocate, increment, compact, repair or recompute an ordinal. It MUST NOT fall back to Delivery array position, Run number, `changeStartSequence`, completed/archive counts, physical Run-group prefixes, or archive-directory counting.

Archive target:

```text
YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>
```

Use the persisted value unchanged and zero-pad to at least three digits.

## Package-bound archive preparation

Real archive readiness/self-check executes only under the exact ActionPackage / canonical Guidance identity supplied by the existing single-Action invocation. It is not a new Standard Action or state. Before archive mutation, check exact accepted `review-apply` continuity, no post-review byte drift, exact active Change/ordinal identity, OpenSpec/task/delta-sync readiness, archive-target collision/identity, completion-transition readiness, handoff/removal completeness and known correction blockers.

Preparation MUST also perform canonical convergence in an isolated dry-run and run affected domain verification plus any materially applicable engineering gates against the converged candidate bytes. OpenSpec structural success alone is insufficient. A post-convergence verification failure that requires repository/canonical byte correction is a real archive blocker and MUST be discovered before the actual canonical sync/move mutation.

Environment-only failure with unchanged bytes stops without archive mutation and may retry the same candidate. A blocker requiring repository/canonical byte mutation, including a post-convergence verification failure, stops before archive mutation and returns to the existing Owner-controlled `revise-apply` correction path; changed bytes require fresh `review-apply`. Normal archive readiness does not require a second Owner archive execution authorization.

This bootstrap HOW remains independent and MUST NOT consume candidate product archive Guidance.

## OpenSpec mechanics

Reuse:

```text
.agents/skills/openspec-archive-change/SKILL.md
```

for OpenSpec status, delta-sync assessment, canonical convergence, movement mechanics, and warnings.

Where generic OpenSpec mechanics would use a date-only target, this wrapper supplies the Flowkit-specific target above. Do not make OpenSpec/vendor semantics own Flowkit `projectOrdinal` assignment or identity.

## Completion semantics

Archive executes while the Change is active after legality is already established.

Do not require pre-existing `completed`.

After successful archive convergence/movement, materialize only the existing Flowkit completion/continuity/handoff facts required by the lifecycle.

## Independence / minimality

Do not consume candidate product Guidance.
Do not create mirror wrappers for the other six Author Actions merely for symmetry.
Do not introduce a Registry/Router/Planner/Runtime/counter service/allocator subsystem/new lifecycle state.

## Run / handoff / STOP

Preserve the latest delta plus all materially required uncommitted ancestor state by cumulative payload or exact retrievable ancestor references. Carry exact removal information for deleted/renamed paths; do not create a payload registry/database.

Keep the standard three-file Run concise and record the exact archive path, persisted projectOrdinal, spec-sync/completion facts and identities needed for continuation.

Keep projectOrdinal separate from Run sequence, changeStartSequence and external physical group prefix.

Do not activate the next Change, perform Delivery finalization, or exercise Git authority inside archive.

STOP after the archive Result.


## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

此条款用于 D05 independent-bootstrap；不读取、调用或委托 candidate 产品 HOW 管理 D05。三文件 Run 记录真实本次执行，材料置于 artifacts，不新增 Run 文件、Registry、自动 Review/下一步或 Git 权限。

只读准备通过后，在业务修改前记录实际开始的 action.md/context.json；真实工作完成后才写 result.json 并读回。开始记录失败不做业务修改，开始后中断或保存失败保留已写 bytes 并明确报告未完成，不补造 PASS、不覆盖或清理历史、不从目录存在推断已获接管权限。bootstrap 三文件不是 canonical 产品 Run 的 schema 样例；D05 历史不转换，后续独立 Reviewer 记录自己的实际 verdict。
