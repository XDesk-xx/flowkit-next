## MODIFIED Requirements

### Requirement: Foundation CLI has one real runnable package/bin surface

系统 SHALL 提供单一 package-declared `flowkit` entrypoint，由符合 `package.json#engines.node` 的 host Node 执行 production build 输出。command catalog SHALL 为 `status`、`next`、`doctor`、`action`；未知命令 SHALL 返回可区分输入错误，不转发其他 subsystem。Node fixture patch SHALL NOT 成为 managed-tool identity。

#### Scenario: Build produces a runnable flowkit entrypoint
- **WHEN** 在受支持 Node 上 build 并安装发行包
- **THEN** package bin SHALL 可执行四个受支持命令，不依赖开发 checkout

#### Scenario: Compatible host Node differs from detached fixture patch
- **WHEN** host 满足 engines 但 patch 不等于 22.23.2
- **THEN** CLI SHALL NOT 仅因此拒绝启动

#### Scenario: Unknown command is requested
- **WHEN** 命令不属于四个受支持命令
- **THEN** CLI SHALL 返回输入错误与非零 exit，不转发或执行 Action

### Requirement: CLI current-Run authority is always explicit, including explicit absence

CLI SHALL 从用户明确的 target 和可选 Delivery/Change 选择解析 exact current facts，用户 SHALL NOT 再提供 `currentRunId` 或 `changeStartSequence`。该 requirement 保留内部 exact current/absence，而将其来源从 caller 手选改为 target 内唯一可验证的正式上下文；省略 Run 参数不是 caller 断言 absence。解析 SHALL 使用 OpenSpec root/Change observation、可信 coordination、受控 Run 地址与真实前序链，不用 max sequence、mtime、目录顺序或 Git history 选择 current。歧义或不完整 SHALL 报告具体问题，不通过用户指定旧 Run 绕过。

#### Scenario: Exact selected Run is read
- **WHEN** 选定 Change 的完整、身份/Role/合法边一致的唯一链有一个末端
- **THEN** CLI SHALL 使用该 exact Run 的 context/result，不要求用户填写 occurrence

#### Scenario: Higher-sequence disconnected Run also exists
- **WHEN** 同一选定 Change 存在高号无关根、分叉或断链
- **THEN** CLI SHALL 报告歧义/链错误，不取最大号，也不退回较早 PASS

#### Scenario: Explicitly represent an active Change with no current Run
- **WHEN** 目标、OpenSpec 和 active coordination 有效且所选 Change 的受控历史确认为空
- **THEN** resolver SHALL 显式产生 null current facts，不创建 Run

#### Scenario: Run choice is omitted or malformed
- **WHEN** 请求不含旧 Run 参数，或请求仍携带旧 `currentRunId`/`changeStartSequence`
- **THEN** 前者 SHALL 进入正式上下文解析，后者 SHALL 被输入诊断拒绝并提示新请求形态；读取失败 SHALL NOT 被解释为 absence

### Requirement: status reports selected formal facts without advancing lifecycle

`status` SHALL 在 requested exact target 内返回解析后的 coordination、OpenSpec 与当前链事实，区分 `idle`、`waiting-owner`、`current`、`archived`、`cancelled` 和只供展示的 `bootstrap-history`。没有唯一目标、记录缺失/损坏或相互矛盾 SHALL 报告具体诊断，不猜 current。caller SHALL NOT 覆盖 Change state。status SHALL read-only，不调用 Policy 创造 next，不修改任何项目/Run/Git 事实。

#### Scenario: Report exact selected Run and OpenSpec facts
- **WHEN** 目标和唯一 current 链解析成功
- **THEN** status SHALL 返回 exact identities、state、OpenSpec observation 和 current Run，不执行 Action

#### Scenario: Caller cannot override reported Change state
- **WHEN** caller 提供 authority-bearing `changeState`
- **THEN** CLI SHALL 拒绝该不支持字段，只使用可信 coordination

