## MODIFIED Requirements

### Requirement: Terminal remains absorbing after exact prepared completion

系统 SHALL 将同一 execution occurrence 的 `terminal` 视为 absorbing boundary；`terminal A` SHALL NOT 被再次 terminal，且普通 `prepare A` SHALL 被拒绝。仅本 capability 定义的 Archive-only retry transition，以及已核准失败 Author correction 的同名 revise 结构边，SHALL 允许相应 same semantic identity 形成新 occurrence 的 prepared candidate；它不得重新打开或修改旧 occurrence。重复 Result admission 与具体 retry 的 Policy eligibility 仍不由普通 lifecycle transition 决定。

#### Scenario: Reject duplicate terminal completion

- **WHEN** current slot 已为 `terminal A` 且再次请求 terminal A
- **THEN** transition SHALL fail closed，而不得把 duplicate completion 当作新的成功 transition

#### Scenario: Reject same-identity prepare after terminal completion

- **WHEN** current slot 已为 `terminal A` 且请求普通 prepare A
- **THEN** transition SHALL fail closed，包括 archive；只能通过各自专用合法结构边建立新 Archive 或失败 Author revise occurrence

## ADDED Requirements

### Requirement: Failed Author correction stages only a new same-revise occurrence

系统 SHALL 提供窄结构边，仅从 exact terminal revise-explore/revise-propose/revise-apply 到同一 Delivery/Change/Action identity 的新 prepared occurrence。生产调用 SHALL 已验证 Policy 的 active 普通 Author FAIL/null、exact parent 和 Owner revise-action 单项 authority；裸 READY token SHALL NOT 证明该 eligibility。结构转换 SHALL 不决定失败 outcome 或 Owner authority，仅复用既有身份/状态结构核对；普通 prepare SHALL 保持拒绝 same terminal identity。不同 target、PASS、未知 outcome、Reviewer 和 Archive SHALL NOT 通过此边。旧 occurrence SHALL absorbing，且状态集合仍仅 prepared/terminal。

#### Scenario: Stage a new same-revise occurrence

- **WHEN** 已核准 exact Owner correction 指向同 identity failed terminal revise
- **THEN** 系统 SHALL 暂存新的 prepared candidate，绑定新 occurrence 与直接失败 parent，不修改旧 terminal

#### Scenario: Reject an unproven same-revise entry

- **WHEN** 调用点只有 READY token，或原结果为 PASS/UNKNOWN、缺 Owner、错 target/role
- **THEN** 生产 entry SHALL 拒绝，不能以结构 helper 成功代替 Policy 证明

#### Scenario: Keep all prior occurrences immutable

- **WHEN** 新的合法同名 revise 成功开始或完成
- **THEN** 旧 context/result/action.md SHALL 保持原 bytes，重复 terminal 和普通同名 prepare SHALL 仍被拒绝
