# Revise Propose 02 — repair-archive-lifecycle

- 日期：2026-10-04（Asia/Shanghai）
- Role：Author
- 状态：RP-03 的规划修订已完成，等待独立 review-propose。
- 基线：main / 9b96b150eec8b59c40d1a72eb61054695a6e763b
- 执行边界：原生 OpenSpec，不创建 Flowkit Run / Delivery，不实施代码或执行 Git checkpoint/push。

## 修订依据与处理

依据 [review-propose-02.md](review-propose-02.md) 的 RP-03 / P2 与 Owner 本轮 `revise-propose` 请求。该 Reviewer 报告 SHA-256 为 `d85f3dfa8d7611cd666d6adacf280bb1a60e391f1b56c4510fa499aea0e17a28`，原文及 changes-requested 保持不变。原 `review-propose.md` 与 `revise-propose.md` 也保持原 bytes；前轮 RP-01、RP-02 的独立复核结论见该报告，不由本 Author 另行批准。

| 合同问题 | 本轮收敛 | 对应规划 |
| --- | --- | --- |
| clean/EOL 结果不一定是普通 add 的最终 index | design 表格改为转换被执行时的内容；显式 text 不再无条件承诺最终 LF | proposal；design 第 6 节；stable-action-command-execution delta |
| raw 未变但 stat 命中与仅 stat 改变可导致不同输出 | 原 index blob bytes 等于 raw、clean/EOL 内容不同的分支在成功候选前明确 unsupported；仅 touch 对照同样拒绝，不持久绑定 stat | design 第 6–7 节；candidateGit、Action admission、checkpoint、Archive target 与 Author/Reviewer HOW deltas；tasks 4.1、4.3、5.1、5.2、6.1 |

该拒绝给出具体路径和普通 add 跳过/转换两种可能，不将旧 CRLF 冒充通用 identity，也不保存猜测的 LF。不用 touch、refresh、renormalize、临时 add、改配置或 stage 后重绑规避问题；不新增 stat 字段、数据库、Git 模拟器或 capability。

absent、原 index 已等于预期内容、已核实预期输出，以及真实内容修改且可证明普通入库行为的原有支持分支继续按合同核对。其他不能证明普通 add 结果的 cache/索引状态仍前置拒绝，不能单靠 raw 修改或 stat 改变声称转换必然发生。归档目标独立应用同一边界；拒绝 projection 时按实际已发生效果保存真实 outcome，不伪造 Archive PASS。

## 本轮真实验证

在系统临时目录运行独立 Git 语义实验，所有 Git 写入仅发生于新 fixture，无 commit。材料保存在：

```text
.flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/revise-propose/20261004-rp03/
```

可复现脚本为 `git-semantic-check.cjs`；`commands.json` 绑定 argv/cwd/起止时间/实际退出状态及 raw stdout/stderr 的 byte offset，原始流为 `stdout.txt`、`stderr.txt`；读回结果为 `git-semantics.json`。

| 检查项 | 实测结果 |
| --- | --- |
| Git | git version 2.49.0.windows.1 |
| fixture | C:/Users/xuser/AppData/Local/Temp/flowkit-rp03-author-9whRkV |
| 原 index / raw OID | 02a8f61309286f7b5719a41b2a7039a9309daea3 |
| clean LF OID | 1275430f1765c63e539cb0452565563bd6aef6a6 |
| stat cache 命中、普通 add 后 | 原 CRLF OID，i/crlf w/crlf |
| 仅改变时间戳、普通 add 后 | clean LF OID，i/lf w/crlf |
| 两次工作文件 raw | 73616d650d0a，未变 |

两次 add 均 exit 0。本轮规划保守排除这两种调用前状态；脚本没有执行尚未实现的 candidate guard，因此不是产品接纳或端到端验收 PASS。官方机制说明见 design 中的 [git-add --renormalize](https://git-scm.com/docs/git-add#Documentation/git-add.txt---renormalize)，本方案不调用该特殊操作。

受控 OpenSpec 1.10.0 实际执行 `validate repair-archive-lifecycle --type change --strict --json --no-interactive`：passed 1 / failed 0、valid=true、issues=[]。命令及原始流保存在 `openspec-command.json`、`openspec.stdout.txt`、`openspec.stderr.txt`。

`planning-validation.json` 确认本轮仅修改 9 份既有 planning 文件；10 个 Modified Capabilities 与 10 个 delta 目录一致，20 条 MODIFIED Requirement 保留全部 79 个原 canonical 场景标题；规划 UTF-8/LF、无尾部空白、单 EOF 换行；26 项实施任务全部未勾选。场景标题和结构检查不替代独立语义审查。

实验前后业务仓库 HEAD、index、Git config、两份 Reviewer 报告与前轮 Author 交接 SHA 均一致。没有修改 src、tests、canonical specs、旧 Run、安装或消费项目；没有运行修复实现测试、真实 Archive、Delivery Full Test/Final。

## 交接

交独立 `review-propose` 核对 RP-03 的保守支持边界、跨消费者一致性与两种 stat 对照的任务验收。Reviewer 是否接受该修订由独立审查决定。本轮停止，不进入 Apply。
