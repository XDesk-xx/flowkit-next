# action-guidance-execution Specification

## Purpose
为 Flowkit-managed Standard Action execution 建立可信、确定且内容绑定的 canonical Action Guidance identity，使 already-decided Action 获得 exact HOW 引用，同时保持 Guidance 只负责 HOW、不得成为 lifecycle 或 authority source。

## Requirements
### Requirement: Canonical Action Guidance is deterministically bound from the already-decided Standard Action
系统 SHALL 只从 trusted Flowkit Action host 拥有的 canonical repository root 与已经确定的 exact `StandardActionId` 解析 product-side Action Guidance。每个 Standard Action 的 canonical entry SHALL 唯一对应 repository-relative `skills/actions/<actionId>/SKILL.md`；resolver SHALL NOT 接受 caller / Agent 任意指定的 Guidance path、Skill name、method name 或 content identity 作为选择 authority。

#### Scenario: Resolve the Action-aligned canonical entry
- **WHEN** exact current Action 的 `StandardActionId` 为 `explore`，且 canonical repository root 中存在有效的 `skills/actions/explore/SKILL.md`
- **THEN** 系统 SHALL 只把该 Action-aligned canonical entry 解析为当前 product-side Guidance identity

#### Scenario: Caller cannot nominate another Guidance entry
- **WHEN** caller / Agent 尝试为 exact `explore` Action 指定 `review-explore`、`.agents/skills/**` 或任意其他 repository path 作为 Guidance
- **THEN** 系统 SHALL NOT 采用该 nomination，且 SHALL 继续只依据 trusted repository root 与 exact `StandardActionId` 确定 canonical entry

### Requirement: Guidance identity is bound to exact canonical path and exact file content
系统 SHALL 将一个可执行 product-side `GuidanceRef` 绑定到 exact canonical repository-relative path 与该 canonical entry 的 exact file-content identity。canonical entry SHALL 是可读取的 regular file；missing、unreadable、non-regular、wrong-Action-aligned 或 structural-invalid Guidance identity SHALL fail closed。相同 canonical path 的文件 bytes 改变 SHALL 产生不同的 exact content identity。

#### Scenario: Content drift changes Guidance identity
- **WHEN** 同一 canonical Action Guidance path 的 file bytes 发生变化
- **THEN** 后续解析得到的 exact Guidance content identity SHALL 与变化前不同

#### Scenario: Missing canonical entry fails closed
- **WHEN** exact Standard Action 对应的 canonical `skills/actions/<actionId>/SKILL.md` 不存在
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 形成可执行 GuidanceRef

#### Scenario: Non-regular canonical entry fails closed
- **WHEN** canonical Action Guidance path 指向 symlink、directory 或其他 non-regular filesystem entry
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 将该 entry 作为 canonical product Guidance

### Requirement: Flowkit-managed execution does not fall back to the bootstrap Agent skill surface
系统 SHALL 将 `skills/actions/**` 作为 Flowkit-managed product Action Guidance 的 canonical repository surface。若对应 canonical product Guidance 缺失或无效，系统 SHALL fail closed，且 SHALL NOT fallback 到 `.agents/skills/**`、conversation memory、Run history、repository-wide Skill discovery 或 method ranking。`.agents/skills/**` SHALL NOT 获得 Flowkit-managed Action Guidance authority。

#### Scenario: Bootstrap skill cannot satisfy a missing product Guidance entry
- **WHEN** `skills/actions/apply/SKILL.md` 缺失，但 `.agents/skills/**` 中存在可执行 Apply-related bootstrap Skill
- **THEN** Flowkit-managed `apply` execution SHALL fail closed，而不得用 bootstrap Skill 替代 canonical product Guidance

### Requirement: Trusted Guidance is frozen only after Action selection and before Agent execution
系统 SHALL 在 exact current Standard Action 已由既有 lifecycle / authority boundary 决定之后，且在 Agent execution callback 被调用之前，解析并冻结该 Action 的 exact Guidance identity。Guidance resolution SHALL NOT 选择或改变 Standard Action、execution role、Owner authority、Policy legality、Reviewer verdict、Verification truth 或 next Action；Guidance resolution failure SHALL 在 Agent callback 之前结束当前 invocation 的 execution attempt。

#### Scenario: Valid Guidance reaches the bounded execution package
- **WHEN** invocation 已拥有 exact prepared current Action，且其 canonical Guidance entry 成功解析
- **THEN** 系统 SHALL 在调用 Agent execution callback 前把 exact Guidance identity 冻结进该 Action 的 executable package

#### Scenario: Guidance resolution failure prevents Agent execution
- **WHEN** invocation 已拥有 exact prepared current Action，但其 canonical Guidance entry 解析失败
- **THEN** 系统 SHALL fail closed 并 SHALL NOT 调用 Agent execution callback

#### Scenario: Guidance cannot change the already-decided Action
- **WHEN** exact current Action 已确定为 `review-propose`
- **THEN** Guidance resolution SHALL 只解析 `review-propose` 对应 canonical HOW，且 SHALL NOT 将当前 Action、Role 或 next boundary 改写为其他值
