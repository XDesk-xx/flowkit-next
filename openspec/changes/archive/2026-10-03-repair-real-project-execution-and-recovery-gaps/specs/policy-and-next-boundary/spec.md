## ADDED Requirements

### Requirement: Known rejection permits only explicitly authorized corresponding revision

对active、exact-linked terminal Reviewer rejected且reported nextBoundary=null，默认decision SHALL 为BLOCKED(review-rejected)。只有明确Owner correction，decision=revise-action、same Delivery/Change、单元素scope精确等于所请求同阶段revise时，Policy SHALL 允许review-explore→revise-explore、review-propose→revise-propose、review-apply→revise-apply，并通过既有structural enterability。该known exception SHALL 不放宽未知outcome、reported conflict、prepared Reviewer或archive/completed guard，不读取filesystem、执行Action或生成Owner事实。

#### Scenario: No correction means stopped rejection
- **WHEN** 当前Review为合法rejected且没有Owner correction
- **THEN** Policy SHALL 返回BLOCKED(review-rejected)，不自动revise/advance/archive

#### Scenario: Exact Owner correction selects a legal new revise
- **WHEN** exact rejected review-propose与匹配scope=[revise-propose]的Owner correction有效
- **THEN** Policy SHALL 在structural enterability通过后返回READY_ACTION(revise-propose)，不执行它

#### Scenario: Rejection cannot hide a reported conflict or skip stage
- **WHEN** rejected宣称非null nextBoundary，或Owner请求其他阶段/forward target
- **THEN** Policy SHALL 分别返回reported-boundary-conflict或unsupported-owner-correction，不以known rejection例外掩盖冲突

## MODIFIED Requirements

### Requirement: Active Change normal Standard Action boundary is deterministic
对于 `active` Change，Policy SHALL 使用 closed normal matrix 计算 Standard Action boundary。CurrentAction 为空时 normal boundary SHALL 为 `explore`；CurrentAction 为 `prepared A` 时 normal boundary SHALL 仍为 exact A，随后仅可按本 capability 的 explicit Owner correction 规则改变最终 boundary。terminal Author actions SHALL 仅在 exact `authorConclusion == "PASS"` 时映射：`explore|revise-explore → review-explore`、`propose|revise-propose → review-propose`、`apply|revise-apply → review-apply`。terminal Reviewer actions SHALL 仅按 exact `reviewerVerdict` 映射：`review-explore approved → propose`、`review-explore changes-requested → revise-explore`、`review-propose approved → apply`、`review-propose changes-requested → revise-propose`、`review-apply approved → archive`、`review-apply changes-requested → revise-apply`。未知/不成功 Author outcome SHALL fail closed 为 `unrecognized-or-unsuccessful-author-outcome`；除已识别 rejected之外的未知/null Reviewer verdict SHALL fail closed 为 `unrecognized-reviewer-verdict`。

terminal Reviewer rejected SHALL 以nextBoundary=null返回BLOCKED(review-rejected)，无普通normal Action后继；非null reported token SHALL 为reported-boundary-conflict。known rejection仅可按专门exact Owner同阶段revise规则改变blocked decision，不能自动映射changes-requested。

#### Scenario: Start an active Change with Explore
- **WHEN** Change 为 `active` 且 CurrentAction slot 为空
- **THEN** normal boundary SHALL 为 `explore`

#### Scenario: Keep a prepared Action as the only legal Action
- **WHEN** Change 为 `active` 且 CurrentAction 为 `prepared propose`
- **THEN** normal boundary SHALL 为 exact `propose`，不得正常切换到 review/next-stage Action；只有满足本 capability 的显式 Owner correction 才可选择合法 revise

#### Scenario: Advance an approved Proposal review to Apply
- **WHEN** Change 为 `active`、CurrentAction 为 `terminal review-propose`、exact-current-run linked Result 的 `reviewerVerdict` 为 `approved`
- **THEN** normal boundary SHALL 为 `apply`

#### Scenario: Route a requested Apply revision back to revise-apply
- **WHEN** Change 为 `active`、CurrentAction 为 `terminal review-apply`、exact-current-run linked Result 的 `reviewerVerdict` 为 `changes-requested`
- **THEN** normal boundary SHALL 为 `revise-apply`

#### Scenario: Reject an unsuccessful Author outcome
- **WHEN** Change 为 `active`、CurrentAction 为 terminal Author Action 且 exact-current-run linked Result 的 `authorConclusion` 不是 exact `PASS`
- **THEN** Policy SHALL 返回 `BLOCKED(unrecognized-or-unsuccessful-author-outcome)`

#### Scenario: Recognized rejection remains stopped
- **WHEN** active exact terminal Review的verdict为rejected且nextBoundary=null
- **THEN** Policy SHALL 返回BLOCKED(review-rejected)而不是unrecognized-reviewer-verdict或自动revise

