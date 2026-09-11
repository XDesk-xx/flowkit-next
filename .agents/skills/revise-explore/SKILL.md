---
name: revise-explore
description: Revise Flowkit Explore after reviewer findings or Owner scope correction using the minimum proof and boundary correction needed for re-review.
metadata:
  author: flowkit
---

# Revise Explore Skill

## Purpose

Repair Explore after reviewer findings or Owner scope correction while preserving stage discipline.

The objective is not "more Explore" by default. The objective is the smallest correction needed to restore a truthful, bounded, Proposal-ready Explore.

## Authority Priority

Apply authority in this order:

1. explicit Owner scope/authority decision;
2. accepted Delivery/Change boundary;
3. reviewer finding;
4. prior Author exploratory direction.

When Owner narrows the real use case, revise the Explore around the corrected input domain even if earlier proof explored broader possibilities.

## Process

### 1. Read the triggering input

Classify it as:

- missing decisive evidence
- incorrect assumption
- missing material risk
- invalid proof boundary
- scope drift / over-generalization
- authority issue
- Owner scope correction

### 2. Identify the smallest semantic correction

Ask:

- What exact conclusion is wrong/incomplete?
- Does the finding belong to the real current input domain?
- Can the risk be closed by narrowing ownership/generation rather than designing a generic subsystem?

### 3. Revise only necessary Explore material

Update as needed:

- facts
- risks
- proof
- decisions
- limitations/non-goals
- Proposal direction

Converge the canonical Explore in place. Replace/remove superseded claims instead of appending correction-history sections. Preserve prior proof/counterexamples only when they still materially explain the current invariant; rewrite that material as current rationale rather than as a revision diary. Use concise exact Run/finding references for deeper provenance when useful.

### 4. Re-run focused proof

Run only proof necessary for the corrected boundary.

Do not continue an obsolete proof branch just because earlier reviews opened it.

### 5. Re-evaluate Proposal readiness

The revised Explore should clearly state:

- current real use case
- minimum contract
- decisive proof
- deferred/non-goal concerns
- whether any blocker remains

## Forbidden

Do not:

- erase failed evidence that still materially supports/explains the current invariant;
- retain superseded conclusions merely to narrate revision chronology;
- rewrite facts merely to obtain PASS;
- expand scope to satisfy a finding;
- turn every edge case into a new protocol;
- implement production code;
- generate Proposal artifacts.

## Output

A revised Explore ready for independent re-review, or an explicit blocked/unknown result.


## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

此条款用于 D05 independent-bootstrap；不读取、调用或委托 candidate 产品 HOW 管理 D05。三文件 Run 记录真实本次执行，材料置于 artifacts，不新增 Run 文件、Registry、自动 Review/下一步或 Git 权限。

只读准备通过后，在业务修改前记录实际开始的 action.md/context.json；真实工作完成后才写 result.json 并读回。开始记录失败不做业务修改，开始后中断或保存失败保留已写 bytes 并明确报告未完成，不补造 PASS、不覆盖或清理历史、不从目录存在推断已获接管权限。bootstrap 三文件不是 canonical 产品 Run 的 schema 样例；D05 历史不转换，后续独立 Reviewer 记录自己的实际 verdict。
