# D05 设计与 Change 计划：严格 Change，轻量 Delivery

修订日期：2026-09-08。配套说明：[D05 解耦分析](flowkit-next-d05-decoupling-analysis.md)。

## 决策与文档边界

Owner 本轮明确授权“取消 archify 与 delivery 关联”，并要求结合前次审查建议重新设计 D05 文档。本版据此替代此前“Full Test 通过后固定更新 Archify”的 D05 方案；[D04 解耦方案](flowkit-architecture-decoupling-final-plan.md) 仅保留为历史输入。

Owner 后续明确选择：必要 proof、Full Test 结果及必要报告进入 `.flowkit` 默认长期保留，`.tmp` 只放可丢弃工作文件；`runs/` 仍只承载固定 Action 生命周期。本版同时替代“必要材料放 `.tmp`、按 Change/Delivery 周期清理”的规划。过程事实不纳入产品文件扫描，不等于免除写入、接纳和消费时的必要校验。

已确定的产品方向是：Flowkit 管理严格的 OpenSpec Change Action 链；Delivery 只组织工作、真实测试、必要完成状态和交接。Archify 退出 Flowkit 交付合同，成为独立、按需使用的文档辅助工具。

本次授权用于重写这两份根目录规划文档，不代表 D05 已 Start、拟议 Change 已激活、Proposal 已批准或代码已经完成拆除。活动 specs、HOW、工具配置及实现应由后续对应 Change 一起收敛；本文不冒充正式 Run 或替代它们。D04 的 archive、Run、Final、Git 和已接受图表原样保留。

Changes 只使用语义名称与拟议 OpenSpec id，不新增顺序编号或编号别名，也不重命名历史目录、Run id 或 projectOrdinal。

## 目标流程与责任

```text
Delivery Start
→ Changes：Explore / Review / Propose / Review / Apply / Review / Archive
             按合法边界 revise；每次 Action 只执行一次并 STOP
→ Delivery Full Test
→ Delivery Final
```

Review/revise 是本项目围绕 OpenSpec 的执行约定，不声称全部由上游 OpenSpec 原生命令提供。Git 在约定节点、明确授权范围内独立调用；画出流程不等于自动执行。

| 对象 | 责任 | 不承担的责任 |
| --- | --- | --- |
| OpenSpec | Change 合同、设计、规格、任务、归档 | 第二套由 Flowkit 重建的合同状态机 |
| Flowkit | 定位上下文、按既有 Policy 核对边界、组织单次调用、接纳和保存真实结果 | 替 Owner 决策、替 Reviewer 作结论、自己执行模型推理 |
| 既有 Agent/宿主 | 按本次 Role/Action 执行 Author 或独立 Reviewer 工作，回交真实结果 | 自动轮转 Role、伪造未执行结果、自动下一 Action |
| Run/Result | 固定 Action 执行、审查、修订与归档链及其完整性 | 通用工具日志、proof 文件容器或 Delivery/Full Test Run |
| `.flowkit/artifacts/` | 默认长期保存真实执行的必要 proof、Full Test 结果及报告，供相关操作校验和消费 | 第二套 Action 生命周期、OpenSpec 合同或自动存储平台 |
| Full Test 执行入口 | 按项目配置运行检查，可靠保存当前尝试的结果及必要日志 | 永久有效的 PASS、把全部历史过程材料当产品文件测试 |
| Delivery Final | 确认 required Changes 完成且当前 Full Test 结论有效，窄写完成状态 | 架构完成审批、重演所有 Review、验证全部历史原始 proof |
| Git | 提交、分支、版本、远端事实 | 控制普通非 Git 阶段，决定测试扫描范围 |
| Skills | 为已经确定的操作提供 HOW 和交接要点 | 增加权限、审批节点或自动执行循环 |
| 独立 Archify/绘图工具 | 在需要理解、沟通或更新说明时辅助绘图 | 成为 Delivery/Change 状态或完成前置 |

