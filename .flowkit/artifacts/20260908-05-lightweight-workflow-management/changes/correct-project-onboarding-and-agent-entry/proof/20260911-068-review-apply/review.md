# Review Apply：新项目接入与 Agent 薄入口

结论：**approved**，无阻断 finding。审查 `20260911-067-apply`；本次 `20260911-068-review-apply`，Change `correct-project-onboarding-and-agent-entry`，projectOrdinal 39。

## 当前步骤与范围

按独立 `.agents/skills/review-apply/SKILL.md` 核对已批准 Proposal/design/spec/tasks、实际变更及真实验收。不读取或调用 candidate review-apply HOW 管理 D05，不修改 Author 内容。066 approved 只提供计划边界，本次批准来自当前独立审查。

当前交付与计划一致：README、随包 docs/onboarding.md 内嵌短 AGENTS 区块、package.json 精确新增一个文档发行条目、一份有界文档测试、三份精确根规划退役，以及 D05 bootstrap 的单条历史出处提示。任务除十二个勾选状态外保持批准时的字节；其他计划未改。

## 决定性核对

- 开始和结束均核对 067 的 41 个直接引用。移除新增 planningHistoryNote 后，D05 manifest 与 Apply 前 bytes/hash 一致；pnpm-lock、src、系统/开发 Skills、canonical specs 和既有 archive 未发生本次变更。三份删除目标的 Git commit:path 内容重新读取并核对长度/hash，均可恢复；未把历史引用改成新的活动规划来源。
- 最终实际 tgz 的摘要与 067 记录相同。直接读取包内 README、onboarding、bin 和 lock，与当前工作树及实际安装匹配；关键安装元数据与源码一致，包中没有目标历史、bootstrap Skills 或开发源码/测试。早期 installation-audit 对应安装前一版本，只按过程材料读取；当前验收消费 finalPackage，不把旧引用误当当前版本。
- durable example-evidence 中保存的示例业务文件、项目入口、规划、真实三文件及必要 proof 的内容/长度/hash 均核对，且与仍存在的 target 一致。业务文件和原 AGENTS 前缀保留，短区块与当前模板一致且没有重复。该副本明确仅为验收证据，不成为第二活动项目 truth；.tmp 不是这些必要内容的唯一保存处。
- 真实库存 Explore 包含实际源码/数据、五组函数调用结果及命令记录，三文件保留 prepared 开始与 terminal 结果，Reviewer/Verification 槽没有被伪造。首次序号与有界 Explore 有 Owner sourceRef；没有自动执行示例下一 Review。
- Reviewer 独立重跑接入/上下文/安装定位回归：13/13 通过；本 Change exact OpenSpec 1.10.0 严格校验通过。使用最终安装重新 status/next/doctor：实际 Run 仍为 20260911-001-explore terminal，next 为 review-explore，doctor pass。独立查询与 067 输出一致，不把本轮 CLI 进程当作新 Agent 会话。
- 核对 067 引用的十四项真实命令及原始流。Linux 实际包离线安装/相关回归为 Author 已执行证据，本轮未重跑 Linux；Windows 报告限实际执行的接入/查询及既有 compatibility 范围，不泛化为所有 native Windows 行为。

## 真实新会话证据

task 4.3 的依据是 Owner 转交的实际新会话结果及明确来源，不是本轮重新跑 CLI。回传的 project/Delivery/Change/ordinal/Run/下一边界、安装 Skill 位置与当前示例相符；输入只含 target 和项目入口，未预给答案。批准的设计允许留下实际会话输出及来源，不要求新增身份认证平台或原始工具日志。

未提供新会话原始工具日志/执行时间的限制已如实保留，不补造；也不因该 Owner 决定没有在 Reviewer 当前聊天中复述就认定未授权。本项只支持本次接入读取，不产生独立 Review verdict 或后续 Action/Git 权限。

## 最小性与范围漂移

复杂度保持最小：项目只保存薄入口和自己的流程事实，manager 自有系统资产；不增加内核、CLI 写命令、路由器、Registry、状态副本、依赖或永久 glue。新测试固定的是获准的文档/模板形态，未把 D05 当前序号或生命周期状态固化成通用不变量。

scope drift: NONE。示例初始化与真实新会话是批准验收的落实，有相应 Owner 交接；不重开前六个 Change。旧规划退役范围精确，没有放宽其他项目当前 Start 的 planning input 可读性要求。

## 交接与 STOP

下一 continuation 为 `archive`，来自既有 Policy 的 review-apply + approved 映射；不在本轮执行 archive 或 Git。D05 的 Formal Full Test / Final 仍为 pending，本次 Review 不宣称 Delivery Verification PASS。

5515 项 Git tracked/nonignored 文件在排除本次 Reviewer Run/proof 后，前后字节摘要及 HEAD 相同；该快照不包含 ignored scratch，示例另按必要 retained files 核对。Reviewer 未删除任何用户文件，也未修改 Author/历史材料。

详细当前证据核对见 `audit/stdout.txt`；真实命令与原始流见 `audit/`、`focused/`、`validate/`、`example-status/`、`example-next/`、`example-doctor/`。三文件 Result 保存并读回后 STOP。