### Requirement: Owner correction is bounded, explicit and revise-only
Policy MAY 在 active terminal Action 已产生有效 normal boundary 且 reported-boundary consistency PASS 后，或 active prepared Author Action 已由上游所选唯一 current tip 的 exact `preparedRunContext` + `preparedResult` 证明仍为 prepared 且四个 outcome/next 槽均为 null 后，应用一个 explicit Owner correction request。对后者，Policy SHALL 验证 `preparedCurrentRunId` 等于 context/result 的同一 runId，并验证 context 的 `lifecycleState=prepared`、`role=author`、ActionIdentity 精确等于 CurrentAction、context/result 的同一 runId 与 ActionIdentity linkage，并验证 Result 四个 outcome/next 槽均为 null；`terminalRunContext`/`terminalResult` 不得冒充 prepared pair。缺失或不完整的 prepared current Run 三项输入、与 `preparedCurrentRunId` 不一致的 RunId、wrong identity/state/role、或 non-null outcome SHALL 一律返回 `BLOCKED(invalid-policy-input)`，先于 correction eligibility，不得只凭 semantic CurrentAction identity 接受请求。未请求 prepared correction 时不新增该 pair 的前置条件。Correction request SHALL 只包含 requested revise-family Standard Action 与 structural-valid OwnerAuthorityFact。Policy SHALL 仅识别 `decision == "revise-action"`，且 authority 的 `deliveryId` / `changeId` SHALL 精确匹配当前 Delivery/Change，`scope` SHALL 精确为仅包含 requested revise Action 的单元素 array。缺失 authority SHALL 返回 `BLOCKED(owner-authority-required)`；structural-invalid 或 decision/identity/scope 不匹配 SHALL 返回 `BLOCKED(owner-authority-rejected)`。

允许的 correction SHALL 仅按 current Author/Reviewer Action 所属 reached stage 向当前或更早阶段回退：explore stage (`explore|revise-explore|review-explore`) 只允许 `revise-explore`；propose stage (`propose|revise-propose|review-propose`) 允许 `revise-propose|revise-explore`；apply stage (`apply|revise-apply|review-apply`) 允许 `revise-apply|revise-propose|revise-explore`。prepared Author Action 允许同阶段 revise；prepared Reviewer Action、archive/completed reopening、其他 target 或 forward skip SHALL 返回 `BLOCKED(unsupported-owner-correction)`。Owner correction SHALL NOT 作为 normal apply/archive invocation authority，也 SHALL NOT 自动执行 requested Action。

唯一额外terminal eligibility SHALL 为exact-linked known rejected且reported nextBoundary=null；它只允许对应review阶段的同阶段revise，并复用本Requirement的Owner identity/decision/single scope及structural-enterability检查。不放宽unknown outcome、Author FAIL、reported conflict或completed guard。

#### Scenario: Allow proactive Explore revision with matching Owner authority
- **WHEN** terminal `explore` 的 normal/reported boundary 均为 `review-explore`，Owner correction 请求 `revise-explore`，且 authority 为 matching `decision=revise-action`、current Delivery/Change、`scope=["revise-explore"]`
- **THEN** correction candidate SHALL 为 `revise-explore`，随后进入统一 structural-enterability check

#### Scenario: Allow an Apply-stage correction to an earlier Proposal revision
- **WHEN** current terminal Action 属于 apply stage、normal/reported consistency PASS，Owner correction 请求 `revise-propose` 且 matching authority 有效
- **THEN** correction candidate SHALL 为 `revise-propose`，随后进入统一 structural-enterability check

#### Scenario: Allow same-stage prepared Author correction
- **WHEN** exact current Run 为 `prepared apply`、outcome/next 均为 null，Owner correction 请求 `revise-apply` 且 exact matching authority 有效
- **THEN** correction candidate SHALL 为 `revise-apply`，随后进入统一 structural-enterability check；原 `prepared apply` 的 outcome 不得被解释为 PASS

#### Scenario: Allow prepared Author return to earlier stage
- **WHEN** exact current Run 为 `prepared apply`，Owner correction 请求 `revise-propose` 或 `revise-explore` 且 exact matching authority 有效
- **THEN** correction candidate SHALL 为所请求 revise Action，随后进入统一 structural-enterability check

#### Scenario: Reject a forward Owner skip
- **WHEN** current terminal 或 prepared Author Action 仍属于 explore stage，而 Owner correction 请求 `revise-propose`、`apply` 或其他非允许 revise target
- **THEN** Policy SHALL 返回 `BLOCKED(unsupported-owner-correction)`

#### Scenario: Reject prepared Reviewer or unproven current Run
- **WHEN** Owner correction 请求替换 prepared Reviewer Action
- **THEN** Policy SHALL 返回 `BLOCKED(unsupported-owner-correction)`，且不得产生 correction READY