Git 节点可在 Start 后、Change 归档后或 Final 后设置。提供节点不等于每个节点都必须 commit，更不自动授权 push/merge。Git 失败不撤销已经发生的 Change/Final 完成事实。

## Archify 退出交付合同

取消关联是删除产品中的交付依赖，不是保留一个架构阶段再填写 optional、skip、not-applicable 或虚构成功结果。

- Start 不要求 C/P/compare；Final 不要求 Architecture outcome、closure ref 或图表文件；Git 节点不读取架构完成证据。
- Flowkit 不再强制安装、携带或检查 Archify，不保留专用 Delivery operation、产品适配器和自动绘图入口。通用 OpenSpec、进程和 Git 能力不因退役而删除。
- 不要求每个 Delivery 创建 `architecture/<delivery-id>/`，不要求六槽图、系统图、跨 Delivery 图表连续性或“本次无需更新”证明。
- 架构未变时不动图。需要解释系统时可以独立生成；Agent 发现图明显过时可以主动提示，并按已有授权更新，不据此自动扩张修改范围。
- 独立绘图不限定在 Full Test 之后。图不存在、过时或绘图失败，都不是 Delivery/Change blocker；仅修改非产品图文不触发代码重测。
- 绘图仍遵守正常文件写入/覆盖权限；若实际改动产品资源，就按真实修改重新验证。Git 仍检查本次提交范围和冲突，不因取消架构门禁而忽略图文文件的实际改动。
- 必要的架构决策仍进入 OpenSpec design。图不能替代代码事实，也不能用修改后的代码编造修改前 Current；缺少可确认历史时可以只描述现状，不强求 compare。
- 已有历史图和 Run 不删除、不重写。用户自行安装的 Archify、独立 Skill 或其他项目使用的 runtime 不在本轮或产品退役的自动卸载范围。

临时绘图文件由该次文档任务自行管理，不新增 Delivery 下默认 `archify/` 子目录、绘图审批、可选工具 Registry 或自动架构影响判定器。

## Full Test：配置独立，结果有效性明确

### 配置与范围

测试命令、参数、工作目录和排除目录由项目明确配置。优先复用现有验证配置；无合适载体时采用 `config/verification/full-test.json`，最终字段在对应 Propose 固定，只保留一个配置入口。

- 与 `.gitignore` 完全独立：不读取、继承或同步它，也不通过 Git index、tracked/untracked 或 `git ls-files --exclude-standard` 推导测试范围。
- 本项目应排除 `.flowkit/`、`.tmp/`、历史 `architecture/` 和项目明确指定的非产品图文/渲染目录；不存在这些目录也正常，不为排除而创建目录。其他项目使用自己的配置，不照搬 Flowkit 开发布局。
- 这里排除的是本仓库真实过程材料的产品扫描/lint/build 输入，不是禁止 Runtime 读取并校验 `.flowkit`。这些读取器、校验器、写入器本身的代码及使用隔离 fixture 的测试仍在 Full Test 范围内。
- 排除按目录用途，不按所有 JSON/Markdown 扩展名。源码、测试、依赖/lock、构建配置及实际被产品消费的资源仍需覆盖，不能借文档标签漏测。
- 项目扫描器与实际测试命令须遵守约定范围。host 不声称能自动改写任意第三方命令；不支持该范围的命令需由项目调整后再使用。
- Git 卫生检查归 Git 节点，OpenSpec 合同/结构验收归 Change 流程；不把它们混入代码 Full Test 的 verdict。已有聚合脚本应拆分调用与结果，源码 lint/build/tests 等实际要求继续保留。
- 产品仍保留的 Git/OpenSpec 集成可以用隔离 fixture 测试；退役的 Archify 集成应连同专属测试移除，不以跳过测试假装已拆除。

### 当前有效结果

“过去真实通过”与“当前可用于 Final”是两件事。以下是最低消费规则，不是 PASS 缓存平台或新的 Delivery 状态机：

