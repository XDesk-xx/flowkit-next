## Purpose

为 Flowkit Foundation 提供一个最小、可构建、可执行且 fail-closed 的 CLI surface，把既有 lifecycle、Run persistence、Policy、managed-tool 与 OpenSpec observation 能力暴露为显式机器接口，同时保持当前 Delivery 的外部治理与 bootstrap 开发边界不变。

## Requirements

### Requirement: Foundation CLI has one real runnable package/bin surface
系统 SHALL 提供一个可由受支持 host Node runtime 执行的单一 `flowkit` CLI entrypoint，并 SHALL 通过 repository build contract 将 production TypeScript emit 为该 entrypoint 可加载的 JavaScript。CLI command catalog SHALL 封闭为本 capability 明确规定的 command；未知 command SHALL fail closed。该 build/bin surface MUST NOT 将 Node `22.23.2` 提升为 managed-tool exact runtime authority。

#### Scenario: Build produces a runnable flowkit entrypoint
- **WHEN** repository 在满足 `package.json#engines.node` 的 host Node 上执行批准的 production build
- **THEN** build SHALL 产生 package-declared `flowkit` entrypoint，且该 entrypoint SHALL 能由 host Node 启动并解析受支持 command

#### Scenario: Compatible host Node differs from detached fixture patch
- **WHEN** CLI 在满足 repository Node compatibility declaration 但 patch version 不等于 `22.23.2` 的 host 上启动
- **THEN** CLI SHALL NOT 仅因 patch version 不同而拒绝启动

#### Scenario: Unknown command is requested
- **WHEN** caller 请求不在 `status`、`next`、`doctor` 中的 command
- **THEN** CLI SHALL fail closed with a machine-distinguishable command/input diagnostic，且 MUST NOT 将未知 command 转发给其他 subsystem

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

### Requirement: Checkpoint authorization is a separate exact Owner gate and never Git execution
当且仅当 canonical Policy decision 为 `ready-checkpoint-evaluation` 时，CLI/host surface MAY 对 separately supplied Owner authority fact 执行 checkpoint authorization evaluation。授权 SHALL 仅在 authority structural-valid 且 `decision=authorize-checkpoint`、exact `deliveryId`、exact `changeId`、`scope=[checkpoint]` 全部匹配时成立。该 evaluator SHALL 只报告 authorization fact，MUST NOT 执行或调度 `git add`、`git commit`、`push`、`merge`、`tag` 或其他 repository mutation。

#### Scenario: Exact checkpoint authority matches
- **WHEN** Policy 为 `ready-checkpoint-evaluation`，且 caller 提供 exact matching `authorize-checkpoint` OwnerAuthorityFact
- **THEN** evaluator SHALL 返回 checkpoint authorized machine fact，同时 SHALL 不修改 Git repository

#### Scenario: Owner authority targets another Change
- **WHEN** Policy 为 `ready-checkpoint-evaluation`，但 supplied authority 的 `changeId`、decision 或 scope 任一不匹配
- **THEN** evaluator SHALL 返回 not-authorized machine fact，且 MUST NOT infer permission from Review、Verification 或 terminal archive state

#### Scenario: Policy is not at checkpoint evaluation
- **WHEN** Policy decision 不是 `ready-checkpoint-evaluation`
- **THEN** checkpoint authorization SHALL NOT 被声明成立，即使 caller 提供 structural-valid Owner authority fact

### Requirement: doctor performs only bounded Foundation runtime diagnostics

`flowkit doctor` SHALL 仅通过既有 resolver 验证 exact OpenSpec runtime identity，并通过 OpenSpec observation 验证 requested repository 的 exact-root；diagnostics SHALL 仅为 `openspec-runtime` 和 `openspec-root`，整体 pass 当且仅当两者通过。SHALL NOT 解析、调用或输出 Archify diagnostic，也不返回其 skip/not-applicable。Node SHALL 继续使用 host compatibility declaration，不转为 exact managed patch lock。

