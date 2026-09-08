# 本机 CLI 与 Action 接入：修订后的有界 Explore

## 目标与授权

Owner 明确授权“当前 Change 回到 revise-explore，重新核定本轮实现与验收边界”。目标是稳定 Flowkit 源码构建本机 CLI，其他项目调用同一实现；不是为了流程完整而建立两套软件或持续人工演练。

本轮为 D05 independent-bootstrap、ordinal 35、020-revise-explore。最新完整审查为 018-review-propose approved；019-apply 被中断，只有 action.md/context.json，没有 result.json。019 不是完成/PASS，不补造结果；020 是 Owner 范围纠正，不是恢复该 invocation。当前未提交实现只是待决候选，留在工作区不等于批准保留。

本轮只改本 Explore、必要 proof 与新 Run；不改 Proposal/design/tasks/delta、manifest、生产代码、测试、Skills 或 Git。必要材料保留 target artifacts，.tmp 仅可丢弃；不清理历史材料或恢复外部管理。

## 源码与最小 proof

证据根：`.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-020-revise-explore/`。方法为 audit.mjs，结果及原始 Buffer 流在 attempt-01；prior-explore.md 仅保存本轮覆盖前未提交的 Explore bytes 供溯源，不作为当前结论。

1. package.json#bin 指向 dist/cli/entrypoint.js；loadManagerInstallation 从自身模块位置加载系统资产。该能力在本轮 Apply 前已存在，属于前一 archived Change，不是本轮新增“隔离软件”。
2. 从 proof 子目录作为 cwd 导入当前 dist/internal/manager-installation.js，实际返回 root=D:/Projects/flowkit-next、name=flowkit-next、version=0.1.0。没有复制软件、安装第二套依赖或执行 Action，证明源码构建目录可自定位；不证明 PATH shim 已部署或任意宿主都可执行。
3. entrypoint 的 status/next/doctor 读请求、输出、退出；只有新增 action 使用 stdin/stdout transport。action-command 调用既有 invokeSingleAction；action-protocol 是宿主传输选择，不是资源分根的原因。
4. 既有 invokeSingleAction 需要真实 execute/prepare callback，不调用模型、不自动完成 OpenSpec 工作，也不自己写完整 Run。CLI 所在本机不意味着软件自动拥有 Author/Reviewer 的执行能力。
5. 新 action-run-reservation 由存活 closure 持有占用权，finish 只创建缺失文件。当前 delta 明确禁止另一 invocation 接管。因此短命令取上下文、稍后另一次提交结果不是简单删 JSONL，需重新界定跨命令 package/占用/接纳，不能偷引入 resume/恢复平台。
6. single-action delta 中 Actual host acceptance includes independent review and cross-session continuation 明确强制两个真实 Change 链，tasks 6.2 另要求 finding。这是过重验收的合同来源，不是源码分根必需，也不是只差勾选 6.5。

本次四个只读命令均 exit 0：exact OpenSpec 1.10.0 version/list/status 与不同 cwd 的系统根加载。OpenSpec 返回当前 Change in-progress、25/27。summary 记录 17 项直接源码/配置/计划的 bytes/hash，命令前后未变。以上不是实现验收、独立 Review 或 Full Test。

## 按职责核定，不按已投入工作量保留

