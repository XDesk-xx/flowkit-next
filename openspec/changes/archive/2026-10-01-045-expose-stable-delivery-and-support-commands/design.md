## Context

见 `proposal.md`。A checkpoint 的 `flowkit` 已有 `status/next/doctor/action start/action finish/proof inspect`；B 的真实 Explore 探针确认其他命令尚未存在。现有 Start、Memo、Full Test、Final、Git 领域函数和 Archive readiness 分别拥有自己的规则，但正常调用仍暴露宿主 callback/临时程序。当前 D07 由 D06 exact Stable manager 管理，以下设计只在候选产品及独立测试目标实现。

## Goals / Non-Goals

**Goals:** 让受信 Agent 将真实 Owner 指令转成一个封闭操作请求，固定发行 CLI 完成该操作的机械步骤与读回；复用现有 package、Policy、OpenSpec 和 Git 检查；把已发生的部分效果准确交接。

**Non-Goals:** CLI 监听 Codex 或其他聊天、解析自然语言/调用模型、自动 Review/下一 Action、建立 Owner Registry、通用插件/执行器/回滚平台、替代 OpenSpec/Git 权威，或在 D07 中改用候选管理自身。C/D/F/E 的内容按 Delivery 分工保留。

## Decisions

### 1. 入口和请求保持封闭

在现有 `bin.flowkit` 的分发层增加 `project`、`delivery`、`change`、`memo`、`git` 固定子命令。复用 A 的 JSON 输入读取、大小限制、可见 target 对照和 manager 安装定位；每个子命令有独立的字段 allowlist 与类型/身份校验。请求只表达目标与数据，不包含函数、可执行路径、shell 片段、Guidance hash、Run sequence 或已通过布尔值。命令自身持有调用既有 domain 函数所需的固定 callback/文件工具实现，不向 Agent 暴露 callback 参数，也不增加通用 `exec`。

固定命令及主要业务输入：

| 命令 | 数据输入与当前来源 | 固定执行/确认 |
| --- | --- | --- |
| `project init` | 项目身份、明确接入 `sourceRef`；无 Delivery ID | 验证 OpenSpec root；create-once `.flowkit/project.json`，相同内容只读复用 |
| `delivery start` | exact Delivery、规划引用/结构化 manifest、create-delivery fact | 由 manager 形成/校验 manifest，调用现有 Start package/writeManifest，读回内容完成 |
| `change activate` | planned Change、activate-change fact | 检查直接依赖/active 唯一性；受管 OpenSpec 建 scaffold；窄写 manifest/读回；ordinal 留给 Explore |
| `memo list/get/create/promote/dismiss` | memoId、封闭 Memo 数据与写操作 authority | 复用既有 Memo 持久化与状态规则，不改 Delivery requirement |
| `change archive` | exact 已开始的 archive Action 定位 | 复用 readiness、受管 OpenSpec 与 manifest completion；返回事实给 A 的 `action finish` |
| `delivery full-test/current` | run 使用 formal authority、`attemptId` 与 `expectedCurrentAttemptId`；current 仅 target | 对同次请求只读确认，或读取 target 固定检查配置并运行/持久化新 attempt |
| `delivery final` | finalize-delivery fact | 从已接纳 Change 与当前 Full Test 实读来源，执行窄写、复验与 confirmation 发布 |
| `git checkpoint/push/integrate` | exact Git operation、target/ref/scope 与本次 Owner fact | 复用现有 Git host 的完整 index/对象/远端检查；各命令单独 STOP |

