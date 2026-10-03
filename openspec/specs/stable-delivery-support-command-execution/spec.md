# stable-delivery-support-command-execution Specification

## Purpose
为 Flowkit 已有 Project、Delivery、Change、Memo、Archive 与正式验证操作提供可发行的固定机械入口，使 Agent 能在识别真实指令后以封闭数据调用既有权威规则，并准确交接写入及失败结果。

## Requirements

### Requirement: Support commands are a closed data-only surface

发行 CLI SHALL 支持且仅支持 B 新增的 `project init`、`delivery start`、`change activate`、`change archive`、`memo list`、`memo get`、`memo create`、`memo promote`、`memo dismiss`、`delivery full-test`、`delivery full-test current`、`delivery final`、`git checkpoint`、`git push` 与 `git integrate` 固定命令。每个命令 SHALL 使用封闭的 `--input <path|->` JSON 请求；写操作 SHALL 有可见的 `--repository-root`，Delivery/Change 定位参数 SHALL 与 JSON 内值一致，缺失/冲突/多余权威字段 SHALL 在副作用前拒绝。请求 SHALL NOT 包含 caller 提供的程序、命令行、模块、callback、Guidance 摘要、Run 序号或自签结果布尔值。

#### Scenario: Fixed command receives matching target data
- **WHEN** Agent 以受支持命令提交封闭请求，且可见目标与 JSON 目标精确一致
- **THEN** CLI SHALL 只执行该命令对应的一次机械操作并返回机器可读结果，不继续下一操作

#### Scenario: Caller attempts to supply executable behavior or another target
- **WHEN** 请求含 `scriptPath`、动态模块/任意命令、caller callback、未知权威字段，或可见 target 与 JSON target 冲突
- **THEN** CLI SHALL 在任何项目写入或外部操作前 fail closed，不将请求转发给宿主解释器

### Requirement: Agent-attested Owner input remains a separate authority boundary

Agent/宿主 SHALL 负责识别真实 Owner 输入、实际角色、授权范围与 `sourceRef`，并在需 Owner 决定的命令中提交精确 `OwnerAuthorityFact` 或 Project 首次接入所需的明确来源声明。CLI SHALL 按操作校验 decision、scope、Delivery/Change、目标、当前 Policy/coordination 及适用证据；CLI SHALL NOT 从任意“授权”字样、请求文件存在、Review/PASS 或历史消息推断 Owner 决定，也 SHALL NOT 声称独立读取、监听或认证聊天。高影响写入 SHALL 在实际写前复核本次提交的 Owner 决定与操作的一致性；该结构校验不替代 Agent 对真实来源的责任。

#### Scenario: Exact current Owner decision is supplied
- **WHEN** 受信 Agent 已依据真实 Owner 指令提交匹配本次操作和目标的 authority fact，且当前正式前置满足
- **THEN** CLI SHALL 使用该 fact 完成适用的操作校验，不要求连接 Codex 桌面聊天或匹配固定自然语言短语

#### Scenario: Source or scope claim does not match the operation
- **WHEN** authority 缺失、sourceRef 与本次声明不一致，或 decision/scope/目标与请求操作不同
- **THEN** CLI SHALL 在副作用前拒绝，且 SHALL NOT 以聊天内容不可访问为由补造授权

### Requirement: Project initialization creates only exact project identity

`project init` SHALL 在目标已有可核对的 OpenSpec root 时，以结构化项目身份 create-once 写入 `.flowkit/project.json` 并读回；已有 exact 内容 SHALL 只读确认，冲突内容 SHALL 保留并拒绝。该命令 SHALL NOT 要求尚不存在的 Delivery ID/OwnerAuthorityFact，不创建 Delivery、Change、Run、Git commit 或其他用户文件。缺 OpenSpec root SHALL 报告需先使用 exact managed OpenSpec 固定工具完成初始化，不在目标上猜测或覆盖。

#### Scenario: New project has no Delivery yet
- **WHEN** 目标 OpenSpec root 有效、`.flowkit/project.json` 缺失，且 Agent 提供明确的项目接入来源与封闭项目身份
- **THEN** CLI SHALL 仅创建并读回该项目身份，不要求虚构 Delivery authority

#### Scenario: Existing project data conflicts
- **WHEN** `.flowkit/project.json` 已有不匹配内容或 OpenSpec root 不可确认
- **THEN** CLI SHALL 不覆盖文件，并报告冲突或缺失的 exact 前置

