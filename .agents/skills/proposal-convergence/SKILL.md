---
name: proposal-convergence
description: Converge an approved Explore into the smallest traceable, testable Proposal contract while preventing scope regression and renewed open-ended exploration.
metadata:
  author: flowkit
---

# Proposal Convergence Skill

## Purpose

Converge an approved Explore into the smallest formal Change contract that satisfies the real authorized use case.

This skill is an auxiliary Propose-stage discipline. It does not replace the normal Proposal mechanism and does not own OpenSpec lifecycle authority.

Explore may discover possibilities. Proposal commits only to what is necessary and justified.

## Core Principle

```text
Approved Explore
+ Owner decisions
+ accepted reviewer findings
→ remove alternatives and deferred branches
→ smallest explicit testable contract
```

Proposal is a convergence phase, not a second Explore phase.

## Required Inputs

Read before finalizing Proposal:

- approved/revised Explore
- latest review-explore verdict
- Owner scope/authority corrections
- relevant existing canonical specs
- relevant historical blocker closures

The handoff must include materially relevant Owner decisions that affect present judgment, including an authorized material relocation or retention boundary. Preserve the decision, scope, and concise exact reference; do not copy the full chat.

## Convergence Process

### 1. Build requirement traceability

Every proposed requirement MUST be justified by at least one of:

- explicit Owner requirement/decision
- approved Explore invariant/decision
- decisive proof result
- accepted reviewer blocker required to close the approved model
- existing canonical contract that must be preserved

If no source exists, default action is:

```text
remove
or
mark as non-goal/future work
```

Do not add a requirement because it "might be useful later".

### 2. Reconfirm the real input domain

Proposal MUST keep the bounded model accepted by Explore.

Reject accidental promotion such as:

```text
controlled generated identifier
→ arbitrary external identifier API
single writer
→ concurrency protocol
manual Author/Reviewer loop
→ multi-Agent orchestration
```

### 3. Choose the minimum contract

For each requirement ask:

> What is the smallest invariant that satisfies the approved real use case?

Prefer fail-closed/simple ownership constraints over new subsystems when they are sufficient.

### 4. Enforce non-goals

Explicitly carry forward important non-goals from Explore.

A deferred concern MUST NOT re-enter through design/tasks unless a new Owner decision changes scope.

### 5. Separate contract from implementation mechanism

Proposal/spec should state observable invariants and boundaries.

Design may select a mechanism, but MUST NOT introduce infrastructure beyond what the contract needs.

Avoid premature:

- registries
- schedulers
- generic abstractions
- databases/WAL
- concurrency/locking
- generalized external APIs

unless explicitly required.

### 6. Detect new unknowns

If Propose discovers a new uncertainty that can materially change the contract:

```text
STOP
→ record blocker
→ return to Explore / Owner decision
```

Do not perform an unbounded new investigation inside Proposal.

### 7. Close the Proposal

Before handoff to review-propose confirm:

- every requirement is traceable;
- acceptance is measurable;
- tasks implement only approved requirements;
- design contains no hidden scope expansion;
- non-goals are visible;
- no unresolved contract-changing unknown remains.

## Output

A convergence assessment that can be applied while creating/revising:

```text
proposal.md
specs/**/spec.md
design.md
tasks.md
```

The Proposal remains owned by the normal Change specification authority.

Keep canonical planning artifacts converged to current implementation-relevant content. Do not duplicate the approved Explore proof transcript or review/revision chronology into Proposal/Design. Preserve current rationale and use concise exact cross-artifact or Run/finding references when deeper provenance is material. File size/line count remain diagnostic only, not correctness Gates.

Treat Explore experiments, accepted decision basis, and current implementation acceptance evidence as distinct classes. Proposal does not depend permanently on every raw experiment by default, and historical proof must never be represented as current implementation PASS.


## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

此条款用于 D05 independent-bootstrap；不读取、调用或委托 candidate 产品 HOW 管理 D05。三文件 Run 记录真实本次执行，材料置于 artifacts，不新增 Run 文件、Registry、自动 Review/下一步或 Git 权限。

只读准备通过后，在业务修改前记录实际开始的 action.md/context.json；真实工作完成后才写 result.json 并读回。开始记录失败不做业务修改，开始后中断或保存失败保留已写 bytes 并明确报告未完成，不补造 PASS、不覆盖或清理历史、不从目录存在推断已获接管权限。bootstrap 三文件不是 canonical 产品 Run 的 schema 样例；D05 历史不转换，后续独立 Reviewer 记录自己的实际 verdict。
