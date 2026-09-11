# 接通 OpenSpec Action 流程：proof-based Explore

## 本轮边界与事实来源

Owner 已授权激活 `connect-openspec-action-workflow` 并调查每次追加 `.gitattributes` 的耦合；本轮只 Explore。D05 沿用独立 bootstrap，不恢复外部 manager，不让 candidate 管理本次 Action。

manifest 中前一 Change 已 completed；其 `013-review-apply` approved → `014-archive` PASS → Git checkpoint `697088391374daa67d63c20f8a365fb44ec5c058` 已形成。本 Change 按实际 Owner 指令激活，唯一 projectOrdinal 为 35：14 个有效、不重复的已分配值，max 34 + 1。SHA 只定位本次源码观察，不作为 Explore 准入条件。

依据：根目录 D05 计划及解耦分析、当前 `foundation-cli-surface` / `run-result-persistence` / `single-action-execution-terminal-boundary` / `action-guidance-execution` specs、相应源码与真实实验。历史 D04 及 bootstrap Runs 不改写，不转换成产品 canonical Run。

必要证据位于 `.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-015-explore/`。下文 proof 路径均相对此目录。`.tmp` 只放可丢弃 fixture；本轮没有删除用户材料，仅移除了实验自行创建的一份重复输入和其空目录。

## 已确认问题

| 风险 / 问题 | 当前事实与 proof | 决策影响 |
| --- | --- | --- |
| 用户必须知道 Run 编号 | `src/cli/request.ts` 明确拒绝省略 currentRunId；`foundation-cli.ts` 只读取显式 selected Run；现行 CLI spec 同样要求 caller 选择 | 不是补一句 HOW 即可解决，需要有界上下文解析入口及对应 CLI delta |
| Run 列表排序被当作 current | `listChangeRunHistory` 返回 sequence 排序；没有实现唯一合法 handoff 链选择 | 从限定目标事实和 previousRunId 链解析，不能取最大目录号 |
| 软件没有实际执行方 | `invokeSingleAction` 只接收 callback，CLI 只有 status/next/doctor；内部 terminal 返回也不等于 durable write 已完成 | 接通一个既有交互宿主，复用 single Action、admission、persistence，不新增模型平台 |
| 原始证据被源码规则改写或阻断提交 | 根 `.gitattributes` 的 `* text=auto eol=lf` 与两个 Change 专属日志例外；新路径不匹配 | 按稳定产物用途制定一次性规则，取消逐 Change 手工维护 |
| `.tmp` 丢失导致交接材料不可用 | 必要 proof 与工作文件需要不同保存位置；位置和 hash 本身又不能证明执行真实 | 生成时可靠保留，相关消费核对，不扫描全部历史或建立证据平台 |

## 实验及其证明范围

### 原始日志与 Git 文本规则

`probe.mjs` 的 `attempt-02/summary.json` 保存真实 Windows Git 命令、退出码、原始 stdout/stderr 和摘要。

- 使用本仓库当前 attributes 的隔离 baseline：未来 Delivery / 新 Change proof 和 Full Test 四类 stdout/stderr 路径均发生 CRLF → LF 的 index bytes 变化；`git diff --cached --check` 返回 2。
- 仅在另一个隔离 fixture 增加 `.flowkit/artifacts/**/stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt` 的通用 `-text -whitespace`：4/4 index bytes 与输入完全相同，检查返回 0。
- 同一 fixture 新增带 trailing whitespace 的 `src/control.ts` 后，检查仍返回 2，且指出源码而非日志。不是关闭全仓检查。
- 本仓库 `.gitattributes` 和 index 没有修改。`attempt-01` 的 Git 子进程被沙箱 EPERM 阻止，原始失败保留；获准在沙箱外运行相同实验后产生独立 `attempt-02`，没有覆盖失败。

根因是“来源用途未分离 + 将某次 Change 路径编码成长期规则”，不是 Git 需要更多审批。拟议最小修复为一次性通用原始流规则，保留源码、结构化 Run/Result、脚本和人工摘要的文本要求；不得对整个 `.flowkit/**` 关闭检查，也不得把日志格式化后更新 hash 冒充原始证据。

通用模式覆盖当前声明的 stdout/stderr 命名，不声称自动识别任意报告。Propose 应固定新原始流的稳定命名；确需保留不同格式的原始报告时按其真实用途界定，不创建分类 Registry。历史例外可由通用规则替代，但历史日志 bytes 不重写。Full Test 路径的实验只说明同类原始流处理，不提前实现 Full Test 配置/执行。

### 最小宿主接缝

`host-probe.mjs` 在当前交互式 Agent/终端宿主启动一个存活进程，通过 stdout 给出只读实验请求，等待 stdin 回交。当前 Agent 真实读取 OpenSpec CLI 创建的 `.openspec.yaml` 与 SHA256，再通过同一进程 stdin 回交；进程校验后退出，没有启动下一操作。

`host-request.json`、`host-response.json`、`host-summary.json` 保存这次真实传递。证明一个既有宿主可保持单次进程、读取输入、执行工作并回交，不需要在 Flowkit 内调用模型 API。此处不是 canonical ActionPackage，不是独立 Review，也不是两个 Changes 的接入验收。

拟议支持域：一个现有交互式 Agent/终端宿主、一个执行中的 Action、一个顺序 writer。由宿主调用 manager 暴露的单次入口并消费结构化上下文；manager 等待该次宿主结果，核对并保存后 STOP。输入只要求目标范围、当前 Role/明确 Action 和实际适用的 Owner 决定，不要求用户写 callback、找 Run 序号或复制系统 Skills。