#### Scenario: Managed runtimes and OpenSpec root are valid
- **WHEN** exact OpenSpec 可解析且 observation exact-bind requested root，没有 Archify runtime 或任何图
- **THEN** doctor SHALL 返回 machine-readable pass，只有两个 OpenSpec diagnostics

#### Scenario: Required OpenSpec cannot be resolved
- **WHEN** 所需 OpenSpec runtime 缺失或 identity 不符
- **THEN** doctor SHALL 报告既有 closed diagnostic 与整体 fail，不回退 PATH/global

#### Scenario: Managed Archify cannot be resolved
- **WHEN** 原 Archify runtime 不可解析，但所需 OpenSpec runtime/root 均有效
- **THEN** doctor SHALL 只报告两个 OpenSpec diagnostics 并整体 pass，不尝试解析 Archify；这是该旧场景的新预期

#### Scenario: OpenSpec binds to a parent repository root
- **WHEN** observation 成功但 reported root 不等于 requested root
- **THEN** doctor SHALL 按既有 root-mismatch semantics fail closed

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

### Requirement: CLI resolves trusted Delivery-Change coordination state before lifecycle use
对于 `status` 与 `next`，CLI SHALL 以 exact repository root、Delivery ID 与 Change ID 定位 repository-owned durable Delivery coordination truth，并在报告 Change state 或构造 Policy facts 前解析唯一 trusted canonical `ChangeState`。CLI SHALL fail closed on missing/mismatched Delivery identity、missing/duplicate exact Change、invalid state，或其他无法得到唯一 canonical coordination fact 的输入；resolver SHALL read only and SHALL NOT mutate Delivery state、Owner authority、OpenSpec Change artifacts、Run/Result 或 Git。

当 durable exact Change state 为 `active` 时，resolver SHALL 仅在以下条件同时满足时把该 state 视为 lifecycle-enterable `active`：存在 structural-valid OwnerAuthorityFact，且 `decision=activate-change`、exact Delivery ID、exact Change ID、`scope=["explore"]`；并且该 Change 的所有 direct `dependsOn` target 在同一 exact Delivery coordination truth 中唯一存在且 state 为 `completed`。缺少 matching provenance、wrong Delivery/Change、任何非 exact `scope=["explore"]`、missing/duplicate dependency target 或 dependency state 非 `completed` 时 SHALL fail closed，且 MUST NOT 将该 Change 提升为 lifecycle-enterable `active`。

对于 `planned`、`completed`、`cancelled`，historical activation provenance SHALL NOT 将 current state self-upgrade 为 `active`。CLI MUST NOT 建立第二 current-state store、coordination registry、background reconciliation 或 generic Owner-authority subsystem。

#### Scenario: Planned Change cannot self-upgrade through caller input
- **WHEN** durable exact Change state 为 `planned`，即使 caller 尝试提供或伪造 `active` assertion
- **THEN** trusted resolution SHALL 保持 canonical `planned`，且 `next` 进入 Policy 后 SHALL NOT 获得 active-Change lifecycle legality

#### Scenario: Planned Change may report incomplete direct dependency without integration failure
- **WHEN** durable exact Change state 为 `planned`，且其 direct `dependsOn` target 当前 state 不是 `completed`
- **THEN** trusted resolution SHALL 仍可报告 canonical `planned`，且 MUST NOT 仅因 dependency 尚未 completed 将普通 planned coordination state 视为 resolver integration failure；dependency-completion eligibility SHALL 仅在 durable state=`active` 时执行

#### Scenario: Exact Owner activation makes active state lifecycle-enterable
- **WHEN** durable exact Change state 为 `active`，matching structural-valid OwnerAuthorityFact 为 `decision=activate-change`、exact Delivery/Change、exact `scope=["explore"]`，且所有 direct dependencies 均为 `completed`
- **THEN** resolver SHALL 产生 canonical lifecycle-enterable `active` 供 `status` / `next` 使用