- 每次 Full Test 由真实执行入口在运行检查前可靠建立本项目、本 Delivery 的当前尝试；建立失败则不继续执行。开始新的尝试后，不能在其失败、中断、未完成或记录不可确认时退回选择旧 PASS。
- 只有当前尝试的约定检查完整通过，实际结果及合同要求的必要产物成功保存并完成接纳校验，才可用于当前 Final。命令执行成功但必要材料写入失败，应报告不可确认，不虚报已完成。
- 执行前后及 Final 消费前核对测试相关输入是否变化。源码、测试、依赖、构建配置、测试命令或排除配置变化后，不能沿用旧 PASS；产品修正回到正常 Change 边界，再执行相应验证。
- 可使用项目明确范围内的轻量变化检查，必要时由现有 Author/Reviewer 明确核对；不要求全仓 hash、专属 commit 或新的审批 Run。不能确认时报告具体疑点，不默认为未变化。
- 仅新增非产品图文、工作文件、真实 Run/执行产物或合法更新 Delivery 管理状态，不使代码测试结论失效；篡改过程事实仍须被相关消费者识别，不能因代码无需重测就直接使用。
- 默认实际执行，不跨尝试自动复用 PASS，不建设语义依赖分析、自动影响规划器或候选代际链。当前尝试的选择复用既有 Delivery 协调记录；每次实际结果仅在对应 `.flowkit/artifacts/` 尝试目录保存一份，协调记录不复制完整 outcome。确切字段与接纳方式在 Propose 固定，不按最大目录号猜当前结果。
- 各次执行结果默认长期保留，不用新结果覆盖旧结果；历史 PASS 不因此成为未来产品版本的验收。长期保留与当前有效性是两个独立要求。

## 长期执行记录与产物，可丢弃工作文件

### 位置与职责

拟议目录如下；`artifacts/` 是 D05 对现有 `.flowkit` 极薄目录约定的明确增量，不是已经实施的布局：

```text
.flowkit/
├─ project.json
├─ memos.json
├─ runs/                              # 保持既有 Action 三文件合同
└─ artifacts/
   └─ <delivery-id>/
      ├─ changes/<change-id>/proof/    # 按实际执行区分，不覆盖旧产物
      └─ full-test/<attempt>/         # 实际结果、必要日志与报告

.tmp/                                 # 可丢弃的中间文件
```

不要求提前创建空目录或每个 Change 都生成 proof。`artifacts/` 只保存实际需要的执行产物，不建立 Registry、EvidenceStore、多后端存储、完整环境快照库或额外审批节点。放在 `.flowkit` 不自动取得事实权威，也不自动要求 Git 跟踪或授权 commit。

| 内容 | 归属与保存 | 后续消费 |
| --- | --- | --- |
| 规格、设计、代码、回归 fixture | 原有 OpenSpec、源码和测试位置 | 按各自合同审查；不复制进 `.flowkit` |
| Action/Review 记录 | 既有 `.flowkit/runs/`，默认长期保留 | 保持 Role/Action、Run 链、Result admission 与必要完整性校验 |
| 用于证明结论的实验输入、脚本、观察输出及必要条件 | `.flowkit/artifacts/` 下关联实际 Change/执行的 proof，默认长期保留 | Reviewer 检查本次相关材料；后续阶段不重演全部历史实验 |
| Full Test 实际结果、必要 stdout/stderr 与报告 | 对应 Full Test 尝试目录，默认长期保留 | Final 消费当前有效结果及本次合同必需材料；Git 不遍历这些证据 |
| Delivery 当前尝试关联、完成状态和必要摘要 | 既有 Delivery 协调记录 | 不复制完整测试结果，不创建 Delivery Run 或第二份协调状态 |
| 缓存、可丢弃的实验中间文件和重复展示输出 | `.tmp/` | 不作为必要证据的唯一来源，不参与完成资格 |
| 历史图与独立绘图产物 | 原历史位置或独立文档任务约定 | 不改写历史，不归入 Flowkit 的默认执行产物 |