| 对象 | 处理方向 | 依据与边界 |
| --- | --- | --- |
| manager 自定位、package/bin、FLOWKIT_HOME/tools | 保留既有职责 | 本机 CLI 需要系统资产定位；target 不复制开发目录。不是另装一套、跨进程或 SHA 准入要求 |
| action-context/current-run-chain、status/next 无 Run 编号输入 | 保留需求，后续核对最小实现 | 用户按项目使用，current 必须来自有效 Run；不能 max 选成功或把损坏当 idle，不新增 current 注册表 |
| 既有 Policy、package/admission、Role、三文件 Run | 保留既有事实归属 | 服务于严格 OpenSpec Action，不是隔离测试脚手架。独立 Reviewer 是实际项目角色，不是每次软件构建都要启动真人审查的依赖 |
| action-command/action-protocol 同进程 JSONL | 不默认保留为唯一入口，使用合同待决 | 一种接入方式，本机 CLI 不强制也不排斥它；不能以已实现/PASS 作为选择依据 |
| live reservation、prepared failure、EOF/错帧分支 | 随接入方式重新核定 | 已执行不能假消失、完成必须可靠记录仍必要；closure、帧和阶段细节属于当前长连接实现，换短命令后须调整而非只删检查 |
| proof/path/hash/相关 handoff | 保留必要材料与有限核对，接口细节可简化 | Owner 已要求目标项目内保留与相关消费校验；不是隔离导致。只核对实际必要引用，不把全部 proof 当永久前置；重复身份和固定 facts 键在接口确定后再核定 |
| 四条通用 raw-stream attributes | 保留修复方向 | 直接修复逐 Change 追加问题；不关联 .gitignore、Full Test 或整目录豁免 |
| 产品与 bootstrap HOW | 简化相关条款，仍保持独立 | 保留真实结果/相关 Owner 决定/STOP；不要求跨 Agent 共享 PTY，不新增 Reviewer 调度/中转器，两套 HOW 不互相委托 |
| 必须另行打包、两个真人 Change、必须出现 finding | 后续从必需验收合同移除固定要求 | 验收基于行为及风险，不基于演练数量或强制出现缺陷。本轮不直接勾掉 tasks 或改规范 |
| 已有测试和隔离历史材料 | 按证明力保留，不要求重演 | 不是实现保留理由或新合同 PASS；019 第二 Change 未完成，不补 approved、不制造 finding，本轮不删除材料 |

## 收敛后的验收方向（不是新 Proposal）

- 从另一个普通工作目录调用本机同一构建入口：系统资产取自 Flowkit，项目事实与写入归 target。测试可使用临时目录保护真实项目，但它不是生产隔离系统。
- 对选定入口验证一次真实工作回交与 durable 读回，明确实际支持的宿主边界，不泛化为任意 Agent 支持。
- Role/非法 next、错误目标、缺失材料、写失败和无自动下一步用确定性测试；合成 reviewer 值只证明程序分支，不冒充真人独立审查。
- 实际项目的正式独立 Review 保留，与程序回归分开；不为凑验收而制造 finding，不规定必须两个 Change。
- 保留与改动风险相关的 Windows/Linux、类型、依赖、可达性和 650 行 gate；证据按候选适用性使用。不会把旧 PASS 冒充新验收，也不重复跑无关完整流程。

## 唯一待决的使用合同

“本机 CLI”确定了交付和资源归属，没有确定 Action 命令是否长时间存活。需 Owner 决定：

- **普通短命令**：调用返回上下文，Agent/人工作完成后另一次显式调用提交结果。不依赖保留 PTY，更接近日常命令使用；但需要有界证明跨命令 package/占用/接纳，可能调整现有 invocation 合同。不能默认引入服务、session Registry、恢复状态或伪造旧结果。
- **单次长连接**：每个实际角色宿主在自己的会话内完成 preparation/execution/result 后退出。可复用目前接缝，但必须明确这是支持模式，不依赖跨 Agent 共享 session，不要求双 Change 真人演练。

Explore 倾向普通短命令作为本机用户入口，但尚未获准并证明其完整 Action 保存闭环。本轮不把 Owner 的源码目标擅自解释成已授权改变 invocation/schema，也不以旧批准强迫保留长连接。

## 结论与 STOP

结论 UNKNOWN，Proposal-ready=false：已核定资源分根无需第二套软件，整套保留/整套删除均无依据；剩余唯一影响合同的决定是短命令还是长连接。取得选择后才补对应最小 proof，交独立 review-explore，再进行 revise-propose。不能现在按旧计划继续 Apply。

将来 revise-propose 须同步受影响 Proposal/design/tasks 与 CLI/single-action/persistence/Guidance delta，不能只删 6.2 却保留相反规范。不另开 Change，不重做已收敛 D05 Explore，不修改历史 Review/Run，不自动下一 Action、Archive 或 Git。
