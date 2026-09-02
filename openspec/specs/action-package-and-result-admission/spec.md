# action-package-and-result-admission Specification

## Purpose
为 Flowkit Core 提供最小、可序列化且 fail-closed 的 ActionPackage 与 Result admission contract，使一次 Standard Action execution 只能针对 exact current Action 与 exact current Run occurrence，并保持 Author、Reviewer、Verification 与 Policy 边界分离。

## Requirements

### Requirement: ActionPackage freezes the exact current execution boundary
系统 SHALL 提供一个 closed package-formation seam，从已经通过既有 structural validation 的 exact current `CurrentAction`、current `RunContextRecord`（或字段等价的 canonical facts）与该 Action 已由 trusted canonical Guidance resolver 形成的 exact `GuidanceRef` 形成一个 closed ActionPackage。formation SHALL 要求 context 的 ActionIdentity 与 current Action identity 完全一致、context lifecycle state 与 current state 完全一致且均为 `prepared`，并要求 context role 精确等于该 Standard Action 的 deterministic execution role；`GuidanceRef` 的 canonical path SHALL 精确对应 current Action 的 `StandardActionId`，并 SHALL 携带 exact canonical content identity。随后 ActionPackage SHALL 复用 context 中的 exact Run occurrence/runId、该 expected execution role、显式 OwnerAuthorityFact 或其 absence、以及 `previousRunId` predecessor provenance，并额外冻结 exact `GuidanceRef`。任一 Run/Action/role/state mismatch、missing/invalid/wrong-Action GuidanceRef、`terminal`/null lifecycle state 或已移除的 `resumed` state SHALL fail closed，且系统 SHALL NOT 形成可执行 ActionPackage。ActionPackage SHALL 具有自己的 exact closed validation envelope，而 SHALL NOT 因新增 execution-only Guidance identity 改变 durable `RunContextRecord` / `context.json` schema。ActionPackage SHALL NOT 以新的 PackageId / ResultId 替代既有 Run occurrence 作为本 capability 的 execution correlation identity。

#### Scenario: Package a prepared current Action
- **WHEN** exact current Action 与 exact current Run occurrence 均属于同一 Standard Action，current state 为 `prepared`，且 trusted resolver 已形成与该 Action 对齐的 valid exact GuidanceRef
- **THEN** 系统 SHALL 形成保留 exact run/action/role/state/authority/predecessor facts 与 exact GuidanceRef 的 ActionPackage

#### Scenario: Reject terminal package input
- **WHEN** 用于形成 ActionPackage 的 current Action/context lifecycle state 为 `terminal`、null、`resumed` 或其他非 `prepared` 值
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 形成可执行 ActionPackage

#### Scenario: Reject mismatched package-formation facts
- **WHEN** current Run context 的 ActionIdentity 或 lifecycle state 与 exact current Action 不一致，或 context role 不等于该 Standard Action 的 deterministic execution role
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 从这些 facts 形成 ActionPackage

#### Scenario: Reject missing or wrong-Action Guidance identity
- **WHEN** package formation 缺失 GuidanceRef，或 GuidanceRef canonical path 不对应 exact current Action 的 `StandardActionId`
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 形成可执行 ActionPackage

#### Scenario: Preserve durable RunContext schema while packaging Guidance
- **WHEN** valid RunContext facts 与 valid exact GuidanceRef 被组合成 ActionPackage
- **THEN** Guidance identity SHALL 只存在于 execution package contract 中，且 SHALL NOT 要求向 durable `context.json` 增加 Guidance field

#### Scenario: Package a re-execution occurrence for the same prepared Action
- **WHEN** exact same current Action 已保持为 `prepared A`，且调用边界为 A 提供新的 valid Run context / Run occurrence 与当前 canonical GuidanceRef
- **THEN** 系统 SHALL 能够直接从 existing `prepared A`、新的 exact Run context 与 exact GuidanceRef 形成新的 ActionPackage，而不得要求再次 prepare A 或引入 `resumed`

### Requirement: Standard Action execution role is deterministic and closed
系统 SHALL 以固定映射确定 Standard Action 的 execution role：`review-explore`、`review-propose`、`review-apply` SHALL 由 Reviewer 执行；`explore`、`revise-explore`、`propose`、`revise-propose`、`apply`、`revise-apply`、`archive` SHALL 由 Author 执行。该映射 SHALL 只表达 execution ownership，不 SHALL 推导 Action 的 Policy legality 或顺序。

#### Scenario: Bind a reviewer-owned Action
- **WHEN** ActionPackage 对应 `review-propose`
- **THEN** expected execution role SHALL 为 `reviewer`

