## MODIFIED Requirements

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

Policy SHALL 在发出 READY_ACTION 前验证 exact CurrentAction slot 可进入，复用 existing lifecycle/prepared-reuse/supersession 以及专用 Archive retry contract，不复制 state machine。empty slot 用普通 prepare；prepared A 的 normal target 仅 exact A reuse；prepared Author 的不同 Owner revise 用 supersession；terminal 的不同 identity 用普通 prepare。已核准的安全失败 Archive same identity SHALL 使用原窄 retry transition；已验证普通 Author FAIL correction 的三个同名 revise SHALL 使用专门的新 occurrence 结构边。该边不得仅凭裸 READY token 开放。不可进入时 SHALL 返回 action-boundary-not-enterable。

#### Scenario: Reuse an exact prepared Action without duplicate prepare

- **WHEN** CurrentAction 为 prepared propose 且 legal target 为 propose
- **THEN** Policy SHALL 返回 READY_ACTION(propose)，不要求 duplicate prepare

#### Scenario: Enter an authorized prepared revise

- **WHEN** prepared Author apply 的 exact Owner target 为 revise-propose 且 supersession 接受
- **THEN** Policy SHALL 允许 READY_ACTION(revise-propose)，不执行

#### Scenario: Block the exact same terminal revise Action

- **WHEN** active exact terminal revise-explore 为 PASS，normal/reported consistency 有效，且 exact Owner correction 指向同名 revise-explore 并通过阶段/authority 核对
- **THEN** Policy SHALL 返回 action-boundary-not-enterable；Archive retry 例外不适用

#### Scenario: Allow a different structurally enterable revise Action

- **WHEN** terminal propose 的合法 correction 为 revise-explore 且普通 prepare 接受
- **THEN** Policy SHALL 允许 READY_ACTION(revise-explore)

#### Scenario: Enter only the dedicated Archive retry

- **WHEN** 安全失败 Archive 的 normal target 为同 identity archive
- **THEN** Policy SHALL 要求专用 retry seam 接受，否则返回 action-boundary-not-enterable

#### Scenario: Enter a new occurrence after the same revise fails

- **WHEN** exact terminal revise-explore/revise-propose/revise-apply 为 FAIL/null 且同名 Owner correction 全部核准
- **THEN** Policy SHALL 验证专门结构边后允许 READY_ACTION，不 reopen 或 reuse 原 occurrence
