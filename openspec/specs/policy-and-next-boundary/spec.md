# policy-and-next-boundary Specification

## Purpose

为 Flowkit Foundation 提供 deterministic、fail-closed 且 serialization-safe 的 legal-boundary Policy，使既有 Change、CurrentAction、exact terminal RunContext/RunResult linkage 与显式 Owner correction facts 能收敛为唯一 READY boundary 或 machine-distinguishable BLOCKED diagnosis，而不承担 Action execution、调度或 repository mutation。

## Requirements

### Requirement: Policy is a pure closed legality decision seam
系统 SHALL 仅基于当前 canonical Change structural state、zero-or-one CurrentAction、terminal 时对应的 exact current RunContextRecord + RunResultRecord，以及可选的 explicit Owner correction request 计算当前 legal boundary。Policy decision SHALL 只允许以下三类 closed result：`READY_ACTION(actionId)`、`READY_CHECKPOINT_EVALUATION`、`BLOCKED(reason)`。Policy SHALL NOT 执行 Standard Action、创建 Run/Result/OwnerAuthorityFact、修改 Change/Action state、读取 OpenSpec filesystem/CLI、执行 Git mutation、调度/poll 下一 Action 或把 READY 解释为 host 已被授权且必须立即 invocation。

#### Scenario: Report a legal Action without executing it
- **WHEN** canonical facts 唯一确定当前 legal Standard Action 为 `apply`
- **THEN** Policy SHALL 返回 `READY_ACTION(apply)` 并 STOP，且不得执行 apply、创建 Run 或生成 Owner authority

#### Scenario: Reject malformed Policy facts
- **WHEN** Policy input 包含未知 Change/Action state、非法 StandardActionId、malformed OwnerAuthorityFact/correction request、terminal CurrentAction 缺少所需 exact current RunContext/Result pair、Run linkage 不一致，或其他无法作为 canonical facts 解释的输入
- **THEN** Policy SHALL fail closed 为 `BLOCKED(invalid-policy-input)` 或更具体的本 capability blocked reason，且不得 normalize、补默认值或猜测 legal boundary

### Requirement: Post-archive completed materialization has highest Change-state precedence
Policy SHALL 在 generic non-active Change guard 之前识别唯一 post-archive exception：仅当 Change state 为 `completed`、CurrentAction 为 exact `terminal archive`、提供 exact current terminal RunContextRecord 与通过同一 runId + ActionIdentity linkage 的 terminal Result、且 `authorConclusion` 为 exact `PASS` 时，normal boundary SHALL 为 checkpoint-evaluation。识别该 normal boundary 后，Policy SHALL 按统一 reported-boundary consistency 规则校验 Result 的 `nextBoundary`：null 或 exact token `checkpoint` SHALL 通过，其他 non-null value SHALL 返回 `BLOCKED(reported-boundary-conflict)`。其他 `planned`、`completed`、`cancelled` state SHALL 返回 `BLOCKED(change-not-active)`。当 Change 仍为 `active` 且 CurrentAction 为 `terminal archive`、exact-current-run linked Result 的 `authorConclusion` 为 `PASS` 时，Policy SHALL 返回 `BLOCKED(archive-completion-state-mismatch)`，不得提前宣称 checkpoint-evaluation。

#### Scenario: Recognize exact completed Archive materialization
- **WHEN** Change 为 `completed`、CurrentAction 为 exact `terminal archive`、exact-current-run linked terminal Result 的 `authorConclusion` 为 `PASS` 且 reported `nextBoundary` 为 null 或 `checkpoint`
- **THEN** Policy SHALL 返回 `READY_CHECKPOINT_EVALUATION`

#### Scenario: Block a conflicting completed Archive handoff
- **WHEN** Change 为 `completed`、CurrentAction 为 exact `terminal archive`、exact-current-run linked terminal Result 的 `authorConclusion` 为 `PASS`，但 reported `nextBoundary` 为非 null 且不等于 `checkpoint`
- **THEN** Policy SHALL 返回 `BLOCKED(reported-boundary-conflict)`，且不得由 generic non-active guard 把该 handoff drift 掩盖成 `change-not-active`

