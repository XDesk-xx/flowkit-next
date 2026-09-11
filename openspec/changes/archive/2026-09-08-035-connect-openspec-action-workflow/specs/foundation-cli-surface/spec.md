## MODIFIED Requirements

### Requirement: CLI current-Run authority is always explicit, including explicit absence

CLI SHALL 从用户明确的 target 与可选 Delivery/Change 选择解析 exact current facts，不再接受 caller 提供 currentRunId/changeStartSequence。current SHALL 来自 OpenSpec root/Change observation、可信 coordination 和所选 Change 唯一有效 previousRunId 链；不得使用 max sequence、mtime、目录顺序或 Git history 选择 current 或推断 absence。省略 Run 参数 SHALL 触发正式解析，而不是断言空历史。结构合法的 Agent-produced canonical Run SHALL 与其他同合同记录一样被读取，不要求来自 CLI 进程或含协议专属 failure 键。

#### Scenario: Exact selected Run is read

- **WHEN** 所选 Change 存在唯一完整有效末端且目标、Role、前序及合法边一致
- **THEN** CLI SHALL 使用该 Run 的 exact context/result，不要求用户填写 occurrence 或执行进程身份

#### Scenario: Higher-sequence disconnected Run also exists

- **WHEN** 所选 Change 存在更高号无关根、分叉、缺父、环或重复 sequence
- **THEN** CLI SHALL 报告链错误，不取最大号或回退旧 PASS

#### Scenario: Explicitly represent an active Change with no current Run

- **WHEN** target、trusted active coordination 与 OpenSpec 事实一致且该 Change 受控历史确认为空
- **THEN** CLI SHALL 显式产生 null current/context/result，不创建 Run；首次 Explore 可在无 scaffold 时由随后获准的 Agent 创建 Change

#### Scenario: Run choice is omitted or malformed

- **WHEN** 请求不含旧 Run 参数，或仍携带 currentRunId/changeStartSequence
- **THEN** 前者 SHALL 解析正式上下文，后者 SHALL 返回输入诊断并提示新请求形态；读取失败不得变为 absence

#### Scenario: Prepared history has no transport-specific failure field

- **WHEN** canonical prepared Run 的 identity/Role/linkage 合法且 Author/Reviewer/Verification/next outcome 槽均为 null
- **THEN** CLI SHALL 不因缺少 invocationFailure 等宿主协议键拒绝记录，也不得把 prepared 解释成 terminal

### Requirement: status reports selected formal facts without advancing lifecycle

status SHALL 返回指定 target 中解析后的 coordination、OpenSpec 与 current Run facts，区分 idle、waiting-owner、current、archived、cancelled 和只供展示的 bootstrap-history。caller SHALL NOT 覆盖 changeState。status SHALL 只读，不通过调用 Policy 创造当前 next，不修改 lifecycle、Runs、OpenSpec、Memo、Archify、coordination 或 Git；解析器可以使用既有 Policy 核对历史边。

#### Scenario: Report exact selected Run and OpenSpec facts

- **WHEN** 唯一有效 current 解析成功
- **THEN** status SHALL 返回 exact identity/state 与 OpenSpec observation，不执行任何 Action

#### Scenario: Caller cannot override reported Change state

- **WHEN** caller 试图提供 authority-bearing changeState
- **THEN** CLI SHALL 拒绝该字段，只使用可信 coordination

#### Scenario: Reporting data cannot create authority

- **WHEN** status 输出历史、规划或 bootstrap facts
- **THEN** 这些事实 SHALL 不创造 Owner/Reviewer/Verification/Git authority，也不将 bootstrap 转换成 canonical current

#### Scenario: No active target differs from ambiguity

- **WHEN** 没有 active 目标，或有多个候选但未明确目标
- **THEN** 前者 SHALL 返回 idle，后者 SHALL 报告候选与歧义；显式 planned 选择显示 waiting-owner 而不自行激活

#### Scenario: Known history is incomplete

- **WHEN** 所选 Change 存在 partial、损坏或与 coordination/OpenSpec 冲突的记录
- **THEN** CLI SHALL 指出具体记录或冲突，不忽略它、伪装空闲或转选旧成功

### Requirement: next delegates lifecycle legality exclusively to canonical Policy

next SHALL 复用同一有界上下文解析器，把 exact target、可信 ChangeState 与有效 current facts 交给既有 Policy，原样报告 ready-action、ready-checkpoint-evaluation 或 blocked。空历史传 null；terminal 使用 matching context/result；prepared 传 null terminal facts。CLI SHALL NOT 复制转换表、准备或执行 Action、创建 Run。Owner correction/checkpoint authority 仍单独按现有合同处理。bootstrap-history 仅报告历史上下文，decision 为 null，不自动迁移或接管。

#### Scenario: Terminal selected Run produces the Policy decision

- **WHEN** 唯一有效 terminal 与可信 coordination 解析成功
- **THEN** next SHALL 使用其 matching facts 并报告既有 Policy 决定，不把 Result 的 reported next 当成独立 authority

#### Scenario: Prepared selected Run does not gain terminal facts

- **WHEN** current 为 prepared
- **THEN** next SHALL 传 null terminal context/result，不借其他 Run 制造完成

#### Scenario: Active Change with no current Run reaches canonical Explore boundary

- **WHEN** 可信 active 目标的受控历史确认为空
- **THEN** next SHALL 报告 Policy 的 Explore boundary，不创建目录/Run 或执行 Explore

