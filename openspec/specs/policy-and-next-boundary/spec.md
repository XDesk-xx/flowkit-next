# policy-and-next-boundary Specification

## Purpose

为 Flowkit Foundation 提供 deterministic、fail-closed 且 serialization-safe 的 legal-boundary Policy，使既有 Change、CurrentAction、exact terminal RunContext/RunResult linkage 与显式 Owner correction facts 能收敛为唯一 READY boundary 或 machine-distinguishable BLOCKED diagnosis，而不承担 Action execution、调度或 repository mutation。

## Requirements

### Requirement: Policy is a pure closed legality decision seam
系统 SHALL 仅基于已经由上游 composition seam 验证/解析完成的 canonical Change structural state、zero-or-one CurrentAction、terminal 时对应的 exact current RunContextRecord + RunResultRecord，以及可选的 explicit Owner correction request 计算当前 legal boundary。对 prepared Author correction，上游 SHALL 从已验证的唯一 current Run tip 提供额外的 exact `preparedCurrentRunId`、`preparedRunContext` 与 `preparedResult`；这些输入在无 prepared correction 时可缺省或为 null，不替代既有 terminal pair。Policy SHALL 将输入 `ChangeState` 视为已经完成 exact Delivery + Change coordination/provenance/dependency binding 的 canonical fact；Policy MUST NOT 自行读取/解析 Delivery manifest、hard dependencies、activation OwnerAuthorityFact、OpenSpec filesystem/CLI 或 Git 来决定该 ChangeState。Policy decision SHALL 只允许以下三类 closed result：`READY_ACTION(actionId)`、`READY_CHECKPOINT_EVALUATION`、`BLOCKED(reason)`。Policy SHALL NOT 执行 Standard Action、创建 Run/Result/OwnerAuthorityFact、修改 Change/Action state、读取 OpenSpec filesystem/CLI、执行 Git mutation、调度/poll 下一 Action 或把 READY 解释为 host 已被授权且必须立即 invocation。Policy 继续拥有其 contract 已明确规定的 Policy-specific Owner correction eligibility（例如 `revise-action`），该 eligibility MUST NOT 被 trusted Change coordination resolver 吞并或泛化。

#### Scenario: Report a legal Action without executing it
- **WHEN** canonical resolved facts 唯一确定当前 legal Standard Action 为 `apply`
- **THEN** Policy SHALL 返回 `READY_ACTION(apply)` 并 STOP，且不得执行 apply、创建 Run 或生成 Owner authority

#### Scenario: Consume resolved active without resolving activation provenance
- **WHEN** Policy 收到 exact Delivery/Change identity 与 canonical resolved `changeState=active`
- **THEN** Policy MAY 按既有 active-Change normal matrix 计算 legal boundary，但 MUST NOT 读取 manifest、检查 `activate-change` scope、解析 direct dependencies 或查询 Owner decision provenance

#### Scenario: Preserve Policy-owned revise-action correction eligibility
- **WHEN** terminal Action 的 normal boundary 与 reported-boundary consistency 已满足，或 prepared Author correction 的 exact current pair 已验证，且 caller 提供 explicit Owner correction request
- **THEN** Policy SHALL 继续按本 capability 的 `revise-action` exact decision/identity/scope contract 判断 correction eligibility，而不得把该判断委托给 trusted Change coordination resolver

#### Scenario: Reject malformed Policy facts
- **WHEN** Policy input 包含未知 Change/Action state、非法 StandardActionId、malformed OwnerAuthorityFact/correction request、terminal CurrentAction 缺少所需 exact current RunContext/Result pair、prepared correction 缺少所需 exact current prepared pair、Run linkage 不一致，或其他无法作为 canonical facts 解释的输入
- **THEN** Policy SHALL fail closed 为 `BLOCKED(invalid-policy-input)` 或更具体的本 capability blocked reason，且不得 normalize、补默认值、读取 repository truth 或猜测 legal boundary