### Requirement: Delivery Start materializes bounded content without Git authority

`delivery start` SHALL 消费已有项目身份、Owner 选定的可读规划、匹配的 create-delivery authority 和结构化固定 manifest 内容，复用既有 Start package/prestate/create-once/readback 合同。成功 SHALL 只确认 Delivery 内容完成；无首个 commit、无关 dirty 或缺 Git 权限 SHALL NOT 单独阻断 Start。命令 SHALL NOT 自动激活 Change、创建 Action Run、提交或推送。

#### Scenario: Start succeeds on an uncommitted project
- **WHEN** 项目/规划/authority/manifest prestate 匹配，目标尚无首个 Git commit
- **THEN** CLI SHALL 完成或只读确认 Start 内容，返回实际 manifest 身份，不尝试 Git 写入

#### Scenario: Manifest write cannot be confirmed
- **WHEN** 写入发生后读回失败或目标内容冲突
- **THEN** CLI SHALL 报告 exact 目标与 `written-unconfirmed`/冲突状态，不补造完成或自动覆盖

### Requirement: Change activation is distinct from Standard Action execution

`change activate` SHALL 要求该 Delivery 中 exact planned Change、全部 completed 直接依赖、无其他冲突 active Change，以及 `decision=activate-change`、exact Delivery/Change、`scope=["explore"]` 的 Owner fact，并 SHALL 以 fixed OpenSpec mechanics 建立 exact Change scaffold、窄写 manifest activation 及读回。首次 `projectOrdinal` SHALL 留给随后真实 Explore 的现有分配规则；激活 SHALL NOT 创建 Explore/Reviewer Run、选择下一 Action 或填入结论。OpenSpec 创建与 manifest 写入之间若发生部分效果，SHALL 报告各自真实状态并停止，不清理已创建材料。

#### Scenario: Activate one planned Change
- **WHEN** exact planned Change 与依赖有效，Owner 授权激活且同名 OpenSpec Change 不冲突
- **THEN** CLI SHALL 建立可读的 OpenSpec Change、保存 exact activation fact，并让后续 Policy 独立计算 Explore 边界

#### Scenario: OpenSpec creation succeeded but coordination failed
- **WHEN** Change scaffold 已创建而 manifest activation 写入或读回未确认
- **THEN** CLI SHALL 报告已有 scaffold 与未确认 coordination，不自动删除、重建或伪造 Explore Run

### Requirement: Memo commands preserve memo ownership and non-blocking meaning

`memo list/get` SHALL 只读；`memo create/promote/dismiss` SHALL 使用既有 Memo 记录与 Owner-gated 规则，验证 exact 目标、来源和状态，窄写 `.flowkit/memos.json` 并读回。Memo SHALL NOT 自动成为当前 Delivery requirement、Policy blocker 或下一 Action。

#### Scenario: Owner promotes a future Memo
- **WHEN** existing open Memo、exact target 与适用 Owner authority 匹配
- **THEN** 命令 SHALL 只更新该 Memo 的现有状态并读回，不修改 Delivery Change 或启动 Action

#### Scenario: Duplicate or unauthorized Memo write
- **WHEN** memoId 已存在、状态不适用或 Owner scope 不匹配
- **THEN** 命令 SHALL 拒绝且保留原 Memo 文档

### Requirement: Archive executes exact OpenSpec convergence inside the current archive Action

`change archive` SHALL 要求同一 Change 当前合法且已由 A 的 `action start` 建立 exact archive Action，实读 approved review-apply、tasks、persisted projectOrdinal、OpenSpec 状态、适用检查与目标归档路径；它 SHALL 使用 exact managed OpenSpec runtime 完成现有收敛/归档机械步骤并读回实际 archive 与 manifest completion。命令 SHALL NOT 接受 caller `checksPassed`/`reviewApproved` 布尔值，也 SHALL NOT 自己生成 Action Result、Reviewer verdict 或 Git checkpoint；Author 随后使用 A 的 `action finish` 记录真实结果。部分 OpenSpec/manifest 效果 SHALL 保留并报告，不自动回滚或重试。

明确的同Run后续invocation SHALL 仅在exact descriptor、前序、package/Guidance及保存的pre/postcondition和真实OpenSpec/coordination事实证明时接续剩余步骤。合法partial可以被只读inspect呈现，但不能冒充完整Run；已验证归档后态时不重复执行OpenSpec archive，已验证completed时只读确认。mixed/unknown/drift或partial machine保存 SHALL 阻断并保留bytes，不自动重试、补Result或重开completed Change。

