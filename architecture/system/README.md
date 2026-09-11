# Flowkit 仓库级实现分析与独立图集

分析日期：2026-09-11。来源基线：`16f617a4074785fae950fb1e9fa8732f369ee303` 的产品源码与当前 canonical OpenSpec。这个 Git 引用只定位分析来源，不是 Delivery 准入条件。

本目录的 `flowkit.*.json` 是当前系统功能的独立派生描述；不使用 Current / Planned / Actual 分类，不设置 compare 或跨 Delivery 连续性合同。JSON 是可维护输入，HTML 由独立 Archify 渲染。本文与图都不替代 OpenSpec、Git、Run、Reviewer 或 Verification。

## 1. 图集入口

| 类型 | 说明 | JSON | HTML |
| --- | --- | --- | --- |
| architecture | 安装、查询内核、项目事实、验证与 Git 的职责关系 | [JSON](flowkit.architecture.json) | [打开系统架构](html/flowkit.architecture.html) |
| workflow | Owner / Author / Reviewer / Verification 如何推进 Delivery | [JSON](flowkit.workflow.json) | [打开交付工作流](html/flowkit.workflow.html) |
| sequence | 一次 canonical target 的 `next` 只读查询 | [JSON](flowkit.sequence.json) | [打开查询时序](html/flowkit.sequence.html) |
| dataflow | Action、Full Test 与 Archify 三类材料的流向 | [JSON](flowkit.dataflow.json) | [打开数据流](html/flowkit.dataflow.html) |
| lifecycle | `CurrentAction` 的 `prepared / terminal` 转换 | [JSON](flowkit.lifecycle.json) | [打开生命周期](html/flowkit.lifecycle.html) |

五类都具有实际实现依据。没有额外生成部署拓扑、网络服务、模型调用或数据库集群，因为当前 Flowkit 是本地 Node 软件包与文件协议，不是这些服务。

读图约定：架构图的连线表示访问、调用或消费关系，不是自动执行顺序；工作流图聚合三个 Author / Review 阶段，逐阶段顺序写在说明卡中；数据流图按材料类别拆成三条链，不声称列出每一个文件读取。生命周期图的 `null` 是空 slot，不是新的 state literal；虚线只表示另一次显式调用建立不同 Action identity，不表示恢复旧 Run。

图例沿用 Archify 的通用视觉分类，不是 Flowkit 的类型声明：`frontend` 可以表示 CLI 入口，`database` 可以表示文件，`security` 不代表新增鉴权服务或 PII 处理，虚线不保证异步。零节点的 waiting/success/failure 图例不表示系统存在对应 Action 状态；具体语义以节点、连线文字及 OpenSpec 为准。

## 2. 实现结构结论

当前产品可分为四部分：

1. **只读入口**：`status / next / doctor`。从安装自身定位资产，从 target 读取项目事实，返回状态、合法边界或明确诊断。
2. **有界执行模块**：公开 domain 能力支持准备、工作、结果接纳、持久化，以及 Delivery 操作。Agent/宿主显式调用；CLI 没有 Action 写命令。
3. **项目文件协议**：OpenSpec 保存合同，manifest 保存协调状态，固定三文件 Run 保存真实 Action，artifacts 保存必要材料；不另建数据库或 Registry。
4. **随包 HOW 与工程检查**：Action/Delivery Skills 指导执行，工具 HOW 约束 exact OpenSpec；格式、lint、依赖和可达性检查各自有界。

生产根入口是 [CLI entrypoint](../../src/cli/entrypoint.ts) 与 [domain exports](../../src/domain/index.ts)。`src/internal` 是被这些能力复用的实现细节，不是独立管理服务。生产模块不读取开发辅助 `.agents/skills`。本分析覆盖仓库可见能力与关键执行路径，不等同于对每个函数进行独立代码审计。

## 3. OpenSpec 与实现覆盖

下表按功能合并现有 canonical specs，不新增需求或第二份合同。

