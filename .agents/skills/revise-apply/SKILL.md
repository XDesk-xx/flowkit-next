---
name: revise-apply
description: Correct Apply-stage implementation defects minimally; stop and return for Owner-authorized Proposal repair when the approved contract itself is defective.
metadata:
  author: flowkit
---

# Revise Apply Skill

## Purpose

Correct implementation-stage defects after review-apply while preserving the approved Proposal boundary.

## Revision Process

### 1. Classify the finding

- implementation defect
- missing required test/verification
- evidence mismatch
- unauthorized scope mutation
- approved-contract defect

### 2. Decide whether the fix belongs to Apply

If the approved contract is correct and implementation is wrong:

```text
revise-apply
→ minimum code/test correction
```

If the finding shows the approved Proposal itself must change materially:

```text
STOP
→ do not rewrite Proposal inside Apply
→ require Owner-authorized return to revise-propose / earlier boundary
```

### 3. Apply minimum implementation correction

- change only what the approved contract requires;
- remove accidental scope expansion when necessary;
- rerun affected verification plus required regression checks.

### 4. Preserve verdict/authority separation

Do not modify reviewer verdicts or fabricate Verification/Owner facts.

## Forbidden

Do not:

- hide failing tests;
- remove inconvenient evidence;
- expand scope to make a test pass;
- introduce deferred/non-goal capabilities;
- repair a Proposal defect by silently changing implementation semantics;
- continue to another lifecycle Action automatically.

## Handoff continuity

Preserve the latest revision delta plus all materially required uncommitted ancestor state by cumulative payload or exact retrievable ancestor references. Carry exact removal information when paths are deleted/renamed; do not create a payload registry/database.

## Output

Corrected implementation + evidence ready for independent review-apply.

## Implementation Convergence During Revision

When correcting Apply findings:

1. repair only the implementation defect actually proven by review;
2. reuse the existing seam whenever it can satisfy the approved contract;
3. remove accidental abstractions, dependencies, or unrelated refactors introduced during Apply;
4. do not respond to a narrow defect by generalizing the subsystem;
5. if the required fix changes the approved contract, STOP and request the proper Owner-authorized boundary return.

The revision target is the smallest faithful implementation, not a broader redesign.


## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

此条款用于 D05 independent-bootstrap；不读取、调用或委托 candidate 产品 HOW 管理 D05。三文件 Run 记录真实本次执行，材料置于 artifacts，不新增 Run 文件、Registry、自动 Review/下一步或 Git 权限。

只读准备通过后，在业务修改前记录实际开始的 action.md/context.json；真实工作完成后才写 result.json 并读回。开始记录失败不做业务修改，开始后中断或保存失败保留已写 bytes 并明确报告未完成，不补造 PASS、不覆盖或清理历史、不从目录存在推断已获接管权限。bootstrap 三文件不是 canonical 产品 Run 的 schema 样例；D05 历史不转换，后续独立 Reviewer 记录自己的实际 verdict。
