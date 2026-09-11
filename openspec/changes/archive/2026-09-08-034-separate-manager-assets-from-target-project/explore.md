# Explore：分离 manager 安装资产与 target 项目

## 本轮结论与授权

Author Explore：PASS，已具备提交独立 review-explore 的有界事实；不是 Reviewer approved，也不是当前实现验收 PASS。

Owner 授权激活本 Change 并进行 proof Explore，沿用独立 bootstrap。D05 上一个 Change `remove-archify-from-delivery-workflow` 已完成 `007-archive`，checkpoint `01d82db` 已 push；该 SHA 只定位本轮实验输入，不是激活准入要求。本 Change 首次分配 `projectOrdinal: 34`：来自 Delivery coordination 中 13 个有效且不重复的既有值，最大值 33 加一，不使用数组位置、Run 数或 archive 数量。

本轮真实 Run 为 `20260908-008-explore`。这是本 Change 首次 Explore，`previousRunId: null`；前一 Change 的 `007-archive` 是依赖完成事实，不伪装成本 Change 的上一 Action。

本轮不修改生产代码、产品 Skills、canonical specs，不创建 Proposal/design/tasks，不执行 Full Test 或 Git mutation。后四个 planned Changes 不激活。

## 真实用例与三处归属

用户安装 Flowkit 后，应能管理一个没有 Flowkit 源码、package scripts、系统 Skills 和 toolchain lock 的普通 OpenSpec 项目。

| 所有者 | 内容及作用 | 不应承担 |
| --- | --- | --- |
| manager 安装 | 自身代码、系统 Action/Delivery Guidance、OpenSpec exact 版本约定、安装身份 | 收集各项目历史，读取 target 同名文件来决定系统资产 |
| target 项目 | 项目代码、OpenSpec、coordination、Runs、必要 artifacts、测试配置和 `.tmp` | 复制 manager 布局或用项目上一次 Delivery commit 定义 manager 身份 |
| `FLOWKIT_HOME/tools` | 当前操作所需的 exact OpenSpec executable runtime | 保存项目历史、代替 manager 安装、发现或恢复 Archify |

这里的“独立 target”是解析根独立，不要求用户迁移项目到指定盘符。实验的隔离 target 位于本 Change proof 目录，避免在项目外保留证据；它不是 Flowkit 开发仓库的根，也没有 Flowkit package scripts。

## 必要事实及最小 proof

必要脚本、输入、真实命令、stdout/stderr 与结果位于：

`.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/separate-manager-assets-from-target-project/proof/20260908-008-explore/`

入口 `probe.mjs`，实际尝试 `attempt-01/summary.json`。执行为 Windows native / Node v22.23.2；真实外部 OpenSpec 1.10.0，未修改或复制 runtime。manager Guidance 使用明确标注的惰性 fixture，不读取或执行 candidate `skills/actions/explore/SKILL.md` 来管理本轮。

| 风险 / 问题 | 实际 proof 及观察 | 决策影响与边界 |
| --- | --- | --- |
| 普通项目是否被迫带管理资产？ | `bare-target`：现有 `observeOpenSpecActiveChanges` 对无 lock 的 target 返回 `invalid-lock`；两个 Guidance resolver 返回 null | 故障在资产定位，不是缺 target 业务脚本；不能用复制 lock/Skills 解决产品分根 |
| 同名项目文件会否改变系统资产？ | `same-name-collision`：target 的 99.0.0 lock 导向对应 `missing-runtime`；target 与 manager 的同路径 Action/Delivery Guidance 产生不同 hash | trusted manager 根必须由安装/宿主确定，不能从 target 同名文件或调用者任意路径提名 |
| 分根是否要求重写 OpenSpec？ | `split-root-composition`：既有 resolver 读取 manager fixture 的 lock，实际 OpenSpec 在无 lock/无系统 Skills 的 target 执行 `list --json`，exit 0 且 `root.path` 精确等于 target | 工具 identity 与工具 cwd 可以分别传递；保留 thin observation 与 exact target-root 检查，不重建 OpenSpec |
| 移动资产与缺 runtime 是否可保持局部处理？ | `relocated-assets-and-missing-runtime`：第二个 manager 目录得到相同工具 identity、Guidance path/content identity；缺 runtime 时仍为 `missing-runtime` | 物理安装路径不应进入目标测试身份；必要 runtime 缺失只阻止依赖它的调用，不全局回退或自动下载 |

现行 3 个定向测试文件共 26 tests：26 PASS / 0 FAIL / 0 skipped。覆盖 Action Guidance、managed tool resolution、OpenSpec observation。它们是当前原实现的回归背景，不证明 D05 新分根能力已实现。

实际 OpenSpec 调用发生在碰撞 fixture 写入之前；脚本保留此顺序。后续写入的 target 同名资产只用于反例，不代表调用 OpenSpec 必須先写它们。

## 已定位的直接消费者