| 功能 | canonical OpenSpec | 已核对实现与边界 |
| --- | --- | --- |
| 角色、身份、结构状态 | [lifecycle-authority-and-identity](../../openspec/specs/lifecycle-authority-and-identity/spec.md) | `src/domain/authority.ts`、`identity.ts`、`state.ts`；Owner、Author、Reviewer、Verification 分工，Delivery/Change 状态不混入 Action 状态 |
| 单一当前 Action | [action-lifecycle](../../openspec/specs/action-lifecycle/spec.md) | `src/domain/action-lifecycle.ts`；只有 `prepared / terminal`；同一终态 identity 不 re-prepare |
| 精确工作包与结果接纳 | [action-package-and-result-admission](../../openspec/specs/action-package-and-result-admission/spec.md) | `src/domain/action-package-result-admission.ts`；核对 package、Role、执行 occurrence 与结果，不由文字描述补成功 |
| 单次工作与 STOP | [single-action-execution-terminal-boundary](../../openspec/specs/single-action-execution-terminal-boundary/spec.md) | `src/domain/single-action-execution.ts`；一次 Action，接纳后 terminal；失败不伪造结束，不自动下一步 |
| Run 持久化 | [run-result-persistence](../../openspec/specs/run-result-persistence/spec.md) | `src/domain/run-result-persistence.ts`；`action.md + context.json + result.json`，create-once 与完整性读回 |
| 合法边界与 revise | [policy-and-next-boundary](../../openspec/specs/policy-and-next-boundary/spec.md) | `src/domain/policy-and-next-boundary.ts`、`src/cli/checkpoint-authorization.ts`；确定性 ready/blocked，授权评估不执行 Git |
| Action HOW 与独立审查 | [action-guidance-execution](../../openspec/specs/action-guidance-execution/spec.md)、[author-action-guidance](../../openspec/specs/author-action-guidance/spec.md)、[reviewer-action-guidance](../../openspec/specs/reviewer-action-guidance/spec.md) | `src/domain/action-guidance-execution.ts` 与 `skills/actions/*/SKILL.md`；内容绑定、材料授权交接、proof/决策依据/当前验收区分；Skill 不选择下一 Action |
| 只读查询与新项目接入 | [foundation-cli-surface](../../openspec/specs/foundation-cli-surface/spec.md) | `src/cli/{entrypoint,foundation-cli,action-context,current-run-chain,trusted-change-coordination}.ts`；唯一有效链解析、idle/歧义/partial/bootstrap-history 分流；[接入说明](../../docs/onboarding.md)与项目短入口 |
| OpenSpec 薄观察 | [openspec-thin-integration](../../openspec/specs/openspec-thin-integration/spec.md) | `src/domain/openspec-observation.ts`、`src/internal/openspec-process-outcome.ts`；读取上游状态，保留异常分类，不重建 Change 状态机 |
| 安装和 exact 工具 | [managed-toolchain-resolution](../../openspec/specs/managed-toolchain-resolution/spec.md) | `src/internal/manager-installation.ts`、`src/domain/managed-tool-resolution.ts`、[lock](../../config/tools/toolchain.lock.json)；manager、target、FLOWKIT_HOME 分根，不按 target 同名资产回退 |
| 跨 Delivery 备忘 | [cross-delivery-memo](../../openspec/specs/cross-delivery-memo/spec.md) | `src/domain/cross-delivery-memo.ts`、`cross-delivery-memo-persistence.ts`；显式 Owner 处理 open/promoted/dismissed，不自动产生 backlog 或 blocker |
| 适用检查执行 | [applicable-check-execution](../../openspec/specs/applicable-check-execution/spec.md) | `src/domain/applicable-check-execution.ts` 与 `src/internal/applicable-check-*.ts`；显式检查、真实进程结果和有界 PASS 复用；不是测试规划平台 |
| Delivery 操作与 Start | [delivery-operation-execution-and-start-continuity](../../openspec/specs/delivery-operation-execution-and-start-continuity/spec.md) | `src/domain/delivery-operation-execution.ts`、`delivery-start-execution.ts`；固定四类操作与 manager HOW，Start 核对规划/manifest，不要求 commit SHA/clean，不内嵌 Git |
| 当前 Full Test | [formal-full-test-execution-and-correction](../../openspec/specs/formal-full-test-execution-and-correction/spec.md) | `src/domain/delivery-full-test-execution.ts` 与 `src/internal/full-test-*.ts`；项目配置选择输入，新 attempt、真实日志、当前结果与必要材料分别核对 |
| Final 内容与有效确认 | [delivery-finalization](../../openspec/specs/delivery-finalization/spec.md) | `src/domain/delivery-final-execution.ts`、`delivery-finalization.ts`、`src/internal/delivery-final-coordination.ts`、`delivery-required-evidence*.ts`；消费 required 完成依据和当前 Full Test，窄写内容与确认，不重放全部历史 |
| Git 节点与主线接纳 | [repository-integration-and-next-base-continuity](../../openspec/specs/repository-integration-and-next-base-continuity/spec.md) | `src/domain/git-workflow-host.ts`、`git-workflow-integration-host.ts`、`delivery-repository-integration-execution.ts`；checkpoint/push/integration 显式授权，范围与对象读回，部分成功交接而非盲重试 |
| 轻量源码 Gate | [lightweight-engineering-gate](../../openspec/specs/lightweight-engineering-gate/spec.md) | [package.json](../../package.json)、[ESLint](../../eslint.config.mjs)；bounded formatting + lint，生产 TS 650 行上限；Git 空白诊断与禁止入库内容检查独立 |
| 结构依赖与生产可达性 | [structural-dependency-health](../../openspec/specs/structural-dependency-health/spec.md)、[repository-entropy-hygiene](../../openspec/specs/repository-entropy-hygiene/spec.md) | [dependency-cruiser config](../../dependency-cruiser.config.mjs)、[reachability check](../../scripts/check-production-reachability.mjs)；检查坏依赖边与 production roots 可达性，不引入 CodeGraph 或层级 Registry |
| 独立 Archify | [architecture-and-canonical-diagram-continuity](../../openspec/specs/architecture-and-canonical-diagram-continuity/spec.md) | 产品不提供 Archify Delivery operation/adapter，不要求图；本图集使用用户独立安装的 Archify Skill，不改产品实现 |

