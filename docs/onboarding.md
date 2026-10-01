# 新项目接入与 Agent 入口

Flowkit 查询流程事实，Agent 按合法边界执行一个 Action。它不是模型服务或自动流程引擎。已有项目先读后补，不用初始化覆盖代码、OpenSpec、AGENTS.md 或配置。

## 1. 固定包安装：manager 与 target 分开

Owner/宿主先选定实际 tgz 和安装目录。当前包为 private，不假设存在公开 latest。发行方在源码仓库运行固定版本 pnpm 的 `pnpm pack`（prepack 重建 dist），交付实际 tgz；使用者不需要开发仓库或 devDependencies。

PowerShell 示例的机器路径须替换为实际值。使用 Node >=22.20.0；仓库确定性 fixture 为 Node 22.23.2 / pnpm 11.22.0。使用新安装目录，已有安装先确认更新范围，不直接覆盖。

```powershell
$packageFile = 'D:\releases\flowkit-next-1.0.0.tgz'
$installDir = 'D:\tools\flowkit-manager'
New-Item -ItemType Directory -Path $installDir -ErrorAction Stop
npm install --prefix $installDir --omit=dev --no-audit --no-fund $packageFile
if ($LASTEXITCODE -ne 0) { throw 'Flowkit installation failed' }
$manager = Join-Path $installDir 'node_modules/flowkit-next'
$metadata = Get-Content -LiteralPath (Join-Path $manager 'package.json') -Raw | ConvertFrom-Json
$cli = Join-Path $manager $metadata.bin.flowkit
Get-Content -LiteralPath (Join-Path $manager 'docs/onboarding.md')
```

包管理器安装运行依赖（当前 yaml），按宿主网络/离线配置处理；失败不等于可用。manager 拥有 dist、系统 Skills、工具 HOW/vendor 和 lock，target 不复制这些资产。安装移位后更新入口定位，target 的 Run/配置留在原处；安装绝对路径不是持久身份。

`FLOWKIT_HOME/tools` 仅提供 executable runtime，不是 manager。宿主预先准备与安装内 `config/tools/toolchain.lock.json` 匹配的 OpenSpec 1.10.0：`tools/openspec/1.10.0/package.json` 及 `bin/openspec.js`。缺失或不匹配时报告 expected/actual/missing 并停止依赖操作，不自动下载 latest 或回退 PATH 上其他版本。不覆盖用户已有 FLOWKIT_HOME。

## 2. 首次查询

指定实际 target 和现有 FLOWKIT_HOME。缺 OpenSpec root 且已授权初始化时，才在 target 内运行 exact runtime 的 `init --tools none`；已有 root 先读后补，不重新初始化，不用 `--force`。上游 `/opsx:propose` 提示不是 Flowkit 跳阶段许可。

```powershell
$target = 'D:\projects\my-project'
$toolHome = $env:FLOWKIT_HOME
if (-not $toolHome) { throw 'Missing FLOWKIT_HOME' }
$openSpec = Join-Path $toolHome 'tools/openspec/1.10.0/bin/openspec.js'
# 仅在缺 root 且已授权初始化时执行下面两行：
# Set-Location -LiteralPath $target
# node $openSpec init --tools none
$scratch = Join-Path $target '.tmp'
New-Item -ItemType Directory -Force -Path $scratch | Out-Null
$requestFile = Join-Path $scratch ('flowkit-query-' + [guid]::NewGuid().ToString('N') + '.json')
$request = @{ repositoryRoot = $target; flowkitHome = $toolHome }
[IO.File]::WriteAllText($requestFile, ($request | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
node $cli doctor --input $requestFile
node $cli status --input $requestFile
node $cli next --input $requestFile
```

每次检查退出码和 JSON；退出 0 也可能是 blocked，不等于可执行。doctor 只证明它检查的 root/runtime。后续通常查询 status/next，需要工具诊断时再 doctor。请求可丢弃，不是第二份 current 配置。多个目标需明确后增加 `deliveryId` / `changeId`，不得传 `currentRunId` / `changeStartSequence` 或用最大目录号猜状态。

## 3. 按用途准备，不强绑所有节点

