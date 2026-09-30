## MODIFIED Requirements

### Requirement: Agent HOW explains canonical Run recording without a host transport

产品 Action HOW SHALL 在明确 Action/Role 与合法边界后说明如何调用选定 manager 发行包的固定 `action start/finish` 与必要 `proof inspect`，消费 manager 绑定的 canonical Guidance/package、受控 Run 地址与三文件字段，记录真实开始、完成或未完成，并核对结果和读回；SHALL 提供与已发行命令合同相符的有界使用示例，不把 caller 自填 GuidanceRef、纯结构 package 或 handle 当作写入许可。正常路径 SHALL 不要求 Agent 创建临时 Node/Python 生命周期程序、目标项目 callback/glue 工程、存活 CLI 或新的 durable Run 文件。产品 HOW 与 bootstrap HOW SHALL 独立，历史 bootstrap 不因新命令存在而转换成 canonical 自管理。

#### Scenario: Agent follows the recording instructions

- **WHEN** Agent 已有合法 Action 并实际完成该角色工作
- **THEN** HOW SHALL 使其能定位本机选定 manager 的固定入口、执行受控 start、提交 matching 真实结果、核对三文件，而不等待同一 CLI 进程回交

#### Scenario: Recording is interrupted

- **WHEN** 开始后工作或必要保存未完成
- **THEN** HOW SHALL 要求保留实际 partial/失败和限制，不补造 terminal，不自动重试或删除历史

#### Scenario: HOW cannot substitute a shape-valid GuidanceRef

- **WHEN** Agent 按产品 Action HOW 开始新 Run，且持有一个 canonical path 与 64 位 hex SHA 均结构合法的普通 GuidanceRef
- **THEN** HOW SHALL 仍调用选定 manager 固定 start，使当前安装重新核对内容身份，不直接以该对象写 `action.md`

#### Scenario: Candidate guidance cannot replace current Stable manager

- **WHEN** 当前 Delivery 中的 candidate Skills 或 build 已更新
- **THEN** 本 Delivery 的正式 HOW SHALL 继续来自已选 Stable manager，直到独立的后续 Delivery authority 边界

#### Scenario: Reviewer judgment is rejected while fixed finish lacks a readable terminal form

- **WHEN** Reviewer 的真实判断为 `rejected`，而当前 Policy/Run-chain 不接受该 terminal verdict
- **THEN** 产品 Review HOW SHALL 要求保留真实判断、报告固定 finish 写前拒绝与 exact incomplete Run，不得把 verdict 改写为 `changes-requested` 或称其已形成正式 terminal；后续处理服从独立合法边界
