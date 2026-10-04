## MODIFIED Requirements

### Requirement: Start commits a recognizable current-manager descriptor before work
start SHALL 重新读取可信coordination、必要OpenSpec上下文、唯一前序链及Policy，核对Role、适用Owner authority、各Action机器readiness、Guidance、受控occurrence及必要Git原始证据字节。实质Author/Reviewer判断仍归角色。Archive readiness SHALL 只包含自有lifecycle admission、可信approved Review/candidate、projectOrdinal及identity完整性；不调用原生validate/archive预演、不执行项目checks或repository/dependency snapshot。原生task/delta/collision/rollback失败 SHALL 发生在真实started Run内。

成功开始 SHALL create-once写并读回action.md，保留 `# Action started`、有界JSON、formatVersion=1、commandOrigin=flowkit-action-start、changeStartSequence、actionPackage和matching preparedContext。新Archive另有archiveContractVersion=2，且新请求不接受applicableChecks；旧字段给明确迁移诊断，不静默跳过。marker不是权限证明。所有admission可判拒绝 SHALL 在首次Run写前发生；写入或读回不确定时不得报告可开始业务。

#### Scenario: Start and work ordering
- **WHEN** 当前事实满足admission且occurrence未使用
- **THEN** start SHALL 保存读回descriptor后才允许本次实际工作

#### Scenario: Preflight or create-once failure
- **WHEN** admission、Guidance、Owner/Role、前序链、证据Git bytes或create-once失败
- **THEN** start SHALL 不报告已开始，并保留已写bytes、区分not-written与written-unconfirmed

#### Scenario: Archive preparation blocks before mutation
- **WHEN** Archive候选在Review后漂移、Policy不符、ordinal或identity无效
- **THEN** start SHALL 在业务和新descriptor前拒绝，保留原边界；原生validation或项目check不属于这里的阻断

#### Scenario: Reviewer readiness does not perform review
- **WHEN** review-propose有完整匹配的Author和可读规划
- **THEN** start SHALL 只确认机器就绪，不生成approved；独立Reviewer仍执行实质审查

#### Scenario: Retry start preserves its failed direct predecessor
- **WHEN** terminal Archive安全失败且新明确archive请求通过重新admission
- **THEN** start SHALL 用专用retry transition建立新occurrence，parent指向原失败；Review通过唯一失败链解析而不是冒充直接parent

### Requirement: Finish admits a real role result and preserves partial outcomes
finish SHALL 接收真实角色结论，验证exact package/current/occurrence/result、候选、proof和reported boundary后才写machine文件。普通Author FAIL/null可保持terminal blocked；Reviewer rejected/null须经exact候选绑定保存terminal并返回review-rejected，不重标changes-requested/approved；unknown token或冲突boundary写前拒绝。Author不得填写Reviewer verdict，命令不得生成Verification PASS。

Archive SHALL 分别校验completed PASS、安全failed FAIL和partial FAIL的真实绑定材料及实际业务状态。只有completed PASS需要可信completed coordination与archived查询形态；安全failed使用可信active/current；可验证terminal partial保持可读与archive-recovery-required，即使业务coordination部分写入或无法可靠解析，也不能伪造completed/active或阻止记录已确认失败。无法验证descriptor/父链或machine写入不完整时仍为incomplete，不补结果。新的Author成功候选可按专门合同增加实测candidateGit机械事实，不改角色结论；同值duplicate只能消费原已存事实。

proof SHALL 核对target/Delivery/Change/Run、regular/readable、SHA-256、原始Git bytes及完整声明；无必要proof不建空目录。首次结束仅create-once保存缺少的context.json/result.json，完整三文件、必要材料、唯一链及对应Policy/query读回后才confirmed；confirmed不是业务PASS。机器partial保持written-unconfirmed，不覆盖或自动重做业务。

#### Scenario: Real result accepted
- **WHEN** 真实工作结论与package匹配、proof有效且保存读回成功
- **THEN** finish SHALL 报告exact terminal或合法prepared failure，使独立查询读到同一记录

