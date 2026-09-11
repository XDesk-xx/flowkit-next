## MODIFIED Requirements

### Requirement: Canonical Action Guidance is deterministically bound from the already-decided Standard Action

系统 SHALL 只从 trusted Flowkit host 确定的 manager 安装根与已经确定的 exact `StandardActionId` 解析 product-side Action Guidance。每个 canonical entry SHALL 唯一对应 manager-relative `skills/actions/<actionId>/SKILL.md`；target 项目根 SHALL 不作为系统资产来源。resolver SHALL NOT 接受 caller / Agent 任意指定的 Guidance path、Skill name、method name 或 content identity 作为选择 authority。

#### Scenario: Resolve the Action-aligned canonical entry
- **WHEN** exact current Action 为 `explore`，且 manager 安装中存在有效的 `skills/actions/explore/SKILL.md`
- **THEN** 系统 SHALL 只解析该 Action-aligned canonical entry，不要求 target 带系统 Skills

#### Scenario: Caller cannot nominate another Guidance entry
- **WHEN** caller / Agent 尝试为 exact `explore` 指定 `review-explore`、`.agents/skills/**`、target 同名文件或任意其他路径
- **THEN** 系统 SHALL 不采用该 nomination，继续只依据 trusted manager 根与 exact Action 确定 canonical entry

### Requirement: Guidance identity is bound to exact canonical path and exact file content

系统 SHALL 将可执行 `GuidanceRef` 绑定到 exact canonical manager-relative path 与 canonical entry 的 exact file-content identity。entry SHALL 是可读取 regular file；missing、unreadable、non-regular、wrong-Action-aligned 或 structural-invalid identity SHALL fail closed。相同路径 bytes 改变 SHALL 产生不同 identity；安装绝对位置 SHALL 不进入该 Guidance identity。

#### Scenario: Content drift changes Guidance identity
- **WHEN** 同一 canonical Action Guidance path 的 bytes 变化
- **THEN** 后续解析的 content identity SHALL 不同

#### Scenario: Missing canonical entry fails closed
- **WHEN** manager 中 exact Action 的 canonical entry 不存在
- **THEN** 系统 SHALL 不形成可执行 GuidanceRef，不采用 target 同名文件补齐

#### Scenario: Non-regular canonical entry fails closed
- **WHEN** manager canonical entry 指向 symlink、directory 或其他 non-regular entry
- **THEN** 系统 SHALL 不将其作为 canonical product Guidance

#### Scenario: Relocation preserves content identity
- **WHEN** manager 安装位置变化，但 canonical relative path 与 bytes 不变
- **THEN** GuidanceRef SHALL 保持相同，不以 target 或安装绝对路径重建身份

### Requirement: Flowkit-managed execution does not fall back to the bootstrap Agent skill surface

系统 SHALL 将 manager 安装内 `skills/actions/**` 作为 product Action Guidance canonical surface。对应 entry 缺失或无效时 SHALL fail closed，SHALL NOT fallback 到 target `skills/**`、任一 `.agents/skills/**`、conversation memory、Run history、全仓发现或 method ranking。Guidance 的取得和使用 SHALL 不改变 target 的 OpenSpec、Run 或执行角色归属。

#### Scenario: Bootstrap skill cannot satisfy a missing product Guidance entry
- **WHEN** manager 的 `skills/actions/apply/SKILL.md` 缺失，但 target 或 bootstrap 中有 Apply-related Skill
- **THEN** product `apply` SHALL 不采用这些文件替代，且在 Guidance HOW callback 前停止
