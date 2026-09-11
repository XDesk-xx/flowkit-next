# D05 解耦分析：Archify 独立按需，交付回归轻量

修订日期：2026-09-08。配套实施设计：[D05 设计与 Change 计划](flowkit-next-delivery-change-plan.md)。

## 最新决定与适用范围

Owner 已明确授权取消 Archify 与 Delivery 的关联，并要求据此重写 D05 文档。取消的是 Flowkit 产品内的阶段、前置条件和内建依赖，不是禁止今后用 Archify 画图。

这项决定替代上一版 D05 中“Full Test 通过后固定更新架构”的方案。本文解释原因、影响和迁移边界；具体 Change 划分及验收以配套计划为准。两份文档仍是根目录规划，不是正式 Explore Run、Reviewer verdict、已批准 Proposal 或产品已经完成的证明。

Owner 后续进一步选择：必要 proof、Full Test 实际结果及必要报告在项目 `.flowkit` 中默认长期保留；`.tmp` 只存放可丢弃工作文件；`runs/` 仍属于固定 Action 生命周期。本文据此替代此前“周期材料存 `.tmp`、到节点后清理”的方案，并明确过程事实仍需按合同验证，不是目录免检。

其余方向保持：严格 OpenSpec Change Action 链；Git 只在授权节点调用；Full Test 使用独立项目配置；不要求所有外围异常自动恢复。当前授权只更新两份规划文档，不自动改变现行 `.flowkit` 目录合同或搬迁 D04 历史材料。

## 为什么不再把绘图放进 Delivery

Delivery 是工作组织边界，不是架构变化事件。修 bug、文案、测试或局部实现的很多 Change 并不改变架构；按交付次数要求 C/P/A、compare 和完成证据，会把低频文档需求变成每次交付的负担。

架构图有价值的时刻是：需要理解系统、讨论设计、解释接口关系，或现有图已明显误导。它可以在这些时刻独立生成或更新，不需要等 Full Test，也不应要求每次 Change 说明为何没有更新。

因此采用：

```text
交付主线：Start → Changes → Full Test → Final
Git：约定节点，独立授权与结果核对
绘图：有需要时独立调用，不参与交付资格
```

不采用两种折中：一是每次交付仍固定画图；二是保留架构阶段，再建设 optional/skip/not-applicable、额外审批或“无需更新证明”。这些都会保留本次要取消的关联。

代价是 Flowkit 不再保证每个 Delivery 都有一套最新架构图；需要说明时再绘制或人工维护。必要的设计决策继续进入 OpenSpec design，代码与测试仍是行为依据，图不是替代真相。

## 责任边界

| 对象 | 保留的责任 | 退出的责任 |
| --- | --- | --- |
| OpenSpec | Change 合同、设计、规格、任务和归档 | 替绘图工具制造固定交付产物 |
| Flowkit | 上下文、合法边界核对、单次调用、真实结果接纳、轻量 Delivery 协调 | 自动模型运行、绘图阶段、全链路原始证据重演 |
| 既有 Agent/宿主 | 按本次明确 Role/Action 执行，回交真实结果 | 自动 Author/Reviewer 循环或自行授权 |
| Run/Result | 固定 Action/Review/revise/archive 的真实记录及其完整性 | 通用工具执行容器、原始 proof 或 Delivery/Full Test Run |
| `.flowkit/artifacts/` | 默认长期保存必要 proof、Full Test 结果及报告，供相关操作校验和消费 | 第二套 lifecycle、OpenSpec 合同或 Evidence 平台 |
| Full Test | 按项目配置真实检查，产生当前有效结果 | 整仓/Git 可见性身份，永久有效 PASS |
| Final | 消费 required Changes 完成事实和当前有效测试结论 | Architecture outcome、六槽图、全部 proof 重演 |
| Git | 本次对象、提交范围、授权和实际版本/远端结果 | 决定非 Git 阶段资格、依赖架构完成证据 |
| 独立 Archify/Skill | 按需辅助解释与绘图 | 必装 runtime、必经节点、周期收尾证明 |
| `.tmp` | 可丢弃的工作文件 | 必要证据唯一来源、跨会话续接前置或完成资格 |