#### Scenario: Block non-active Change outside the exact post-archive shape
- **WHEN** Change 为 `planned`、`cancelled`，或为 `completed` 但不满足 exact completed/archive/PASS materialization shape
- **THEN** Policy SHALL 返回 `BLOCKED(change-not-active)`

#### Scenario: Do not advertise checkpoint before Archive materialization completes
- **WHEN** Change 仍为 `active`、CurrentAction 为 exact `terminal archive` 且 exact-current-run linked terminal Result 的 `authorConclusion` 为 `PASS`
- **THEN** Policy SHALL 返回 `BLOCKED(archive-completion-state-mismatch)`

### Requirement: Active Change normal Standard Action boundary is deterministic
对于 `active` Change，Policy SHALL 使用 closed normal matrix 计算 Standard Action boundary。CurrentAction 为空时 normal boundary SHALL 为 `explore`；CurrentAction 为 `prepared A` 时 normal boundary SHALL 仍为 exact A。terminal Author actions SHALL 仅在 exact `authorConclusion == "PASS"` 时映射：`explore|revise-explore → review-explore`、`propose|revise-propose → review-propose`、`apply|revise-apply → review-apply`。terminal Reviewer actions SHALL 仅按 exact `reviewerVerdict` 映射：`review-explore approved → propose`、`review-explore changes-requested → revise-explore`、`review-propose approved → apply`、`review-propose changes-requested → revise-propose`、`review-apply approved → archive`、`review-apply changes-requested → revise-apply`。未知/不成功 Author outcome SHALL fail closed 为 `unrecognized-or-unsuccessful-author-outcome`；未知/null Reviewer verdict SHALL fail closed 为 `unrecognized-reviewer-verdict`。

#### Scenario: Start an active Change with Explore
- **WHEN** Change 为 `active` 且 CurrentAction slot 为空
- **THEN** normal boundary SHALL 为 `explore`

#### Scenario: Keep a prepared Action as the only legal Action
- **WHEN** Change 为 `active` 且 CurrentAction 为 `prepared propose`
- **THEN** normal boundary SHALL 为 exact `propose`，不得切换到 review/next-stage Action

#### Scenario: Advance an approved Proposal review to Apply
- **WHEN** Change 为 `active`、CurrentAction 为 `terminal review-propose`、exact-current-run linked Result 的 `reviewerVerdict` 为 `approved`
- **THEN** normal boundary SHALL 为 `apply`

#### Scenario: Route a requested Apply revision back to revise-apply
- **WHEN** Change 为 `active`、CurrentAction 为 `terminal review-apply`、exact-current-run linked Result 的 `reviewerVerdict` 为 `changes-requested`
- **THEN** normal boundary SHALL 为 `revise-apply`

#### Scenario: Reject an unsuccessful Author outcome
- **WHEN** Change 为 `active`、CurrentAction 为 terminal Author Action 且 exact-current-run linked Result 的 `authorConclusion` 不是 exact `PASS`
- **THEN** Policy SHALL 返回 `BLOCKED(unrecognized-or-unsuccessful-author-outcome)`

### Requirement: Terminal Result is bound to the exact current Run before outcome or correction evaluation
对于 terminal Standard Action，Policy SHALL 在解释 outcome 或 reported `nextBoundary` 前要求同时提供 exact current terminal `RunContextRecord` 与 terminal `RunResultRecord`。Policy SHALL 复用既有 Run persistence linkage truth：terminal context 的 ActionIdentity SHALL 精确等于 CurrentAction identity，且 context/result SHALL 满足既有 matching Run linkage（包含 `terminalResult.runId == terminalRunContext.runId` 与 exact ActionIdentity linkage）。缺失任一 terminal fact、wrong ActionIdentity、runId mismatch，或将同一 Standard Action 的 prior Run Result 与 current terminal RunContext 混用，均 SHALL 返回 `BLOCKED(terminal-result-missing-or-mismatched)`，不得读取该 Result 的 outcome 或 `nextBoundary`。Policy SHALL 在 exact current Run linkage 通过后从 canonical facts 计算 deterministic normal boundary，再将 Result 的 reported `nextBoundary` 仅作为 opaque consistency fact 校验：null SHALL 不阻止 normal calculation；non-null value SHALL 精确等于 normal boundary 的 reported token（Standard Action 使用其 StandardActionId，checkpoint-evaluation 使用 `checkpoint`），否则 SHALL 返回 `BLOCKED(reported-boundary-conflict)`。Owner correction SHALL 只在该 normal consistency 已通过后评估，且不得覆盖或掩盖 conflict。

