## MODIFIED Requirements

### Requirement: Current Action is a single slot

系统 SHALL 将 current Action 表达为 zero-or-one slot；任一时刻该 structural lifecycle fact SHALL 最多包含一个 CurrentAction，且一个 current Action SHALL 同时携带其 canonical Action identity 与一个 Action lifecycle state。本 capability 的有界 prepared supersession SHALL 可以不同 identity 的 revise 或同 identity revise 的新 occurrence 替代 prepared current；普通 prepare 不具备此能力。旧 occurrence 保留不表示存在第二个 current。

#### Scenario: No current Action exists
- **WHEN** 尚未内部 prepare 当前 Action
- **THEN** current Action slot SHALL 能够表示 empty，而不需要伪造 idle/pending Action

#### Scenario: Reject non-terminal replacement
- **WHEN** current slot 已包含 prepared Action A，调用方尝试普通 prepare Action B
- **THEN** 系统 SHALL reject replacement，且 SHALL 保持 single-current-Action invariant

#### Scenario: Bounded supersession keeps one current slot
- **WHEN** 有界 prepared supersession 对 prepared A 与不同 identity 的 revise B，或同 identity revise 的新 occurrence 成功，且新 Run 已完整保存并读回
- **THEN** current slot SHALL 仅指向新 occurrence 的 prepared 或其后续 terminal state；旧 Run 仍保留，不能同时成为第二个 current

### Requirement: Prepared Author supersession is a distinct structural transition

系统 SHALL 在保持 prepared/terminal closed states 和普通 prepare 规则不变的前提下，提供只针对 prepared Author Action 的有界 supersession transition。输入 SHALL 包含当前 canonical ActionIdentity、同 Delivery/Change 的 revise-family target identity，以及与该 target 精确绑定的已校验 Owner correction boundary。target SHALL 可为不同 identity 的既有 revise，或三个 revise-explore/revise-propose/revise-apply 之一的 exact same identity；same identity SHALL 只用于新 occurrence，而非重新打开或改写旧记录。不满足任一条件 SHALL fail closed。结构转换自身 SHALL NOT 创造 Owner authority、决定 stage eligibility、分配 Run 或把裸 READY 当作完整 correction eligibility；未提交并读回新 Run 前 SHALL NOT 对外宣称 current 已替换。

#### Scenario: Supersede a prepared Apply with same-stage revise
- **WHEN** exact current 为 prepared apply、target 为同 Change 的 revise-apply，且同一 exact Owner correction boundary 已通过 Policy
- **THEN** transition SHALL structurally 给出一个 revise-apply/prepared candidate，等待新 Run 完整提交

#### Scenario: Continue a prepared revise with the same identity
- **WHEN** exact current 为 prepared revise-explore/revise-propose/revise-apply，target 为同 Delivery/Change 的相同 revise identity，且 exact Owner correction boundary 已通过 Policy
- **THEN** transition SHALL 给出同 identity 的 prepared candidate，仅供创建新的 execution occurrence，旧 occurrence SHALL 保持不变

#### Scenario: Reject unapproved or wrong-target supersession
- **WHEN** current 为 prepared Author 但 correction boundary 缺失、target 与 boundary 不同、target 不是 revise-family、跨 Delivery/Change，或当前为 Reviewer/Archive Action
- **THEN** transition SHALL fail closed，原 prepared current SHALL 保持不变

#### Scenario: Ordinary prepare remains closed over prepared
- **WHEN** current 为任意 prepared A 且调用方使用普通 prepare 请求 A 或不同的 B
- **THEN** transition SHALL 按既有 prepare 规则拒绝，不得将该请求解释为 supersession