- `src/domain/managed-tool-resolution.ts`：`repositoryRoot` 决定 `config/tools/toolchain.lock.json`；现有 runtime 限定、package/version/entrypoint 检查可复用。
- `src/domain/action-guidance-execution.ts`：已决定 Action 对应固定相对路径与 hash；需明确这个根属于 manager。
- `src/domain/single-action-execution.ts`：调用 Guidance resolver 的根须接入 manager 归属，不新增宿主执行器或 Action 自动循环。
- `src/domain/delivery-operation-execution.ts`：Guidance resolver 和 `readExactDeliveryGuidance` 必须使用同一个 manager 根。
- `delivery-start-execution.ts`、`delivery-full-test-execution.ts`、`delivery-final-execution.ts`、`delivery-repository-integration-execution.ts`：只处理直接调用的 Guidance 根；项目输入、输出、Git/测试 cwd 仍归 target，不借此改写这些 operation 的其余合同。
- `src/domain/openspec-observation.ts`：目前把同一个 target `repositoryRoot` 同时用于 lock 读取和 child cwd，是需要拆开的实际接点。
- `src/cli/foundation-cli.ts`、`request.ts`、`entrypoint.ts`：系统资产根从安装入口注入，项目请求继续表达 target；不依赖 target 提供可信 manager 路径。
- `package.json` 目前提供 `dist/cli/entrypoint.js` bin，但没有明确发行 `files` 白名单。Propose 应定义最小运行安装内容和对应安装验收，不直接把开发仓库整棵复制到用户项目。

Run persistence 与 coordination 现有 `repositoryRoot` 用于项目事实，不能把所有同名参数机械替换为 manager 根。Full Test 命令、排除配置、candidate 枚举的解耦仍属于后续 Change。

## 最小 Proposal 方向（尚未批准）

1. 明确 trusted manager 安装根与 target 根的调用契约；优先由安装入口定位自身资产并注入直接消费者，不建立 Root Registry、动态搜索或多候选排名。
2. 保留现有固定 Guidance 路径和内容绑定，仅改变其根归属；缺失时准确诊断，不回退 target 或 bootstrap Skills。安装物理路径改变但相对路径/bytes 未变不应使系统 Guidance 身份无故改变。
3. OpenSpec lock 来自 manager；validated executable 来自 `FLOWKIT_HOME/tools`；所有项目观察 cwd 和 returned-root 校验指向 target。缺失/冲突维持既有局部诊断，不增加 runtime 全目录摘要或安装源归档前置。
4. 分根必须贯通 prepare 与 execute 的实际 Guidance 读取，不能只改 resolver 或 CLI 声明。保留现有包绑定、Role、Owner、Review 和一次 Action 后 STOP。
5. 发行只包含必要运行代码、依赖声明、系统 Guidance/其必需相对引用资产和 tool lock；不携带项目执行历史、开发 `.agents` 或外部 runtime。目标项目不安装 Flowkit 的开发依赖或复制专用 glue scripts。
6. 活动规范/产品 HOW/README/AGENTS 中与根归属、安装身份冲突的条款同步收敛，说明 D05 自开发仍沿用独立 bootstrap。旧 Delivery、archive、Run 不迁移，不追溯改写旧 manager 权威。实际 manager 身份不再从 target 上一 Delivery commit 派生；不增加签名、安装 Registry 或新身份数据库。

预计受影响的既有能力：`managed-toolchain-resolution`、`action-guidance-execution`、`openspec-thin-integration`、`delivery-operation-execution-and-start-continuity`、`foundation-cli-surface`，必要时同步 `single-action-execution-terminal-boundary` 中对应接口说明。Propose 按真实条款影响选择 delta，不为了“覆盖”增添无变化 specs。

## Apply 应证明什么

- 用实际安装布局的 CLI/adapter 管理无 Flowkit scripts/Skills/lock 的独立 target，能够读取当前已支持的状态并调用真实 exact OpenSpec；不能仅用这里的组合实验或合成 callback 宣布产品接入完成。
- target 同名 lock/Guidance 不接管 manager；安装移动后 target 读取/写入与项目测试配置不变，项目历史不写入安装目录。
- 缺失所需工具时有既有清楚诊断；不使用工具的能力不因该工具缺失被额外拦截。不引入 PATH fallback、下载或 Archify。
- 当前已经支持的各直接 Guidance prepare/read 路径一致；现有 Role/Run/包绑定回归保留。新宿主、idle/current 自动发现和 Full Test 测试范围实现由各自后续 Change 验收。
- 保持 `src/**/*.ts` 650 行 gate；只在实际超限或职责需要时拆分，不扩展 gate 到原始日志，不为普通现象增加审批。

## 证据语义、限制与 STOP

Owner 已选择必要 proof 在 target `.flowkit/artifacts` 默认长期保存，`.tmp` 只承载可丢弃中间材料；本轮不改变保留策略、不迁移 D04、不建立存储平台。原始日志保持工具输出，不套用源码格式 gate；本轮不修改 Git 配置或 `.gitattributes`。

本轮实验结论只是待独立审查的 Explore 依据；只有对应 review 通过后，才能作为已接受的 Proposal 决策依据。历史 proof 不能冒充未来 Apply 的当前实现 PASS。

尚未执行真正安装后的端到端 CLI status/完整生命周期，也未做 Linux detached 验收；它们不被虚报为已通过。受控 manager 资产移位实验没有验证可发布安装包。发行内容与入口根注入的具体接口是下一 Propose 的有界设计工作，不需要新一轮开放式 Explore。

未纳入：自动 Agent/Reviewer 调度、OpenSpec mutating adapter、Full Test 范围/保存协议、Start 去 commit 条件、Final 简化、Git 调用自动化、Archify、历史迁移、通用 Root/Skill/Tool Registry。

当前阻断未知项：无。交给独立 `review-explore`，STOP。
