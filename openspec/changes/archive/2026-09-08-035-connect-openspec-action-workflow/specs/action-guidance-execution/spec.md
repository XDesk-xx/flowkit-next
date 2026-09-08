## ADDED Requirements

### Requirement: Agent HOW explains canonical Run recording without a host transport

产品 Action HOW SHALL 在明确 Action/Role 后说明如何使用既有 canonical Guidance/package、受控 Run 地址与三文件字段，记录真实开始、完成或未完成，并核对结果和读回；SHALL 提供与已发行校验器相符的有界使用示例，不只要求“填写成功结果”。示例 SHALL 不要求目标项目维护 callback/glue 工程、存活 CLI、prepare/submit 协议或新 schema。产品 HOW 与 bootstrap HOW SHALL 独立，D05 bootstrap 不因产品示例存在而转换成 canonical 自管理。

#### Scenario: Agent follows the recording instructions

- **WHEN** Agent 已有合法 Action 和真实工作结果
- **THEN** HOW SHALL 使其能定位本机 manager 的既有资产、形成 matching context/result、使用 create-once 操作并核对三文件，而不需要等待 CLI 进程回交

#### Scenario: Recording is interrupted

- **WHEN** 开始后工作或必要保存未完成
- **THEN** HOW SHALL 要求保留实际 partial/失败和限制，不补造 terminal，不自动重试或删除历史

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