#### Scenario: Structurally valid wrong-scope activation fails closed
- **WHEN** durable exact Change state 为 `active` 且 only matching structural-valid `activate-change` fact 的 scope 为 `checkpoint`、`propose`、`archive`、`["activate-change","explore"]` 或其他非 exact `["explore"]`
- **THEN** resolver SHALL fail closed，且 MUST NOT 产生 lifecycle-enterable `active`

#### Scenario: Activation authority cannot cross Change or Delivery identity
- **WHEN** Owner activation fact 属于另一个 Change 或另一个 Delivery
- **THEN** resolver SHALL NOT 将该 fact 用于当前 exact Delivery + Change 的 active eligibility

#### Scenario: Direct dependency must be completed for durable active
- **WHEN** durable exact Change state 为 `active`，且该 Change 声明 direct `dependsOn`，而任一 target missing、duplicated、invalid 或 state 不是 `completed`
- **THEN** resolver SHALL fail closed，且该 Change MUST NOT 成为 lifecycle-enterable `active`

#### Scenario: Completed or cancelled state is not revived by old activation evidence
- **WHEN** current durable Change state 为 `completed` 或 `cancelled` 且历史中仍存在 matching `activate-change` OwnerAuthorityFact
- **THEN** resolver SHALL 保持 current durable state，且 MUST NOT 从历史 activation provenance 推导 `active`

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

### Requirement: Runnable distribution contains only required manager assets

系统 SHALL 提供可独立安装运行的发行包，包含 production JavaScript、运行依赖声明、系统 Action/Delivery Guidance 及其必要静态引用资产、OpenSpec tool lock 和必要 package/bin 元数据。发行包 SHALL 不包含开发 `.agents`、目标项目 OpenSpec/coordination/Runs/artifacts、`.tmp`、历史架构、测试工作区或外部 executable runtime；所需 runtime 仍位于 `FLOWKIT_HOME/tools`。

发行 SHALL 不要求 target 安装 manager 开发依赖或运行 Flowkit build scripts。运行安装 identity SHALL 不产生当前开发 Delivery 自管理权限；旧 Delivery/Run/accepted history SHALL 不因安装模型改变而迁移或重写。

#### Scenario: Install and run without a development checkout
- **WHEN** 从实际发行包建立 manager 运行安装并提供其运行依赖，启动 package-declared bin 访问独立 target
- **THEN** CLI 与系统资产 SHALL 可用，不依赖源码 checkout、tsx、开发 package scripts 或目标项目复制的管理资产

#### Scenario: Distribution excludes project execution history
- **WHEN** 生成实际发行包
- **THEN** 包内 SHALL 无项目执行历史、bootstrap Skills 或 OpenSpec executable runtime，且所有系统 Guidance 的必要静态引用 SHALL 在 manager 安装内可解析

### Requirement: Agent-recorded canonical history supports independent query sessions

Agent 按既有 canonical 三文件/schema/地址约定产生的实际 Run SHALL 能被后续独立 CLI 查询进程解析。可用性 SHALL 不依赖保留 stdin/stdout、PTY、PID、回调或之前查询进程的内存。结构验证 SHALL 不被宣称为执行真实性或 Reviewer 独立性的证明。

#### Scenario: A new query observes an Agent result

- **WHEN** Agent 已按合法 Role/Action 完成真实工作并保存可验证记录，之前查询进程已退出
- **THEN** 新 status/next SHALL 不要求输入 Run 编号即可读到真实 current 与相应 Policy 边，不重新执行工作

#### Scenario: Historical bootstrap is not relabeled

- **WHEN** target 只有明确标记的历史 independent-bootstrap 记录
- **THEN** 查询 SHALL 保留历史展示语义，不转换字段或生成 canonical 成功