#### Scenario: Preserve normal prepared continuation without a pair
- **WHEN** CurrentAction 为 `prepared apply`、没有 Owner correction request，且 caller 未提供 prepared pair
- **THEN** 既有 normal boundary SHALL 仍为 `READY_ACTION(apply)`；不得为继续原 Action 新增 pair 前置要求

### Requirement: Post-archive completed materialization has highest Change-state precedence
Policy SHALL 在 generic non-active Change guard 之前识别唯一成功 post-archive exception：仅当 Change state 为 `completed`、CurrentAction 为 exact `terminal archive`、提供 exact current terminal RunContextRecord 与通过同一 runId + ActionIdentity linkage 的 terminal Result、且 authorConclusion 为 PASS 时，normal boundary SHALL 为 checkpoint-evaluation。新 Archive outcome 存在时 SHALL 同时为合法 completed；旧无该字段的已接纳 PASS 保持原兼容规则。Result 的 nextBoundary 为 null 或 checkpoint SHALL 通过，其他 non-null value SHALL 返回 BLOCKED(reported-boundary-conflict)。其他 planned、completed、cancelled state SHALL 返回 BLOCKED(change-not-active)。active + terminal Archive PASS SHALL 返回 BLOCKED(archive-completion-state-mismatch)，不得提前 checkpoint。

已识别 terminal Archive partial SHALL 按本 capability 的 recovery-required 规则保持 blocked，不因 coordination 已部分写成 completed 而成为成功 exception；已接纳业务 partial 与不可验证的 ChangeState 不得互相伪造。

#### Scenario: Recognize exact completed Archive materialization
- **WHEN** Change 为 completed、CurrentAction 为 exact terminal archive、matching PASS Result 的 outcome 为 completed或合法旧无字段形式，且 nextBoundary 为 null/checkpoint
- **THEN** Policy SHALL 返回 READY_CHECKPOINT_EVALUATION

#### Scenario: Block a conflicting completed Archive handoff
- **WHEN** exact completed/archive/PASS 的 reported nextBoundary 非 null 且不等于 checkpoint
- **THEN** Policy SHALL 返回 BLOCKED(reported-boundary-conflict)，不以 generic non-active guard 掩盖

#### Scenario: Block non-active Change outside the exact post-archive shape
- **WHEN** Change 为 planned、cancelled，或 completed 但不满足成功形态且不是已识别 partial
- **THEN** Policy SHALL 返回 BLOCKED(change-not-active)

#### Scenario: Do not advertise checkpoint before Archive materialization completes
- **WHEN** Change 仍为 active 且 matching terminal Archive Result 为 PASS
- **THEN** Policy SHALL 返回 BLOCKED(archive-completion-state-mismatch)

### Requirement: Active Change normal Standard Action boundary is deterministic

对于 active Change，Policy SHALL 使用 closed normal matrix。CurrentAction 为空时为 explore；prepared A 时仍为 exact A，随后仅可按 explicit Owner correction 改变 boundary。terminal Author PASS 映射保持：explore/revise-explore→review-explore、propose/revise-propose→review-propose、apply/revise-apply→review-apply。terminal Reviewer 映射保持：review-explore approved→propose、changes-requested→revise-explore；review-propose approved→apply、changes-requested→revise-propose；review-apply approved→archive、changes-requested→revise-apply。

唯一新增 Author FAIL normal 例外为 exact terminal Archive 的已验证安全 failed outcome：nextBoundary 必须为 null，normal 为 archive，最终仍需专用 structural enterability。partial 为 BLOCKED(archive-recovery-required)。六个普通 Author Action 的 exact terminal FAIL/null 仅可通过本 capability 的 explicit Owner correction 选择 revise，不新增 normal 自动继续。未请求普通失败 correction 时，或其他未知/不成功 Author outcome SHALL 为 unrecognized-or-unsuccessful-author-outcome。未知/null Reviewer verdict SHALL 为 unrecognized-reviewer-verdict；known rejected 的 null boundary SHALL 返回 review-rejected，非 null 为 reported-boundary-conflict，仅专门 Owner 规则允许其对应 revise，不自动重标 changes-requested。