| 用途 | 项目事实及既有入口 |
| --- | --- |
| 只读查询 | 实际 target、OpenSpec root、runtime 与请求；没有 active 可以返回 idle |
| 首次项目 / Delivery Start | Owner 确认项目身份、真实规划、Delivery 和范围；读取 manager 的 `skills/delivery/start/SKILL.md`，按各自边界调用 `project init` 与 `delivery start` 固定命令并读回 |
| 激活 / 首次 Explore | Owner 明确 activation；调用 `change activate` 建立 Change scaffold 与 manifest 决定，首次 Explore 按对应 HOW 一次分配 projectOrdinal |
| 单次 Action | 查询合法边界后读对应 Action Skill，真实开始、工作、接纳、固定三文件保存读回，然后 STOP |
| Full Test | 进入该授权节点才准备 target 自有 `config/verification/full-test.json`，读取 manager 的 `skills/delivery/full-test/SKILL.md` |

已有 project/manifest/Run 先核对再复用，不复制开发仓库 D05 manifest、ordinal 或 Owner ref。首次 ordinal 无已赋值基线时，按既有 HOW 取得明确初始化决定；不从空目录、数组位置或测试样例推断没有历史。Start 不要求首个 commit/clean worktree，不内嵌 commit。正在用于 Start 的规划仍须可读，不能套用历史退役规则。

接入、doctor PASS 均不产生 activation、Role、Review 或 Git 权限。CLI 提供查询 `status/next/doctor`、机械记录 `action start/finish`、`proof inspect` 和下述固定支持命令；CLI 不编码、不做独立 Review、不自动执行下一 Action。当前 Delivery 由已选定的外部 Stable manager 管理，候选包仅在独立 target 验收。

固定 Action 记录使用同一个已选定安装的 `bin.flowkit`。在 `next` 确认 exact Action 后，Agent 先读取安装内 `skills/actions/<actionId>/SKILL.md`，再提交含 `repositoryRoot`、`flowkitHome`、`deliveryId`、`changeId`、exact `actionId`、实际 `role` 的 JSON：

```powershell
node $cli action start --input $startRequestFile
# 仅 effect=started 时完成本次实际角色工作；runId 来自开始响应。
node $cli proof inspect --input $proofRequestFile
node $cli action finish --input $finishRequestFile
node $cli status --input $queryRequestFile
node $cli next --input $queryRequestFile
```

`proof inspect` 请求另含 `runId` 与受控 proof `path`；只有实际必要材料才调用。生产者在 finish 前须将本 Run 正式 proof 目录的**全部文件**逐一纳入本 Run 显式 `proofRefs`，每条含归属、路径、用途、bytes 与 SHA。固定 finish 会枚举本 Run 目录并双向核对；若目录有三个文件而只列一个、目录为空、引用重复或文件无效，会在 terminal 机器文件写入前拒绝并保留开始记录和材料。无新材料时不建空目录，显式使用 `proofRefs: []`。后续 Action 的 handoff 可只交接本次判断需要的已声明引用，不删减原 Run Result 或重扫旧目录。`.tmp` 仅承载可丢弃请求、诊断和隔离实验；需要长期复现的实验脚本按原始字节作为本 Run proof 声明具体用途，不作为标准生命周期入口。finish 请求含 `runId`、`role`、`terminal` 与真实 `RunResultRecord`。仅返回 `effect=confirmed` 才表示三文件和 canonical chain 已读回；这不代表业务 PASS。prepared Owner correction 仅由收到真实 Owner 指令的受信宿主在 start 请求中加入现有 `OwnerAuthorityFact`，finish 不再重填。archive start 另需非空 `applicableChecks: [{id,reason}]`，由 Agent 声明实际适用且已在 target `package.json` scripts 或 `config/verification/full-test.json` checks 中配置的检查；隔离 convergence 后执行，未配置或失败则阻断。Reviewer `rejected` 是可报告的真实判断，但当前固定 finish 会在 machine 文件写前拒绝其持久化并保持 incomplete；不得改写成 `changes-requested`。普通 Action 不需要新增 Owner fact，Review、Full Test 与 Git 边界仍独立。

### 可选宿主权限示例

先由 Owner 选择实际安装目录、target 和所需命令，再在宿主自己的权限机制中逐项审核。宿主可见的是 `node` 可执行文件、选定安装的 exact `$cli` 绝对路径、子命令和明示 argv；`--input` 文件名或 stdin 的内容不构成宿主可见的 target 授权。下表中的 `$target`、`$deliveryId`、`$changeId` 均须替换为已选定值；不同类别不继承权限。

