## Why

Flowkit 应帮助 Agent 从项目事实判断当前流程并续接工作，而不是通过存活 CLI 进程托管 Agent 执行。当前计划将上下文读取、结果记录与宿主通信绑定，又把真实执行日志绑定到逐 Change 的文本检查例外，超出了本机流程管理的实际需要。

## What Changes

- **BREAKING**：status / next 不再要求用户填写 currentRunId / changeStartSequence；从指定 target 的 OpenSpec、coordination 与唯一有效 Run 链解析当前上下文，明确区分空闲、歧义、未完成和历史 bootstrap。
- CLI 保持 status / next / doctor 三个只读命令。撤出本 Change 未发布的 action 命令、JSONL、存活进程 reservation 与专属回交机制，不以 prepare/submit、adapter 或会话服务替代。
- Agent 依既有 Action/Role/Guidance 与 canonical Run 约定完成实际工作，记录真实开始、完成或未完成。保留 exact package/result 校验、prepared/terminal、独立 Reviewer 和一次 Action 后 STOP；CLI 不执行工作、不创建成功结果。
- 明确顺序单 writer 的同一次执行可先记录 action.md，再一次写入尚缺的 context/result；完整记录不覆盖，部分保存失败保留现场。记录的有效性不依赖 CLI 进程身份，不承诺自动恢复。
- 必要 proof 留在 target .flowkit/artifacts，.tmp 仅可丢弃。Agent 及相关消费者核对实际必要引用、归属与完整性；HOW 携带相关 Owner 决定，不默认依赖所有原始 proof。
- 保留四条通用 raw-stream attributes 修复，不逐 Change 加例外，不与 .gitignore、Git 跟踪或 Full Test 选取耦合。
- 用有界记录/跨进程读取、错误事实与无自动执行的行为测试验收；撤销必须第二套安装、两个真人 Change 和人为制造 finding 的验收义务。

## Capabilities

### New Capabilities

无；不新增管理子系统。

### Modified Capabilities

- foundation-cli-surface：自动解析所选项目上下文与只读 next，支持符合既有合同的 Agent-produced canonical Runs。
- single-action-execution-terminal-boundary：明确 Agent 执行/记录与既有内核 invocation 的关系，不将 CLI transport 作为必需条件。
- run-result-persistence：真实开始和完成的三文件记录顺序、create-once 与部分写入可见性，不绑定存活进程。
- action-guidance-execution：Agent 使用 canonical Runs 的 HOW、必要材料与有限交接、原始流边界。

## Impact

范围限于 CLI/context 的直接实现与测试、本 Change 新增协议代码的撤出、既有持久化直接接点、产品与独立 bootstrap 的相关 HOW、README/AGENTS 和原始流规则。不改变 closed Run/Result/ActionPackage 字段、Policy 转换算法、既有内核公共调用语义，不增加依赖或 Runtime/Policy/Run schema。

依据为 021-revise-explore 经 022-review-explore approved 的当前边界，以及 Owner 的 CLI/Agent 职责纠正和原始流修复决定。019 Apply 仍中断，历史实现/实验不是修订后验收 PASS；不重写历史 Runs、Review 或 archive。

manifest 中本 Change 的“宿主接入”表示 Agent 实际工作和合法记录，不再表示 CLI 托管协议；直接说明性文字的同步列入 Apply，不改变 id、state、ordinal、依赖或 Owner 事实。本轮仅修订七个已有计划文件与记录真实 Run。

D05 继续 independent-bootstrap。Full Test、Delivery 起止、Git 执行、Archify、历史迁移、Registry、恢复服务及整套内核退役不在范围内。650 行源码/测试 gate 保持，超限按职责拆分。完成计划后交独立 review-propose 并 STOP。