### 生成即可靠保存，默认不清理

- 需要交给 Reviewer 的 proof，以及 Full Test 的实际结果和必要报告，从生成时就按受保护产物保存。允许执行过程使用工作文件，但在宣布可审查或成功接纳前，必要 bytes 必须完整落入受保护位置；不能只保留指向 `.tmp` 的路径或链接，也不能等到 Review/Final 前才尝试搬迁。
- 保存足以核对结论的必要输入、命令/方法、实际输出及环境限制，不只写一个 PASS；实际内容由执行产生、相关结论由有权角色核验，格式正确或 hash 匹配本身不证明执行真实发生。不假定以后一定能复现，不伪造丢失的当时输出。
- 已完成的结果和证据不就地覆盖；revise/重跑保留新的实际执行产物及必要关联。Full Test 结果是 Verification 产物，不引入 prepared/terminal，不改变固定 Action Run 的三文件结构。
- 必要执行产物默认长期保留，删除原“周期到期、转存、清理资格、收尾清理”设计。Archive/Final 不触发自动删除，也不以清理完成为前置；以后确需处理容量或删除敏感内容时另按明确范围处理，不提前建设清理平台。
- 只收集必要材料，不复制整个依赖目录、缓存、运行环境或全量源码快照，不收集与证明无关的凭据和敏感数据。存储空间会随历史增长，这是长期保留的取舍，不用静默丢弃必要产物规避。
- `.tmp` 只承载可丢弃内容；丢失最多使当前未完成操作需要重做，不应丢失已提交审查的证据或已接纳的结果。“可丢弃”不是 Agent 随意删除用户文件的授权。

### 过程事实仍需验证，但不当作产品文件扫描

| 边界 | 必须执行的检查 | 不扩张为 |
| --- | --- | --- |
| 生成、写入与结果接纳 | 真实执行来源、格式、项目/Delivery/Change/尝试归属、必要产物完整可读、结果一致性；沿用需要的局部完整性校验 | 手写 PASS、只验 hash 就认定真实、对全仓生成新的摘要链 |
| Runtime 正常读取 | 对本次使用的 project/runtime identity、Memo、Run/Result、产物按其合同检查，不因位于 `.flowkit` 就信任 | 每个操作扫描全部历史目录 |
| Reviewer 消费 proof | 独立检查本次相关证据与语义结论，必要时实际复验；缺失或矛盾不能批准 | 所有后续阶段重复扮演 Reviewer |
| Final 消费 Full Test | 核对本项目本 Delivery 的当前尝试、真实完整结果及其对当前测试输入的有效性 | 重跑全部历史测试、逐份遍历所有历史日志 |
| 产品 Full Test | 测试管理代码本身，用隔离 fixture 覆盖缺失、损坏、归属错误和写入失败等场景 | 扫描本仓库真实 `.flowkit` 历史材料作为产品输入 |

当前所需过程事实缺失、损坏或不一致时，报告具体问题并停止依赖它的操作；不能拿聊天说明、旧 PASS 或新生成的 bytes 充当旧事实。已发现但与本次操作无关的历史问题应如实报告，不自动撤销其他已完成工作或变成全局 blocker。这样既保持过程事实可信，也不把长期保留变成全链路反复审计。

本版不追溯迁移 D04 历史材料，不改写已接受 Run 或历史 Owner 清理授权；对应 Change 在未来同步活动 specs、HOW、目录约定和直接消费者。

## 拟议 Changes 与实施依赖

保留六个语义 Change，不把每条审查意见再拆成 correct Change。原“测试后更新派生架构”改为“移除 Delivery 架构依赖”，不再建设测试后绘图能力。