#### Scenario: Start an active Change with Explore

- **WHEN** Change 为 active 且 CurrentAction 为空
- **THEN** normal boundary SHALL 为 explore

#### Scenario: Keep a prepared Action as the only legal Action

- **WHEN** active Change 的 CurrentAction 为 prepared propose
- **THEN** normal SHALL 为 propose；只有满足显式 Owner correction 才可选择合法 revise

#### Scenario: Advance an approved Proposal review to Apply

- **WHEN** active 的 terminal review-propose matching verdict 为 approved
- **THEN** normal SHALL 为 apply

#### Scenario: Route a requested Apply revision back to revise-apply

- **WHEN** active 的 terminal review-apply matching verdict 为 changes-requested
- **THEN** normal SHALL 为 revise-apply

#### Scenario: Reject an unsuccessful Author outcome

- **WHEN** terminal Author outcome 不是 PASS，且不满足专门的安全 Archive failure或partial合同，也不满足普通 Author FAIL 的 explicit Owner correction
- **THEN** Policy SHALL 返回 BLOCKED(unrecognized-or-unsuccessful-author-outcome)

#### Scenario: Recognized rejection remains stopped

- **WHEN** active exact terminal Review 为 rejected 且 nextBoundary=null
- **THEN** Policy SHALL 返回 BLOCKED(review-rejected)，不自动 revise

#### Scenario: Keep an ordinary failed Author stopped without correction

- **WHEN** active exact 普通 Author terminal FAIL、Reviewer/Verification/next 为 null，且没有 Owner correction 请求
- **THEN** Policy SHALL 返回 BLOCKED(unrecognized-or-unsuccessful-author-outcome)，不自动 revise

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

### Requirement: Owner correction is bounded, explicit and revise-only

Policy SHALL 仅在 active terminal Action 有效 normal/reported consistency 已通过，或 active prepared Author 的 exact current pair 已证明 prepared 且四个 outcome/next 槽均为 null 后，或 active exact terminal 普通 Author FAIL 的专门 pair 与 null reported boundary 已验证后，评估 explicit Owner correction。preparedCurrentRunId SHALL 等于 context/result 同一 runId，context SHALL 为 prepared/author 且 ActionIdentity 匹配 CurrentAction，context/result linkage SHALL 有效；terminal pair 不得冒充 prepared pair。prepared correction 输入缺失、wrong identity/state/role、non-null outcome SHALL 返回 invalid-policy-input；未请求 correction 时不新增该 pair 前置条件。

Correction SHALL 只接受 requested revise-family Action 与 structural-valid OwnerAuthorityFact，decision 必须为 revise-action，deliveryId/changeId 为 exact current，scope 为仅包含 requested Action 的单元素数组。缺 authority 返回 owner-authority-required；结构、decision、identity、scope 不符返回 owner-authority-rejected。

Reached-stage 规则保持：explore stage 只允许 revise-explore；propose stage 允许 revise-propose/revise-explore；apply stage 允许 revise-apply/revise-propose/revise-explore。prepared Author 可同阶段 revise；prepared Reviewer、其他 target、forward skip 与 completed reopening 均为 unsupported-owner-correction。known rejected terminal/null 仅允许对应 review 阶段同阶段 revise。

另一个窄例外为 active、exact-linked、已接纳安全 failed Archive/null boundary：Owner 明确授权时 SHALL 允许 revise-propose 或 revise-apply，以修正不能直接重试的候选。该例外不涵盖 partial、unknown、旧无 outcome Archive FAIL 或 completed Archive；不得要求修订中的候选继续等于旧 Review，但原失败证据、唯一链与安全 active 必须可证。Owner correction SHALL NOT 自动执行业务，不作为普通 archive 的额外审批。

