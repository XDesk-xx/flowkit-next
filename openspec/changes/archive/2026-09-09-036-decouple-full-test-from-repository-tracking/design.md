## Context

依据 proposal.md 与 031-review-explore approved。设计需要处理配置、文件输入、真实进程、持久化和 Final 的直接接点，满足 design 的跨模块条件。030 proof 仅为决策依据，不是本轮实现验收。

## Goals / Non-Goals

**Goals:** 使用既有 Node/文件/YAML 与 Full Test operation，形成项目自有的测试配置和当前可消费结果；让源码 gate 与 Git checkpoint 职责分开。

**Non-Goals:** 不重构全部 Start/Final/Integration；不改变其他 Action 的 Run/Policy/候选身份；无新 CLI 写命令、Agent transport、Registry、自动执行循环、并发写协议、跨尝试 PASS 缓存、证据迁移或历史清理。只支持顺序单 writer，冲突报告而非恢复服务。

## Decisions

### 1. 单一项目配置和调用入口

固定 target 相对路径 config/verification/full-test.json；不是 manager 全局配置，不接受 caller 替换 checks/priorFacts 或任意配置路径。JSON 根只允许 inputs、exclude、environment、checks：

- inputs：非空、不重复的项目相对文件/目录路径数组，目录递归；可使用 "." 表示 target 根。
- exclude：同样的相对路径数组，按 exact path 或目录边界前缀排除，不支持 glob/正则，不要求目录存在。不允许空字符串、绝对路径、反斜杠、.. 或规范化歧义；"." 仅 inputs/cwd 可用。
- environment：需要绑定的环境变量名数组，不重复；只保存值的摘要/存在标记，不保存 secret 明文。固定绑定 platform/arch/Node version 与实际 program 可执行文件身份。
- checks：有序非空数组，每项为 {checkId, program, args, cwd}；checkId 使用既有 semantic id，唯一；program 为显式 executable 名或路径，args 为完整字符串数组，cwd 为 target 下目录，缺失拒绝。不得改成 shell 字符串或从 scripts 自动发现检查。

保留已发行 invokeDeliveryFullTestOperation 的 operation 入口，输入收敛为 repositoryRoot、{deliveryId, ownerAuthority} 及现有 manager installation 依赖。新增只读 current Full Test reader 供既有 Final/Agent 读取，返回当前结果或明确 missing/incomplete/invalid/stale，不枚举最大目录挑 PASS。已授权 Agent 通过发行包已有 domain API 调用，不要求 target 编写 Flowkit adapter，不把 API 调用当正式 D05 自管理。

projectId 从 target .flowkit/project.json 读取；Delivery 从原 manifest 确认，不要求任何 Git repository/commit。保留 exact Full Test Owner authority 和 manager Guidance 身份；本机安装与 target 根不合并。

选择原因：项目需要一个明确命令集合和边界，而非测试框架。弃用 caller 临时 checks、隐式 package script 推导、多配置层与新 CLI command。未知字段拒绝，避免拼错配置被静默忽略。

### 2. 输入范围和实际命令一致

读取普通文件/目录，按相对路径 UTF-8 排序，去重；不查询 Git、ignore、index 或 commit。必需 inputs/cwd 缺失、不可读、选中符号链接/junction/特殊文件都明确拒绝，不跟随外部链接；被 exclude 的子树不进入读取。此为本轮有界支持模型，不构造跨盘输入平台。config 本身总是必要输入，不能被 exclude 隐藏；生成结果目录和 Git 元数据不是产品输入。

本项目配置列明 src、tests、scripts、skills、config、package.json、pnpm-lock.yaml、pnpm-workspace.yaml、tsconfig.json、tsconfig.build.json、eslint.config.mjs、dependency-cruiser.config.mjs、.node-version 等实际产品/检查输入；列明排除 .flowkit、.tmp、architecture、.agents、.git、node_modules、dist、coverage、.codebuddy。inputs 只列实际存在且需要的条目，不因目录不存在创建占位内容。依赖安装由 lock/工具身份关联，不扫描 node_modules。

输入身份使用独立 full-test-input:sha256:<hex> 域，覆盖排序后的选中路径/文件内容、配置原始 bytes、实际命令及 cwd、program resolved bytes、material environment 摘要；不使用旧 shared candidate v2，也不把配置字符串 refs 当成已读取的文件证明。只用于当前尝试有效性，不跨尝试缓存。绝对安装根不作为项目内容身份；program 实际解析来源和 bytes 必须可确认。

