# 流程 CLI 与 Agent 执行解耦：有界 Explore

## 当前目标与授权

Owner 已明确：CLI 负责当前流程，例如 next 告知下一步；Agent 知道 Flowkit Runs 的使用约定，执行实际工作并记录结果。本轮授权为“owner 授权 继续 revise explore”。因此不是在长连接与分次提交之间选择，而是撤销“CLI 必须托管 Action 执行”的前提。

本轮属于 connect-openspec-action-workflow，D05 independent-bootstrap，projectOrdinal 35，Run 20260908-021-revise-explore。021 接续 020；020 的 UNKNOWN 保持不变，由本轮新结论解决其待决问题。019-apply 仍只有 action.md/context.json，未完成，不补写成功结果。018 的旧 Proposal approval 不代表新边界已经获独立审查。

仅修订本 Explore、必要 proof 与本次三文件 Run。不修改 Proposal/design/tasks/delta specs、manifest、代码、测试、Skills 或 Git；不启动 candidate 管理 D05，不恢复外部 manager，不继续隔离真人演练。

## 职责边界

| 对象 | 应承担 | 不承担 |
| --- | --- | --- |
| CLI status / next / doctor | 读取指定项目的 OpenSpec、coordination、Runs；报告状态、既有 Policy 的合法下一步或具体诊断 | 执行 OpenSpec Action、等待 Agent 回交、调度 Reviewer、写执行成功、自动推进 |
| Agent | 根据明确的 Action/Role 与对应 HOW 工作；调用 OpenSpec 和项目工具；记录本次真实结果及相关材料；STOP | 通过聊天或自填 approved 创造授权；替 Author 自审 |
| Runs | 唯一的 Action 执行记录及前后关联；供下一会话读取 | 复制 OpenSpec 合同、永久保存全部原始 proof、要求 CLI 进程持续存活 |
| 既有 Runtime / Policy | 保留身份、Role、结果字段、读写校验及合法边计算职责；供有限复用 | 因为存在内核，就强制暴露一个宿主执行协议 |
| Skills | 说明如何执行、如何使用既有 Run 合同、如何交接必要 Owner 决定与结果 | 决定新的合法边、自动 Author/Reviewer 循环或增加审批节点 |

严格 OpenSpec Action 与轻量流程管理可以同时成立。next 报告合法边不等于执行授权；执行记录由真实执行产生，不要求执行本身发生在 CLI 子进程里。

## 本次 decisive proof

证据根：.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-021-revise-explore/。audit.mjs 保存直接源码的行号快照与哈希、OpenSpec 原始流、命令/时间/退出状态及受保护文件基线。attempt-01 为 sandbox spawn EPERM，未运行子命令；attempt-02 在获准后运行相同只读命令，四项 exit 0。失败尝试保留，不解释为产品缺陷。

1. src/cli/entrypoint.ts 只在 command=action 分支引入 executeActionCommand 与 jsonLineActionTransport；status/next/doctor 可走独立读路径。移除 Action transport 不要求重建这三个查询入口。
2. src/cli/foundation-cli.ts 的 nextCommand 读取上下文后调用 policyForRecord；不依赖 Action transport 回调。current-run-chain.ts 的 policyForRecord 直接把 Run context/result 映射给既有 Policy。读取与执行可分离，不需要新的流程转换表。
3. src/domain/run-result-persistence.ts 的 RunContextRecord/RunResultRecord 没有 PTY/session/transport 身份字段；writeDurableRun 与 readDurableRun 接受结构化记录、校验归属和三文件内容。schema 不要求由 CLI 执行进程生产记录。该判断不等于任意 JSON 都可信，也不等于现有 writer 能可靠处理所有中断。
4. 既有 writer 会在本次创建文件失败后清理所建目录，且只负责完整记录写入；它不负责记录工作开始、执行实际工作或验证审查真实性。因此不能把“直接调用旧 writer”宣称为已解决执行中断证据。Agent HOW 必须保留真实未完成事实，不承诺事务化或自动恢复；后续只修复新生产路径确实依赖的保存缺口。
5. current-run-chain.ts 对 canonical group 读取并验证 previousRunId 链；对 semantic bootstrap group 则检查标记并只返回 bootstrap-history。foundation-cli.ts 对后者返回 decision=null。由此确认“让 Agent 写任意 bootstrap JSON，现有 next 自然能继续”是错误的。
6. Git diff HEAD 对 single-action-execution、run-result-persistence、policy-and-next-boundary 三个既有内核文件为空。本轮应审计新增 CLI/协议及其直接消费者，不以纠偏为由删除此前完成的整个内核。
7. exact OpenSpec 为 1.10.0，list/status 的项目根为 D:/Projects/flowkit-next，当前 Change 仍 in-progress、25/27；tasks 6.2/6.5 尚未完成。旧计划包含 JSONL、live reservation、两个真实 Change 及 finding 验收，不是仅漏勾一个任务。
8. 本次 proof 执行前后 192 项源码、测试、Skills、配置、计划及已有 Runs 的哈希未变。020 已证明源码构建目录的系统资产自定位，本轮不重演安装实验；只将它作为相关决策依据，不作为当前实现验收。

本次是源码关系核查与只读观察，不是新接口实现 PASS、独立 Reviewer verdict 或 Full Test。

## Agent 记录与 CLI 读取的最小共同约定