#### Scenario: Bind an author-owned Action
- **WHEN** ActionPackage 对应 `revise-propose`
- **THEN** expected execution role SHALL 为 `author`

### Requirement: Candidate Result must link exactly to the ActionPackage
系统 SHALL 要求 candidate Result 的 runId 与 ActionIdentity 分别精确等于 ActionPackage 的 runId 与 ActionIdentity。系统 SHALL reject wrong Run、wrong Delivery/Change/Action linkage，且 SHALL NOT 通过 trim、alias、case-fold、default 或推断修复 mismatch。

#### Scenario: Reject wrong Run linkage
- **WHEN** candidate Result 的 ActionIdentity 正确但 runId 不等于 ActionPackage.runId
- **THEN** 系统 SHALL reject 该 Result

#### Scenario: Reject wrong Action linkage
- **WHEN** candidate Result 的 runId 与 package 相同但 ActionIdentity 任一 component 不匹配
- **THEN** 系统 SHALL reject 该 Result

### Requirement: Result outcome slots preserve execution authority separation
系统 SHALL 根据 ActionPackage 的 execution role 限制 Standard Action Result 可填充的 outcome slot。Author execution SHALL NOT 提交 Reviewer verdict；Reviewer execution SHALL NOT 提交 Author conclusion；任何 Standard Action execution SHALL NOT 提交正式 Verification verdict。未适用的 authority slot SHALL 保持 null/absent contract value，而不得由 admission 推断或复制其他 outcome。

#### Scenario: Admit an Author outcome without Reviewer or Verification authority
- **WHEN** Author-owned Action 的 candidate Result 只提供 Author conclusion，并保持 Reviewer verdict 与 Verification verdict 未适用
- **THEN** 系统 SHALL 保持三类 outcome authority 分离并允许继续 admission

#### Scenario: Reject Reviewer verdict from an Author execution
- **WHEN** Author-owned Action 的 candidate Result 尝试填充 Reviewer verdict
- **THEN** 系统 SHALL reject 该 Result

#### Scenario: Reject formal Verification verdict from a Standard Action
- **WHEN** 任一 Author/Reviewer Standard Action candidate Result 尝试填充 formal Verification verdict
- **THEN** 系统 SHALL reject 该 Result

### Requirement: Admission remains a bounded validation seam
系统 SHALL 将 successful admission 的职责限制为确认 candidate Result 属于 exact ActionPackage/current Action boundary，并返回已接纳的 Result fact。系统 SHALL NOT 在本 capability 中解释 reported `nextBoundary` 的 Policy legality、自动选择或执行下一 Action、执行 terminal transition、建立 replay/nonce registry，或替代 durable Run persistence。

#### Scenario: Preserve nextBoundary as opaque admitted data
- **WHEN** 一个 otherwise admissible Result 携带结构合法的 reported nextBoundary
- **THEN** admission SHALL 原样保留该值，但 SHALL NOT 据此判断下一 Action 是否 legal

#### Scenario: Admission stops before terminal or next-Action orchestration
- **WHEN** candidate Result 通过本 capability 的所有 admission checks
- **THEN** 系统 SHALL 返回 admitted Result fact，并 SHALL NOT 自动 terminalize current Action 或执行下一 Action

### Requirement: Result admission binds to the exact current prepared Action and Run occurrence
系统 SHALL 在 admission 时同时比较 ActionPackage、exact current Action 与 exact current Run occurrence。只有 package ActionIdentity 与 current Action identity 完全一致、package/current state 均完全为 `prepared`、package runId 与 exact current Run occurrence runId 完全一致时，candidate Result 才有资格继续 admission；任一 mismatch SHALL fail closed。

#### Scenario: Reject a stale prior occurrence of the same Standard Action after lifecycle contraction
- **WHEN** 一个旧 ActionPackage 与当前 Action 拥有相同 ActionIdentity、role 与 `prepared` lifecycle state，但 package runId 不等于 exact current Run occurrence runId
- **THEN** 系统 SHALL reject 该 candidate

#### Scenario: Admit exact current prepared occurrence freshness inputs
- **WHEN** package/current Action identity、`prepared` state 与 exact current Run occurrence 均完全一致
- **THEN** 系统 SHALL 允许 candidate Result 进入后续 Result linkage / authority-slot admission checks

#### Scenario: Reject removed or terminal lifecycle states at admission
- **WHEN** package 或 exact current Action 使用 `resumed`、`terminal` 或其他非 `prepared` lifecycle state
- **THEN** 系统 SHALL fail closed，且不得把该 state normalize 为 executable state