普通失败 correction SHALL 仅接受 explore/revise-explore/propose/revise-propose/apply/revise-apply 的当前 terminal Author：current/context/result identity 与 runId exact-linked，context 为 terminal/author，Author conclusion=FAIL，Reviewer/Verification=null，reported next=null。stale/missing/错 role/state/linkage SHALL 在 Owner 判断前 fail closed；该失败的 non-null next SHALL 优先返回 reported-boundary-conflict。reported consistency 通过后 SHALL 先验证 requested revise 的 reached-stage matrix，再核对合法目标的 Owner fact；fact 仍使用上文 decision/target/单项 scope。PASS、UNKNOWN、Reviewer、completed Change、Archive partial/machine partial SHALL NOT 进入此例外。新 revise SHALL 形成新 occurrence 和直接失败 parent，原失败 SHALL 不变；新 PASS SHALL 重新进入对应独立 Review，不继承旧 approval。

#### Scenario: Allow proactive Explore revision with matching Owner authority

- **WHEN** terminal explore 的 normal/reported 为 review-explore，Owner 的 revise-explore 请求具有 exact decision/target/scope
- **THEN** correction candidate SHALL 为 revise-explore，并继续 structural-enterability 核对

#### Scenario: Allow an Apply-stage correction to an earlier Proposal revision

- **WHEN** apply-stage terminal 的 normal/reported 通过，Owner 明确授权 revise-propose
- **THEN** correction SHALL 选择 revise-propose 并核对结构可进入性

#### Scenario: Allow same-stage prepared Author correction

- **WHEN** exact prepared apply 的四槽为 null 且 Owner 的 revise-apply authority匹配
- **THEN** correction SHALL 选择 revise-apply；原 prepared 不解释为 PASS

#### Scenario: Allow prepared Author return to earlier stage

- **WHEN** prepared apply 与 matching Owner revise-propose/revise-explore 请求有效
- **THEN** correction SHALL 选择所请求合法 revise，并进行结构核对

#### Scenario: Reject a forward Owner skip

- **WHEN** 当前仍在 explore stage 而请求 revise-propose、apply 或其他 forward Action
- **THEN** Policy SHALL 返回 unsupported-owner-correction

#### Scenario: Reject prepared Reviewer or unproven current Run

- **WHEN** Owner correction 请求替换 prepared Reviewer
- **THEN** Policy SHALL 返回 unsupported-owner-correction，不产生 READY

#### Scenario: Reject missing or mismatched prepared current Run

- **WHEN** preparedCurrentRunId/context/result 缺失、不一致、错 ActionIdentity，或以 terminal pair 冒充
- **THEN** Policy SHALL 返回 invalid-policy-input，不凭 semantic identity 接受

#### Scenario: Reject non-prepared or outcome-bearing pair

- **WHEN** prepared correction 的 state/role 不是 prepared/author 或四个 outcome/next 槽任一非 null
- **THEN** Policy SHALL 返回 invalid-policy-input

#### Scenario: Require explicit matching correction authority

- **WHEN** authority 缺失或 decision/current identity/scope 不匹配
- **THEN** Policy SHALL 分别返回 owner-authority-required 或 owner-authority-rejected

#### Scenario: Recognized rejected Review accepts an exact Owner revision request

- **WHEN** active review-apply rejected/null 已验证且 Owner 授权 revise-apply
- **THEN** Policy SHALL 按 known rejection 例外选择对应 revise，不改 verdict

#### Scenario: Correct candidate after a safe Archive failure

- **WHEN** active Archive 安全失败/null 已验证，Owner 明确授权 revise-propose 或 revise-apply
- **THEN** Policy SHALL 允许该 revise 新 Run 接原失败 Run，后续必须经过普通独立 Review；不能直接继承旧 candidate approval

