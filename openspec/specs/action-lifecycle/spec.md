# action-lifecycle Specification

## Purpose
为 Flowkit Foundation 提供独立、可序列化且 fail-closed 的 current Standard Action lifecycle contract，使后续 persistence、resume、Result admission 与 Policy 能共享同一套 `prepared/resumed/terminal` 结构事实，而不把 Action lifecycle 混入 Change state 或提前引入 Run/attempt identity。

## Requirements

### Requirement: Action lifecycle state literals are closed and independent
系统 SHALL 为 current Standard Action 只使用独立的 `prepared` 与 `terminal` lifecycle state literals；未知 literal 以及已移除的 `resumed` literal SHALL 被拒绝，且这些 literals SHALL NOT 被当作 Delivery 或 Change structural state。

#### Scenario: Accept the closed Action lifecycle states
- **WHEN** current Action state 为 `prepared` 或 `terminal`
- **THEN** 系统 SHALL 将其识别为合法 Action lifecycle state

#### Scenario: Reject an unknown Action lifecycle state
- **WHEN** current Action state 使用 `resumed`、`pending`、`running`、`completed`、未知 literal 或非 string 值
- **THEN** 系统 SHALL fail closed，且不得把输入 normalize 为已知 lifecycle state

### Requirement: Current Action identity reuses canonical semantic identity
系统 SHALL 以既有 canonical `DeliveryId + ChangeId + StandardActionId` 共同识别 current Action，并 SHALL NOT 要求第二个 Action key、UUID、RunId、attempt id 或 sequence number 才能表达本 capability 的 current Action lifecycle。

#### Scenario: Accept a canonical current Action identity
- **WHEN** identity 包含 canonical DeliveryId、canonical ChangeId 与已知 StandardActionId
- **THEN** 系统 SHALL 能够将该 identity 用作 current Action lifecycle target

#### Scenario: Reject malformed current Action identity
- **WHEN** DeliveryId/ChangeId 不满足既有 canonical semantic identity contract，或 ActionId 不在既有 Standard Action catalog
- **THEN** 系统 SHALL fail closed，且不得 trim、lowercase、alias、生成替代 identity 或推断 Run/attempt identity

### Requirement: Current Action is a single slot
系统 SHALL 将 current Action 表达为 zero-or-one slot；任一时刻该 structural lifecycle fact SHALL 最多包含一个 `CurrentAction`，且一个 current Action SHALL 同时携带其 canonical Action identity 与一个 Action lifecycle state。

#### Scenario: No current Action exists
- **WHEN** 尚未内部 prepare 当前 Action
- **THEN** current Action slot SHALL 能够表示 empty，而不需要伪造 idle/pending Action

#### Scenario: Reject non-terminal replacement
- **WHEN** current slot 已包含 `prepared` Action A，调用方尝试 prepare Action B
- **THEN** 系统 SHALL reject replacement，且 SHALL 保持 single-current-Action invariant

### Requirement: Prepare transition is deterministic and fail closed
系统 SHALL 允许 empty slot 内部 prepare canonical Action A，并产生 `A/prepared`；当 current slot 为 `terminal A` 时，系统 SHALL 仅在目标 canonical semantic ActionIdentity B 与 A 不同时 structurally 允许 prepare B，并产生 `B/prepared`。`prepare` SHALL 保持内部 structural lifecycle event，且其他 prepare 组合 SHALL 被拒绝。

#### Scenario: Prepare the first current Action
- **WHEN** current slot 为 empty 且目标 identity 为 canonical A
- **THEN** transition SHALL 产生唯一 current Action `A/prepared`

#### Scenario: Replace a terminal Action with a different canonical identity
- **WHEN** current slot 为 `terminal A` 且 prepare 的 canonical ActionIdentity B 满足 `B != A`
- **THEN** transition SHALL structurally 产生 `B/prepared`

