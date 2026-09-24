# action-guidance-execution Specification

## Purpose
为 Flowkit-managed Standard Action execution 建立可信、确定且内容绑定的 canonical Action Guidance identity，使 already-decided Action 获得 exact HOW 引用，同时保持 Guidance 只负责 HOW、不得成为 lifecycle 或 authority source。

## Requirements

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

### Requirement: Trusted Guidance is frozen only after Action selection and before Agent execution
系统 SHALL 在 exact current Standard Action 已由既有 lifecycle / authority boundary 决定之后，且在任何 product Action Guidance preparation/execution HOW 被执行之前，解析并冻结该 Action 的 exact Guidance identity进同一个 ActionPackage。若 invocation 正在从空/terminal slot 暂存新的 prepared candidate，系统 MAY 使用该 staged exact Action identity形成 ActionPackage，但 SHALL NOT 在 package-bound preparation成功前把 staged candidate提交为新的 externally current Action。Guidance resolution SHALL NOT 选择或改变 Standard Action、execution role、Owner authority、Policy legality、Reviewer verdict、Verification truth 或 next Action；Guidance resolution failure SHALL 在任何 product Guidance HOW callback 之前结束当前 invocation attempt。

#### Scenario: Valid Guidance reaches the bounded execution package
- **WHEN** invocation 已拥有 exact prepared或staged-prepared Action identity，且其 canonical Guidance entry 成功解析
- **THEN** 系统 SHALL 在任何 product Guidance HOW执行前把 exact Guidance identity冻结进 ActionPackage，并 SHALL 让 preparation与后续 execution消费同一个 exact package Guidance identity

#### Scenario: Guidance resolution failure prevents Agent execution
- **WHEN** exact invocation target 的 canonical Guidance entry解析失败
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 调用 package-bound preparation或Action execution callback

#### Scenario: Guidance cannot change the already-decided Action
- **WHEN** exact current invocation target 已确定为 `review-propose`
- **THEN** Guidance resolution或package-bound preparation SHALL NOT 将其改为其他 Standard Action、Role或 next Action

#### Scenario: Package identity changes when canonical Guidance bytes change
- **WHEN** exact Action、Run context和其他 package facts不变，但 canonical Guidance file bytes改变
- **THEN**后续 invocation形成的 ActionPackageRef SHALL 改变，且 preparation与execution SHALL 都受该新 exact package identity约束

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

### Requirement: Necessary Action proof is retained with bounded ownership and integrity checks

Agent SHALL 将本次必要 proof 输入、方法/命令、实际输出及限制保存到 target `.flowkit/artifacts/<delivery-id>/changes/<change-id>/proof/<run-id>/`，默认长期保留且不覆盖旧执行。Run 仅携带有界引用和交接，保持既有三文件/closed 字段。生产者及实际相关消费者 SHALL 核对当前必要引用的 project/Delivery/Change/Run 归属、target 内真实路径、regular/readable、完整性和结论一致性，拒绝路径/链接逃逸或只指向 .tmp 的必要副本。hash 正确不等于执行真实或审查批准。

#### Scenario: Disposable workspace disappears after handoff

- **WHEN** 可丢弃工作目录被移除
- **THEN** 已交接必要 proof SHALL 仍在 target 可读，不依赖该工作目录或 manager 安装根

#### Scenario: Missing corrupt or wrong-owner proof is consumed

- **WHEN** 当前判断确实依赖的引用缺失、损坏、不可读、归属错误或逃逸 target
- **THEN** SHALL 阻止该项接纳/消费并指明引用，不把无关历史材料变成所有查询的前置

#### Scenario: A new execution retains independent material

- **WHEN** 同一 Action 被明确再次执行
- **THEN** 新 occurrence SHALL 保存新必要材料，历史 bytes 保持不变，无必要新材料时不创建空 proof 目录

#### Scenario: Routine flow queries do not consume raw proof

- **WHEN** status/next 只需 Run、coordination 和 OpenSpec facts 判断流程
- **THEN** SHALL 不递归扫描 proof 或因无关原始日志增长使查询阻断；保留记录不等于当前实现 PASS

### Requirement: Raw execution streams are independent of source text and Git visibility policies

原始 stdout/stderr SHALL 保持实际 bytes，使用 stdout.txt、stderr.txt、`<label>.stdout.txt`、`<label>.stderr.txt`。本仓库 Git attributes SHALL 用 .flowkit/artifacts/** 下四条通用 raw-stream 模式关闭 text normalization/whitespace 检查，替代具体 Delivery/Change 路径例外。源码、Run JSON、脚本及人工摘要 SHALL 保持文本规则，不对整个 .flowkit 免检、不格式化日志后重写 hash、不将结构化文件改名伪装日志。规则 SHALL 不联动 .gitignore、tracked 状态或 Full Test 范围；其他项目自行管理 Git 配置，不由普通 Action 自动注入。

#### Scenario: New Change logs need no new Git attributes

- **WHEN** 新 Delivery/Change 产生声明命名的含 CRLF/trailing whitespace 原始流并进入授权提交
- **THEN** Git index SHALL 保留原 bytes，原始流空白不阻断检查，不需追加该 Change 路径

#### Scenario: Structured text still fails its text checks

- **WHEN** 源码、Run JSON 或人工摘要含不合规空白
- **THEN** 文本检查 SHALL 仍报告，不因与 proof 同目录而豁免

#### Scenario: Raw stream policy does not select test inputs

- **WHEN** ignore/跟踪或 raw-stream attributes 改变
- **THEN** SHALL 不因此生成或修改 Full Test 配置

### Requirement: Host handoff carries relevant decisions without becoming a second authority store

实际 Agent 交接 SHALL 简要携带影响当前判断的 Owner 决定、接受后的设计依据和必要引用，区分 Explore 实验、已接受决策依据与当前实现验收。SHALL NOT 复制全部聊天/历史 proof 或把旧 PASS 当新实现 PASS。材料路径或授权背景变化 SHALL 先核对具体影响；未收到说明不等于未授权。产品与 bootstrap HOW 各自保留适用条款、不相互委托，不追溯改写历史 Owner 例外或 bootstrap 数据。这里的 host 指实际执行 Agent，不要求通信宿主平台。

#### Scenario: Approved material handling is carried into review

- **WHEN** Owner 的材料保留/移动/清理范围影响判断
- **THEN** 交接 SHALL 给出真实 sourceRef 与简要决定，Reviewer 核对具体影响而不凭路径变化推断越权

#### Scenario: Decision basis does not demand all historical proof forever

- **WHEN** Proposal 消费已批准 Explore 的依据
- **THEN** SHALL 使用当前结论及相关批准引用，不默认长期依赖全部原始实验；已有保留边界不因此撤销

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