## 4. 各步骤怎样解耦

### 接入与查询

固定发行包包含代码、Skills、lock 与接入说明。安装自身决定资产来源；target 的绝对路径只定位项目。用户项目不复制一套系统 Skills，也不依赖 Flowkit 开发仓库。`FLOWKIT_HOME/tools` 只提供 executable runtime，不能替代 manager 安装。

自然语言指令交由 Agent 理解：先核对实际 Role 和 target，再查询边界，最后读已确定 Action 的 Skill。没有模型调用平台、自然语言调度引擎或自动 Author/Reviewer 切换。`next` 不是以最大 Run 目录号猜当前状态，也不是执行下一步。

### Delivery Start → Changes

Start 建立固定 manifest 与规划关联，不以 Git SHA、clean worktree 或 Previous Actual 作准入条件。Change 激活仍来自明确 Owner 决定。普通 Action 按 OpenSpec、Policy、Role 和真实 Run 链执行，不为每次常规推进新加 Owner 审批。

Explore 的实验用于回答未知问题；被接受的理由用于后续决策；Apply 的当前验收用于判断当前实现。三者不能互相冒充。必要材料在 target 内按相关性读取；保留某份材料不等于它永远有效，也不意味着后续应遍历全部历史 proof。

### Archive → Full Test

Archive 完成 Change 与规范同步，不自动 commit。Full Test 使用 [项目配置](../../config/verification/full-test.json) 的 inputs/exclude/environment/checks；源码、测试、发行 Skills、配置与构建依赖文件是本项目的实际输入，不是整仓所有文件。

当前排除项包括 `architecture`、`.flowkit`、`.tmp`、`.agents`、`.git`、`node_modules`、`dist`、`coverage`、`.codebuddy`。排除规则独立于 `.gitignore`；必要验证材料自身的完整性另行检查，不因此把所有历史材料加入代码测试。

Full Test 材料在 target 的 `.flowkit/artifacts/<delivery>/full-test/<attempt>/`。manifest 的 `fullTestAttempt` 关联当前执行；失败或 partial 不能悄悄消费旧 PASS。Full Test 不创建 Standard Action Run。

### Full Test → Final → Git

Final 消费 required Change 的可信 archive/直接 review-apply 完成依据和当前 Full Test，而不是重复执行祖先 admission。先完成窄范围内容写入及 `null confirmationRef`，相关复验后发布有效确认。

Git 是独立节点：Start/Archive 后可以按授权 checkpoint/push；Final 不自动授予 commit/merge 权限。Integration 消费有效完成确认，同时独立核对提交对象、分支、远端接纳和 accepted-main。无关 worktree 修改不自动成为阻断，范围外 staged 仍不能夹带。

这些必要引用关系用于确认当前动作消费的事实，不构成整仓 hash 联锁。代码或必要合同改变应按正常 Change/验证处理；仅更新被排除的架构描述不使代码 Full Test 失效。

## 5. 当前快照与非目标

D05 manifest 中七个 required Change 均为 completed；当前 `fullTestStatus: passed`，`finalizationStatus: pending`。这些是绘图时读取的快照，不由本文维持。当前 D05 仍使用 independent-bootstrap；图中的产品执行能力不等于 candidate 已接管管理本 Delivery。

本轮没有进入新的 Change、创建 Run、执行 Full Test/Final 或 Git mutation。没有恢复外部 manager，也没有增加 Registry、永久 proof 平台、自动工作流、清理器或新的 schema。Archify 校验与浏览器检查只验证这些派生图，不提供产品 Review verdict 或新的 Full Test PASS。

## 6. 历史、渲染与检查

原有 `workflow.json`、`lifecycle.json`、`data-flow.json` 以及 Delivery 子目录图是历史材料，保持原始 bytes。它们可能描述旧架构前置条件，不应当作当前流程入口。当前入口仅为本页列出的 `flowkit.*.json`。

既有 `architecture/.gitignore` 排除各 `html/` 子目录，因此生成 HTML 留在本机，可由 JSON 重新生成；这与 Full Test 的显式目录排除是两个独立规则。本轮未修改任何 ignore 配置。

本机独立工具的单图重建示例（路径按实际安装替换）：

```powershell
node C:/Users/xuser/.agents/skills/archify/bin/archify.mjs deliver architecture architecture/system/flowkit.architecture.json architecture/system/html/flowkit.architecture.html --quality showcase --repo-root D:/Projects/flowkit-next --json
```

其他四类替换 type 和同名输入/输出即可，不需 `--repo-root`。不要直接修改生成 HTML。源码引用只在 architecture schema 中绑定；其余四图的规范/实现依据见本页，不添加工具不支持的自定义字段。

每图的 [delivery 回执](receipts/)保存真实 JSON/HTML SHA-256、字节数和九项 showcase 检查结果。浏览器观察另记于 [图集检查记录](verification.md)，不伪装成 Archify 自动回执或 Flowkit Run。
