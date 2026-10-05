# action-lifecycle Specification

## Purpose
为 Flowkit Foundation 提供独立、可序列化且 fail-closed 的 current Standard Action lifecycle contract，使后续 persistence、Result admission、single-Action execution 与 Policy 能共享同一套 `prepared/terminal` 结构事实，而不把 Action lifecycle 混入 Change state 或提前引入 Run/attempt identity。

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
系统 SHALL 将 current Action 表达为 zero-or-one slot；任一时刻该 structural lifecycle fact SHALL 最多包含一个 `CurrentAction`，且一个 current Action SHALL 同时携带其 canonical Action identity 与一个 Action lifecycle state。仅有本 capability 定义的有界 prepared supersession 可用不同 identity 替代 prepared current；普通 `prepare` 不具备此能力。

#### Scenario: No current Action exists
- **WHEN** 尚未内部 prepare 当前 Action
- **THEN** current Action slot SHALL 能够表示 empty，而不需要伪造 idle/pending Action

#### Scenario: Reject non-terminal replacement
- **WHEN** current slot 已包含 `prepared` Action A，调用方尝试普通 prepare Action B
- **THEN** 系统 SHALL reject replacement，且 SHALL 保持 single-current-Action invariant

#### Scenario: Bounded supersession keeps one current slot
- **WHEN** 有界 prepared supersession 对 `prepared A` 与不同的 revise Action B 成功，且新 Run 已完整保存并读回
- **THEN** current slot SHALL 仅指向 `B/prepared` 或其后续 terminal state；A 的旧 Run 仍保留，不能同时成为第二个 current

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

系统 SHALL 将同一 execution occurrence 的 `terminal` 视为 absorbing boundary；`terminal A` SHALL NOT 被再次 terminal，且普通 `prepare A` SHALL 被拒绝。仅本 capability 定义的 Archive-only retry transition，以及已核准失败 Author correction 的同名 revise 结构边，SHALL 允许相应 same semantic identity 形成新 occurrence 的 prepared candidate；它不得重新打开或修改旧 occurrence。重复 Result admission 与具体 retry 的 Policy eligibility 仍不由普通 lifecycle transition 决定。

#### Scenario: Reject duplicate terminal completion

- **WHEN** current slot 已为 `terminal A` 且再次请求 terminal A
- **THEN** transition SHALL fail closed，而不得把 duplicate completion 当作新的成功 transition

#### Scenario: Reject same-identity prepare after terminal completion

- **WHEN** current slot 已为 `terminal A` 且请求普通 prepare A
- **THEN** transition SHALL fail closed，包括 archive；只能通过各自专用合法结构边建立新 Archive 或失败 Author revise occurrence

### Requirement: Prepared Author supersession is a distinct structural transition
系统 SHALL 在保持 `prepared/terminal` closed states 和普通 `prepare` 规则不变的前提下，提供只针对 `prepared` Author Action 的有界 supersession transition。输入 SHALL 包含当前 canonical ActionIdentity、不同的同 Delivery/Change revise-family target identity，以及与该 target 精确绑定的已校验 Owner correction boundary；不满足任一条件 SHALL fail closed。结构转换自身 SHALL NOT 创造 Owner authority 或决定 stage eligibility，且未提交新 Run 前 SHALL NOT 对外宣称 current 已替换。

#### Scenario: Supersede a prepared Apply with same-stage revise
- **WHEN** exact current 为 `prepared apply`、target 为同 Change 的 `revise-apply`，且同一 exact Owner correction boundary 已通过 Policy
- **THEN** transition SHALL structurally 给出一个 `revise-apply/prepared` candidate，等待新 Run 完整提交

#### Scenario: Reject unapproved or wrong-target supersession
- **WHEN** current 为 `prepared apply` 但 correction boundary 缺失、target 与 boundary 不同、target 不是 revise-family，或当前为 Reviewer Action
- **THEN** transition SHALL fail closed，原 prepared current SHALL 保持不变

#### Scenario: Ordinary prepare remains closed over prepared
- **WHEN** current 为任意 `prepared A` 且调用方使用普通 `prepare` 请求 A 或不同的 B
- **THEN** transition SHALL 按既有 prepare 规则拒绝，不得将该请求解释为 supersession

### Requirement: Only a failed Archive can use the bounded same-identity retry transition
系统 SHALL 为已经由 Policy 核准的 retryable terminal Archive 提供独立结构转换，要求 current 为 `terminal archive`、target 为同 Delivery/Change 的 exact same archive semantic identity，且与 exact current failure 绑定的已校验 boundary 为 `ready-action(archive)`。转换 SHALL 仅产生新 occurrence 的 `prepared` candidate；新 Run 保存读回前不得声明 current 已替换。该转换 SHALL NOT 创造 retry eligibility、Run 序号、Owner authority、第三种 lifecycle state 或通用 same-action retry。

#### Scenario: Retry a safe failed Archive as a new execution
- **WHEN** exact current Archive 安全失败且专用 retry boundary 有效
- **THEN** 系统 SHALL 允许同 semantic identity 的新 prepared candidate，旧 terminal Run 不变

#### Scenario: Reject a non-Archive or unsupported retry
- **WHEN** current 为其他 Action、prepared、completed Archive PASS、recovery-required，或 exact retry boundary 缺失/不匹配
- **THEN** retry transition SHALL 拒绝，不放宽普通 prepare 或 terminal 规则

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