Propose 必须固定具体命令/结构化传输及失败落盘顺序，而非只提供 callback 类型；传输往返不是新的 prepare Action 或审批节点。宿主 EOF、未回交、拒绝结果、必要写入失败均不得报告成功。进程中断不自动恢复或重放有副作用的工作；保留已有 prepared/不完整诊断，交给现有角色核对。本项必须覆盖此失败边界，但不建设守护进程、WAL、锁服务或自动恢复系统。

### 上下文及必要证据

`continuity-probe.mjs` / `continuity-summary.json` 是非生产拓扑反例：空历史、线性链、目录重排、高号无关根、缺父、分叉、断开环 7 项成立。排序不改变有效链端；更高编号不能解决歧义。模型不验证真实 Run schema 或 Policy，不能直接当作产品 resolver。

产品应先由真实 OpenSpec + manifest 定位唯一目标；多 active 或多个匹配目标时报告具体歧义，可接受 Owner 明确选择，不猜。只扫描选定 Change 的受控 Run 候选并用现有 reader 验证身份、Role、previousRunId 及适用合法边；唯一有效链才可提供 current facts，然后交现有 Policy 计算边界。没有 Run 只能在该目标事实完整且确认空历史时表示空，不将读取失败当 idle。已归档、planned/等待 Owner 与事实矛盾分开报告。

不建立第二份 current 注册表，不因自动定位引入“每步 commit”。历史 bootstrap 形状只作为历史读取/显示，不伪装为 canonical Action input；无需让新宿主接管 D05 自身。

证据实验保存必要 bytes 后删除自己的 `.tmp` 重复输入，保留文件仍可读；create-once 写入拒绝覆盖、必要文件缺失被拒绝、篡改 hash 不匹配。错误 Change 即使 hash 相同仍是错误归属。这里只证明文件/反例基础，不冒充产品证据接纳器的完整验收。

必要证据通过现有结果 facts 中的有界引用传递；保留命令/方法、实际输出、归属及必要完整性信息，不扩张 Run 三文件。接纳前核对当前必要文件完整可读且与本次执行一致；后续只读取本次相关引用。路径必须归 target、拒绝越界/逃逸，不能只凭字符串前缀或 hash 信任。摘要不能替代真实来源，Reviewer 仍独立判断证明力。

### 既有能力基线

实际执行 `single-action-execution`、`run-result-persistence`、`foundation-cli-surface` 三组定向测试：30 PASS、0 FAIL、0 skipped，原始输出在 `attempt-02/existing-focused-tests.stdout.txt`。它们证明已有接缝基线未失败，不证明新增能力已实现。本轮未执行 Full Test 或 Linux 验收。

## 最小 Proposal 方向与直接影响

1. CLI/context：替换必须手工提供 currentRunId 的用户入口限制；保留内部 exact identity、可信 coordination、OpenSpec thin observation 和 Policy owner。不是重建 OpenSpec 状态机。
2. 单次宿主：把 package → 真实工作 → result admission → durable 三文件 → STOP 接通。terminal 成功报告在必要写入及读回之后；失败不得借旧成功继续。已产生但未成功接纳的副作用准确报告，不自动 rollback/retry。
3. proof：本次必要产物在 target `.flowkit/artifacts` 默认长期保留；消费检查有界；相关 Owner 材料授权随交接传递。Explore 原始实验、接受后的决策依据、当前实现验收证据分开。
4. 文本边界：以通用 raw-stream 模式替代当前两个 Change 的逐路径例外，补跨 Delivery/Change 及源码负向回归；同步实际涉及此边界的 repository HOW。此项在本 Change 修复，不推迟到 Git Change。

预计需要修改 `foundation-cli-surface`、`single-action-execution-terminal-boundary` 及涉及 proof 交接的现有能力 delta；如 `run-result-persistence` 或 `action-package-and-result-admission` 的文字阻挡必要接入才最小同步，不无故改 closed schema。`action-guidance-execution`、产品 Actions HOW、bootstrap HOW 和 AGENTS 中直接冲突的当前约定按受影响条款协调；两套 HOW 仍独立，产品不读 `.agents`。不重写 archived specs/Run。

Apply 验收必须包含：一个实际支持宿主的两个 Changes、一次真实 revise、独立 Review、新会话不填 Run 序号续接、未回交/错误 Role/非法 next/损坏或缺失证据/保存失败、无自动 Role 切换或下一 Action，以及原始流跨新路径保真与源码检查仍有效。单元 callback、拓扑模型或本轮 transport probe 不能替代该验收。

650 行 source gate 保持；仅超限或确需职责拆分时拆文件，不压行、放宽 gate 或借机重构。

## 非目标、限制与结论

不处理 Archify，不执行 Git，不更改 `.gitignore`，不把原始流规则当 Full Test 排除配置；Full Test/Start/Final/Git 执行仍由 D05 后续既定 Changes 负责。不新增 Change、Agent/Provider/Skill/Gate Registry、EvidenceStore、永久凭据、跨项目状态服务、自动审查循环或周期清理器。

Author Explore 结论：PASS，可交独立 `review-explore`。关键方向由源码与有界实验支持；命令字段和精确写入顺序由 Propose 固定并交审查，不在本轮实现。实际双 Change 宿主验收、Linux 及产品证据接纳仍未执行，不宣称其 PASS。

本轮只更新 activation manifest、OpenSpec Explore 材料、必要 proof 与真实三文件 bootstrap Run；不生成 Proposal/design/tasks/delta specs，不修改 Skill 或生产实现。下一边界：`review-explore`，STOP。