#### Scenario: Authorize correction from each ordinary failed Author stage

- **WHEN** 六个普通 Author Action 任一有 exact FAIL/null pair，Owner 请求在 reached-stage 内的单项 revise
- **THEN** Policy SHALL 选择对应 revise 并核对结构可进入性，包括三个 revise 自身失败后的同名目标

#### Scenario: Reject inconsistent failed inputs before authorization

- **WHEN** failed pair stale/缺失/错误角色或 state，或 reported next 非 null，且同时提供 Owner fact
- **THEN** Policy SHALL 先拒绝无效输入；non-null next SHALL 为 reported-boundary-conflict，不用授权掩盖冲突

#### Scenario: Keep failed correction authority exact

- **WHEN** 普通 FAIL 请求同阶段或已到达此前阶段的合法 revise，但 authority 缺失或 decision/Delivery/Change/单项 scope 不匹配
- **THEN** Policy SHALL 分别返回 owner-authority-required 或 owner-authority-rejected，不进入结构可进入性判断

#### Scenario: Exclude recovery outcomes from ordinary failure correction

- **WHEN** 请求把 UNKNOWN、Reviewer failure、completed Change 或 Archive partial/machine partial 作为普通 Author FAIL
- **THEN** Policy SHALL 保持各自原拒绝/恢复边界，不产生此 correction 的 READY

### Requirement: Every READY Action must be structurally enterable through the existing lifecycle seam

Policy SHALL 在发出 READY_ACTION 前验证 exact CurrentAction slot 可进入，复用 existing lifecycle/prepared-reuse/supersession 以及专用 Archive retry contract，不复制 state machine。empty slot 用普通 prepare；prepared A 的 normal target 仅 exact A reuse，该查询 boundary SHALL NOT 授权创建新的 occurrence。prepared Author 的 Owner revise 使用有界 supersession，包括不同 identity 以及同 identity 的三个 revise。该 correction SHALL 已通过 active Change、exact prepared current Run/context/result linkage、prepared/author、四个 outcome/next 槽 null、reached-stage 和现有 revise-action authority 的全部校验；缺失、错配或前跳 SHALL 保持既有 blocked diagnosis。terminal 的不同 identity 用普通 prepare；已核准的安全失败 Archive same identity SHALL 使用原窄 retry transition；已验证普通 Author FAIL correction 的三个同名 revise SHALL 使用专门的新 occurrence 结构边。新 prepared 同名 revise 边和这些 terminal 边 SHALL NOT 仅凭裸 READY token 开放。不可进入时 SHALL 返回 action-boundary-not-enterable。

#### Scenario: Reuse an exact prepared Action without duplicate prepare
- **WHEN** CurrentAction 为 prepared propose 且无 Owner correction，legal target 为 propose
- **THEN** Policy SHALL 返回 READY_ACTION(propose)，不要求 duplicate prepare，也不授权新的 Run

#### Scenario: Enter an authorized prepared revise
- **WHEN** prepared Author apply 的 exact Owner target 为 revise-propose 且 supersession 接受
- **THEN** Policy SHALL 允许 READY_ACTION(revise-propose)，不执行

#### Scenario: Enter a new occurrence after the same prepared revise
- **WHEN** active exact prepared Author revise-explore/revise-propose/revise-apply 的完整 current pair、四槽 null 及对应同名 Owner correction 全部有效
- **THEN** Policy SHALL 经有界 supersession 核对后返回对应 READY_ACTION，不以 same identity 拒绝，也不修改旧 occurrence

#### Scenario: Reject an unauthorized prepared continuation
- **WHEN** 同名 prepared revise correction 的 authority 缺失或 decision/Delivery/Change/单一 scope 不符，或其 current pair 陈旧、不完整、非 Author、非 prepared、含 non-null outcome
- **THEN** Policy SHALL 按既有 authority/pair diagnosis 拒绝；普通 reuse 的 READY SHALL NOT 补足这些条件

