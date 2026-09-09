# Proof Explore：独立 Full Test 与 gate 范围

## 当前边界

- Delivery：20260908-05-lightweight-workflow-management；Change：decouple-full-test-from-repository-tracking。
- Owner 已授权激活并执行 proof Explore，且明确把 gate 范围与 checkpoint 阻断问题纳入本 Change。
- projectOrdinal 36；当前 Run 分组 004-decouple-full-test-from-repository-tracking；Run 20260909-030-explore。三个编号含义不同。
- D05 independent-bootstrap；不使用 candidate 管理本 Delivery。产品 CLI 仍为 status/next/doctor，不重开已收敛的宿主协议。
- 本轮只是实验与边界核定，不是 Proposal、独立 Review、实现验收或 D05 Formal Full Test。
- 必要输入/实验脚本/原始输出保存在本项目 artifacts；.tmp fixture 可丢弃。不迁移、清理或改写历史。
- 最新 Owner 仅授权修正当前 Change 的 Run 分组；030 开始文件原 bytes 随目录移动，前三个分组不修改。

## 问题与既有事实

D05 要求代码 Full Test 由项目配置决定命令和输入，与 Git ignore/index/HEAD、真实过程历史解耦；Final 只消费当前有效测试结果。当前代码仍混用 D04 的共享 candidate 与 caller 提供的 prior PASS。gate 对 staged/unstaged tracked 文本施加整批空白规则；formatter 已限源码，但 whitespace 没有相同边界。

静态直接入口：

| 入口 | 当前事实 | 本 Change 影响 |
| --- | --- | --- |
| src/internal/applicable-check-candidate.ts | 必须是 Git 根，Git ls-files stage + others --exclude-standard 枚举；仅专门排除 Runs/Memo | Full Test 不再用 Git 枚举；不要全局改写其他 Action/Git 消费者的 candidate 合同 |
| src/domain/delivery-full-test-execution.ts | caller 提供 checks，package 散列产生 executionRef；允许 priorFacts reuse；结果仅返回给 caller | 接项目配置、区分实际尝试、实际执行并持久化，不跨尝试自动复用 |
| src/internal/applicable-check-process.ts | shell:false/windowsHide:true；stdout/stderr ignore | 保留受控进程调用，增加必要流保存与错误诊断；共享 Action 调用方不能被强加 Full Test attempt |
| src/domain/delivery-operation-execution.ts | Full Test facts 是 candidateRef + orderedChecks closed 结构 | 仅调整直接 Full Test operation 合同，不修改 ActionPackage/Run/Policy schema |
| src/domain/delivery-final-execution.ts | 用旧 candidate 和 caller 的 fullTestOutcome 关联 Final | 必须同步当前尝试与输入有效性消费者，不能 producer 改完仍要求旧整仓字段 |
| src/internal/delivery-required-evidence-source.ts | 从回调读取 Full Test outcome，并核对匹配；同时管理 Change closures | Full Test 读取绑定 target 当前尝试；本轮不重构全部 Change closure 机制 |
| src/internal/delivery-final-coordination.ts | pre-final delivery keys closed，Full Test 状态按旧流程消费 | 增加必要当前尝试引用的直接读写适配；完整 Start/Final 简化留给下一 Change |
| package.json / lightweight-engineering-gate spec / AGENTS 第17节 | quality:gate 混合 Git whitespace、formatter、lint、tracked-artifact；checkpoint HOW 要求 diff --check | 拆开代码质量与 Git 检查，明确非产品历史空白不能成为 checkpoint 全局 blocker |

config 下尚无项目 Full Test 配置。根目录 D05 规划中的旧 Action 宿主/两个真人 Change 验收文字已被后续批准合同取代，不据此扩张本轮范围。

## 决策性 proof