#### Scenario: Reject re-prepare of the same terminal Action
- **WHEN** current slot 为 `terminal A` 且 prepare 的 canonical ActionIdentity 仍为 A
- **THEN** transition SHALL fail closed，而不得把同一个 terminal Action 重新变为 prepared

#### Scenario: Reject prepare over a non-terminal Action
- **WHEN** current slot 为 `prepared A`
- **THEN** 任意 prepare 请求 SHALL 被拒绝，而不得替换或重复 prepare 当前 Action

### Requirement: Structural lifecycle legality does not create Policy eligibility
本 capability SHALL 只决定 current Action slot 与 lifecycle transition 的 structural legality；它 SHALL NOT 根据 OpenSpec status、Review verdict、Verification evidence、Owner authority 或 Standard Action ordering 判断某个 Action 是否为合法 next Action。

#### Scenario: Different-identity terminal replacement is only structurally allowed
- **WHEN** `terminal A -> prepare B` 满足 canonical identity 且 `B != A`
- **THEN** lifecycle contract MAY structurally 接受该 replacement，但系统 SHALL NOT 因此推导 B 已获得 next-Action Policy eligibility

#### Scenario: Lifecycle terminal does not imply external authority
- **WHEN** Action A 进入 `terminal`
- **THEN** 系统 SHALL NOT 仅由该 lifecycle fact 推导 Owner authorization、Reviewer verdict、Verification PASS 或 Git authority

### Requirement: Lifecycle validation and transitions are deterministic and serialization-safe
系统 SHALL 以普通 JSON-compatible identity/state facts执行确定性的 lifecycle validation 与 transition；同一合法输入 SHALL 产生等价结果，非法输入 SHALL fail closed，且结果 SHALL 不依赖进程内 registry、对象引用身份、动态 Action registration 或隐式 normalization。

#### Scenario: Equivalent semantic identities behave equivalently
- **WHEN** 两个独立对象包含相同 canonical DeliveryId、ChangeId 与 StandardActionId
- **THEN** lifecycle comparison SHALL 按 semantic field equality 将它们视为同一 ActionIdentity，而不得依赖 JavaScript object identity

#### Scenario: Malformed lifecycle input cannot be normalized into validity
- **WHEN** lifecycle input包含 malformed identity、unknown ActionId 或 unknown state
- **THEN** 系统 SHALL reject 输入，且不得通过默认值、trim、case folding、alias resolution 或生成 occurrence identity 改变其语义

### Requirement: Terminal transition admits only the exact same prepared Action
系统 SHALL 只允许 `prepared A -> terminal A`；terminal target SHALL 与 current Action 的 canonical semantic ActionIdentity 完全相同，且系统 SHALL NOT 要求或制造中间 resume/resumed lifecycle state。

#### Scenario: Complete a prepared Action directly
- **WHEN** current slot 为 `prepared A` 且 terminal target 为 exact same canonical ActionIdentity A
- **THEN** transition SHALL 产生 `terminal A`

#### Scenario: Reject terminal identity mismatch from prepared
- **WHEN** current slot 为 `prepared A`，但 terminal target 为 B 且 `B != A`
- **THEN** transition SHALL fail closed

### Requirement: Terminal remains absorbing after exact prepared completion
系统 SHALL 将 `terminal` 视为同一个 canonical current Action 的 absorbing boundary；`terminal A` SHALL NOT 被再次 terminal 或 re-prepare 为 A。重复 Result 是否可再次 admission 或同一 semantic Action 是否可由后续 Policy 重新选择，不属于本 capability。

#### Scenario: Reject duplicate terminal completion
- **WHEN** current slot 已为 `terminal A` 且再次请求 terminal A
- **THEN** transition SHALL fail closed，而不得把 duplicate completion 当作新的成功 transition

#### Scenario: Reject same-identity prepare after terminal completion
- **WHEN** current slot 已为 `terminal A` 且请求 prepare A
- **THEN** transition SHALL fail closed