“轻量”允许准确报告失败、未完成和无法确认；不允许假成功、越权或把旧 PASS 当成新结果。

## 当前代码中的依赖与拟议处理

以下是当前 D04 实现的静态定位，不是本轮故障实验，也不是 D05 要保留的文件清单。拆除应覆盖直接消费者，不能只取消 CLI 上的一个步骤。

| 当前入口 | 已有耦合 | D05 处理 |
| --- | --- | --- |
| [Start 内容校验](src/internal/delivery-start-content.ts) | 固定 C/P/compare 输出和三个 Archify 检查 | 移除图表输出/检查，Start 只处理自己的上下文 |
| [Delivery operation](src/domain/delivery-operation-execution.ts) | closed operation 集合包含架构完结及专属 Guidance 路径 | 从活动 operation、导出和 HOW 移除，不保留空成功步骤 |
| [Architecture execution](src/domain/delivery-architecture-finalization-execution.ts) 及 internal helpers | 独立架构闭合记录、产物重验及 candidate 链 | 直接消费者迁移后退役专属模块/适配器/测试 |
| [Final](src/domain/delivery-final-execution.ts) | 缺 architectureOutcome 即拒绝，读取 architectureMaterializedCandidateRef | 删除架构前置，保留 Change 完成与当前有效 Full Test 判断 |
| [required evidence](src/internal/delivery-required-evidence-source.ts) / [coordination](src/internal/delivery-final-coordination.ts) | 完整架构来源、closure ref 和状态字段 | 移除活动架构字段/消费；其余证据简化在对应 Change 收敛 |
| [工具解析](src/domain/managed-tool-resolution.ts) / [doctor](src/cli/foundation-cli.ts) | managed tool 包含 Archify，doctor 默认检查它 | 去掉产品必需项与发行资产，不碰用户独立安装 |
| [Start 执行](src/domain/delivery-start-execution.ts) | clean 与 acceptedBaseCommit 前置 | 后续协调 Change 取消 Git 固定点要求，保留范围/冲突检查 |
| [candidate reader](src/internal/applicable-check-candidate.ts) / [Full Test](src/domain/delivery-full-test-execution.ts) | Git tracked/非忽略 untracked 枚举和整仓摘要比较 | Full Test 使用项目配置范围与轻量有效性核对 |
| [package scripts](package.json) | quality:gate 混合代码检查和 git diff --check HEAD | 拆开 Git 节点检查与代码检查 |
| [Integration](src/domain/delivery-repository-integration-execution.ts) | Finalized candidate、完整临时来源与 Git 对象绑定 | 后续 Git Change 仅保留本次操作必要的范围/对象/结果核对 |
| [CLI request](src/cli/request.ts) / [single Action](src/domain/single-action-execution.ts) | 用户需提供 currentRunId，执行依赖宿主 callback | 上下文自动定位，既有宿主负责执行，软件接纳结果 |
| [检查进程](src/internal/applicable-check-process.ts) | stdout/stderr 被忽略 | 可靠保存必要日志/报告与可读错误，默认长期保留，不建设存储平台 |

当前 [Start HOW](skills/delivery/start/SKILL.md)、[Full Test HOW](skills/delivery/full-test/SKILL.md)、[Final HOW](skills/delivery/final/SKILL.md)、[工具 lock](config/tools/toolchain.lock.json) 和 [AGENTS.md](AGENTS.md) 仍描述 D04 机制，包括现有 `.flowkit` 极薄目录约定。本轮不直接修改它们；正式实施时由对应 Change 同步活动合同、HOW、`artifacts/` 增量及必要读写校验。新设计不能靠对旧规则填写 skip 生效。

## 四个需要保留的最小正确性边界

### 测试结果：当前有效，不是找到任何一次 PASS

解除整仓 hash 不等于取消测试有效性。真实执行入口在运行前可靠建立当前尝试，建立失败不继续执行；新的失败、中断、未完成或必要保存失败不能回落到旧 PASS。实际结果及必要产物可靠保存、接纳后，Final 才能消费本项目、本 Delivery 当前有效的完整通过结论。

执行前后以及消费结果前，核对源码、测试、依赖、构建配置、测试命令和排除配置等实际测试输入。已变化则重新验证；不能可靠确认时由现有 Author/Reviewer 明确核对或报告疑点，不默认为有效，也不新增审批 Run。

