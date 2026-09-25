## ADDED Requirements

### Requirement: A new canonical Action start binds current manager Guidance before Run creation

对一个已合法确定、可由当前 Role 执行的 exact Standard Action，Flowkit 提供的正常 canonical start SHALL 在同一次受控开始操作中，从 trusted current manager installation 解析该 Action 的 canonical regular Skill bytes，形成与当前 `CurrentAction`、Run context、Role、受控 occurrence 和 GuidanceRef 一致的 ActionPackage，并 create-once 记录 `action.md`。caller 提供的 path、SHA、结构合法 GuidanceRef 或 ActionPackage SHALL NOT 充当安装来源证明或替代本次解析。若准备阶段已有 expected GuidanceRef，start SHALL 在首次 Run 文件系统创建之前再次解析并要求与之完全一致。start SHALL 只在先前已决定的 Action 与既有 Policy/readiness 边界内执行，不自行选择 Action、Owner authority、Reviewer verdict 或下一步。

#### Scenario: Current canonical bytes begin an exact Action
- **WHEN** 当前 manager 中 exact Action 的 Skill 为可读取 regular file，当前 Action、Role、Run context、occurrence 与 readiness 均匹配，且开始时的 Guidance identity 未漂移
- **THEN** start SHALL create-once 写入含该真实 GuidanceRef 的 `action.md`，并交回同一开始操作绑定的 ActionPackage 与 Run 地址

#### Scenario: Forged or wrong-Action SHA is rejected before a Run exists
- **WHEN** caller 提供 canonical path 及形状合法但伪造的 SHA，或把另一 Action Skill 的 SHA 用作当前 Action 的身份
- **THEN** start SHALL 不采用该身份，并在目标 Run 目录或 `action.md` 创建前拒绝不一致的开始请求

#### Scenario: Manager replacement or content drift invalidates a prepared identity
- **WHEN** expected GuidanceRef 来自另一安装且当前安装的 canonical bytes 不同，或同一 canonical path 的 bytes 在准备后、开始前改变
- **THEN** start SHALL 在目标 Run 目录或 `action.md` 创建前拒绝旧身份；当前安装中相同 path 与相同 bytes 的合法身份 SHALL 仍可开始

#### Scenario: Missing or non-regular current Guidance blocks start
- **WHEN** 当前 manager 的 exact Skill 缺失、不可读、是 symlink 或其他 non-regular entry
- **THEN** start SHALL 在目标 Run 目录或 `action.md` 创建前失败，且 SHALL NOT 回退到 target 或其他安装的 Skill

#### Scenario: Failure after start preserves the partial occurrence
- **WHEN** 真实 `action.md` 已 create-once 写入而后续工作或保存失败
- **THEN** 系统 SHALL 保留该 occurrence 的原始 bytes 与 partial 状态，SHALL NOT 删除、覆盖、重占或自动执行下一 Action

#### Scenario: Historical Run identity remains tied to its original start
- **WHEN** 一个旧 Run 在安装 A 下启动，之后当前安装 B 的相同路径 Skill bytes 已改变
- **THEN** 读取旧 Run SHALL 保留其原时点 Guidance 身份，不因 B 的 SHA 不同追溯否决；B 下的新启动 SHALL 以 B 的真实 bytes 判断

## MODIFIED Requirements

### Requirement: Agent HOW explains canonical Run recording without a host transport

产品 Action HOW SHALL 在明确 Action/Role 后说明如何调用 manager 自有的可信 start 入口，消费由该入口绑定的 canonical Guidance/package、受控 Run 地址与三文件字段，记录真实开始、完成或未完成，并核对结果和读回；SHALL 提供与已发行校验器相符的有界使用示例，不把 caller 自填 GuidanceRef 或纯结构 package 当作写入许可。示例 SHALL 不要求目标项目维护 callback/glue 工程、存活 CLI、prepare/submit 协议或新 schema。产品 HOW 与 bootstrap HOW SHALL 独立，D05 bootstrap 不因产品示例存在而转换成 canonical 自管理。

#### Scenario: Agent follows the recording instructions

- **WHEN** Agent 已有合法 Action 和真实工作结果
- **THEN** HOW SHALL 使其能定位本机 manager 的既有资产、调用可信 start、形成 matching context/result、使用 create-once 操作并核对三文件，而不需要等待 CLI 进程回交

#### Scenario: Recording is interrupted

- **WHEN** 开始后工作或必要保存未完成
- **THEN** HOW SHALL 要求保留实际 partial/失败和限制，不补造 terminal，不自动重试或删除历史

#### Scenario: HOW cannot substitute a shape-valid GuidanceRef

- **WHEN** Agent 按产品 Action HOW 开始新 Run，且持有一个 canonical path 与 64 位 hex SHA 均结构合法的普通 GuidanceRef
- **THEN** HOW SHALL 仍调用 manager 自有 start 入口作当前安装的内容身份核对，不直接以该对象写 `action.md`