#### Scenario: Untrusted active claim cannot reach Policy as active

- **WHEN** activation/provenance/direct dependency 事实不足
- **THEN** CLI SHALL 在向 Policy 提供 authoritative active 之前失败，不以 caller 自述替代

#### Scenario: Policy returns blocked

- **WHEN** Policy 返回 blocked
- **THEN** next SHALL 将其作为合法机器结果，不自动产生 correction、下一 Action 或进程故障

### Requirement: CLI machine outcomes distinguish valid formal results from command/integration failure

CLI SHALL 输出确定的结构化结果，不解析 free-text 重建 domain 语义。正常 status、Policy blocked、checkpoint unauthorized 与 bounded doctor diagnostic SHALL 保持正式 machine outcomes；非法输入、歧义、missing/invalid/incomplete Run、managed-tool/integration failure 或未知命令 SHALL 可区分且非零退出。CLI 不提供宿主通信帧、Action 执行或保存完成响应。

#### Scenario: Policy blocked is a formal result

- **WHEN** next 成功构造事实且 Policy blocked
- **THEN** CLI SHALL 输出该决定，不误分类为调用失败

#### Scenario: Exact Run cannot be read

- **WHEN** 所选受控历史包含 incomplete/invalid occurrence
- **THEN** CLI SHALL 非零退出并指出该问题，不尝试另选旧 Run

#### Scenario: Action command is not a workflow executor

- **WHEN** caller 请求 action 或 prepare/submit 等未支持命令
- **THEN** CLI SHALL 返回未知命令诊断，不读取宿主回交、不执行工作或写 Run

### Requirement: Foundation CLI remains a thin bootstrap-era surface without self-management

Production CLI SHALL 仅提供 status/next/doctor，组合既有 domain/integration 与所选 target 的有界上下文解析。SHALL NOT 读取/执行 .agents/skills、调用模型、执行 Author/Reviewer transport、驱动 OpenSpec mutation、自动切换 Role/下一 Action、激活 Change、建立 Registry、执行 Full Test/Final/Git 或提升 Owner authority。OpenSpec 实际工作归已获准的 Agent。D05 开发继续 independent-bootstrap，不因查询能力存在而自我接管；Archify 无产品入口。

#### Scenario: Bootstrap Skills are absent from production call path

- **WHEN** 产品 CLI 执行
- **THEN** 它 SHALL 只使用所需 manager 资产与 target 正式事实，不读取/执行 bootstrap HOW

#### Scenario: Independent diagrams do not provide lifecycle authority

- **WHEN** target 存在独立或历史图
- **THEN** CLI SHALL 不从图推导流程、不触发绘图或 Delivery Start/Final

#### Scenario: Archify is managed but not lifecycle authority

- **WHEN** 用户独立管理 Archify 安装或图
- **THEN** CLI SHALL 不解析该安装，不把它视为 Flowkit managed tool 或 authority

#### Scenario: Querying the next review does not execute it

- **WHEN** next 报告 review-explore 等独立审查边
- **THEN** CLI SHALL 报告后退出，不创建 Reviewer Run 或执行 Reviewer

### Requirement: Installed manager assets are independent of target project facts

系统 SHALL 从运行安装入口和自身 package name/version 定位 manager，repositoryRoot 仅表示 target；request SHALL NOT 覆盖系统资产根或任意 Skill 路径。三命令使用其所需 manager 资产、exact tool lock 与 target facts，不以 target package、cwd 或上一 Delivery SHA 选择安装。target SHALL 无需复制 Flowkit 源码/Skills/lock、安装开发依赖或保存专用 glue scripts；项目 Run/proof 属于 target，manager 不接收项目历史。缺资产只阻断实际依赖能力，不回退 target 同名文件。安装身份不产生 lifecycle/Git authority。

#### Scenario: Installed CLI reads an independent target

- **WHEN** 同一本机 build 或实际发行安装从其他工作目录访问正式 target
- **THEN** CLI SHALL 从自身定位系统资产，读取 target facts，不要求第二套软件或 target 开发布局

#### Scenario: Target cannot override system installation

- **WHEN** target 有同名 package/Skills/lock，或 request 指定资产覆盖
- **THEN** 同名文件 SHALL 不改变可信来源，不支持的字段 SHALL 被拒绝

#### Scenario: Relocated installation leaves target data in place

- **WHEN** 同内容安装移位后访问同一 target
- **THEN** 系统 SHALL 继续读取原项目数据，不迁移历史或改变其测试配置

## ADDED Requirements

### Requirement: Agent-recorded canonical history supports independent query sessions

Agent 按既有 canonical 三文件/schema/地址约定产生的实际 Run SHALL 能被后续独立 CLI 查询进程解析。可用性 SHALL 不依赖保留 stdin/stdout、PTY、PID、回调或之前查询进程的内存。结构验证 SHALL 不被宣称为执行真实性或 Reviewer 独立性的证明。

#### Scenario: A new query observes an Agent result

- **WHEN** Agent 已按合法 Role/Action 完成真实工作并保存可验证记录，之前查询进程已退出
- **THEN** 新 status/next SHALL 不要求输入 Run 编号即可读到真实 current 与相应 Policy 边，不重新执行工作

#### Scenario: Historical bootstrap is not relabeled

- **WHEN** target 只有明确标记的历史 independent-bootstrap 记录
- **THEN** 查询 SHALL 保留历史展示语义，不转换字段或生成 canonical 成功