仅新增真实 Run/执行产物、工作文件、非产品图文或合法更新 Delivery 状态，不触发代码重测；篡改过程事实仍须被相关消费者识别，既有历史 Run 不可改写。不建设通用输入归属系统、跨尝试 PASS 缓存或另一个 candidate 代际链。

各尝试的实际结果保存在对应 `.flowkit/artifacts/` 目录，不覆盖旧结果；当前尝试的选择复用既有 Delivery 协调记录，不从最大目录号推断，也不复制完整 outcome 形成两份真相。确切字段与消费者接口由对应 Propose 固定。历史 PASS 默认长期保留，但不会因此永久有效。

### Action 执行：已有宿主，不是新的 Agent 平台

现有 `invokeSingleAction` 接受执行 callback，它本身不提供模型或 Author/Reviewer 执行器。D05 将接通一个实际支持的既有 Agent/宿主：Flowkit 提供本次合法 Action 的上下文与 HOW，宿主执行，Flowkit 接纳和持久化结果。

用户不需要实现 callback 或手工找 Run 编号；宿主接入方式及回交约定在 Action Change 的 Propose 明确。不扩展多 Provider 调度、模型平台或自动审查循环。仅有合成 callback 单元测试不等于真实接入完成，未回交就不能宣布 terminal 成功。

### 绘图：没有基线也不影响交付

旧规划的矛盾是：Start 不保存图，到收尾又要求补齐历史 Current/Planned 与 compare。取消绘图阶段后，不再需要为交付解决这个问题。

独立绘图时仍不编造历史；缺少可靠基线可以只描述当前事实，必要时注明来源/时间，不强制恢复旧 C/P 或增加 Start commit。图表缺失、过时和绘图失败均不阻断交付；绘图若实际改动产品输入，仍按真实修改执行正常 Change/验证规则。

绘图输出也遵守正常文件写入与覆盖权限；Git 仍核对这些文件是否属于本次授权提交范围及是否存在冲突。取消架构前置，不等于免除实际文件操作的边界。

### 过程事实：不参与产品扫描，不等于免验证

`.flowkit` 中保存的是 Runtime/Verification 等过程事实与必要产物，但“放进这个目录”不使任意内容自动可信。`project.json`、Memo、Run/Result 以及执行产物仍由相关消费者按各自合同读取校验；代码 Full Test 不扫描全部真实历史材料，与这些校验是不同职责。

- 生成/接纳时核对真实来源、格式、归属、必要产物完整可读及结果一致性，保留需要的局部完整性检查；手写 PASS、格式正确或 hash 匹配都不能单独证明实际执行发生。
- Reviewer 独立检查当前相关 proof 与结论，必要时复验；Final 核对 required Changes 完成事实、当前 Full Test 结果及输入有效性；Git 核对本次对象、范围和授权，不逐份读取历史测试日志。
- 本次必要过程事实缺失、损坏或不一致时，阻止依赖它的操作并准确报告。不能因排除产品扫描就继续使用，也不能用聊天说明或重新生成的 bytes 冒充旧事实。
- 读取、写入、完整性/归属校验这些能力的实现代码仍要测试，以隔离 fixture 覆盖异常；不把本仓库真实 Run 或证据库当作通用产品验收输入。
- 不在每个阶段扫描整个 `.flowkit`，不重演全部历史实验。已发现但与本次操作无关的历史问题应报告，不自动变成全局 blocker 或撤销其他完成事实。

解耦的是产品扫描、相关事实校验和保存职责，不是取消真实性要求，也不是去掉所有内容摘要。具体检查复用现有边界，不建设新的审核平台。

## 独立测试配置与长期执行产物

`.gitignore` 负责 Git 对未跟踪文件的忽略；Full Test 配置负责约定命令和测试范围。两者不同源、不继承、不自动同步。