原始结果：.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/decouple-full-test-from-repository-tracking/proof/20260909-030-explore/probe/command.json、probe/stdout.txt；第二个实验：scope-probe/command.json、scope-probe/stdout.txt。均为本轮 Windows 原生 Node 22.23.2 受控实验。内部 Owner 值/Delivery 是明确标记的 synthetic fixture，不提供正式 authority。

| 问题 | 观察 | 决策影响与限制 |
| --- | --- | --- |
| Git 可见性是否影响产品输入？ | 只修改 fixture .git/info/exclude，extra-product.txt 从旧 candidate manifest 消失，产品 bytes 未改变 | 测试输入必须独立文件范围，不只是不读 .gitignore。此处使用 info/exclude 隔离了 ignore 文件自身作为产品输入的干扰 |
| artifacts 是否使 candidate 漂移？ | 新增原始 stdout artifact 后 candidateRef 改变；再新增 Run descriptor 不变 | 排除全部真实过程材料作为代码输入，而不是逐日志命名修补 candidate。不能因此免除相关记录消费校验 |
| 当前空白失败发生在哪里？ | untracked diff --check exit 0；暂存后 cached check exit 2，指出 input.bin 尾随空白及历史 audit.mjs 末尾空行；stdout.txt 无报错 | gate 范围缺陷复现。日志模式修复有效但不完整；Git 检查输出不等于产品错误/授权失败，不再要求重写历史 proof |
| 实际命令输出是否保存？ | 现有 process API 执行输出命令后仅返回 passed/exitCode/signal，源码 stdio ignore | 必要 stdout/stderr 应 Buffer 保存，命令失败原因应可读；此结果不是新 writer 的验收 |
| 两次 Full Test 是否有独立执行身份？ | 相同 package，控制环境先 exit 0 后 exit 7，两次 executionRef 相同；旧 PASS validator 仍接受旧 outcome；传旧 prior 后得到 reused-passed | 缺的是 durable current-attempt 选择及消费约束，不是需要新 Runtime。该实验不声称真实 Final 已被绕过；未执行 Final，改变的控制环境也未绑定进环境引用 |
| 独立范围是否可行？ | 非生产 prototype 只选择 src/tests/package；新增 ignore/artifacts/图不改变结果，修改被 Git ignore 的产品文件仍改变输入；旧 API 对非 Git 根拒绝形成 package | 可采用普通文件范围核对，不必全仓 Git hash。prototype 只证明有界 regular files，不是通用 scanner、平台验收或已实现配置解析 |

## 最小 Proposal 方向（不是已批准合同）

1. 单一项目配置入口。现无适合载体，建议使用规划约定 config/verification/full-test.json。明确项目相对 cwd、显式命令/argv、测试相关输入与排除目录；准确字段在 Propose 固定，不建立 Registry/自动测试规划器。配置及实际被消费的源码/测试/依赖/构建资源都属于输入。排除不按 JSON/Markdown 扩展名一刀切。
2. 所有真实测试命令须与该范围一致。父进程无法阻止任意第三方脚本自行扫描历史；本项目拆开现有聚合脚本，检查相关扫描器。外部项目自行提供符合范围的命令，不宣称配置天然沙箱化任意命令。
3. 每次实际 Full Test 建立唯一、create-once attempt 目录，保存在 target artifacts/<delivery>/full-test/<attempt>；既有 Delivery coordination 仅保存当前关联，不复制完整结果。运行前可靠保存开始及当前指向；任一步失败不得执行检查。之后任何中断/失败/必要保存失败都不能回退旧 PASS；残留保留，不自动补结果或恢复。
4. 顺序实际执行明确 checks，保留命令、起止、真实退出状态、必要 Buffer stdout/stderr、输入范围/配置身份与结果。保存和读回成功才可报告可消费结果；不增 Standard Action Run，不把 executionRef 内容散列当唯一 occurrence。当前尝试内也不依赖以前尝试的 PASS 缓存。
5. 输入有效性只核对测试相关文件/配置/工具环境，不绑定 Git 可见性或整仓状态。开始/结束/Final 消费时检查相同约定输入；不相关图文、真实 Runs、artifacts、管理状态变化不使代码结论失效。必要结果归属/完整性检查与代码重测分开。结果哈希不是执行真实性，相关消费者必须关联真实当前尝试。
6. 代码 gate 保持适用 formatter/lint/650 行等要求；从代码测试聚合中拆出 Git whitespace 与 tracked-artifact 检查。checkpoint 不将历史证据空白/测试输入当全局阻断，不靠用户反复豁免或每次追加 attributes。原始 bytes 保存、Git 文本归类、工程 lint、Git 授权四者分别处理。
7. 直接同步 Full Test 的 Final/coordination/evidence 消费者及相关 specs/HOW/测试，不保留伪造旧 candidate 字段。不要修改 shared candidate 来迫使所有 Action/Git 系统一起迁移。
8. 有效项目根及必要文件范围检查应独立于 Git；不需要首个 commit。链接逃逸/缺失必要输入按明确有界支持模型处理，不扩展通用文件归属平台。外部路径/任意特殊文件等支持细节在 Propose 明确，不能静默遗漏产品文件。

