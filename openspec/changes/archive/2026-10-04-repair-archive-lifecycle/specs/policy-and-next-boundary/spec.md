## MODIFIED Requirements

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

唯一新增 Author FAIL normal 例外为 exact terminal Archive 的已验证安全 failed outcome：nextBoundary 必须为 null，normal 为 archive，最终仍需专用 structural enterability。partial 为 BLOCKED(archive-recovery-required)。其他未知/不成功 Author outcome SHALL 为 unrecognized-or-unsuccessful-author-outcome。未知/null Reviewer verdict SHALL 为 unrecognized-reviewer-verdict；known rejected 的 null boundary SHALL 返回 review-rejected，非 null 为 reported-boundary-conflict，仅专门 Owner 规则允许其对应 revise，不自动重标 changes-requested。

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
- **WHEN** terminal Author outcome 不是 PASS，且不满足专门的安全 Archive failure或partial合同
- **THEN** Policy SHALL 返回 BLOCKED(unrecognized-or-unsuccessful-author-outcome)

#### Scenario: Recognized rejection remains stopped
- **WHEN** active exact terminal Review 为 rejected 且 nextBoundary=null
- **THEN** Policy SHALL 返回 BLOCKED(review-rejected)，不自动 revise

### Requirement: Owner correction is bounded, explicit and revise-only
Policy SHALL 仅在 active terminal Action 有效 normal/reported consistency 已通过，或 active prepared Author 的 exact current pair 已证明 prepared 且四个 outcome/next 槽均为 null 后，评估 explicit Owner correction。preparedCurrentRunId SHALL 等于 context/result 同一 runId，context SHALL 为 prepared/author 且 ActionIdentity 匹配 CurrentAction，context/result linkage SHALL 有效；terminal pair 不得冒充 prepared pair。prepared correction 输入缺失、wrong identity/state/role、non-null outcome SHALL 返回 invalid-policy-input；未请求 correction 时不新增该 pair 前置条件。

Correction SHALL 只接受 requested revise-family Action 与 structural-valid OwnerAuthorityFact，decision 必须为 revise-action，deliveryId/changeId 为 exact current，scope 为仅包含 requested Action 的单元素数组。缺 authority 返回 owner-authority-required；结构、decision、identity、scope 不符返回 owner-authority-rejected。

Reached-stage 规则保持：explore stage 只允许 revise-explore；propose stage 允许 revise-propose/revise-explore；apply stage 允许 revise-apply/revise-propose/revise-explore。prepared Author 可同阶段 revise；prepared Reviewer、其他 target、forward skip 与 completed reopening 均为 unsupported-owner-correction。known rejected terminal/null 仅允许对应 review 阶段同阶段 revise。

另一个窄例外为 active、exact-linked、已接纳安全 failed Archive/null boundary：Owner 明确授权时 SHALL 允许 revise-propose 或 revise-apply，以修正不能直接重试的候选。该例外不涵盖 partial、unknown、旧无 outcome Author FAIL 或 completed Archive；不得要求修订中的候选继续等于旧 Review，但原失败证据、唯一链与安全 active 必须可证。Owner correction SHALL NOT 自动执行业务，不作为普通 archive 的额外审批。

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

### Requirement: Every READY Action must be structurally enterable through the existing lifecycle seam
Policy SHALL 在发出 READY_ACTION 前验证 exact CurrentAction slot 可进入，复用 existing lifecycle/prepared-reuse/supersession 以及专用 Archive retry contract，不复制 state machine。empty slot 用普通 prepare；prepared A 的 normal target 仅 exact A reuse；prepared Author 的不同 Owner revise 用 supersession；terminal 的不同 identity 用普通 prepare。只有已核准的安全失败 Archive same identity SHALL 使用窄 retry transition。不可进入时 SHALL 返回 action-boundary-not-enterable。

#### Scenario: Reuse an exact prepared Action without duplicate prepare
- **WHEN** CurrentAction 为 prepared propose 且 legal target 为 propose
- **THEN** Policy SHALL 返回 READY_ACTION(propose)，不要求 duplicate prepare

#### Scenario: Enter an authorized prepared revise
- **WHEN** prepared Author apply 的 exact Owner target 为 revise-propose 且 supersession 接受
- **THEN** Policy SHALL 允许 READY_ACTION(revise-propose)，不执行

#### Scenario: Block the exact same terminal revise Action
- **WHEN** terminal revise-explore 的 correction target 仍为 exact revise-explore
- **THEN** Policy SHALL 返回 action-boundary-not-enterable；Archive retry 例外不适用

#### Scenario: Allow a different structurally enterable revise Action
- **WHEN** terminal propose 的合法 correction 为 revise-explore 且普通 prepare 接受
- **THEN** Policy SHALL 允许 READY_ACTION(revise-explore)

#### Scenario: Enter only the dedicated Archive retry
- **WHEN** 安全失败 Archive 的 normal target 为同 identity archive
- **THEN** Policy SHALL 要求专用 retry seam 接受，否则返回 action-boundary-not-enterable

### Requirement: Blocked diagnosis is closed and deterministic
Policy SHALL 使用 closed machine-distinguishable catalog，至少包含 invalid-policy-input、change-not-active、archive-completion-state-mismatch、archive-recovery-required、terminal-result-missing-or-mismatched、unrecognized-or-unsuccessful-author-outcome、unrecognized-reviewer-verdict、review-rejected、reported-boundary-conflict、owner-authority-required、owner-authority-rejected、unsupported-owner-correction、action-boundary-not-enterable。同组 canonical facts SHALL 产生等价结果，不使用 free-text、动态 Registry 或不确定 fallback 替代。

#### Scenario: Produce the same blocked reason for the same facts
- **WHEN** 相同 facts 包含同一 reported conflict
- **THEN** Policy SHALL 返回等价 reported-boundary-conflict

#### Scenario: Do not turn checkpoint evaluation into Git authority
- **WHEN** Policy 返回 READY_CHECKPOINT_EVALUATION
- **THEN** 它 SHALL 仅为合法治理边界，不产生 Git permission 或执行 commit

## ADDED Requirements

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