| 类别 | 可供宿主逐项审核的固定调用 | 边界 |
| --- | --- | --- |
| 只读材料 | `node $cli proof inspect --repository-root $target --delivery-id $deliveryId --change-id $changeId --input $proofRequestFile` | 固定入口仍核对 JSON 目标与具体 proof；仅按需读取 |
| 只读 Delivery 检查 | `node $cli delivery full-test current --repository-root $target --delivery-id $deliveryId --input $currentRequestFile` | 只读当前状态；不授权运行 Full Test |
| 受控记录 | `node $cli action start --repository-root $target --delivery-id $deliveryId --change-id $changeId --input $startRequestFile`；`node $cli action finish --repository-root $target --delivery-id $deliveryId --change-id $changeId --input $finishRequestFile` | 两个子命令分别审核；Policy、Role、Run 和 Result admission 仍由 CLI 核对 |
| 项目检查 | 在选定 target 明确调用其 `pnpm quality:gate`、`pnpm typecheck` 等具体脚本 | 项目脚本权限与 Flowkit CLI 权限分开，结果不产生 Owner/Review 权限 |
| Git/网络 | `git checkpoint`、`git push`、`git integrate` 各自为独立审批节点 | 不能继承只读或记录命令的权限；仍需 exact Owner 与 Git 事实 |

Foundation `status`、`next`、`doctor` 当前仅支持 `--input`，没有 `--repository-root` 目标 argv，不能给它们配置声称“按 target 前缀匹配”的自动放行。任何示例都不放行裸 `node`/`python`、所有 Flowkit 子命令、其他安装或其他 target。宿主前缀匹配不解析 JSON；即使宿主匹配，CLI 仍须拒绝 JSON 与可见目标冲突。可测试的宿主应分别试选定调用及不同安装、子命令、target、冲突 JSON 的反例。当前发行没有交互式宿主规则测试结果，此项保持**未验证**，不承诺零提示，也不自动安装或修改用户全局规则。

候选 CLI 的支持命令为 `project init`、`delivery start`、`change activate`、`change archive`、`memo list/get/create/promote/dismiss`、`delivery full-test`、`delivery full-test current`、`delivery final` 和 `git checkpoint/push/integrate`。每个 JSON 请求都含 `repositoryRoot`、`flowkitHome`；Delivery/Change 命令另含各自 ID，并与可见参数一致。例如：

```powershell
node $cli project init --repository-root $target --input $projectRequestFile
node $cli delivery full-test current --repository-root $target --delivery-id $deliveryId --input $currentRequestFile
node $cli change archive --repository-root $target --delivery-id $deliveryId --change-id $changeId --input $archiveRequestFile
```

例如在已存在的 Delivery 上只读查询当前 Full Test，沿用第 2 节的 `$target`、`$toolHome`、`$cli`，以同一目标生成封闭请求：

```powershell
$deliveryId = (node $cli status --input $requestFile | ConvertFrom-Json).deliveryId
if (-not $deliveryId) { throw 'No current Delivery; select an exact Delivery before this query' }
$currentRequestFile = Join-Path $scratch ('flowkit-full-test-current-' + [guid]::NewGuid().ToString('N') + '.json')
$currentRequest = @{ repositoryRoot = $target; flowkitHome = $toolHome; deliveryId = $deliveryId }
[IO.File]::WriteAllText($currentRequestFile, ($currentRequest | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
node $cli delivery full-test current --repository-root $target --delivery-id $deliveryId --input $currentRequestFile
```

写命令的 `OwnerAuthorityFact`/`sourceRef` 由 Agent 根据真实 Owner 指令声明；CLI 核对结构、目标和当前正式前置，不监听或认证聊天。`project init` 在尚无 Delivery 时仅需明确项目接入 `sourceRef`。Full Test run 请求另含预先固定的 UUID v4 `attemptId` 和从 `delivery full-test current` 读取的 nullable `expectedCurrentAttemptId`；同次重投沿用两者并只读返回，明确新运行使用新 ID 和不同 Owner fact。`change archive` 先由 `action start` 建立合法 archive Action，命令只做 OpenSpec/协调内容；Author 随后用 `action finish` 保存真实 Result。`git integrate` 在 PR/merge 尚未由外部接受时交接待办，不把 checkpoint 视为接受完成。外部接受后用 exact checkpoint 的 `reuse-existing` 请求核对目标 main ref；只有 main 已离开授权 base 且包含该 commit，固定命令才只读确认接受。