请求公共字段为 `repositoryRoot`、`flowkitHome`；已存在 Delivery 的操作再有 exact `deliveryId`，Change 操作再有 exact `changeId`。`project init` 只加 `projectId`、`repository`、`runtimeFamily` 与接入 `sourceRef`，固定生成现行 `formatVersion: 1`、`state: "initialized"` 的项目文件。`delivery start` 加规划 artifact 与结构化 manifest 数据、现有 create-delivery fact；manager 实读规划并计算内容身份，不采信 caller hash 或任意 YAML bytes。`change activate` 只加 exact Owner fact，不接受 caller ordinal。Memo 写命令使用现有 Memo 输入类型与各自 Owner fact。`change archive` 加 A 的开始响应提供的 Run 定位值，但重新读取该开始记录与当前链，定位值不产生权限。Full Test run 除本次 Owner fact 外，接收 Agent 在首次投递前固定的 UUID v4 `attemptId`（同次重投保持不变）和从当前 Delivery 关联读得的 nullable `expectedCurrentAttemptId`；它们是请求身份与并发前置，不是 Owner authority 或 caller verdict。新运行须有不同 `attemptId` 及针对该次运行的 distinct Owner fact `ref`；检查配置和输入由 target 实读，不能由 caller 选择。`full-test current` 只读并返回当前 attempt 身份，即使结果为 failed/incomplete。Final 只接收本次 Owner fact，完成来源由 target 实读。Git 请求沿用现有 `GitHostRequest` 的 exact node/operation/branch/ref/path 形状，加本次 Agent 对 Owner 输入的声明；Change checkpoint 使用既有 `authorize-checkpoint` fact 与 Policy evaluator，普通 Start checkpoint 使用无 changeId 的同名 fact，push 使用 `authorize-push` fact，Integration 使用既有 singleton fact。每个解析器只接受本命令所需字段，禁止把一项操作的数据转用于另一项。

`repositoryRoot` 必须为可见参数和 JSON 中同一目标；需要的 Delivery/Change 可见参数也必须一致。`flowkitHome` 只选择 exact managed OpenSpec runtime，不选择 manager 源码。安装根由已选定的 `flowkit` executable 固定；target 同名资产不能接管。JSON stdin 可用作数据输入，但不改变可见 target 限定。

### 2. Owner 来源由 Agent 证明给宿主，CLI 只验证可见结构和操作

Agent 根据真实用户输入判断是否存在 Owner 决定、操作及范围，提交现有 `OwnerAuthorityFact` 与 `sourceRef`。CLI 无法独立读取聊天，所以不声称它验证了消息真实性；它检查 fact 形状、decision/scope/目标、Policy、协调状态及本次操作内容。`project init` 在尚无 Delivery 时只接受项目接入 `sourceRef` 与项目身份，不造一个假的 Delivery-scoped fact。普通词语匹配不进入产品。

Git 现有 `ReadGitHostAuthority` callback 改由 CLI 的固定适配器提供：适配器接收 Agent 对本次 Owner 决定的 attestation，构造 exact host request，重新读取相关 Policy/Final/Git 事实，在每笔写前重验；不接受请求内的 JS callback。此适配器的匹配证明请求一致，**不证明聊天来源**。现有 Git scope、index、proof bytes、对象和 remote ref 校验仍是另一组独立条件；Agent 不能用结构合法的 fact 绕过它们。Full Test/Final 的适用 Owner fact 同样由 Agent 提供，实际验收事实仍由 target 正式来源读取。

### 3. 各操作保留独立的写入顺序