#### Scenario: Reviewed Change archives at its persisted ordinal
- **WHEN** exact archive Action 已开始且真实前置、工具和目标路径有效
- **THEN** 命令 SHALL 完成既有 OpenSpec 归档与 completion 读回，返回归档路径和实际效果供 Author 结束该 Action

#### Scenario: Preflight or mid-archive failure
- **WHEN** Reviewer 证据缺失、检查未通过、工具不可用、目标冲突或归档中途失败
- **THEN** 命令 SHALL 在可确定的写前阶段阻断，或在已有副作用后准确报告 partial/incomplete，不声称 archive/Action 完成

#### Scenario: Same Run continuation does not replay accepted archive effects
- **WHEN** 明确同Run调用时真实ordinal archive/spec和completed coordination均匹配且没有冲突successor
- **THEN** 命令 SHALL 只读确认业务完成并交给原Run finish，不重放归档或新建Run

### Requirement: Full Test executes one formal attempt and exposes current result

`delivery full-test` SHALL 要求适用 Owner authorization、请求前固定的 UUID v4 `attemptId` 与 nullable `expectedCurrentAttemptId`。首次调用 SHALL 仅在目标 attempt 不存在、预期关联与实际当前关联一致、且本次 Owner fact `ref` 不等于当前 attempt 的 `ref` 时，使用该 `attemptId` 建立 create-once 开始记录，绑定 exact Delivery、Owner fact、预期关联及实读的配置/输入 identity；发布并读回当前关联后，按既有正式 Full Test 规则执行本次全部适用检查。相同代码/配置上的明确新运行 SHALL 使用新 `attemptId` 和 distinct Owner fact `ref`，其检查 SHALL 重新执行。`attemptId`/预期关联仅识别请求和防止陈旧投递，不产生 Owner authority 或测试 verdict。`delivery full-test current` SHALL 只读返回当前关联身份及材料状态，即使为 failed/incomplete；既有无预期关联字段的历史开始记录 SHALL 保持可读，不为重投补写或重签。新的失败、partial 或输入漂移 SHALL NOT 回用旧 PASS；命令 SHALL NOT 将测试结果变成产品修改、Git 或 Final 权限。

#### Scenario: Fresh authorized Full Test attempt
- **WHEN** required Changes、当前配置/代码输入与 Owner authority 满足既有正式前置，且新 `attemptId`、distinct Owner fact `ref` 与预期当前关联匹配
- **THEN** 命令 SHALL 执行并保存一个可读的新 attempt 与真实检查结果，随后停止

#### Scenario: Same request is redelivered after a response is lost
- **WHEN** 同一 `attemptId`、Owner fact 与 `expectedCurrentAttemptId` 再次送达，且目标开始记录已存在，不论当前为 terminal passed/failed、pending，或开始/发布/结果阶段出现 partial
- **THEN** 命令 SHALL 核对该记录和可确认材料，只读返回该 attempt 的状态、是否仍为 current 及未知部分，不再次执行检查、不创建或发布另一 attempt；历史 PASS 不被报告为当前 PASS，记录冲突或不可确认时 SHALL 拒绝并保留已有 bytes

#### Scenario: Directory exists but its start is not confirmed
- **WHEN** 同一 `attemptId` 的目录已建立，但开始记录缺失、损坏或无法读回
- **THEN** 命令 SHALL 报告已知 partial/不可确认并停止，不在该目录补写开始记录或执行检查

#### Scenario: Owner explicitly starts another run on the same input
- **WHEN** 已有 terminal 或经明确核对的 partial，Owner 明确要求新运行，Agent 提供新 `attemptId`、针对本次决定的 distinct Owner fact `ref` 和读取到的当前关联
- **THEN** 命令 SHALL 在关联未漂移时建立独立 attempt 并重新执行全部适用检查，保留旧 attempt；若关联已漂移 SHALL 在检查前拒绝，不把旧投递解释成新运行

#### Scenario: Check fails after an earlier PASS
- **WHEN** 新 attempt 的适用检查失败或必要材料不可确认
- **THEN** 当前结果 SHALL 表示新失败/partial，`current` SHALL NOT 退回先前 PASS

### Requirement: Delivery Final consumes accepted completion and confirms in its own boundary

