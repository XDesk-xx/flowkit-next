## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Action lifecycle state literals are closed and independent
系统 SHALL 为 current Standard Action 只使用独立的 `prepared` 与 `terminal` lifecycle state literals；未知 literal 以及已移除的 `resumed` literal SHALL 被拒绝，且这些 literals SHALL NOT 被当作 Delivery 或 Change structural state。

#### Scenario: Accept the closed Action lifecycle states
- **WHEN** current Action state 为 `prepared` 或 `terminal`
- **THEN** 系统 SHALL 将其识别为合法 Action lifecycle state

#### Scenario: Reject an unknown Action lifecycle state
- **WHEN** current Action state 使用 `resumed`、`pending`、`running`、`completed`、未知 literal 或非 string 值
- **THEN** 系统 SHALL fail closed，且不得把输入 normalize 为已知 lifecycle state

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

## REMOVED Requirements

### Requirement: Resume requires the exact same non-terminal Action identity
**Reason**: Approved Explore proved that current Foundation happy-path execution and repeated execution do not require an independent `resumed` lifecycle state; exact `RunOccurrence` already distinguishes execution occurrences, while keeping resume/resumed would duplicate that concern and introduce unsupported interruption/recovery semantics.

**Migration**: Callers SHALL keep a selected current Action in `prepared` until an exact Result is admitted and the Action terminalizes. If a later invocation is permitted for the exact same still-prepared Action, it SHALL reuse that `prepared` CurrentAction with a new exact Run occurrence rather than issue a resume event.

### Requirement: Terminal transition admits only the exact same active Action
**Reason**: The old requirement includes `resumed -> terminal`; after removing `resumed`, terminalization must be expressed only for the exact prepared Action.

**Migration**: Use the added `Terminal transition admits only the exact same prepared Action` requirement and terminalize only from `prepared`.

### Requirement: Terminal is absorbing for the same current Action
**Reason**: The old requirement and scenarios include resume-specific terminal behavior that no longer exists after lifecycle contraction.

**Migration**: Use the added `Terminal remains absorbing after exact prepared completion` requirement; duplicate terminal and same-identity re-prepare remain fail-closed.