- `project init`：检查 OpenSpec root 与目标文件；只在缺失时 create-once 写；读回 exact 身份。缺 OpenSpec root 时交接 exact managed OpenSpec 初始化，不让命令猜测如何覆盖已有项目。
- `delivery start`：先实读规划/项目/manifest prestate，形成 Start package；固定 manager callback 用结构化规划构造确定 manifest，使用现有 `writeManifest`；相同内容可复用，写后读回。无 Git 或无首个 commit 不成阻断。
- `change activate`：预检 manifest 与 OpenSpec 目标；先用 exact managed OpenSpec 创建 scaffold，再窄写 manifest active 与 Owner fact；中途失败保留 scaffold 并报告 partial。它不分配 ordinal、不开始 Explore。
- Memo：复用既有原子替换和状态校验，写后读回 exact memo；不将其自动 promotion 为新要求。
- `change archive`：A 的 archive start 先建立 Action；固定命令核对该开始记录、已批准 Review、tasks、persisted ordinal、managed tool 与检查；执行 OpenSpec 归档/规格收敛及 manifest completion；失败保留原效果。Author 再用 A finish 提交真实 Result，CLI 不替 Author/Reviewer填结论。
- Full Test：写前先按 `attemptId` 检查 create-once 目录。若已有开始记录，仅在 delivery、Owner fact、`expectedCurrentAttemptId` 与记录相同且材料可确认时只读返回该 attempt 的 terminal/pending/partial 事实；不重新运行检查、不重新发布 current，记录冲突或不可确认则拒绝。新 `attemptId` 须与当前关联不同，Owner fact `ref` 须与当前 attempt 不同，`expectedCurrentAttemptId` 须与当前关联（包括 null）相同；从 target `config/verification/full-test.json` 和当前代码/材料形成输入身份，复用现有执行/存储函数但以请求的 `attemptId` 建立 create-once 开始记录，并在其中绑定预期关联，然后以既有写前 prestate/CAS 发布 current，读回后才执行检查。开始记录存在而尚未发布、发布后 pending、terminal passed/failed、材料损坏或响应丢失均只按该 ID 读回已确认事实；未知或 partial 不自动继续检查。经明确核对的 partial 后可以用新 Owner fact、新 ID 与当时当前关联启动后续运行，旧材料保持原样；并发关联漂移则拒绝新运行。配置或输入变化必须改变当前有效性，不能继承旧 PASS。`current` 只读。
- Final：从 accepted archive/直接 review-apply、当前有效 Full Test 与 exact Owner fact 形成 package；执行现有两笔窄写，相关复验后发布 confirmation。`completed` 但无有效 confirmation 仍是未确认。
- Git：checkpoint、push、integration 各自绑定 Owner 本次 exact operation。checkpoint 写前检查完整 index 与证据 bytes，写后核对 commit；push 核对 local object 和 remote exact ref；integration 消费 confirmed Final 和 singleton。PR/merge 使用既有外部工具或人工交接。

不同操作不共享一个通用事务或恢复器。固定结果至少携带 command、target、effect、已确认的持久身份、未确认/部分效果与下一人工边界；机器错误非零退出，业务 blocked/partial 不以 exit 0 解释成成功。重复调用只按每个有界合同做 exact 同次只读确认或明确拒绝；Full Test 的显式请求身份规则是对现有每次随机生成 attempt 的固定入口适配，新开始记录增加预期关联绑定，现有历史开始记录仍按原格式只读消费，不改变独立新尝试必须重跑检查的规则。绝不覆盖 Run、proof 或历史结果。

### 4. 验收分层

先对命令解析/负例及各固定适配器做有界测试，再用独立最小 target 证明 project init、Start、activation、Memo、archive、Full Test、Final 的机械闭环，并在隔离 Git 仓库验证 checkpoint/push/integration 的 exact scope、对象与部分成功。真实 Author/Reviewer 判断由独立角色提供，fixture verdict 只证明解析，不冒充正式审查。B 当前实现测试只证明其候选；Change E 才验证发行包和新会话的完整 bootstrap 使用。A 的回归和既有 Full Test/Final/Git 权限边界必须保持。

## Risks / Trade-offs

- **Agent 对 Owner 来源的 attestation 无法由 CLI 自行认证** → 明确宿主信任边界，CLI 只报告自己实际核对的结构/状态；高影响操作保持 exact sourceRef、scope、目标与写前重验，宿主权限仍独立生效。
- **Archive/activation 跨 OpenSpec 与 manifest 写入** → 预检所有可在写前确定的条件；固定顺序、create-once 与逐步读回；部分效果可见且不自动清理或盲重试。
- **Full Test/Final/Git 有外部副作用或长运行过程** → 保留现有 attempt、confirmation、Git 对象作为真实身份；超时不等于失败或未写，后续只读确认后交接。
- **命令列表较长** → 每项对应 D07 既有操作所有权；复用现有能力，不增加通用路由/脚本执行层，C 再做全目录 Guidance 收敛。

## Migration Plan

只扩展候选发行 CLI、直接受影响的帮助/示例和规格，不改历史 Run/proof、OpenSpec archive 或旧稳定安装。D07 仍由 D06 exact Stable manager 执行正式生命周期；候选在独立目标验收。后续 Owner 明确形成 Delivery Final Git checkpoint 后，才可能将该 exact 发行选为下一 Delivery 的 Stable manager。
