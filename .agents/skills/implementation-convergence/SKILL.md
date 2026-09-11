---
name: implementation-convergence
description: Keep Flowkit Apply implementation minimal, reusable, traceable to the approved contract, and free of opportunistic redesign or unnecessary new abstractions.
metadata:
  author: flowkit
---

# Implementation Convergence Skill

## Purpose

Converge an approved Proposal into the smallest faithful implementation that satisfies the accepted contract and verification requirements.

This skill is an auxiliary Apply-stage discipline. It does not replace the normal Apply mechanism and does not own lifecycle authority.

The Apply stage is for implementation, not renewed architecture exploration.

## Core Principle

```text
Approved Proposal
+ existing repository seams
+ required verification
→ reuse first
→ minimum source/test mutation
→ no speculative abstraction
→ faithful implementation
```

A correct implementation is preferred over a generalized implementation.

## Required Inputs

Before implementing, read:

- approved Proposal/spec/design/tasks;
- latest review-propose verdict;
- Owner scope/authority decisions;
- existing source/test seams that already satisfy part of the contract;
- explicit non-goals and deferred concerns.

Do not silently import requirements from rejected Explore branches or unrelated future work.

## Implementation Discipline

### 1. Trace every material mutation

Every material source/config/test mutation SHOULD answer:

> Which approved requirement or verification need requires this change?

Valid reasons include:

- explicit requirement;
- approved design decision;
- task needed to realize the contract;
- test needed to verify a required invariant;
- minimal supporting refactor strictly necessary to implement the above.

If there is no traceable reason, do not make the mutation.

### 2. Reuse before introducing

Prefer, in order:

1. existing domain types and validators;
2. existing repository/path seams;
3. existing serialization patterns;
4. existing test helpers;
5. a small local helper;
6. a new abstraction only when the approved contract actually requires one.

Do not create a framework merely because several future Changes might someday use it.

### 3. Keep the implementation surface small

Avoid opportunistic:

```text
renaming unrelated modules
repository-wide cleanup
new dependency introduction
new framework layers
new generic registries
new plugin abstractions
new persistence engines
new concurrency machinery
future-proofing for non-goals
```

When two implementations satisfy the approved contract, prefer the one with fewer new concepts and smaller mutation scope.

### 4. Preserve explicit non-goals

Apply MUST NOT reintroduce capabilities that Explore/Proposal deliberately deferred.

Examples include, when excluded by the current Change:

```text
multi-Agent orchestration
scheduler/automatic-next execution
locking/WAL/database machinery
crash-recovery framework
generic filesystem API
unrelated CLI/integration work
future Delivery features
```

A theoretically useful capability is not sufficient justification.

### 5. Do not repair a defective contract inside Apply

If implementation reveals that the approved Proposal is materially wrong, incomplete, or impossible without changing its contract:

```text
STOP
→ record the blocker
→ report the smallest contract defect
→ require Owner-authorized return to revise-propose / earlier boundary
```

Do not silently rewrite Proposal semantics through code.

A small implementation detail that does not alter the approved contract may be resolved locally.

## Verification Discipline

Verification SHOULD be selected by actual contract risk.

Prefer:

- focused tests for new invariants;
- existing regression suites affected by the mutation;
- type/format/build checks already required by the repository;
- OpenSpec validation when formal artifacts are involved.

Do not create a generic evidence platform or unrelated acceptance matrix merely to make Apply look more rigorous.

## Simplicity Check

Before declaring Apply complete, ask:

```text
1. Did we implement every approved requirement?
2. Did we add anything not needed by the approved contract?
3. Could an existing seam have been reused instead?
4. Did we introduce a new abstraction/dependency for hypothetical future use?
5. Did implementation discover a Proposal defect that should have caused STOP?
6. Are tests focused on actual required behavior and regressions?
```

If (2), (4), or (5) is yes, converge further or stop for the proper boundary decision.

## Output Boundary

A converged Apply should leave:

- the smallest necessary implementation/test mutations;
- completed tasks that correspond to real work;
- real verification results;
- explicit note of any blocker requiring boundary return;
- no claim of Review, Verification, Archive, or checkpoint authority.

## Anti-Patterns

Avoid:

```text
"while here" refactors
"might be useful later" abstractions
framework extraction before proven reuse
new dependency for a tiny local requirement
implementing deferred non-goals
changing spec semantics in code
broad test infrastructure unrelated to the Change
```

## Final Rule

> Apply should make the approved contract real with the least new machinery possible.

Reuse existing seams. Keep mutations local. Stop when the contract itself must change.

## Handoff continuity

When Apply hands off uncommitted work, preserve the latest delta plus all materially required uncommitted ancestor state using cumulative payload or exact retrievable ancestor references. Carry exact removals for deleted/renamed paths. Do not introduce a payload registry/database.


## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

此条款用于 D05 independent-bootstrap；不读取、调用或委托 candidate 产品 HOW 管理 D05。三文件 Run 记录真实本次执行，材料置于 artifacts，不新增 Run 文件、Registry、自动 Review/下一步或 Git 权限。

只读准备通过后，在业务修改前记录实际开始的 action.md/context.json；真实工作完成后才写 result.json 并读回。开始记录失败不做业务修改，开始后中断或保存失败保留已写 bytes 并明确报告未完成，不补造 PASS、不覆盖或清理历史、不从目录存在推断已获接管权限。bootstrap 三文件不是 canonical 产品 Run 的 schema 样例；D05 历史不转换，后续独立 Reviewer 记录自己的实际 verdict。
## 代码 gate 与 Git checkpoint

代码质量保持 bounded formatting、lint 与适用行数要求；Git whitespace/禁止入库内容分别诊断，不混作 Full Test 代码 verdict。历史 proof、测试输入、原始日志的空白不自动阻断 checkpoint，不要求重复豁免，不逐 Change 加 attributes 或重写已接受材料。核对本次授权、范围、真实冲突及 Git 结果；此 HOW 不创建提交权限。Full Test 使用项目独立范围与当前 attempt，不继承普通 Action 的 candidate/reuse。