#### Scenario: Block the exact same terminal revise Action
- **WHEN** active exact terminal revise-explore 为 PASS，normal/reported consistency 有效，且 exact Owner correction 指向同名 revise-explore 并通过阶段/authority 核对
- **THEN** Policy SHALL 返回 action-boundary-not-enterable；prepared continuation 与 Archive retry 例外均不适用

#### Scenario: Allow a different structurally enterable revise Action
- **WHEN** terminal propose 的合法 correction 为 revise-explore 且普通 prepare 接受
- **THEN** Policy SHALL 允许 READY_ACTION(revise-explore)

#### Scenario: Enter only the dedicated Archive retry
- **WHEN** 安全失败 Archive 的 normal target 为同 identity archive
- **THEN** Policy SHALL 要求专用 retry seam 接受，否则返回 action-boundary-not-enterable

#### Scenario: Enter a new occurrence after the same revise fails
- **WHEN** exact terminal revise-explore/revise-propose/revise-apply 为 FAIL/null 且同名 Owner correction 全部核准
- **THEN** Policy SHALL 验证专门结构边后允许 READY_ACTION，不 reopen 或 reuse 原 occurrence

### Requirement: Blocked diagnosis is closed and deterministic
Policy SHALL 使用 closed machine-distinguishable catalog，至少包含 invalid-policy-input、change-not-active、archive-completion-state-mismatch、archive-recovery-required、terminal-result-missing-or-mismatched、unrecognized-or-unsuccessful-author-outcome、unrecognized-reviewer-verdict、review-rejected、reported-boundary-conflict、owner-authority-required、owner-authority-rejected、unsupported-owner-correction、action-boundary-not-enterable。同组 canonical facts SHALL 产生等价结果，不使用 free-text、动态 Registry 或不确定 fallback 替代。

#### Scenario: Produce the same blocked reason for the same facts
- **WHEN** 相同 facts 包含同一 reported conflict
- **THEN** Policy SHALL 返回等价 reported-boundary-conflict

#### Scenario: Do not turn checkpoint evaluation into Git authority
- **WHEN** Policy 返回 READY_CHECKPOINT_EVALUATION
- **THEN** 它 SHALL 仅为合法治理边界，不产生 Git permission 或执行 commit

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

### Requirement: Archive failures expose retry or recovery without inventing execution
Policy SHALL 在 exact current Run linkage 验证后解释封闭 Archive outcome，不读取文件系统或执行 OpenSpec。安全 failed 必须是 active、Author FAIL、null nextBoundary，才可选择 archive；新 start 仍须重新核对真实安全状态、Review/candidate 和 ordinal。partial 必须为 Author FAIL/null，SHALL 返回 archive-recovery-required；composition 无法解析真实 ChangeState 时 SHALL 暴露同类恢复阻断，不伪造 canonical state。失败 Result 非 null reported boundary SHALL 返回 reported-boundary-conflict。无受支持 outcome 的普通 FAIL 保持旧 blocked行为。

#### Scenario: Retry is offered but not executed
- **WHEN** matching active terminal Archive 具有安全 failed outcome且null boundary
- **THEN** Policy SHALL 计算 READY_ACTION(archive)，不创建 Run，不执行命令，不要求 Result 自签 next=archive

#### Scenario: Partial stays blocked even after some completion writes
- **WHEN** matching terminal Archive 为 partial，包括 coordination 已写而其他确认不完整
- **THEN** Policy/查询 SHALL 保持 archive-recovery-required，不将它解释成 checkpoint-ready或安全重试

#### Scenario: Stale outcome cannot authorize a new attempt
- **WHEN** failure Result 与当前 context 的 runId或ActionIdentity不匹配
- **THEN** Policy SHALL 先返回 terminal-result-missing-or-mismatched，不消费旧 retryable 标记