#### Scenario: Reporting data cannot create authority
- **WHEN** status 展示 planning/readiness 或历史 bootstrap facts
- **THEN** 输出 SHALL NOT 产生 Owner/Reviewer/Verification/Git authority，也不把 bootstrap 转成 canonical current

#### Scenario: No active target differs from ambiguity
- **WHEN** 没有 active 目标，或多个 active 目标而用户未选择
- **THEN** 前者 SHALL 返回 idle，后者 SHALL 列出歧义候选并要求明确目标；planned 选择 SHALL 显示 waiting-owner 而非自行激活

### Requirement: next delegates lifecycle legality exclusively to canonical Policy

`next` SHALL 复用同一上下文 resolver，仅将可信 exact Change state、current 与 matching terminal facts 交给既有 Policy；空历史传 null，prepared 不制造 terminal facts。合法边 SHALL 由同一 Policy 验证，不复制转换表；Owner correction/checkpoint authority 按既有合同单独输入。next SHALL 只报告，不执行或自动准备 Action。无 active 目标或仅有 bootstrap-history 时 SHALL 报告不可执行的上下文事实，不伪造 Policy 输入。

#### Scenario: Terminal selected Run produces the Policy decision
- **WHEN** 唯一有效末端为 terminal
- **THEN** next SHALL 使用其 matching context/result 并原样报告 Policy decision

#### Scenario: Prepared selected Run does not gain terminal facts
- **WHEN** 已完整保存的失败 occurrence 保留 prepared state
- **THEN** next SHALL 传递 null terminal facts，不借前序 PASS 声称当前完成

#### Scenario: Active Change with no current Run reaches canonical Explore boundary
- **WHEN** trusted active 目标的受控历史确认为空
- **THEN** next SHALL 报告 Policy 的 Explore boundary，不创建 Run 或执行 Explore

#### Scenario: Untrusted active claim cannot reach Policy as active
- **WHEN** activation/provenance/direct dependency 事实不足
- **THEN** CLI SHALL 在提供 authoritative active 前失败，不接受 caller 自述

#### Scenario: Policy returns blocked
- **WHEN** Policy 返回 blocked
- **THEN** next SHALL 保留该正式结果，不自动创造 correction 或下一 Action

### Requirement: CLI machine outcomes distinguish valid formal results from command/integration failure

CLI SHALL 输出结构化结果，不解析 free-text 重建语义。status 的正常上下文状态、next 的 Policy blocked、checkpoint unauthorized 和 bounded doctor diagnostic SHALL 保持合法 machine outcomes；输入、歧义、缺失/损坏 Run、集成、宿主协议、证据或保存失败 SHALL 可区分且非零退出。action SHALL 采用已声明 JSON Lines 往返，只在必要保存/读回完成后输出最终 terminal outcome；领域测试失败或 Reviewer changes-requested SHALL 与 transport/admission failure 区分。

#### Scenario: Policy blocked is a formal result
- **WHEN** next 成功构造事实且 Policy blocked
- **THEN** CLI SHALL 输出 blocked 正式结果，不冒充进程故障

#### Scenario: Exact Run cannot be read
- **WHEN** 所选 Change 存在 incomplete/invalid occurrence
- **THEN** CLI SHALL 非零退出并报告该 occurrence，不选择旧 Run

#### Scenario: Action response is not durable success
- **WHEN** 宿主回交正确结果但必要持久化失败
- **THEN** action SHALL 返回非零保存诊断，不输出 terminal 成功

### Requirement: Foundation CLI remains a thin bootstrap-era surface without self-management

