# 016 review-explore 独立证据

对象：`connect-openspec-action-workflow / 015-explore`。本次只判断事实、proof 的证明范围、最小边界和 Proposal readiness；不证明新增能力已实现。

## 实际检查

- `audit.mjs attempt-01` 核对 93 个当前输入/证据引用，015 的三文件与 handoff、014 archive 及其 accepted Review 关联、当前 activation/依赖/ordinal、原始命令日志及 source hashes。
- 独立 Git fixture 比较本仓库当前 attributes 与通用 raw-stream 规则：proof/Full Test 两种目录各四种声明命名；baseline 的 8 条流均被 CRLF 规范化，通用规则的 8 条流均逐字节保留。
- 同一 fixture 的源码、结构化 Run JSON、人工摘要 JSON 三种负向控制仍触发 whitespace failure；没有对整个 `.flowkit` 关闭检查。实际命令、退出码、stdout/stderr 和 bytes hashes 保存在 `attempt-01`。
- `host-probe.mjs` 经当前 Reviewer 的交互 Agent/终端启动，输出一项只读请求；Reviewer 实际读取 OpenSpec scaffold 和 hash，再向同一个存活进程 stdin 回交。进程校验一次响应后退出 0，未调用下一 Action。request/response/summary 独立保存。
- Author 的 7 项拓扑反例、必要 bytes 保存/缺失/覆盖/篡改反例及 30 项既有测试输出与方法一致。它们不等于产品 resolver、证据接纳或宿主接入验收；本次未重跑该 30 项测试。

## 语义审查与后续边界

CLI 当前确实要求 explicit currentRunId；history 的排序只用于 reporting。探索已明确要修改相应 CLI 合同，不把排序当 current authority，不伪装 bootstrap 历史为 canonical Run。

现有 `invokeSingleAction` 不做 durable write；`writeDurableRun` 接收完整 record，创建失败会移除它本次创建的 partial directory。因此 Proposal 必须固定准备、执行、必要证据保存、接纳/读回与成功报告的顺序，以及 EOF/中断/拒绝/部分写入的可见失败。直接串联“callback terminal → write”不能被视为失败边界已经解决。此要求来自 Explore 已列的失败边界，不新增 recovery service、WAL、锁或生命周期状态。

真实两 Change、独立 Review、一次 revise、新会话无需 Run 序号及失败路径验收仍属于 Apply；本次 transport 仅确认既有宿主接缝可行，不能代替它们。通用日志规则仅覆盖声明 raw-stream 命名，不把任意报告/脚本/JSON 都当原始流。

结论由 Reviewer 的语义审查给出，不由 hash 或脚本 PASS 自动生成。宿主/上下文与证据处理在当前授权内；Full Test 范围/执行、Start/Final 简化和 Git 调用不提前实现。未修改 Author、生产、Skills、历史 Run、真实仓库 attributes 或 index；没有运行 Proposal/Apply/Archive/Full Test。