#### Scenario: Context saved but Result save fails
- **WHEN** context.json成功而result.json保存或读回失败
- **THEN** finish SHALL 保留已有文件并报written-unconfirmed，不宣称terminal或自动补写

#### Scenario: Wrong reported boundary is rejected before first Result write
- **WHEN** approved review-propose报告nextBoundary=archive或使用未知verdict
- **THEN** finish SHALL 写前拒绝，不能只凭结构合法报告confirmed

#### Scenario: Rejected Reviewer judgment persists as terminal stopped
- **WHEN** 真实Reviewer rejected/null具有合法角色和exact Author绑定
- **THEN** finish SHALL 保存terminal三文件和known blocked链，不伪装业务PASS或执行下一Action

#### Scenario: Rejected Reviewer judgment is not a terminal Run in this Change
- **WHEN** rejected的角色/候选绑定无效或nextBoundary非null
- **THEN** finish SHALL 在首次machine写前拒绝，不能重标verdict绕过

#### Scenario: Complete bytes are not a valid canonical continuation
- **WHEN** machine文件已写但唯一链/Policy读回不能确认exact tip
- **THEN** finish SHALL 保留bytes报written-unconfirmed，不以单个文件结构通过宣布完成

#### Scenario: Failed Archive is confirmed without archived status
- **WHEN** Archive安全失败、active前态与真实材料可证、三文件成功保存
- **THEN** finish SHALL confirmed terminal FAIL，独立query为active/current且next可计算archive，不要求archived状态

#### Scenario: Business partial is not a partial machine record
- **WHEN** Archive业务recovery-required，但实际失败材料、descriptor和唯一父链有效
- **THEN** finish SHALL 可保存完整terminal partial并使查询blocked；若machine保存失败则另报incomplete

### Requirement: Fixed Action inspection exposes partial facts without granting recovery
action inspect SHALL 保留共同target/exact runId封闭请求，严格核对可见目标，只读呈现descriptor、machine完整性、diagnostic refs、真实Archive效果、remaining和canContinue，不写Run/phase/correction。descriptor-only或machine partial不得冒充完整current；完整terminal partial则应明确显示真实已记录失败与recovery-required，不误报文件缺失。wrong root、Guidance drift、fork、mixed/unknown或旧未知格式 SHALL 明确阻断。

#### Scenario: Inspect a descriptor-only Archive
- **WHEN** 原target有合法Archive descriptor而machine尚未写
- **THEN** inspect SHALL 提供exact locator与可验证效果，普通status/next仍报告incomplete而非空闲

#### Scenario: Claimed effect does not authorize retry
- **WHEN** caller曾说none但真实source/spec/coordination不能证明安全前态或成功后态
- **THEN** inspect SHALL 报unknown、canContinue=false，不建议重放或替代Run

#### Scenario: Inspect an immutable terminal partial
- **WHEN** 三文件完整且记录为Archive partial
- **THEN** inspect SHALL 区分完整失败记录与未完成业务，只提供显式恢复所需事实，不自动解锁普通retry

### Requirement: Terminal revise start preserves exact Owner and predecessor facts
fixed start SHALL 接纳既有active terminal阶段Owner revise、known rejected对应revise和安全failed Archive后的窄revise-propose/revise-apply，同时保留prepared Author correction。Owner fact SHALL 为既有revise-action、same target、single requested scope并绑定新package/descriptor/context；新Run指向原tip，不改旧结果。Archive correction核对安全active与原失败链，不要求待修候选仍等于旧Review；直接Archive retry仍要求同候选。

unknown outcome、普通Author FAIL、invalid chain、prepared Reviewer、partial/completed Archive或reported conflict SHALL 不被Owner fact兜底。普通Action不新增Owner审批。

#### Scenario: Explicit revise follows known rejection
- **WHEN** review-apply rejected/null有效且Owner授权same Change的revise-apply
- **THEN** start SHALL 经Policy/结构核对建立唯一Author successor，不改原verdict

