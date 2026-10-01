# B：Delivery 与辅助操作固定入口的 Proof Explore

## 当前范围

Delivery `20260929-07-bootstrap-execution-and-skill-hardening` 的 Change `expose-stable-delivery-and-support-commands` 已由 Owner 输入 `owner-input:2026-09-30:backup-branch-then-restart-b` 重新激活。本次 Author `explore` 的 Run 为 `20260930-014-explore`，首次 Explore 分配 `projectOrdinal: 45`。正式分支从 Change A checkpoint `146cf0d77289c997e2ce6d5ce2b1c68416b0034f` 开始；旧 B 尝试保存在独立备份分支，不作为当前 Run 链或实现验收。

目标是让 Project、Delivery、Change、Memo、Archive、Full Test、Final 和 Git 辅助操作通过 Flowkit 发行包内固定命令完成各自的机械步骤。Change A 已提供 `action start`、`action finish`、`proof inspect`；B 复用其 Action 记录边界。全量 Skills 收敛归 C，通用证据与窄执行约束归 D，prepared proof checkpoint 兼容修复归 F，独立发行验收归 E。

Owner 对执行模型的明确修正是：Agent 依据当前会话中的真实 Owner 指令，识别意图、角色、目标和授权范围，然后调用对应固定命令。Flowkit 的 Policy 计算合法边界，固定命令校验结构、身份、当前状态及操作前置，并执行限定的机械步骤。普通词语“授权”不构成机械触发词；不以严格匹配聊天措辞替代 Agent 对 Owner 意图的判断。CLI 不监听 Codex 桌面聊天，也不调用模型、自动 Review 或自动执行下一步。

## 本次有界证明

在真实 Action 开始记录后，对 A checkpoint 的候选执行 `pnpm run build`，退出 0。候选 `package.json#bin.flowkit` 指向 `dist/cli/entrypoint.js`；`flowkit --help` 退出 0，仅列出 `status`、`next`、`doctor`、`action start`、`action finish`、`proof inspect`。同一候选的 `flowkit delivery start --input .tmp/d07-b-restart-query.json` 退出 2，返回 `invalid-arguments`。原始 stdout/stderr、命令时间和退出状态保存在 `.flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/expose-stable-delivery-and-support-commands/proof/20260930-014-explore/` 的 `command.json` 与对应 `*.stdout.txt`、`*.stderr.txt`。这证明当前发行入口的缺口，不证明未来命令已经可用。

`source-boundary.json` 记录本次读取的十个相关源文件的 bytes、SHA-256 和被核对的调用标记。源码观察给出以下 Proposal 边界；它不是实现测试 PASS。

| 风险 / 问题 | 当前事实 | Proposal 决定 |
| --- | --- | --- |
| 固定命令应由谁实现？ | `src/cli/entrypoint.ts` 与 `src/cli/request.ts` 只有有限命令与严格请求解析；A 的 `src/cli/action-commands.ts` 已将 Action 记录放入发行入口。 | 在同一发行入口添加有限的操作命令和数据请求；不接受 `scriptPath`、模块路径、任意 shell、caller callback 或动态执行。 |
| 各操作能否合并为一个流程？ | Start 通过 `writeManifest` 写目标 manifest；Memo 有独立持久化函数；Full Test 保存当前 attempt；Final 发布协调确认；Git checkpoint/push 以真实对象和远端读回为准。 | 命令复用各自已有的校验、写入和读回责任，保留各自前置、提交点和失败状态，不建立通用工作流/事务。 |
| Change 激活是否等于 Standard Action？ | `resolveTrustedChangeCoordination()` 读取 manifest、completed 依赖和 exact Owner activation fact；A 的 Action 命令负责 Run。 | `change activate` 是有界 Owner 决定的固定操作；随后 `explore` 才是一次 Standard Action。激活命令不伪造 Explore Run，也不自动启动它。 |
| Owner 来源由谁判断？ | 现有 `git-workflow-host.ts` 的 reader 需要宿主提供真实输入；CLI 自身无法读取或验证聊天。`OwnerAuthorityFact` 是有形状的记录，摘要不能证明聊天确曾发生。 | Agent/宿主负责识别真实 Owner 输入并给出 sourceRef 与精确操作；固定命令验证请求、目标、当前状态和操作权限，不声称独立认证聊天。高影响操作在实际调用时提供当前授权事实，并按已有 Git/Full Test/Final 规则再次检查。 |
| Archive 是否只是文件移动？ | `archiveReadiness()` 包含前置检查与受限执行；OpenSpec 是规格/归档权威。 | 固定入口调用既有 OpenSpec 与 Flowkit 规则，先检查可执行性，保留 partial/失败事实；不能用请求中的布尔值冒充收敛或审查通过。 |

## 授权与失败边界

Agent 将 Owner 的明确指令转换为具体操作输入，例如 `change activate`、`delivery full-test`、`git checkpoint`。输入包含实际 target、sourceRef、Owner 决定及必要的限定材料。固定命令不得把“请求 JSON 存在”解释成 Owner 已授权；它必须按操作类型核对 `OwnerAuthorityFact`、Delivery/Change 身份、合法边界和已有证据。Agent 对真实会话来源负责，CLI 无法代替这项宿主判断。Proposal 应明确这一信任边界，不能暗示 CLI 重新读取聊天或提供了加密来源认证。

请求中的可见 target 与数据 target 必须一致；状态、依赖、Run/Result、材料及当前 Git 对象在写前按相关操作重验。读回必须区分未写入、已写但未确认、部分效果、明确失败与完成；重试不能覆盖真实 Run、proof、OpenSpec 产物或 Git 对象。一次命令只完成它指定的操作，返回后 STOP。Reviewer 仍独立给出 verdict，Verification 仍独立提供检查证据。

## 最小 Proposal 方向与限制

1. 为上述八类操作定义有限的命令、请求、结果和对应 Owner/Role/Policy 前置；复用既有领域函数与 A 的固定 Action 入口。
2. 通过真实 Agent/Owner 指令边界提供 sourceRef 和操作输入；按实际操作校验来源声明与目标的一致性，不建设 Codex 桌面监听器、Owner Registry 或泛化宿主插件。
3. 对缺失/冲突授权、错误目标、已存在文件、写前漂移、写后未确认及重复调用做有界负例；Git 仍校验 index、对象和远端 exact ref，Full Test/Final 仍消费自己的正式证据。
4. B 直接更新新命令的帮助与必要调用示例；C 再统一收敛自有 Skills/HOW。接受证据必须来自 B 当前实现，不能复用本次 Explore 探针作为实现 PASS。

本次未实现任何 B 固定命令，也未执行独立 Review、正式 Full Test、Final 或 Git checkpoint。`source-boundary.json` 只证明被观察源码的当前结构，Agent 对真实 Owner 输入的判断仍是宿主责任。

**PASS（可进入独立 `review-explore`）**：当前 CLI 缺口已由真实探针证实，既有操作所有权与最小信任边界足以支撑有界 Proposal；无需新增聊天监听、自动 Review 或另一套生命周期状态。