#### Scenario: Reject missing or mismatched prepared current Run
- **WHEN** prepared Author correction 的 `preparedCurrentRunId`、`preparedRunContext`、`preparedResult` 任一缺失，三者 runId 不同，context/result ActionIdentity 与 CurrentAction 不同，或同时给出非 null terminal pair 冒充当前 prepared Run
- **THEN** Policy SHALL 返回 `BLOCKED(invalid-policy-input)`，且不得仅凭 CurrentAction semantic identity 接受 correction

#### Scenario: Reject non-prepared or outcome-bearing pair
- **WHEN** prepared Author correction 的 context state/role 不为 `prepared/author`，或 Result 的 `authorConclusion`、`reviewerVerdict`、`verificationVerdict`、`nextBoundary` 任一非 null
- **THEN** Policy SHALL 返回 `BLOCKED(invalid-policy-input)`，且不得把该 Result 解释为 terminal outcome

#### Scenario: Require explicit matching correction authority
- **WHEN** Owner correction request 存在但缺失 authority，或 authority 的 decision/current identity/scope 与 requested revise Action 不匹配
- **THEN** Policy SHALL 分别返回 `BLOCKED(owner-authority-required)` 或 `BLOCKED(owner-authority-rejected)`

#### Scenario: Recognized rejected Review accepts an exact Owner revision request
- **WHEN** active review-apply terminal rejected/null boundary已验证且Owner明确授权revise-apply
- **THEN** Policy SHALL 将它作为known rejection专门eligibility核对后选择revise-apply，不重标原verdict

### Requirement: Terminal Result is bound to the exact current Run before outcome or correction evaluation
对于 terminal Standard Action，Policy SHALL 在解释 outcome 或 reported `nextBoundary` 前要求同时提供 exact current terminal `RunContextRecord` 与 terminal `RunResultRecord`。Policy SHALL 复用既有 Run persistence linkage truth：terminal context 的 ActionIdentity SHALL 精确等于 CurrentAction identity，且 context/result SHALL 满足既有 matching Run linkage（包含 `terminalResult.runId == terminalRunContext.runId` 与 exact ActionIdentity linkage）。缺失任一 terminal fact、wrong ActionIdentity、runId mismatch，或将同一 Standard Action 的 prior Run Result 与 current terminal RunContext 混用，均 SHALL 返回 `BLOCKED(terminal-result-missing-or-mismatched)`，不得读取该 Result 的 outcome 或 `nextBoundary`。Policy SHALL 在 exact current Run linkage 通过后从 canonical facts 计算 deterministic normal boundary，再将 Result 的 reported `nextBoundary` 仅作为 opaque consistency fact 校验：null SHALL 不阻止 normal calculation；non-null value SHALL 精确等于 normal boundary 的 reported token（Standard Action 使用其 StandardActionId，checkpoint-evaluation 使用 `checkpoint`），否则 SHALL 返回 `BLOCKED(reported-boundary-conflict)`。Owner correction SHALL 只在该 normal consistency 已通过后评估，且不得覆盖或掩盖 conflict。

known rejected SHALL 在同一exact linkage验证后单独验证reported nextBoundary必须为null，再产生review-rejected并按专门Owner规则检查；因其没有normal Action后继，不套用普通normal boundary token映射。其他normal outcome一致性与优先顺序保持不变。

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

#### Scenario: Rejected cannot use stale linkage or a forward token
- **WHEN** rejected的pair与current Run不匹配或reported boundary非null
- **THEN** Policy SHALL 先返回对应linkage或reported-boundary-conflict阻断，不允许Owner correction掩盖

### Requirement: Blocked diagnosis is closed and deterministic
Policy SHALL 使用 closed、machine-distinguishable blocked reason catalog，至少包含：`invalid-policy-input`、`change-not-active`、`archive-completion-state-mismatch`、`terminal-result-missing-or-mismatched`、`unrecognized-or-unsuccessful-author-outcome`、`unrecognized-reviewer-verdict`、`review-rejected`、`reported-boundary-conflict`、`owner-authority-required`、`owner-authority-rejected`、`unsupported-owner-correction`、`action-boundary-not-enterable`。同一组 canonical facts SHALL 产生等价 decision；Policy SHALL NOT 以 free-text、动态 registry、历史 Action package 形状或 nondeterministic fallback 代替该 closed diagnosis。

#### Scenario: Produce the same blocked reason for the same facts
- **WHEN** 相同 canonical Policy facts 被重复评估且包含同一个 reported-boundary conflict
- **THEN** Policy SHALL 每次产生等价 `BLOCKED(reported-boundary-conflict)` decision

#### Scenario: Do not turn checkpoint evaluation into Git authority
- **WHEN** Policy 返回 `READY_CHECKPOINT_EVALUATION`
- **THEN** 系统 SHALL 仅把它解释为 legal governance boundary，且不得据此生成 Git permission、执行 commit 或声明 checkpoint authorization 已满足