`delivery final` SHALL 要求 exact Final Owner authority、全部 required Change 的可信已接纳完成来源、当前有效 Full Test 与既有 Final package/confirmation 规则；命令 SHALL 完成既有窄写、复验和发布确认，并仅在确认可读时报告 completed。它 SHALL NOT 接受 caller 自称的 archive/Review/Verification 布尔值，不执行 Git、Integration 或下一 Delivery Start。

#### Scenario: Confirmed Final is published
- **WHEN** required completion、当前 Full Test 和 Owner authority 均有效，窄写与复验完成
- **THEN** 命令 SHALL 返回有效 confirmationRef 并停止，不创建 Git authority

#### Scenario: Final content exists but confirmation is absent
- **WHEN** 第一笔窄写已发生但复验或确认发布失败
- **THEN** 命令 SHALL 报告 `written-unconfirmed` 与已有内容，不把 completed 字段当成成功 Final

### Requirement: Fixed operation outcomes expose effects without replaying work

每个写命令 SHALL 区分输入拒绝/写前 blocked、已完成且已读回、失败、incomplete、`written-unconfirmed` 与实际部分效果，返回 exact operation/target、已确认身份及未完成步骤。重复请求 SHALL 仅在该操作明确的合同允许且 exact 请求身份一致时只读确认，否则拒绝；不得覆盖 canonical Run/proof、OpenSpec 产物、Memo、Full Test attempt、Final confirmation 或 Git 对象。成功或失败返回后 SHALL STOP，不自动调用下一个命令。

#### Scenario: Response lost after a write
- **WHEN** 目标写入可能已发生但结果响应或读回丢失
- **THEN** 命令 SHALL 以有界只读检查报告已确认部分与未知部分，不自动重做写操作

#### Scenario: One operation completes
- **WHEN** 本次固定命令的全部自身效果已确认
- **THEN** 命令 SHALL 返回该操作的完成事实并退出，不自动 Review、Archive、Full Test、Final 或 Git 后继节点

### Requirement: Current owned support HOW matches fixed command requests and outcomes

发行的 Delivery Start、Full Test、Final、repository integration Skills 及仍有效的自有 references SHALL 将正常机械操作映射到本安装已支持的 `project init`、`delivery start`、`change activate`、`change archive`、Memo、`delivery full-test`/`current`、`delivery final`、`git checkpoint`/`push`/`integrate` 固定数据命令及适用 OpenSpec 工具命令。HOW SHALL 对实际需要的节点给出与发行 parser 一致的 `--input`、可见 target、精确数据字段、效果/错误状态与真实读回步骤；Owner 来源、角色、适用检查、外部接受事实仍由相应权威提供。正常操作 SHALL NOT 要求 Agent 动态导入内部模块、提供可执行 callback、编写临时生命周期程序或把固定命令包装成新的任意执行器。当前有效的 onboarding、README、CLI help/示例和 AGENTS 入口 SHALL 与同一合同相符；历史描述可保留为历史，不得被指示为当前正常路径。

#### Scenario: Owner authorizes a Delivery operation
- **WHEN** Agent 已从真实 Owner 输入形成该节点的精确授权，且当前状态允许该操作
- **THEN** 当前自有 HOW SHALL 指向对应固定命令和匹配的封闭请求，要求核对已确认效果并 STOP，不自行调用后继节点

#### Scenario: Git node has a partially confirmed effect
- **WHEN** 固定 Git 命令返回部分成功、未确认或需外部接受
- **THEN** repository integration HOW SHALL 交接已确认对象及剩余步骤，不把 callback、旧宿主输出或 checkpoint 当成 push/merge 接受事实，也不盲重试

#### Scenario: A current reference still teaches internal execution
- **WHEN** 当前 Skill 的有效 reference 仍要求直接导入发行 `dist` 或传入 `readOwner` callback 完成正常操作
- **THEN** 发行自有 HOW SHALL 修正或退役该 reference，使其不再成为默认操作路径；不得仅在另一 reference 隐藏相同执行样板

#### Scenario: Bootstrap guidance remains in use for this Delivery
- **WHEN** 本仓库的独立 `.agents/skills/**` 仍服务于当前外部 Stable manager 管理的 bootstrap 执行
- **THEN** 候选发行 HOW SHALL 不读取、替换或委托该来源，当前正式操作 SHALL 不因候选说明更新而切换 manager

### Requirement: Ordinary checkpoint stages a bounded exact path set