## 4. 合并项目短入口

读取已有 AGENTS.md，仅合并下方区块、保留其他原文。无区块才追加，相同有效区块不重复，有路径/规则冲突先报告，不整文件覆盖。替换占位符并核对可读性；安装移位只更新定位，不搬 Run。Role 来自当前会话/Owner，不固定成上一 Run role。

```markdown
<!-- flowkit-entry:start -->
## Flowkit 项目入口

- target：<本项目绝对路径>
- manager：<所选安装的 node_modules/flowkit-next 绝对路径>
- FLOWKIT_HOME：<外部 exact tools 根目录；不是 manager>
- 实际 Role 取当前会话/Owner 明确职责，不从上一 Run role 推断，不自动切换。
- 先读 manager/docs/onboarding.md，使用其 package.json 的 bin 查询本 target 的 status/next。
- 阶段请求先核对唯一合法 Action 与实际 Role，再读该安装的 skills/actions/<actionId>/SKILL.md；仅询问下一步则只读后 STOP。
- 歧义、blocked、partial、bootstrap-history、角色/阶段冲突或缺事实先报告并 STOP；不猜编号、不回退旧 PASS、不自动下一步或 Git。
<!-- flowkit-entry:end -->
```

区块仅定位与提示，不是新 Skill、Policy、状态副本或安装路径 schema；不需要每项目系统 Skill、长期 helper 或新环境变量协议。

## 5. 收到“根据最新 run，review”之后

确认 target、安装来源和实际 Role，再查询 status/next，读取 `next.decision` 的实际内容。若 decision.kind 为 `ready-action` 且 actionId 与请求匹配，例如实际 Reviewer 的 review 请求匹配 review-propose，则读取该安装 `skills/actions/review-propose/SKILL.md`，不猜 review-apply。遵循该 Skill 的完整执行方法，不改变 normative HOW/content identity。

revise 同样与查询给出的具体 Action 匹配，不新增自然语言代码路由表。Author 不能因为下一步是 review 自动成为 Reviewer，应交接独立角色。仅请求“下一步是什么”就只读后 STOP；无执行请求不自动开工。

| 查询/上下文 | 处理 |
| --- | --- |
| idle / 无唯一 active / 歧义 | 报告当前情况，歧义需明确目标，不自动激活 |
| blocked / 缺 activation、依赖事实 | 报告实际 reason，不补成功字段 |
| partial / 开始后未完成 | 保留已有 bytes，不自动清理、接管或回退旧 PASS |
| bootstrap-history | 只展示历史，不转换成 canonical current |
| Role 或阶段不匹配 | 指出冲突，交接所需角色/决定并 STOP |
| 缺安装/runtime/Skill 或内容无效 | 核对选定安装，不取 target 同名文件或其他版本回退 |

## 6. 材料与验收

真实 Action 保存固定三文件 Run；必要 proof 留 target `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，按当前需要交接引用。`.tmp` 放可丢弃包/探针/请求，不作唯一必要证据。旧 proof 不是当前实现 PASS；材料处理授权简要交接，不复制聊天。

Full Test 的 inputs/exclude/environment/checks 来自 target 配置，独立于 `.gitignore`、index、HEAD；当前 attempt 材料在 `.flowkit/artifacts/<delivery>/full-test/`，新失败/partial 不回用旧 PASS。Archify 不是测试或 Delivery 前置。Git 只在独立授权节点执行，测试成功不替代权限。

接入验收分别记录：实际固定包下一次有内容的真实 Author 工作与 Run；新 CLI 进程读回同一 target；真实新 Agent 会话只凭 target 与短入口自行找到安装、Run、边界和 Skill 后 STOP。新会话不继承聊天、不预给答案，不要求第二次 Action、制造 finding、独立 Review verdict 或完整 Delivery 演练。

pack dry-run、doctor、CLI 重启和合成 fixtures 不能抵扣真实工作/新会话。没有实际新会话就保持未执行，不补 PASS。这些检查也不是 Formal Full Test。
