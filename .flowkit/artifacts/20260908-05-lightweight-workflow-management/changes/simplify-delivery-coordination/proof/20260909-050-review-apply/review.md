# 050 review-apply — simplify-delivery-coordination

结论：changes-requested。审查对象为 049 Apply，批准合同为 047 revise-propose / 048 approved review；不是重审或废弃 048。发现一项实现缺口 R050-01，未发现需要重新设计 Proposal 的合同阻断。

## R050-01（P2）确认前复验遗漏 active OpenSpec set

位置：src/domain/delivery-final-execution.ts:372（revalidateRelated），对照同文件 :200 的准备检查；调用点为 src/internal/delivery-final-coordination.ts:474、:500。

已批准 finalization delta 的“Delivery Final consumes complete exact prerequisite outcomes”要求 active set empty；“Trusted host owns one exact Delivery coordination closure”与 design Decisions 3 要求完成相关复验才发布确认。当前准备及 execute 后重建 package 会检查 active set，但第一笔内容写入后及确认临时文件 flush 后的 revalidateRelated 只重查项目、选定完成来源、Guidance、Full Test，没有重读 active OpenSpec 状态。

独立有界复现见 active-set-probe-01/observations.json、command.json 和原始 stdout/stderr：

| 时机 | 实际 active set | 本次 Final | 只读 reader |
| --- | --- | --- | --- |
| 正常对照 | 空 | terminal | completed |
| 调用前新增 Change | late-change | failed，零次替换 | not-completed |
| 第一笔内容替换后新增 Change | late-change | terminal，两次替换 | completed |
| 第二笔确认 staging 时新增 Change | late-change | terminal，两次替换 | completed |

故障点新增真实 fixture Change 目录；测试宿主的 OpenSpec 进程按实际目录报告 active set，事后通过产品 observation 独立读得非空。Full Test 沿用仓库现有 fixture 的 source.txt 范围，没有通过改配置规避失败。后两种情况下，本应阻止确认的活动工作已经出现在既有复验节点之前，仍获得可跨会话消费的成功标记。

最小修正：在现有确认前相关事实复验中复用同一 target/runtime 的只读 active OpenSpec observation，非空或无法确认则不发布 confirmationRef；若第一笔已写，保留未确认内容和真实失败诊断。补上述两个时机、正常及调用前拒绝的定向回归，检查 reader/Integration 不把未确认内容当成功。

这是补齐现有必要前置，不要求所有并发 writer 的强事务保证、连续监控、确认提交后的业务重验、历史重放或新增平台；不用回到 Proposal 或拆新 Change。

## 已核对的实现与收敛

- Start 已删除 acceptedBaseCommit、全仓 clean、validation receipt 与内嵌 commit；只在固定目标做 create-once/精确复用、规划/项目/来源/实际 bytes 保护。unborn、dirty 与目标漂移回归通过。
- required 完成来源收敛为可信 host 选定的 archive/直接 approved review 三文件，保留身份、Role、链接及来源绑定的 bytes 校验，不扫描祖先 proof。合成 accepted source 明确是 fixture，不声明真实独立 Review。
- R046-01 的两阶段持久区分已经实现：内容阶段 confirmationRef=null，第二笔原子发布才确认；确认前故障与确认后响应丢失在全新进程可区分。该核心修正不撤回，但“全部必要复验已满足”的实现完整性仍须闭合 R050-01。
- Integration 已移除 Final 全包、requiredEvidence 与 finalizedCandidateRef，直接读确认结果；独立 Owner Git 授权、来源、实际对象、create/reuse 与接受关系检查保留。
- full-test-current 仅删除旧类型依赖，未改当前 attempt、输入及材料验证语义。HOW/AGENTS 修改可追溯到 tasks；两个旧 fixture 删除对应直接消费者收敛，不是删除历史证据。

## 当前检查与证据边界

本轮重核 126 个交接/材料引用与 168 个 Linux 当前输入文件；批准规划除 19 项任务勾选外 bytes 不变，049 引用和 manifest 交接一致。049 当前两平台整组命令与来源材料已核对，但其 PASS 不替代本轮 verdict。

独立 attempt-02：OpenSpec 1.10.0 确认、domain 303/303、typecheck、OpenSpec strict 全部 exit 0。四场景故障探针 exit 0 的含义是“稳定复现上述观察”，不是缺陷通过验收。当前常规回归没有覆盖 R050-01。

attempt-01 在沙箱内完成 input-audit 后，spawn 同步抛 EPERM，驱动未生成该次命令原始流或 summary；工具返回 exit 1。没有补造原始输出或 PASS，保留已有 audit。获准在沙箱外原样重跑到新 attempt-02，其真实 streams/metadata 已保存。

本轮未独立重跑全部 Linux/installation/工程命令，未声称 D05 Formal Full Test。探针仅调用隔离普通 target 的候选 API，使用显式合成 host/tool/Owner fixture；必要观察、manifest 样本与原始流保存在本 Reviewer artifacts。临时 fixture 未删除，不依赖其永久存在来交接 finding。

## 必要评估与交接

当前步骤：独立 review-apply，核对批准合同、049 exact 实现及证据，并复现决定性缺口。

复杂度/最小性：实现总体删除重复外围事实；同一 manifest 的局部确认不是第二结果库。修正 R050-01 可复用现有有限复验节点，不需要新抽象。

new-content / scope drift：NONE。未发现借此次更改扩展 Git 节点、Registry、自动恢复或工作流。后续 invoke-git-at-workflow-boundaries 仍 planned，本轮不执行。

下一交接为当前 Change 的 revise-apply，修正后重新独立 review-apply。049 Author PASS、常规检查 PASS、050 changes-requested 分别保留；不得 archive、自动下一步或据此获得 Git 权限。

Owner 决定来源沿用 049 context.json#ownerDecisionsRelevant：D05 independent-bootstrap；必要材料默认留 target artifacts，.tmp 可丢弃，历史不改写。Reviewer 仅新增本轮 Run/proof；未改 Author 源码、测试、计划、Skills、manifest、历史记录或仓库 Git。
