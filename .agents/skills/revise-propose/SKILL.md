---
name: revise-propose
description: Revise a Proposal after review findings using the smallest contract correction that preserves the approved Explore boundary.
metadata:
  author: flowkit
---

# Revise Propose Skill

## Purpose

Repair Proposal after exact review-propose findings or an explicit Owner-scoped planning correction while keeping the approved Explore boundary and Proposal convergence intact.

## Process

### 1. Classify the finding

- missing requirement
- unclear acceptance
- contract inconsistency
- scope regression
- design ambiguity
- verification gap
- task/spec mismatch

For an Owner-scoped correction after an approved review, bind the exact current Owner decision and distinguish it from a withdrawn Reviewer finding. Carry only decision-relevant scope and material handling/retention boundaries, not the full conversation.

### 2. Trace the finding to the approved model

Confirm the finding closes a real hole in:

- Owner requirement
- approved Explore
- existing canonical contract
- an accepted reviewer concern

If the requested fix would introduce a new product scope, STOP and require Owner/Explore decision instead of silently accepting it.

### 3. Apply the minimum contract correction

Prefer the smallest normative rule that closes the hole.

Examples:

```text
overwrite risk
→ create-once + fail closed

sequence ambiguity
→ sequence uniqueness
```

Do not jump directly to generic infrastructure unless required by the approved model.

### 4. Keep artifacts aligned

Update only affected planning artifacts:

```text
proposal.md
specs/**/spec.md
design.md
tasks.md
```

Ensure requirements, design, tasks, and acceptance remain consistent.

Converge affected planning text in place: replace/remove superseded claims and keep only rationale still needed to understand the current design. Do not append Reviewer/Owner correction chronology or copy the full prior Proposal/Explore into the revised artifacts. Use concise exact Run/finding references for deeper provenance when material.

Do not turn temporary Explore experiments into permanent Proposal dependencies. Keep accepted decision basis separate from current implementation acceptance evidence; historical proof cannot establish a current implementation PASS.

### 5. Re-run Proposal checks

Confirm:

- traceability
- minimality
- non-goals
- strict specification validation
- no production implementation mutation

## Forbidden

Do not:

- reopen broad Explore inside revise-propose;
- add a new subsystem to avoid a narrow blocker;
- implement production code;
- bypass reviewer blocker;
- alter Owner scope implicitly.

## Output

Updated Proposal artifacts ready for independent re-review.


## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

此条款用于 D05 independent-bootstrap；不读取、调用或委托 candidate 产品 HOW 管理 D05。三文件 Run 记录真实本次执行，材料置于 artifacts，不新增 Run 文件、Registry、自动 Review/下一步或 Git 权限。

只读准备通过后，在业务修改前记录实际开始的 action.md/context.json；真实工作完成后才写 result.json 并读回。开始记录失败不做业务修改，开始后中断或保存失败保留已写 bytes 并明确报告未完成，不补造 PASS、不覆盖或清理历史、不从目录存在推断已获接管权限。bootstrap 三文件不是 canonical 产品 Run 的 schema 样例；D05 历史不转换，后续独立 Reviewer 记录自己的实际 verdict。