父进程配置不是子命令的沙箱。本项目显式串行执行 format:check、lint、typecheck、build、test:domain、相关 acceptance、dependency-health、entropy 及其回归；落地配置使用本平台可执行 program + args，不直接 shell:false 启动 Windows .cmd。现有项目脚本若内部带 Git/OpenSpec 汇总或扫描真实 history，必须拆出代码检查部分；读写器本身仍用 fixture 测试。项目适配命令/扫描范围属于配置验收，不宣称可自动约束任意外部命令。

### 3. 当前 attempt 的发布与失败顺序

目录固定 .flowkit/artifacts/<delivery-id>/full-test/<attempt-id>/，attempt-id 为实际入口生成 UUID，目录 create-once；重复 package 也有不同 attempt。既有 manifest delivery 增加一个可选 fullTestAttempt 字符串，保存当前 attempt-id，不保存完整 outcome。新项目无此字段表示从未建立当前测试；历史结果保留但不自动成为新入口的 current。

顺序固定：
1. 只读核对授权、target/Delivery、配置/输入、Guidance 和输出根。失败不运行检查，不声称已开始新尝试或可沿用旧 PASS 完成本次请求。
2. 创建 attempt 目录并写 start.json，读回；窄写并读回 manifest 的 fullTestAttempt，同时将 fullTestStatus 置 pending。发布前再次核对所读 manifest，使用现有局部写入/替换办法保留非目标 bytes。此引用发布是当前尝试选择点。
3. 仅在开始记录与当前关联都可读回时执行 checks。发布失败则本次不执行；保留已写开始文件，不清理或覆盖。若发布是否成功不明确，消费者重读 manifest，不能按调用者旧缓存选 PASS。
4. 发布后当前记录缺失/partial/命令失败/中断/保存失败，均不可消费旧 attempt；记录保存失败也不能回写旧关联。允许未来明确新调用创建新 attempt，不接管旧 partial。
5. 执行和输入重验后，写 result.json 并读回；只有当前结果真实完整通过且输入未变时，将 fullTestStatus 窄写 passed，否则可写 failed（若保存不了就保持 pending，照样不可消费）。最终状态更新失败不可报告 durable completion。
6. Final 读当前关联与当前文件，核对结果和输入，再确认关联没有变化；不只看 fullTestStatus 或局部 PASS validator。旧 passed 状态与缺失/不符结果不构成通过。

不要求事务/WAL/锁。新调用在 current pending/partial 时必须先报告已有未完成事实；明确开始新尝试可替换 current 引用，保留原目录。没有 authority 的并发接管不支持，不自动重试。

### 4. attempt 材料与进程结果

start.json 固定保存 {projectId, deliveryId, attemptId, startedAt, ownerAuthority, guidanceRef, configRef, inputRef, orderedChecks}；configRef 为配置内容摘要。orderedChecks 保存已解析 program 身份、argv、cwd、环境摘要及 checkRef，不能包含环境 secret 明文。开始记录 create-once。

每个 check 使用 checks/<checkId>/stdout.txt、stderr.txt，stream bytes 原样顺序写入，不解码再格式化；执行完再保存 command.json，记录 program/argv/cwd、开始结束时间、exitCode、signal、process/save 错误和原始流 bytes/hash。打开输出失败不启动该进程；中途流写失败停止/终止该子进程并报告不可确认，不产通过。退出非零是 check failed，spawn/signal 是 process-failed，不自动重试；串行继续其他已声明 checks 收集结果，但一旦输入漂移或必要持久化失败则停止剩余执行。

result.json 固定为 {projectId, deliveryId, attemptId, executionRef, startedAt, finishedAt, configRef, inputRef, status, failureReasons, checks}；status 为 passed/failed，failureReasons 为实际失败原因数组（通过时为空），checks 按声明顺序保存每项 checkId/checkRef、实际状态及 command/stream 引用；未执行项明确标记 not-executed 与原因，不伪造 command 引用。输入漂移、未执行完整检查或必要保存失败不能形成 passed；能保存则保存 failed，不能保存则保留 partial。这些是 Full Test 文件合同，不是 Standard Action Run/Result schema。读回要求身份、引用边界/regular/readable、size/hash、检查完整性与结果一致。

executionRef 保留 full-test-execution:sha256:<hex> 值域，由包含本次 attemptId 的 exact Full Test operation package 按既有 execution projection 派生；相同输入的不同 attempt 不得得到同一 executionRef。Final 的 fullTestExecutionRef 与 requiredEvidence.fullTest.executionRef 均使用此值，sourceRef 则由当前 attempt 的真实保存位置派生；UUID occurrence 不直接塞入旧 hash 字段，也不以 ref 自洽代替读取开始记录。