已获 exact Owner 授权的普通 `git checkpoint`/宿主 create-new 操作 SHALL 能在受支持目标平台处理超出单次进程参数长度的合法精确路径集合。暂存输入 SHALL 仅由已验证的 operation `paths` 构成，并保持 literal、排序/唯一及既有安全路径语义；实现 SHALL 不把目录/glob、shell 源码、范围外 staged 或 caller 任意程序当作等效输入。写前与提交前 SHALL 保留既有分支/HEAD、Owner 当前来源、工作树与 index 身份、managed evidence 原始字节及实际提交对象/范围核验。失败后 SHALL 读回并报告已确认的 index/commit 效果和未知部分，保留用户 index，不自动清空、重试、提交、push 或改写历史。

#### Scenario: Many exact paths exceed argv limit
- **WHEN** 授权的同一 checkpoint 含足以触发宿主单次 argv 长度限制的合法路径集合
- **THEN** 宿主 SHALL 仍以有界输入暂存精确集合，并仅在全部既有权限、证据及对象读回成立时报告 completed

#### Scenario: Unrelated staged path or changed source
- **WHEN** index 含范围外 staged，或本次 Owner、分支、HEAD、路径字节或 index 在写前/写间漂移
- **THEN** 宿主 SHALL 按既有边界拒绝或报告不完整，不夹带范围外文件，也不从已暂存状态推断新 Owner authority

#### Scenario: Stage or commit response is uncertain
- **WHEN** 大批量路径暂存部分发生或命令响应丢失，实际 index/commit 状态尚未全部确认
- **THEN** 宿主 SHALL 交接已确认对象及剩余核对步骤，保留现有 index，不自动重放写操作或把 stage 当成 checkpoint

### Requirement: Optional host permissions remain narrow and visible

发行接入说明 SHALL 只提供需由 Owner 审核选择的宿主权限示例，按只读查询、受控记录写入、项目检查及 Git/网络分别界定选定 manager 安装、固定命令与实际支持的可见目标。只有入口接受目标 argv 且核对 JSON 一致性时，示例才可声称宿主命令前缀按 target 收窄；当前 Foundation `status/next/doctor` 仅接受 `--input`，其请求文件路径或 stdin SHALL NOT 被描述为可见 target 绑定。示例及其验证 SHALL 不将裸 `node`/`python`、全部 Flowkit 命令、不同安装或不同 target 一并放行；支持可见目标的固定入口仍 SHALL 核对 JSON，宿主前缀匹配 SHALL NOT 被宣称为语义授权。无可执行交互式宿主规则验证时，发行/验收 SHALL 标明该项未验证，不能声称零提示或自动安装权限。

#### Scenario: Exact installed read-only command
- **WHEN** 可测试宿主对选定安装且实际支持目标 argv 的固定只读命令与可见 target 应用示例规则
- **THEN** 仅该匹配请求 MAY 按用户已批准的宿主策略执行，CLI 仍独立验证请求数据

#### Scenario: Interpreter or target changes
- **WHEN** 命令使用裸解释器、其他安装/子命令、另一个可见 target 或 JSON 中冲突目标
- **THEN** 示例规则或固定入口 SHALL 拒绝相应越界；Git/网络操作 SHALL 不继承只读/记录命令的权限

### Requirement: Archive convergence checks use independent target dependencies

Archive的start与change archive预检 SHALL 使用同一显式执行合同：真实隔离OpenSpec convergence后执行全部声明适用检查，依赖在scratch内独立可写，manager不创建指向原target依赖的junction/共享可写hardlink，不自动install/update/delete原依赖。可证明target内部的链接 SHALL 只映射到scratch；逃逸/未知外部依赖、不完整snapshot或package/lock/metadata漂移 SHALL 在业务archive前拒绝。不支持的布局 SHALL 明确阻断，不缩窄检查或静默回退。

对pnpm11，源依赖状态 SHALL 通过禁止自动install的只读preflight；scratch运行 SHALL 仅局部关闭pre-run依赖同步，不跳过实际scripts或将旧PASS作为新检查。不要求Owner给两个进程分别补隐藏env。此约束不声明对任意项目恶意脚本的通用OS sandbox。

#### Scenario: Native pnpm junction regression executes project checks
- **WHEN** Windows pnpm11 target依赖状态有效且snapshot所有链接闭合到scratch
- **THEN** 声明检查 SHALL 实际执行，原candidate与依赖保持不变，不能在pnpmpre-run保护处误报项目测试失败

