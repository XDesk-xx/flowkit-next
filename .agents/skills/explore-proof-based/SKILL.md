---
name: explore-proof-based
description: Proof-based Explore for Flowkit changes. Use to investigate contract-changing unknowns, persist first-Explore project ordinal facts in the independent bootstrap plane, bound real scope, and stop exploration before it drifts into non-goal subsystems.
metadata:
  author: flowkit
---

# Explore Proof-Based Skill

## Purpose

Execute Explore as a bounded, proof-based investigation before Proposal.

Explore exists to answer:

> What must be true for this Change to be proposed safely, and what is the smallest real problem boundary?

Explore may broaden the question space temporarily, but it MUST NOT silently broaden the product input domain or turn the Change into a generic subsystem.

## Authority Boundary

Policy / Owner authority decides whether an Action is legal.

This skill defines HOW Explore is performed after the exact Explore Action is already current/legal.

Explore evidence is not approval. Reviewer approval is still required before Proposal.

Owner scope correction overrides prior exploratory direction. When Owner narrows the real use case, obsolete proof branches become historical risk evidence, not mandatory Proposal blockers.

This independent D03/D04 bootstrap skill MUST NOT read or execute candidate `skills/actions/explore/SKILL.md`.

## First-Explore project ordinal bootstrap parity

`semantic ChangeId` remains canonical identity. `projectOrdinal` is only a durable project-wide monotonic sequence/archive-naming fact.

After the exact Explore Action is already legal/current:

1. Read the exact Delivery Change coordination entry.
2. If it already has a valid positive-integer `projectOrdinal`, reuse it unchanged.
3. If absent, inspect durable already-assigned `projectOrdinal` facts from repository Delivery Change coordination entries.
4. Require the durable assigned facts to be valid, unique and internally consistent. On malformed, duplicate, contradictory or insufficient facts, STOP fail-closed.
5. Derive the next value only as `max(existing assigned projectOrdinal) + 1` and persist it exactly once on the exact current Change entry.
6. Planned-only Changes reserve nothing. An explored-then-cancelled Change keeps its assigned ordinal consumed.

Never use Delivery array position, Run number, `changeStartSequence`, completed/archive counts, physical Run-group prefix, or archive-directory counting as fallback sequencing input.

If there is no durable assigned ordinal baseline, STOP for an explicit bounded bootstrap/Owner decision rather than inventing an initial value.

This is bootstrap HOW maintenance only. It does not decide activation/legality and does not create a Registry, counter service, allocator subsystem, new lifecycle state or self-hosting convergence.

## Core Principle

For each material uncertainty:

```text
Risk
→ Question
→ Proof
→ Evidence
→ Decision impact
→ Boundary
```


## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

此条款用于 D05 independent-bootstrap；不读取、调用或委托 candidate 产品 HOW 管理 D05。三文件 Run 记录真实本次执行，材料置于 artifacts，不新增 Run 文件、Registry、自动 Review/下一步或 Git 权限。

只读准备通过后，在业务修改前记录实际开始的 action.md/context.json；真实工作完成后才写 result.json 并读回。开始记录失败不做业务修改，开始后中断或保存失败保留已写 bytes 并明确报告未完成，不补造 PASS、不覆盖或清理历史、不从目录存在推断已获接管权限。bootstrap 三文件不是 canonical 产品 Run 的 schema 样例；D05 历史不转换，后续独立 Reviewer 记录自己的实际 verdict。

Proof budget follows decision impact.

Do not prove edge cases merely because they exist. Continue proof only when the uncertainty can change the current contract, block the real use case, or invalidate an important assumption.

## Process

### 1. Establish the real use case

Record:

- Owner-stated goal
- current Delivery / Change scope
- real actors and inputs
- existing contracts/specs
- known non-goals

Separate:

```text
Facts
Assumptions
Unknowns
Future possibilities
```

Do not treat a future possibility as a current input domain without authority.

### 2. Scan material risks

Consider only risks relevant to the current Change, including when applicable:

- authority / identity
- lifecycle boundary
- persistence/state integrity
- compatibility
- migration
- verification closure
- future direct consumer impact
- scope expansion

### 3. Prioritize proof

For each important risk ask:

1. Is it inside the real authorized input domain?
2. Can it change the contract?
3. Can it block the minimum real use case?

If all three are no:

```text
record as limitation / future risk if valuable
→ stop exploring that branch
```

### 4. Execute minimum decisive proof

Allowed:

- targeted source/spec inspection
- controlled experiment
- focused fixture/test
- counterexample
- small non-production prototype

Forbidden:

- unrelated refactor
- production implementation
- architecture expansion
- generic subsystem design not required by the real use case
- exhaustive proof of explicitly deferred input domains

### 4A. Check concept ownership and mutation/failure ordering when relevant

When Explore is about to introduce a new mechanism, first ask whether the need already belongs to an existing capability/entity, operation, state, configuration, validation/proof mechanic, or Guidance/HOW. Prefer the existing owner unless proof shows a real new capability boundary.

When the design is stateful or side-effecting, identify validation, the mutation/commit point, failure behavior before and after commit, and whether retry/rollback/correction remains legal. Apply this proportionally; simple non-mutating work does not need artificial lifecycle analysis.

### 5. Reduce proof into decisions

For every proof, record:

- what it established
- what decision it changes or supports
- what it does NOT establish

A proof with no decision impact should not become a Proposal requirement by default.

Keep three meanings distinct in the handoff:

- an Explore experiment is bounded evidence for an uncertainty at that time;
- an accepted decision basis is the current conclusion/boundary plus the relevant Owner and accepted-review reference;
- current implementation acceptance evidence must be produced against the current candidate during Apply/Verification.

Historical Explore proof does not become current implementation PASS. Raw experiments may be temporary when the current contract no longer depends on their bytes; carry any materially relevant Owner decision about moving, retaining, or disposing of that material, without copying the whole conversation or creating a proof store.

### 5A. Converge canonical Explore to current truth

The canonical Explore should preserve current bounded proof, conclusions, limitations, and rationale still needed to understand the current contract. It is not an append-only diary of Reviewer/Owner corrections.

When prior proof or a counterexample remains material, rewrite it as current rationale. When it is only execution chronology, keep the concise continuation-relevant fact/reference in the existing Run surface and rely on Git for exact repository history rather than copying the chronology into Explore.

File size/line count may reveal duplication but are diagnostic only; do not turn them into hard correctness thresholds.

This bootstrap rule is independent HOW. It MUST NOT read or execute candidate `skills/actions/explore/SKILL.md`.

### 6. Produce Proposal-ready boundary

Explore should end with:

- problem statement
- durable facts
- required invariants
- resolved key unknowns
- remaining limitations
- explicit non-goals / deferred concerns
- minimum Proposal direction
- PASS / FAIL / UNKNOWN

## Stop Conditions

Stop Explore successfully when:

- the minimum real use case is bounded;
- key contract-changing unknowns are resolved;
- remaining unknowns are outside the authorized input domain or explicitly deferred;
- a Proposal can be written without inventing new scope.

Stop Explore as blocked when:

- required authority is missing;
- a key claim cannot be supported;
- the real scope cannot be bounded;
- ordinal persistence facts are ambiguous/inconsistent;
- a newly discovered issue requires Owner scope/priority decision.

Never convert UNKNOWN into PASS.

## Anti-Drift Rules

Reject these patterns:

```text
edge case discovered
→ enlarge input domain
→ discover more edge cases
→ build generic subsystem
```

Prefer:

```text
edge case discovered
→ ask whether input is real
→ constrain generation/ownership when appropriate
→ prove the bounded model
→ defer non-goals
```