建议先拆除 Archify 直接依赖，再做分根；这样无需先搬迁随后会退役的产品资产。分根之后接通 Action 和 Full Test，最后汇合到轻量 Start/Final，再接 Git 节点。这里的依赖是工程实施约束，不是额外执行编号或自动流程。

| Change | 拟议 OpenSpec id | 可验收结果 | 直接依赖 |
| --- | --- | --- | --- |
| 移除 Delivery 架构依赖 | `remove-archify-from-delivery-workflow` | 没有 Archify/图文件也不阻断原有交付路径 | 无 |
| 分离管理软件与目标项目 | `separate-manager-assets-from-target-project` | manager 资产、目标项目、所需外部工具各归其位 | 移除 Delivery 架构依赖 |
| 接通 OpenSpec Action 流程 | `connect-openspec-action-workflow` | 既有 Agent/宿主可完成一次真实 Action 并续接 | 分离管理软件与目标项目 |
| 独立配置与执行 Full Test | `decouple-full-test-from-repository-tracking` | 独立范围、实际检查、长期保存且当前有效的结果 | 分离管理软件与目标项目 |
| 简化 Delivery 起止与完成确认 | `simplify-delivery-coordination` | 无 commit 前置 Start；消费有效测试结论的 Final | 接通 OpenSpec Action 流程、独立配置与执行 Full Test |
| 在约定节点调用 Git | `invoke-git-at-workflow-boundaries` | 授权范围内调用与实际结果读回 | 简化 Delivery 起止与完成确认 |

每个 Change 内按直接消费者拆小任务并验证，最终保持活动合同和实现一致。后续能力未接通时明确不可用，不放置占位 PASS；不要求用尚未实现的 D05 host 管理 D05 自身。

长期保存与校验规则不新增第七个 Change：分根明确 target 所有权，Action 接入处理 proof 生成/交接，Full Test 处理测试结果保存及接纳，协调 Change 处理必要结果消费。共享目录边界由直接生产者及消费者同步收敛，不增加独立存储平台或先行的清理 Change。

### 移除 Delivery 架构依赖

目标：取消架构产物与交付资格的关系，不削弱 Change/Review 和真实测试要求。

- 删除 `delivery-architecture-finalization` 的活动 operation、Guidance 路由、产品执行/校验适配器及仅服务它的导出。
- 删除 Start 的 C/P/compare 固定输出与 Archify 检查；删除 Final、required evidence、coordination、Integration 直接消费者的架构结果/引用要求。同步消费者，不能只删 producer 留下必填字段。
- 去除 managed tool、doctor、发行资产和当前 HOW 中的 Archify 必需项；OpenSpec 的 exact runtime 要求保持。退役产品专属 Skill/vendor 资产，不触及独立用户安装。
- 同步活动 specs、HOW、repository guidance 和测试；保留历史记录按原类型可读，不伪造旧结果为新合同结果，也不长期保留两套活动交付流程。

验收：无 Archify runtime、无任何图文件、无 Architecture outcome 时，满足其余现行前置的 Start → Full Test → Final 路径可完成；doctor 不因 Archify 缺失失败。真实测试失败仍阻断 Final，Git 仍需独立授权，历史 bytes 不变。

验证：定向 operation/Start/Final/Integration/doctor 测试与历史读取回归；确认没有活动调用要求图、skip 证明或 Archify runtime。历史文本中的 Archify 字样不属于未清理的产品依赖。

预计入口：`delivery-operation-execution.ts`、`delivery-start-content.ts`、Architecture 模块、Final/required-evidence/coordination、managed tool resolution、CLI doctor、发行配置和相关 specs/HOW。只去掉架构相关依赖；其余 Git 前置、测试范围和完整证据依赖由后续对应 Change 处理。

### 分离管理软件与目标项目

目标：被管理项目无需复制 Flowkit 源码、系统 Skills、toolchain lock 或专用 glue scripts。