#### Scenario: A real assertion failure still blocks archive
- **WHEN** 隔离后的项目check真实退出非零
- **THEN** archive SHALL 被阻断，即使过去Review或其他preflight曾PASS

#### Scenario: External writable dependency alias is refused
- **WHEN** snapshot不能在scratch内闭合或只读源preflight检测依赖不一致
- **THEN** manager SHALL 拒绝并给具体环境原因，不安装或修改原依赖

### Requirement: Archive failure diagnostics retain bounded original process evidence

每次Archive预检及真实命令失败 SHALL 在清理scratch前create-once保存target-owned命令元数据、raw stdout/stderr、exitCode/signal/spawnError/timeout、截断标记与归属引用。start前失败 SHALL 用独立attempt身份且nullable runId，不伪造Run。每流最多16MiB，超限停止进程并标process-failed/truncated，保留实际已收bytes前缀，不声称完整日志或PASS。未配置、执行环境、命令不可用、测试非零和timeout SHALL 可区分；不记录秘密env，不格式化原流。材料保存失败 SHALL 报实际已保存/未确认部分并阻断，不仅返回笼统check ID。

#### Scenario: Dependency failure remains diagnosable after cleanup
- **WHEN** pnpm前置条件或check失败且scratch随后被清理
- **THEN** 响应 SHALL 指向可读的命令与原始流材料，包含真实退出/分类，不把它简化成测试断言失败

#### Scenario: Output overflow cannot become a successful check
- **WHEN** stdout/stderr超限或保存失败
- **THEN** 命令 SHALL 报process-failed/unconfirmed及保留位置，不能返回PASS或丢弃已保存bytes

### Requirement: Explicit same Run Archive continuation consumes verified actual effects

对合法descriptor-only Archive，manager SHALL 在artifacts保持有界immutable pre/postcondition与真实effect观察，绑定Run/package/Guidance、原candidate、受影响spec、archive目标和coordination。下一次明确change archive invocation SHALL 先观察真实状态，再只执行可证尚未完成的剩余步骤。完整prestate且无archive效果才可执行真实OpenSpec archive；已证明default/exact archive和spec后态时 SHALL 不重放archive，只做必要rename/coordination/读回。reported effect或phase文件存在 SHALL 不独立证明实际成功。

供后续checkpoint消费的既有Archive材料 SHALL 绑定exact Author/Review/Archive链、source/最终ordinal archive路径、迁移文件的完整suffix/hash集合、受影响spec的前后hash或null缺失态，以及coordination文件前后hash和仅当前Change active→completed的差异。生产端 SHALL 核对迁移内容不变、spec后态等于已检查的隔离收敛、coordination无额外字段变化；真实Archive terminal Result SHALL 绑定所需材料的exact路径、bytes、SHA-256。未接纳terminal前材料仅作观察/恢复，不能独立提供checkpoint转换依据；不新增Run文件或第二份OpenSpec truth。

mixed/unknown/drift、Guidance不兼容、partial machine文件、竞争successor或旧未知descriptor SHALL 阻断。不得自动重试、回滚、cleanup旧Run、创建替代Run、补造Result或引入resumed状态。已completed协调及exact archive匹配时 SHALL 只读返回业务完成，仍由同Run finish接纳实际结果。

#### Scenario: Process acknowledgement is lost after archive bytes appear
- **WHEN** source已移走且default archive/spec真实bytes匹配持久预期后态
- **THEN** 明确同Run继续 SHALL 只做剩余ordinal rename/coordination，不重执行OpenSpec archive

#### Scenario: Coordination response was lost
- **WHEN** exact archive/spec和completed coordination实际匹配
- **THEN** 同Run重投 SHALL 只读确认业务效果，不能重写coordination或创建新Run

#### Scenario: Accepted archive binds the transformation used by checkpoint
- **WHEN** 真实迁移、spec收敛与coordination更新均验证成功，随后同Run finish接纳terminal结果
- **THEN** 该结果 SHALL 绑定已有材料中的exact转换前后身份，供checkpoint核对合法后态；旧Author/Review Run保持原bytes，单独completed响应不替代此绑定

#### Scenario: Partial convergence cannot be guessed as safe retry
- **WHEN** 实际spec/source/archive呈混合状态，或machine文件已经partial写入
- **THEN** 系统 SHALL 保留全部bytes并报告unknown/blocked及所缺事实，不自动补成功或重放
