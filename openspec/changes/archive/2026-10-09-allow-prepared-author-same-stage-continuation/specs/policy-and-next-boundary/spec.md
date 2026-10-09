## MODIFIED Requirements

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