#### Scenario: Unknown verdict cannot be rescued by Owner fact
- **WHEN** Review outcome或原记录/绑定无法验证
- **THEN** start SHALL 拒绝，不按known rejection续行

#### Scenario: Candidate correction after failed Archive remains reachable
- **WHEN** 安全failed Archive后需要改delta/源码且Owner授权对应revise
- **THEN** start SHALL 允许合法修订接原failed parent，后续重新形成候选和独立Review；不得先要求旧candidate unchanged而锁死修订

## REMOVED Requirements

### Requirement: Candidate admission rejects Git-filtered byte drift
**Reason**: 将所有raw与Git-filtered差异一概拒绝，会阻断正常Git EOL入库规则及明确要求工作区CRLF的脚本；本Change显式替代该规则及其旧CRLF拒绝场景。
**Migration**: 新候选按下述raw与Git存储身份绑定合同接纳。旧Run的raw hash含义不变，不回填历史projection；旧无新身份记录只按原合同兼容，不能凭当前工作区追认。

## ADDED Requirements

### Requirement: Candidate admission binds raw bytes to supported Git storage identity
新成功Author候选 SHALL 在保留raw identity的同时由manager只读生成并核对有界candidateGit绑定，覆盖既有artifactHashes或Explore专用identity的exact文件集合，包括相关 stage-0 indexBasis。caller声明该字段时须与实测完全相同；缺失时由manager生成；不能以其产生Author PASS、Reviewer或Verification权限。Review start/finish SHALL 验证原raw候选、必要proof、有效规则及其索引输入与预期输出关系，仍绑定exact reviewedRunId。索引仍为绑定输入，或已经是满足既有 mode/path 合同的预期 blob，不构成投影漂移；其他相关索引变化须在新接纳前拒绝，不能重算预期追认旧Review。

系统 SHALL 只支持 identity 或可验证的 Git 内建 CRLF→LF 文本投影，预期 blob 必须对应同一 raw、有效属性/设置和相关 index 前态下普通 staging 成功时的存储内容，不含 renormalize 的特殊语义。自动文本模式下，相关 index 已含非 binary CRLF（包括 mixed）的普通条目时 SHALL 保留当前 raw 为 identity；该规则包含 text=auto 及继承 core.autocrlf=true/input 的自动动作。显式 text 不套用该 auto 保留分支；自动模式的 LF/absent 对照按其实际文本判定处理。不能仅以无 -w 的 hash-object --path 输出认定实际 staging 的 blob，也不能将 binary 或 lone CR 错当作非 binary CRLF 索引依据。

clean/EOL 内容与普通 add 的最终 index SHALL 分别判断，不能因显式 text 就承诺 add 必定执行转换。若原普通 stage-0 blob bytes 等于当前 raw，但受支持 clean/EOL 内容不同，系统 SHALL 在保存成功候选前明确 unsupported，并指出路径及 stat-cache 跳过与实际转换的歧义；不得改选旧 blob 为通用 identity 或保存猜测的 LF。该拒绝 SHALL 不依赖 stat/时间戳，raw 不变而仅 stat 改变时仍拒绝，不持久增加 stat 字段或数据库。Review/Archive 输入核对 SHALL 使用相同边界；已核实预期输出按既有输出合同核对，不重绑历史。其他不能证明普通 staging 结果的 cache/索引状态亦须前置拒绝，raw 修改或 stat 不同单独不构成转换必然发生的证明。

active clean filter、working-tree-encoding、ident 转换不得执行或默认为 EOL。仅 EOL 分支须证明有效文本动作、安全 UTF-8/no-NUL 及预期 bytes 只移除了 CRLF 中的 CR；不 trim、不处理 lone CR、不改 BOM/编码或重新序列化。候选生成与 Review 的投影校验 SHALL 不写真实或临时 index/object/worktree，不执行 add 试算、touch、refresh、renormalize、修改配置或复制开发环境。不能可靠解释的转换或索引状态 SHALL 在保存成功候选前明确 unsupported，而不先保存猜测的 blob。合法 raw!=blob 不作为内容漂移；真实 raw/规则/相关索引冲突、未知转换和 map/hash 不符仍拒绝。预期 blob 不保证后续 Git 命令成功，真实安全转换拒绝或执行错误不得被忽略或通过关闭设置绕过。