- 已跟踪的非产品图文仍可被测试配置排除；未跟踪产品文件仍须覆盖。
- 只修改 Git ignore/跟踪状态，不改变测试范围；修改测试配置不改变 Git 跟踪状态，但会影响测试结果的适用性。
- 本项目排除历史 `architecture/`、`.flowkit/`、`.tmp/` 和已声明的非产品渲染目录；它们无需存在。其他项目配置自己的范围，不被迫创建这些目录。
- 排除真实过程材料作为产品扫描输入，不排除管理软件读取这些材料的能力；相关代码及隔离 fixture 测试仍属于产品验证范围。
- 项目命令/扫描器实际遵守规则，不能只增加 host 配置而让子命令仍扫描全部管理文件。JSON/Markdown 不按扩展名统统排除，实际产品资源仍要验证。

### 为什么不再使用周期清理模型

上一版把“不必永久保存”和“可以放 `.tmp`”混在一起。待审 proof 或 Full Test 必要材料即使只需消费一次，在消费前也不能丢；如果临时目录先被删除，而原始环境或输入又无法复现，仅保留路径或一句结论无法补救。

Owner 已选择默认长期保留，因此直接去掉周期到期、转存、清理资格和收尾清理机制。无需再建立一个“受保护但到期可删”的材料生命周期。

### 最小保存模型

| 位置 | 保存内容 | 规则 |
| --- | --- | --- |
| 原 OpenSpec、源码与测试目录 | 合同、设计、代码、回归 fixture | 保持原 authority，不复制进 `.flowkit` |
| `.flowkit/runs/` | 固定 Action 的三文件记录 | 长期保留；不混入 Full Test/普通工具 Run，不改写历史 |
| `.flowkit/artifacts/` | 按实际执行区分的必要 proof、Full Test 结果与日志/报告 | 默认长期保留；不覆盖旧产物，不新增 lifecycle 或 Registry |
| 既有 Delivery 协调记录 | 当前尝试关联、完成状态及必要摘要 | 不复制完整 outcome，不新建 Delivery Run |
| `.tmp/` | 可丢弃的实验中间文件、缓存、重复输出 | 不能是必要证据的唯一来源，不承担完成资格 |

proof 的必要输入、方法/命令、观察输出和环境限制应在交接前可靠保存；Full Test 的实际结果及必要报告在成功接纳前可靠保存。可以使用临时工作文件，但不能让已交接/接纳材料的唯一 bytes 或链接目标仍留在 `.tmp`，也不能等到 Review/Final 前再搬迁。无法复现不是补写旧结果或丢弃唯一观察的理由。

目录本身不提供执行真实性；真正的 Review 和实际测试仍要发生。Full Test 结果是 Verification 产物，不因持久化获得 prepared/terminal 或新建 Standard Action Run。方案只是本地文件保存及相关校验，不需要 EvidenceStore、多种存储后端或证据管理平台。

长期保留会增加存储占用，因此只收集必要材料，不复制全仓、依赖、缓存和整个运行环境，不收集无关凭据/敏感数据；未来确需处理容量或删除内容时单独明确范围，不自动到期删除。保存位置不决定 Git 跟踪或 commit 授权。

独立绘图仍在该次文档任务范围内；D04 已有图、历史 Run、外部材料及既有 Owner 清理授权不追溯改写或自动迁移。本轮不创建新产物目录，也不移动任何历史文件。

## Change 划分与迁移顺序

六个 Change 的正式拟议 id、依赖和验收见[计划](flowkit-next-delivery-change-plan.md)。本次将原“测试后更新派生架构”替换为“移除 Delivery 架构依赖”，不新增第七个 Change，也不为审查意见额外创建 correct Changes。

实施顺序的理由：

- 先移除架构依赖：一次收敛 Start/Final/Integration 的架构字段、operation、toolchain/doctor 与活动 HOW，避免只删除某个模块后留下必填消费者。
- 再分根：只发行和定位仍然必需的 manager/OpenSpec 资产，不先搬迁将被删除的 Archify 集成。
- Action 接入与 Full Test 各自提供可验收能力，再汇入轻量 Start/Final；最后处理 Git 调用与范围。
- producer 的共享返回值变化时，同步必要消费者；不用虚构旧字段或空成功结果维持表面兼容。前一 Change 不宣称尚由后续处理的其他耦合已经消失。

长期保存与校验直接并入原六个 Change：分根明确 target 数据所有权；Action 接入负责 proof 保存、交接和相关校验；Full Test 负责结果及必要报告持久化；协调 Change 负责消费当前有效结果。原“简化 Delivery 起止与周期收尾”更名为“简化 Delivery 起止与完成确认”，语义 id `simplify-delivery-coordination` 不变，不保留周期清理任务，也不新增存储 Change。