## 相关消费者与后续分界

本轮纳入 Full Test operation、配置、输入选择、实际进程保存、当前尝试和其必要消费者；gate 规范/脚本/AGENTS/HOW 只修本次授权的检查范围与阻断语义。可复用现有 Node 进程、文件、JSON/YAML 与局部身份辅助函数，无新增外部依赖的明确需求。

simplify-delivery-coordination 继续负责 Start acceptedBaseCommit/全仓 clean、完整 Final 简化、其余整仓摘要连锁和 Change closure 历史重验。invoke-git-at-workflow-boundaries 负责正式 Git/PR/merge 执行入口与结果交接。本轮不实现它们，也不让 Git 调用成为 Full Test prerequisite。

保留 OpenSpec Action 的严格顺序、独立 Reviewer、真实三文件记录与 Owner 权限。Run 分组 004 的纠正不改变 semantic ChangeId/projectOrdinal，不回迁 D05 历史，不新增编号体系。

## 后续验收应证明什么

- 只改 ignore/index/是否 tracked，测试集合不变；未跟踪或被 ignore 的产品仍被覆盖；非产品 history 不进入扫描。
- 项目命令实际遵守范围；产品/配置/依赖变动失效，单独 artifacts/非产品图文/合法管理状态不失效。
- PASS 后 FAIL/中断/必要保存失败时，不可消费旧 PASS；当前结果损坏/错归属拒绝消费，不以重跑代码掩盖证据错误。
- .tmp 可丢弃；当前必要输入、日志、结果可在新会话读回；未开始/部分开始/已执行保存失败如实报告。
- 代码格式错误仍由适用 gate 检出；历史证据空白不阻断正常 checkpoint，原始流/测试输入不被悄悄格式化。
- Windows 原生进程/文件与 Linux 适用回归；现有 Action candidate/persistence 不因 Full Test 改动回归。
- 同步后的 canonical specs 与实现一致，保留 650 行 gate，不以拆分检查为由跳过真实代码测试。

## 结论与限制

Explore 结论：PASS（问题与最小 Proposal 边界已获得静态事实和可重跑反例支持）。这不代表修复完成、Review approved、Formal Full Test PASS 或可以 Apply。

仍待 Propose 固定的是配置 exact 字段、输入范围语法/链接支持、当前尝试引用位置及最小外部调用入口；上述选择应保持本机文件/已有 Agent 调用能力，不引入 CLI Agent 托管、长连接、统一证据平台、并发调度、自动重试或跨尝试缓存。失败写入/跨会话消费与 Linux 实现验收尚未执行，需在 Apply 以真实候选验证，不用本轮 prototype 冒充。

交接独立 review-explore 后 STOP；本轮不自动启动 Reviewer、不进入 Propose/Apply、不执行仓库 Git mutation。