- manager 自带必需代码、系统 Guidance 与 OpenSpec 工具版本约定；target 拥有代码、OpenSpec、Runs、长期执行产物、测试配置及可丢弃工作文件；可执行 OpenSpec runtime 位于外部 `FLOWKIT_HOME/tools`。管理软件安装目录不接收各项目的执行历史，移动/更新 manager 不迁移或清理 target 的 `.flowkit`。
- manager 身份来自自身安装，不来自目标项目上一 Delivery 的 commit；工具工作目录指向 target，资产解析不被 target 同名 Skill/lock 接管。
- 只在实际依赖工具的操作中检查 exact runtime，不静默下载 latest 或回退全局版本；不重新引入 Archify 的安装或发现能力。

验收与验证：在分离目录、没有 Flowkit package scripts 的外部项目上读取状态并调用所需 OpenSpec 能力；移动安装位置不改变目标测试范围；覆盖同名资产冲突和 exact runtime 缺失诊断。

预计入口：managed tool resolution、Action/Delivery Guidance resolvers、OpenSpec adapter、CLI 与发行配置。同步对应 HOW，不建立 Skill/Tool Registry。

### 接通 OpenSpec Action 流程

目标：明确谁执行 Action，让用户不再手工拼接 Run 上下文，也不要求用户实现 callback。

- 执行方是既有 Agent/宿主，不是 Flowkit 内新建的模型运行器。Flowkit 根据本次明确 Role/Action 和正式事实提供 ActionPackage/HOW，宿主完成真实工作后回交结果，Flowkit 接纳并持久化。
- 从 OpenSpec、coordination 和真实 Run 链定位对象，表达 idle、已归档、等待 Owner；多义或不完整时精确诊断，不按最大目录号猜 current，不自行决定下一 Action。
- 接通既有单次执行与三文件 persistence，保持 prepared/terminal、Author/Reviewer 分离、合法 revise 和一次执行后 STOP。
- 简要传递相关 Owner 决定、设计依据和 proof 关联；必要 proof 在 `.flowkit/artifacts/` 可靠保存并核对归属/完整性后才交接，Reviewer 独立检查其证明力。新会话不依赖 `.tmp`，不因原始观察无法复现而丢掉唯一证据。
- 区分缺失必要 Action/证据与丢失可丢弃中间文件；前者不能凭说明视为已验证，后者不撤销已接纳结果。历史 bootstrap 记录及既有 Owner 保留/清理例外按原范围读取，不追溯重写。
- Propose 固定一个实际支持的宿主接入方式及最小输入/回交约定。callback 单元测试或人工伪造结果不能代替接入验收；宿主未接通、未完成或未回交时不能宣布 Action 成功。

验收与验证：通过实际支持的宿主推进两个 Changes，包含一次真实 revise 和独立 Review；新会话不提供 Run 序号也能续接。没有自动 Role 切换、自动下一 Action 或每步强制 commit。

证据边界验证：隔离 fixture 中在 proof 交接后移除 `.tmp`，Reviewer 仍能读取已保存的必要输入/输出；必要 proof 写入失败、缺失、归属错误或内容损坏时不能宣布可审查/批准。新产物不覆盖旧执行，Run 三文件及完整性合同保持不变。

预计入口：`src/cli/request.ts`、`src/cli/foundation-cli.ts`、`single-action-execution.ts`、coordination/Run readers 及最小宿主接缝。同步受影响 HOW；不建设 Agent/Provider 平台、调度器或自动 Author/Reviewer 循环。

### 独立配置与执行 Full Test

目标：真实执行项目检查，解除 Git 可见性与测试身份的耦合，提供可供 Final 使用的当前有效结果。