退役终态是没有活动架构调用/必填字段/安装前置，而不是全仓搜索不到 Archify 字样。历史 OpenSpec archive、Runs、D04 manifest 与已接受图都保留；新活动 specs/实现不要求重演旧架构结果，不把 bootstrap 记录转换成新产品 outcome。

这不是要求新旧架构交付机制长期并行，也不是建立旧结果转换平台。按现有 Change 流程分小任务、验证直接消费者并进行独立审查即可。

## 对前次审查意见的落实

| 前次问题 | 本版处理 |
| --- | --- |
| 历史 PASS 与当前可用结果不清楚 | 明确当前尝试、失败不回落、输入/配置变化重验、不可确认则报告 |
| 缺少 C/P 时如何完成架构阶段 | 删除该阶段及其交付前置，不增加历史补图或不适用审批 |
| “接通 Action”没有确定执行方 | 既有 Agent/宿主执行，Flowkit 接纳；Propose 固定一个实际接入方式 |
| 触及大文件就必须先拆分 | 保持 650 行 gate，只在超限或职责确有需要时拆分 |
| 必要材料放 `.tmp`，消费前可能丢失且无法复现 | 必要 proof、Full Test 结果及报告生成时可靠保存至 `.flowkit/artifacts/`，默认长期保留 |
| 长期产物可能混入固定 Action Runs | `runs/` 语义和三文件保持；产物独立保存，不新建 Delivery/Full Test Run |
| 排除 `.flowkit` 被理解为过程事实无需验证 | 生成/接纳校验、相关消费校验与产品扫描分开；管理代码自身仍用 fixture 回归 |

新增验收重点：隔离 fixture 中清空 `.tmp` 后，已交接 proof 和已接纳 Full Test 结果仍可用；当前必要材料损坏/缺失/错误归属被相关操作拒绝；必要保存失败不得宣称完整成功；真实历史材料增长不进入代码扫描；Archive/Final 不清理证据也不重验全部历史。

本版允许必要执行产物的本地长期保留，但不建设多后端 EvidenceStore、周期清理器、绘图生命周期、架构影响判定器、可选工具 Registry、通用测试规划器、Agent 平台或全自动异常恢复。必要人工核对依托现有角色和执行边界，不增加审批层。

## 当前基础、历史与本轮完成边界

本轮读回的本地分支为 `delivery/20260902-04-delivery-continuity-stable-core-closure`，HEAD 为 `fb0785adbc25920515a181aae33fa1e05b333166`；本地 `origin/main` 为 `182e711fbc8e50979134d2e7717b048093d23b8b`。未 fetch 或核验新的远端状态；这些值仅定位分析源码，不是 D05 Start 的指定 SHA。

[D04 manifest](openspec/delivery-groups/20260902-04-delivery-continuity-stable-core-closure.yaml) 记载 completed/passed/completed 与 independent-bootstrap；[086 Result](.flowkit/runs/20260902-04-delivery-continuity-stable-core-closure/007-correct-delivery-content-continuity/20260907-086-archive/result.json) 是 bootstrap archive history，不单独充当 D04 Full Test/Final 证明。D04 闭合不因新产品取舍而重新打开。

本轮 managed OpenSpec 1.10.0 的 `list --json` 返回无活动 Change；当前尚无 D05 manifest。外部 `flowkit` 命令不可用，未用 candidate CLI 代替正式管理 authority。D05 开始执行前仍须明确独立管理方式，本轮不恢复旧 manager 或授权自我接管。

当前 `src/**/*.ts` 的 max-lines 为 650，含空行和注释。删除耦合后能直接缩短的文件不必先拆；只因真正职责需要或超限而拆分，不压行、不放宽 gate、不做无关重构。

本轮只更新两份 D05 文档并核对文字/链接/范围一致性，没有修改产品、活动 specs、Skills、Memo 或历史材料，没有卸载 runtime、清理证据、执行产品验收、创建 Run 或进行 Git mutation。D04 当时授权的外部证据不在此次搬迁或删除范围。