必要日志/开始/结果仅在当前 attempt 下保存一份；Final/evidence 不复制 outcome。只读取当前实际依赖，不遍历历史 artifacts。保留真实来源与校验，不声称散列能证明执行或独立 Review。raw 文件无限量输出不承诺可保存：磁盘/流失败明确失败，不截断后声称完整。

### 5. package、Final 与共享能力的窄接点

Full Test operation facts 改为 {attemptId, configRef, inputRef, orderedChecks}，输入不再是旧 Git candidate；Guidance 与 Owner envelope 不变。只读 prepare 可生成待用身份但不宣称开始；实际 invocation 完成第3节开始/发布才运行。撤出 Full Test priorFacts/reused-passed 路径和相应 caller；Action applicable-check API 的现有 v2/显式 reuse 保留。

Final 不再接纳任意 caller fullTestOutcome；从 target 当前 attempt reader 消费并派生 Full Test evidence。必要外部 reader 只保留其 Change closure 职责，不得替换当前 Full Test 来源。其 verifiedCandidateRef 字段在 Full Test→Final 边界承载 inputRef，相关 validators 明确支持该域；finalizedCandidateRef 仍是原 Git integration 的 v2 内容投影，不与 inputRef 作相等比较。Final ref 的现有字段顺序保持，绑定的值更新；相应黄金向量/直接 Integration validator 同步。

Final 执行前后检查当前 attempt/inputRef 和 coordination 自身的窄写冲突；不再用整仓 candidate 判断测试是否有效。窄写后的 Git finalized 投影及后续 integration 既有检查保留，不能重新冒充代码测试范围。本轮不承诺去掉后续 Git/Start 的所有旧耦合。

### 6. gate 与 checkpoint 分开

quality:gate 仅聚合原 bounded format:check 与 lint（含既有 source-size）；不运行 git diff 或 forbidden tracked-artifacts。保留 check:forbidden-tracked-artifacts 作为 Git 节点显式检查，不改变其禁止 runtime/dependencies 入库的规则。其失败属于具体提交内容问题，不是 Full Test 代码 verdict。

AGENTS/相关 HOW 区分：源码质量在 Apply/Review 适用 gate 处理；checkpoint 只核对本次授权、范围、真实冲突、禁止入库内容及 Git 结果。可输出 git diff --check 诊断，但不得将非产品历史空白直接升级为提交阻断。新编写的结构化材料仍应按正常格式书写，但不倒逼修改已接受历史以凑检查通过；用户明确忽略非产品空白不制造测试 PASS。

本次不再扩张四条 raw-stream attributes，不统一格式化历史 .bin/.mjs，不自动修改其他项目 Git 配置。原始 bytes 的 Git 保存需要本次操作明确核对；不把整个 artifacts 当源码 formatter 输入。本机长路径支持是 Git 环境配置，不是产品 gate/Full Test 合同或新权限门槛。

## Risks / Trade-offs

- 第三方命令绕过项目范围 → 以项目配置/脚本集成验收落实，不承诺通用命令沙箱。
- 单 writer 发布或保存中断 → partial 保留、当前关联读回、无旧 PASS fallback；不引入恢复平台。
- input 摘要不能识别所有环境语义 → 明确配置 material environment、实际 executable 身份和输入；变化或不可确认即不接纳旧结论，不靠全仓 hash 假装完整。
- 现有 Final/Integration 仍有旧边界 → 仅必要 Full Test 适配，其他简化留到原后续 Changes，不能用旧字段阻止新 Full Test 结果接入。
- 真实历史越积越多 → 不参与代码扫描，也不自动清理；只保存必要当前材料。

## Migration Plan

按配置/范围→attempt/执行→消费者→gate/HOW→验收的小步实现；直接 producer/consumer 在同一 Change 收敛。没有新依赖的需求。已存 D04/D05 bootstrap Runs、旧 Full Test 外部材料与历史分组原样保留，不转换为新 current、不重签 PASS。发行 API 的破坏性变化更新调用方和相关测试；未来回退由 Owner 单独授权 Git 操作，不设计自动 rollback。

## Traceability

| 来源 | 设计决定 | 验收 |
| --- | --- | --- |
| 030 Git 可见性/artifacts 反例，031 approved | 1–2 | ignored/untracked 产品覆盖；过程材料和 ignore 变化不改变集合 |
| 030 输出/attempt 反例，031 当前发布提醒 | 3–4 | 实际进程、保存失败/中断、跨会话当前读取、失败不回旧 PASS |
| 030 必要消费者，现行 Final 合同 | 5 | 当前结果篡改/错归属/stale 拒绝；合法管理变化不重测 |
| Owner gate 修复决定 | 6 | 历史空白不阻断 checkpoint；代码格式/650 行负向仍失败 |