- 接通单一项目配置和约定范围，分离 Git-based 全仓 candidate；拆开代码检查、Git 卫生与 OpenSpec 合同验收，不建设绘图检查阶段。
- 使用现有进程能力实际执行，将结果、退出状态、命令、时间及必要日志/报告可靠保存至 `.flowkit/artifacts/<delivery-id>/full-test/<attempt>/`；落实前文的当前尝试、长期保留、接纳校验和有效性规则，不产生 Standard Action Run。
- 覆盖失败、中断、必要产物写入失败/损坏、错误归属、新失败后误选旧 PASS 及测试相关输入变化；产品修正回到正常 Change，不在测试入口暗中修代码。
- 同步返回结果的直接消费者，使新 Full Test 结果能被 Final 正确读取；不要求保留或伪造旧整仓摘要字段，不借此删除严格 Action Run/Result 的完整性校验。

验收与验证：修改 `.gitignore` 或跟踪状态不改变测试集合；已跟踪图文被排除、未跟踪产品文件仍覆盖；先 PASS 后 FAIL/中断不能 Final，产品/测试配置变更不能借旧 PASS 继续，只有非产品图文变更不重测；新会话能读取当前尝试，Full Test 不创建 Standard Action Run。

保存/读取验证：隔离 fixture 中删除 `.tmp` 后当前结果及必要报告仍可读；检查 PASS 但必要保存失败不得接纳为完整成功。损坏或归属不符的当前结果被消费者拒绝，不以重跑代码 Full Test 代替记录校验；历史记录增长不进入产品扫描范围，读写/校验器自身回归测试仍执行。

预计入口：Full Test domain、`applicable-check-process.ts`、项目验证配置/脚本、候选读取的 Full Test 调用方及结果直接消费者。同步 Full Test spec/HOW。

### 简化 Delivery 起止与完成确认

目标：Start 建立交付上下文，Final 确认约定工作和有效测试已经完成；不承担证据转存或周期清理。

- Start 读取目标与 Owner 范围、组织 Changes；不要求 `acceptedBaseCommit`、专属 commit 或全仓 clean，只检查自己的目标、范围和写入冲突。图表前置已由退役 Change 移除，不再设计另一种架构完成方式。
- Final 从 OpenSpec/Run 完成事实与当前有效 Full Test 结论确认完成；不重演所有 Review、不遍历全部原始 proof、不复制完整 `requiredEvidence` 快照作为外围通行证。
- 消除剩余整仓摘要连锁要求，窄写既有 Delivery 状态及必要结果关联，支持跨会话读取；Full Test 结果只有对应尝试目录中的一份，不新建 Delivery Run 或第二份结果库。
- 按当前合同验证相关完成事实和测试结果；不因长期保存而扫描整个 `artifacts/`，不因排除产品扫描而跳过消费校验。无到期删除、清理资格或清理完成前置。

验收与验证：有无关未提交文件、已初始化但尚无首个 commit 时可 Start；写入冲突、缺 required Change 完成事实或测试结论无效时不虚报完成。没有图或绘图失败仍可 Final；`.tmp` 不存在不影响已保存结果的消费；Final 后结果和必要证据仍保留，后续不重演全部 proof。

预计入口：Start/Final domain、operation facts、coordination writer 和必要结果读取。直接受影响的 Integration 消费者同步收敛；本 Change 不执行或授权 Git 写入，不实现周期清理器。

### 在约定节点调用 Git

目标：把 Git 作为外部版本管理能力使用，不作为外围共同身份系统。

- 在约定节点绑定明确操作、目标和既有授权，核对提交范围、分支/远端、覆盖风险；不把全部未跟踪文件作为全局 blocker。
- 调用已有 Git/远端工具并读回实际结果；可复用已有提交，不要求额外固定点 commit 或特定 parent/count，除非本次 Owner 明确要求。
- PR/merge 通过已有工具或 Skill 人工衔接；不要求原生覆盖所有平台、凭据和 merge 策略，未完成就显示未完成。
- 失败或副作用不明时先做可用的只读确认，再交给人处理；不默认重复 commit/PR/merge，不自动 rollback/rebase。