Run/proof/raw日志和按项目属性标为binary/-text的字节敏感内容 SHALL 保持原bytes；Git投影不能替代原始执行/测试证据。deletion仍按真实删除表示，不制造文件hash。旧无candidateGit记录不自动生成历史投影，raw==blob兼容路径外需真正新候选和独立Review。

#### Scenario: Supported CRLF candidate can be independently accepted
- **WHEN** raw为CRLF、有效Git规则只形成LF blob、实测投影及其他候选条件有效
- **THEN** 新Author/Reviewer接纳 SHALL 允许该差异，保存raw与blob绑定，不重写工作区

#### Scenario: Exact raw evidence and LF source remain valid
- **WHEN** raw证据保持identity，或LF源码的投影等于raw且其余条件有效
- **THEN** guard SHALL 通过，不从同值hash生成审查或测试PASS

#### Scenario: Explicit CRLF working-tree policy is supported
- **WHEN** `.cmd/.bat` 被标为text eol=crlf且真实raw为CRLF、普通staging可证明为LF并通过上述支持边界
- **THEN** 接纳 SHALL 按合法EOL投影核对，不要求Author改成违反该工作区规则的LF文件

#### Scenario: Unknown filter or real content drift stays rejected
- **WHEN** 有主动filter/encoding/ident转换，或raw候选/绑定规则发生未授权变化
- **THEN** 接纳 SHALL 明确拒绝且不执行任意filter、不normalize、不继承旧Review

#### Scenario: Automatic text preserves an existing CRLF index
- **WHEN** 先有 i/crlf，随后启用 text=auto，raw 从 old CRLF 修改为 new CRLF，其他候选条件有效
- **THEN** 新候选 SHALL 保存 new CRLF 的 identity blob 及原 indexBasis，Review SHALL 按同一依据核对，不采用无索引命令给出的 LF 预测

#### Scenario: Inherited auto conversion and forced text remain distinct
- **WHEN** 分别使用属性未指定但继承 autocrlf=true/input、显式 text，以及 auto 下 LF/absent 索引对照
- **THEN** 接纳 SHALL 按普通 staging 的相应索引敏感行为生成可验证 blob，不把所有 CRLF 或所有 eol=lf 输入统一归类

#### Scenario: An unexpected index basis blocks new admission
- **WHEN** 相关 index 不再是绑定输入或预期输出，存在未合并/非普通/未知条目，或输入读取期间发生漂移
- **THEN** 新候选或 Review 接纳 SHALL 在结果写前明确拒绝，不修改索引、重算旧绑定或留到 checkpoint 才发现错误预测

#### Scenario: Duplicate finish does not recalculate historical projection
- **WHEN** 同值finish重投且该Run已有完整candidateGit与原结果
- **THEN** 命令 SHALL 只读核对已存机械事实，不为旧Run重算、改hash或重执行业务

#### Scenario: Attribute-only normalization cannot guess ordinary add output
- **WHEN** raw 等于旧 i/crlf blob，仅属性从 -text 变为 text eol=crlf，clean 内容为 LF，而非 racy stat cache 可使普通 add 保留旧 CRLF
- **THEN** 候选形成 SHALL 在成功 Result 保存前明确 unsupported，不保存 LF 预期、不通过实际 add 试算或触碰时间戳解锁

#### Scenario: Timestamp-only change does not widen supported admission
- **WHEN** 上述 raw、规则与原 index blob 均未改变，仅 stat 改变后普通 add 可输出 LF
- **THEN** 候选形成 SHALL 仍按同一保守边界拒绝，不将 stat 变化当成 durable 转换证明；absent 或原 index 已等于预期内容的对照不因该拒绝被阻断