#### Scenario: Accept a matching reported normal boundary
- **WHEN** terminal `explore` 的 matching PASS Result 导出 normal boundary `review-explore`，且 Result reported `nextBoundary` 为 `review-explore`
- **THEN** reported-boundary consistency SHALL PASS 并允许继续后续 correction/READY evaluation

#### Scenario: Block a conflicting reported boundary before correction
- **WHEN** terminal `explore` 的 matching PASS Result 导出 normal boundary `review-explore`，但 Result reported `nextBoundary` 为 `propose`，即使同时提供请求 `revise-explore` 的 Owner correction
- **THEN** Policy SHALL 返回 `BLOCKED(reported-boundary-conflict)`，且不得用 Owner correction 掩盖该 handoff drift

#### Scenario: Accept the fresh Result for the exact current Run occurrence
- **WHEN** CurrentAction 为 `terminal review-explore`，exact current terminal RunContext 为 `review-explore(R2)`，terminal Result 也属于 `R2` 且 ActionIdentity 精确匹配
- **THEN** exact current Run linkage SHALL PASS，Policy MAY 继续读取该 R2 Result 的 reviewer outcome 与 reported `nextBoundary`

#### Scenario: Reject a stale Result from a previous occurrence of the same Action
- **WHEN** CurrentAction 为 `terminal review-explore`，exact current terminal RunContext 为 `review-explore(R2)`，但提供的 terminal Result 来自 prior `review-explore(R1)`，即使 R1/R2 具有相同 semantic ActionIdentity
- **THEN** Policy SHALL 返回 `BLOCKED(terminal-result-missing-or-mismatched)`，且不得让 stale R1 outcome/nextBoundary 影响 normal boundary 或 Owner correction

#### Scenario: Reject a terminal Result for another Action
- **WHEN** CurrentAction 为 `terminal review-propose`，exact current terminal RunContext 匹配该 CurrentAction，但 terminal Result 的 ActionIdentity 不精确匹配该 CurrentAction/context
- **THEN** Policy SHALL 返回 `BLOCKED(terminal-result-missing-or-mismatched)`

### Requirement: Owner correction is bounded, explicit and revise-only
Policy MAY 在 active terminal Action 已产生有效 normal boundary且 reported-boundary consistency PASS 后应用一个 explicit Owner correction request。Correction request SHALL 只包含 requested revise-family Standard Action 与 structural-valid OwnerAuthorityFact。Policy V1 SHALL 仅识别 `decision == "revise-action"`，且 authority 的 `deliveryId` / `changeId` SHALL 精确匹配当前 Delivery/Change，`scope` SHALL 精确为仅包含 requested revise Action 的单元素 array。缺失 authority SHALL 返回 `BLOCKED(owner-authority-required)`；structural-invalid 或 decision/identity/scope 不匹配 SHALL 返回 `BLOCKED(owner-authority-rejected)`。

允许的 correction SHALL 仅按 current terminal Action 所属 reached stage 向当前或更早阶段回退：explore stage (`explore|revise-explore|review-explore`) 只允许 `revise-explore`；propose stage (`propose|revise-propose|review-propose`) 允许 `revise-propose|revise-explore`；apply stage (`apply|revise-apply|review-apply`) 允许 `revise-apply|revise-propose|revise-explore`。其他 target、prepared CurrentAction 上的切换、archive/completed reopening 或任何 forward skip SHALL 返回 `BLOCKED(unsupported-owner-correction)`。Owner correction SHALL NOT 作为 normal apply/archive invocation authority，也 SHALL NOT 自动执行 requested Action。

#### Scenario: Allow proactive Explore revision with matching Owner authority
- **WHEN** terminal `explore` 的 normal/reported boundary 均为 `review-explore`，Owner correction 请求 `revise-explore`，且 authority 为 matching `decision=revise-action`、current Delivery/Change、`scope=["revise-explore"]`
- **THEN** correction candidate SHALL 为 `revise-explore`，随后进入统一 structural-enterability check