Production CLI SHALL 只组合既有 domain/integration 与本 capability 的有界上下文、单次交互宿主接缝。它 SHALL NOT 读取/执行 `.agents/skills/**`、调用模型 API、切换 Role、自动下一 Action、自动激活 Change、建立 Registry、执行 Delivery Full Test/Final、Git mutation 或 Owner promotion。OpenSpec mutation SHALL 由已获准 Action 的真实宿主依上游 mechanics 执行，CLI 不重建 OpenSpec state machine。D05 自研 SHALL 保持独立 bootstrap，不因新入口存在而自我接管；Archify 无产品入口。

#### Scenario: Bootstrap Skills are absent from production call path
- **WHEN** 任一产品 CLI command 执行
- **THEN** 它 SHALL 只使用 manager 正式资产与 target 事实，不消费 bootstrap Skills

#### Scenario: Independent diagrams do not provide lifecycle authority
- **WHEN** repository 有独立/历史图
- **THEN** CLI SHALL 不读图决定 lifecycle，不触发绘图或 Start/Final

#### Scenario: Archify is managed but not lifecycle authority
- **WHEN** 用户独立管理 Archify 安装或图
- **THEN** CLI SHALL 不解析该安装，不将其视为 managed tool 或 authority

#### Scenario: Completed Action does not start another
- **WHEN** action 已完成并报告 continuation
- **THEN** CLI SHALL STOP，不运行下一个 Action 或自动 Reviewer

### Requirement: Installed manager assets are independent of target project facts

系统 SHALL 从自身入口/package 定位 manager 资产，target repositoryRoot SHALL 只表示项目根；request SHALL NOT 覆盖资产根或任意 Skill 路径。四个 CLI 命令 SHALL 使用 manager 自有 Guidance/tool lock 和 target 正式事实，不用 target 上一 Delivery SHA 选择安装。target SHALL 无需复制 Flowkit 源码、Skills、lock 或 glue scripts；项目 Run/proof 写入 SHALL 只留 target，缺 manager 资产 SHALL 只阻断依赖它的能力且不得由 target 同名文件补齐。安装身份 SHALL 不产生 lifecycle/Git authority。

#### Scenario: Installed CLI reads an independent target
- **WHEN** 实际发行安装与 target 分根，target 没有 Flowkit 开发资产而正式事实/runtime 有效
- **THEN** 四个入口 SHALL 能使用其所需 manager 资产，不依赖开发路径或 target scripts

#### Scenario: Target cannot override system installation
- **WHEN** target 含同名 package/Skills/lock 或 request 指定资产覆盖
- **THEN** 系统 SHALL 不改变可信来源，拒绝不支持字段

#### Scenario: Relocated installation leaves target data in place
- **WHEN** 完整安装移位后访问同一 target
- **THEN** 系统 SHALL 仍读取原项目事实，写入原项目，不迁移历史或改变测试配置

## ADDED Requirements

### Requirement: One explicit Action request uses resolved context and existing authority

`action` SHALL 要求已由调用宿主明确的 Role 与 Standard Action，复用上下文 resolver、trusted coordination、既有 Policy 及 exact Guidance。请求 Action/Role 不匹配合法边时 SHALL 在宿主执行前拒绝。ordinary Action SHALL NOT 新增 Owner 审批；既有 activation、correction 与 Git 权限边界保持。不支持 canonical 执行的 bootstrap-history SHALL 只显示，不迁移或自动接管。

#### Scenario: Legal author invocation needs no manual Run number
- **WHEN** trusted active Change 的合法边与明确 Author 请求一致
- **THEN** CLI SHALL 分配新受控 occurrence 并进入一次宿主调用，不要求填写 Run 编号或额外 commit

#### Scenario: Wrong role or illegal action is rejected
- **WHEN** Author 请求 Reviewer Action 或请求不符合 Policy
- **THEN** CLI SHALL 拒绝且不派发执行、不产生 Reviewer verdict

#### Scenario: Review context does not imply automatic review
- **WHEN** Policy 指向独立 Review
- **THEN** CLI SHALL 等待真实独立 Reviewer 宿主的明确调用，不替 Author 自动扮演 Reviewer