验收与验证：无授权不写入；提交不夹带无关文件；提交及读回不要求逐份读取 Full Test 日志或清理 `.flowkit/artifacts/`，图文件与架构状态不参与前置；Git 失败不重开 Change/Final，不出现“回写 SHA 再 commit”循环。若过程文件属于本次授权提交范围，仍执行正常范围/冲突检查，不将其误当免检区。

预计入口：repository integration domain、Git helper、调用入口和 Git HOW。只保留本次 Git 对象/范围/实际结果核对，不建立远端接受平台、Provider Registry 或通用事务系统。

## 整体验收与实施约束

| 场景 | D05 预期 |
| --- | --- |
| 外部项目未安装 Archify、没有架构目录或任何图 | 完整交付不要求它们；无 skip/不适用证明 |
| 仅独立更新非产品图文，或绘图失败 | 不创建架构门禁，不重测代码；Git 正常范围/冲突检查仍保留 |
| 分离安装资产、使用项目自己的检查命令 | 不复制 manager 资产，不依赖 Flowkit 开发布局 |
| 无首个 commit / 有无关未提交文件 | Start 不因 SHA 或全仓 clean 失败 |
| 多个 Changes、独立 Review、revise、归档与跨会话 | 严格 Action 链和真实三文件 Runs 保持有效 |
| 更改 Git ignore/跟踪状态 | Full Test 覆盖集合不变 |
| 新尝试失败、中断、未完成或结果写入失败 | 不回用旧 PASS 完成 Final |
| 测试后修改产品输入或测试配置 | 旧结论不可直接用于当前验收 |
| proof 已交接或 Full Test 已接纳后删除 fixture 的 `.tmp` | 必要 proof、结果和报告仍可读，跨会话继续不依赖工作目录 |
| 当前所需过程记录缺失、损坏、错误归属或必要写入失败 | 阻止依赖该记录的接纳/消费，不用说明或旧 PASS 替代 |
| `.flowkit` 新增历史执行产物 | 不改变产品扫描集合；相关 Runtime 读取仍按合同校验 |
| 测试过程事实读取器、写入器、校验器 | 使用隔离 fixture 正常回归，不因排除真实历史目录而跳过 |
| Archive/Final 完成 | 记录与必要产物默认长期保留，无周期清理或全部历史证据重验前置 |
| Git 失败或远端状态不明 | 只读确认、准确报告，不虚报成功或盲目重试 |
| D04 archive/Run/Final/Git/已接受图 | 原样保留，不转换成 D05 产品结果 |

上述是未来实现的验收要求，不是本轮测试结果。用隔离 fixture 验证管理能力，不把本仓库真实历史和图表实例变成通用产品测试输入。

每个 Change 在现有验证/审查节点内分小任务，覆盖自己的直接消费者，不增加额外审批或 Git checkpoint。跨 Change 的共享返回值应在生产者改变时同步必要消费者，不保留相互矛盾的活动合同、虚构兼容字段或空成功适配器。

当前 `src/**/*.ts` gate 为 650 行，含空行和注释。只在修改后超限或确有职责分离需要时拆分；删除耦合使文件缩短时可直接保留，不执行“触及大文件就先拆分”。不得压行、放宽 gate 或做无关重构；平台验收区分实际 Windows/Linux 与 simulation。

Flowkit 自身开发继续遵守独立管理与 stable/candidate 边界。D05 正式开始前须确认可用管理方式；本文既不授权恢复已卸载 manager，也不允许 candidate 自我接管。不把此自研约束强加为其他项目的 commit 身份要求。

必要执行产物的本地长期保留不等于建设 Evidence 平台。不建设多后端 EvidenceStore、周期清理器、复杂测试输入分类平台、PASS 缓存平台、自动异常恢复、绘图生命周期或 Registry。少见且可人工处理的外围异常，准确报告即可，不据此扩张 Changes。

本轮只重写两份 D05 文档；未激活 Change、修改产品/spec/Skill、卸载工具、清理历史、执行产品测试或进行 Git mutation。