#### Scenario: Allow an Apply-stage correction to an earlier Proposal revision
- **WHEN** current terminal Action 属于 apply stage、normal/reported consistency PASS，Owner correction 请求 `revise-propose` 且 matching authority 有效
- **THEN** correction candidate SHALL 为 `revise-propose`，随后进入统一 structural-enterability check

#### Scenario: Reject a forward Owner skip
- **WHEN** current terminal Action 仍属于 explore stage，而 Owner correction 请求 `revise-propose`、`apply` 或其他非允许 revise target
- **THEN** Policy SHALL 返回 `BLOCKED(unsupported-owner-correction)`

#### Scenario: Require explicit matching correction authority
- **WHEN** Owner correction request 存在但缺失 authority，或 authority 的 decision/current identity/scope 与 requested revise Action 不匹配
- **THEN** Policy SHALL 分别返回 `BLOCKED(owner-authority-required)` 或 `BLOCKED(owner-authority-rejected)`

### Requirement: Every READY Action must be structurally enterable through the existing lifecycle seam
Policy SHALL 在 normal boundary 或 Owner-corrected boundary 最终发出 `READY_ACTION(target)` 前验证该 target 对 exact CurrentAction slot structurally enterable，并 SHALL 复用既有 Action lifecycle / prepared-reuse contract 而不得复制第二套 lifecycle state machine：empty slot 的 target 必须可由现有 prepare transition 建立；`prepared A` 只允许 exact A reuse 且不得 duplicate prepare；`terminal A` 的 target 必须可由现有 prepare transition 建立。候选 target 无法进入时 SHALL 返回 `BLOCKED(action-boundary-not-enterable)`。

#### Scenario: Reuse an exact prepared Action without duplicate prepare
- **WHEN** CurrentAction 为 `prepared propose` 且 candidate legal Action 为 exact `propose`
- **THEN** Policy SHALL 允许 `READY_ACTION(propose)`，并 SHALL 将其视为 prepared reuse compatibility 而不是要求 duplicate prepare

#### Scenario: Block the exact same terminal revise Action
- **WHEN** CurrentAction 为 `terminal revise-explore`，Owner correction 最终 candidate 仍为 exact `revise-explore`
- **THEN** existing terminal prepare rule SHALL 使 candidate 不可进入，Policy SHALL 返回 `BLOCKED(action-boundary-not-enterable)`

#### Scenario: Allow a different structurally enterable revise Action
- **WHEN** CurrentAction 为 `terminal propose`，Owner correction candidate 为 `revise-explore`，且 existing lifecycle prepare rule 接受该不同 ActionIdentity
- **THEN** structural-enterability check SHALL PASS 并允许 `READY_ACTION(revise-explore)`

### Requirement: Blocked diagnosis is closed and deterministic
Policy SHALL 使用 closed、machine-distinguishable blocked reason catalog，至少包含：`invalid-policy-input`、`change-not-active`、`archive-completion-state-mismatch`、`terminal-result-missing-or-mismatched`、`unrecognized-or-unsuccessful-author-outcome`、`unrecognized-reviewer-verdict`、`reported-boundary-conflict`、`owner-authority-required`、`owner-authority-rejected`、`unsupported-owner-correction`、`action-boundary-not-enterable`。同一组 canonical facts SHALL 产生等价 decision；Policy SHALL NOT 以 free-text、动态 registry、历史 Action package 形状或 nondeterministic fallback 代替该 closed diagnosis。

#### Scenario: Produce the same blocked reason for the same facts
- **WHEN** 相同 canonical Policy facts 被重复评估且包含同一个 reported-boundary conflict
- **THEN** Policy SHALL 每次产生等价 `BLOCKED(reported-boundary-conflict)` decision

#### Scenario: Do not turn checkpoint evaluation into Git authority
- **WHEN** Policy 返回 `READY_CHECKPOINT_EVALUATION`
- **THEN** 系统 SHALL 仅把它解释为 legal governance boundary，且不得据此生成 Git permission、执行 commit 或声明 checkpoint authorization 已满足