- 面向后续产品使用，Agent 按既有 canonical 三文件字段与地址约定记录真实 Action；由 HOW 给出必要字段、Role 分工、previousRunId、结果来源、相关材料及读回方法。可以复用已有校验/持久化函数，但不要求目标项目编写 callback/glue、不再增加 prepare/submit CLI 协议。
- next 的输入是项目及必要时的 Delivery/Change 选择，不要求人手填 currentRunId；目录 sequence 只分配地址，不用于判定 current。current 来自有效关联链，不能跳过新失败/未完成去选旧 PASS。
- CLI 不因“谁写了文件”要求它来自自身存活进程。它核对结构、身份、Role、关联与现有 Policy；Agent 与独立 Reviewer 分别对实际工作和审查负责，机器结构校验不能证明语义真实性。
- Agent 执行中断、必要保存失败或只剩部分记录时，如实保留并报告未完成；不补成功、不自动继续、不回退旧成功。下一步需要事实核对时给出具体诊断，不建设预占服务、会话数据库或恢复状态。
- D05 当前 independent-bootstrap 与未来产品 canonical 使用分开。历史 bootstrap 继续明确展示，不自动转换或改写；当前 D05 继续由独立 bootstrap 记录实际工作。产品支持 Agent 产出的 canonical Runs，不以转换历史 bootstrap 为准入前置。
- 本轮新增 prepared failure 对 facts.invocationFailure 的协议专属强制形态应随 transport 去除而重新核定，不能把它当作所有既有 prepared 记录的通用合法性要求。保留既有 prepared/terminal 合同，不新增 resumed 或别的状态。

这解决了 020 的使用合同未知项：没有 CLI 回交链路需要再选择。确切 HOW 示例和必要读写路径测试属于后续 revise-propose / Apply，不是新的宿主接入探索。

## 对当前候选的处置方向

| 范围 | 后续计划方向 |
| --- | --- |
| manager 自定位、package/bin、FLOWKIT_HOME/tools | 保留前一 Change 成果；本机同一构建服务不同 target，测试临时目录只用于保护真实数据 |
| action-context / current-run-chain / status / next | 保留实际需求，去掉 transport 专属假设；复用既有 Policy 与校验，不另建 current 注册表 |
| action-command / action-protocol / action 请求及错误分支 | 从本轮产品方案撤出；不改名成另一套 prepare/submit 或 adapter |
| action-run-reservation 及专属 EOF/帧/closure 测试 | 随唯一执行消费者撤出；有独立价值的损坏/未完成读取测试迁到对应读取责任，不保留空壳依赖 |
| action-proof / action-target-files | 按实际生产消费者核定最小复用；删除仅服务回交协议的接缝，保留必要材料核对要求，不为可达性保留无调用的库 |
| single-action / package / persistence / Policy 既有公共内核 | 不整体删除、不扩张历史 scope；明确现有能力与新 Agent 生产路径的直接接点 |
| .gitattributes 通用原始流修复 | 保留；取消逐 Change 追加，原始 bytes 不格式化，不与 .gitignore / Full Test 绑定 |
| 产品 HOW、bootstrap HOW、README、AGENTS | 后续同步直接条款，说明 Agent 执行与 Runs 使用；两类 HOW 独立，不要求 PTY 中转 |
| 两个真人 Change、必须 finding、必须另一安装 | 撤销固定验收义务；已有实验保留为历史，不伪造缺失完成，不因投入已多而保留实现 |

## 最小验收边界与后续计划影响

后续按行为验收：从普通 target 调用同一构建的 status/next/doctor；给定符合既有约定的 Agent Run，下一独立进程不填 Run 编号即可读到正确状态与合法边；合法 review/revise、空历史、错误身份、分叉、损坏和未完成用明确标为合成的 fixture 回归。查询不写项目，不触发 Action/模型/Git。

实际项目仍要求独立 Reviewer；程序 fixture 中的 approved 仅测试字段/分支，不是独立审查。一个有界记录与读回示例足以验证 HOW 的可用性，不强制两个真实 Change、不为验收制造 finding。Windows/Linux 与 650 行 gate 按实际改动执行，不重复无关全流程，也不复用旧证据冒充新候选 PASS。

必要 proof 默认保存 target .flowkit/artifacts；.tmp 仅可丢弃。只交接相关引用及真实 Owner sourceRef，不长期依赖全部原始 proof；无清理授权，不删除历史材料。

revise-propose 必须同步当前 Proposal/design/tasks 和四个 delta 的直接受影响条款：foundation-cli-surface、single-action-execution-terminal-boundary、run-result-persistence、action-guidance-execution。移除新增宿主执行要求时，应撤销该 Change 对相应规范的不必要 delta，不反向重写历史 archive。D05 manifest 中“宿主接入/结果接纳”目标需在计划修订时与本边界澄清为 Agent 实际执行和合法记录，不能继续指向 JSONL；本轮不修改 manifest。

不包含 Full Test 配置、Delivery Final、Git 自动化、Archify、Registry、证据平台、全历史迁移或整套内核退役。

## 结论与 STOP

Author Explore 结论 PASS，Proposal-ready=true：本次仅表示真实使用边界、必要修订范围和验收边界已收敛；不是实现完成或 Reviewer approved。020 的 interaction-model UNKNOWN 已由明确的 Owner 方向及上述源码核查解决；没有需要继续演练旧宿主协议的阻断项。

下一边界为独立 review-explore。审查后再进行 revise-propose，不能直接按旧计划继续 Apply。本次不自动启动 Review、不改勾选、不执行后续 Action 或 Git，STOP。
