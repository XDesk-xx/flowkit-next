# Revise Propose — repair-archive-lifecycle

日期：2026-10-04。Role：author。状态：规划修订完成，待独立 review-propose；不是 Reviewer 批准或修复实现验收。

项目：`D:\Projects\flowkit-next`。分支：`main`。基线 HEAD：`9b96b150eec8b59c40d1a72eb61054695a6e763b`。本 Change 仍由原生 OpenSpec 管理，不创建 Flowkit Run / Delivery。

## 1. 本轮输入与处理

依据为当前 [review-propose.md](review-propose.md) 中的 `changes-requested`：RP-01 / P1 与 RP-02 / P2。Reviewer 原文 SHA-256 为 `f2fed40e0da81a3d123fbe55df0ffbf6b19b5da90c6a65188dbcb2b90b80c42e`，本轮未修改原文或其 verdict。

| Finding | Author 修订 | 定位与后续验证 |
| --- | --- | --- |
| RP-01 | 将 delivery-finalization 纳入 Modified Capabilities，补齐两条 MODIFIED Requirements；成功 Archive 通过连续安全失败 parent 链关联真实 approved Review/Author，不要求成功 Run 直接父项为 Review | proposal.md:29；design.md 第 5 节；specs/delivery-finalization/spec.md；tasks.md 5.4、7.1 |
| RP-02 | Git 投影显式消费相关 stage-0 indexBasis，区分自动文本的既有 CRLF 保留与真正 CRLF→LF；无 -w 的 hash-object --path 只作适用分支的辅助核对，不作普通 staging 的充分预测 | design.md 第 6–7 节；candidateGit、Action admission、checkpoint 与相关 HOW delta；tasks.md 1.2、4.1、4.3、5.1、5.2、7.1 |

上述是 Author 对规划的处理说明，两个 finding 是否已满足仍由独立 Reviewer 判断。

## 2. RP-01 的收敛边界

链 `R15 review-apply approved -> R16 archive failed -> R17 archive PASS` 保持 `R17.previousRunId=R16`。完成消费者返回 `archiveRunId=R17`、`reviewApplyRunId=R15`，不删改失败记录，也不把 R16 当作 Review。

`src/cli/support-delivery-final.ts` 的完成选择器和 `src/internal/delivery-required-evidence-source.ts` 的接纳器共同复用共享来源解析，`src/domain/delivery-final-execution.ts` 的准备/相关复验消费同一规则。零次、一次、多次安全失败、partial/未知/错链/fork/错目标/过期 PASS 与中间材料损坏均纳入待实施回归。

`changeCompletions` 保持原五字段、manifest required 顺序和真实来源完整性，不持久复制一份完成链，不重放无关祖先 admission。Delivery active、required completed、空 OpenSpec active set、当前 Full Test PASS、独立 Final Owner authority 和确认发布规则不变。本轮及该消费者回归均不授权执行业务项目的真实 Full Test/Final。

## 3. RP-02 的收敛边界

candidateGit 的 indexBasis 只记录候选路径的 absent 或普通 stage-0 entry（mode、blob OID、EOL 分类），不记录整份 index。普通 staging 预期由 raw、有效 Git 规则和该依据共同决定；未知或不支持状态在成功候选前明确拒绝。

自动模式下已有非 binary CRLF/mixed 索引保存当前 raw 的 identity；显式 text 不套用该保留分支。预测只计算，不写真实或临时 index/object/worktree，不运行 add 试算或任意 filter。stage 前核对绑定输入或已确认预期输出，stage 后核对输出 blob，而不是要求旧输入 OID 不变。预期不随实际错误输出被改写。

归档 destination 使用自己的索引前态：source 为 i/crlf、destination 为 absent，即使属性相同也不能继承 source 的保留分支。Run/proof/原始日志和 byte-sensitive 内容仍逐字节保存；真实 Git 安全转换拒绝仍是失败，不改配置强行通过。

## 4. 本轮实际验证与限制

### 4.1 原生 Windows Git 语义对照

执行环境：`git version 2.49.0.windows.1`。在系统临时目录创建独立 Git fixtures，分别准备索引前态、有效属性/设置和修改后的工作文件，再读取 raw/no-w path hash，并真实执行 fixture 的普通 add 作为对照；不调用尚未实现的产品投影逻辑。临时目录已清理，业务仓库 index 未变，实验没有 commit 或 Flowkit Run。

| 用例 | 预期转换 | 与实际 fixture index 比较 |
| --- | --- | --- |
| text=auto，原 i/crlf，修改后仍 CRLF | identity | 一致 |
| text=auto eol=lf，原 i/crlf，修改后仍 CRLF | identity | 一致 |
| 未指定文本属性，继承 autocrlf=true，原 i/crlf | identity | 一致 |
| 未指定文本属性，继承 autocrlf=input，原 i/crlf | identity | 一致 |
| text=auto，原 i/lf，修改后 CRLF | crlf-to-lf | 一致 |
| text=auto，原 absent，新 CRLF 文件 | crlf-to-lf | 一致 |
| 显式 text eol=crlf，原 i/crlf | crlf-to-lf | 一致 |
| text=auto，原 i/mixed 且包含 CRLF | identity | 一致 |
| text=auto，原 i/crlf，修改后 raw 已为 LF | identity | 一致 |
| -text，原 i/crlf，autocrlf=true | identity | 一致 |

10 个对照均匹配，真实 add 均未改写对应工作文件。首个用例的 raw/实际 index OID 为 `d2eb92c3f437753a118e0fb686bbc3d3bba96b63`，无 -w 的 path hash 为 `3e757656cf36eca53338e520d134963a44f793f8`，再次证实不能用后者覆盖索引敏感分支。

这些是 Git 设计语义验证，不是修复后候选生成、Review、Archive、checkpoint 或 Final 消费者的端到端验收。本轮未执行 Linux 产品验收；任务中的完整支持矩阵及产品回归仍待 Apply。

最小原生复现可沿用独立 Reviewer 文档附录 C；自动保留分支还与 Git 官方 text 属性合同和 v2.49.0 convert.c 一致，参考链接保留在 design.md 第 6 节。

### 4.2 OpenSpec 与规划完整性

使用受控 OpenSpec 1.10.0 执行：

```text
node C:\Users\xuser\.flowkit\tools\openspec\1.10.0\bin\openspec.js validate repair-archive-lifecycle --type change --strict --json --no-interactive
```

实际结果：1 个 Change，passed 1 / failed 0，`valid: true`、`issues: []`。原生 status 返回 proposal/specs/design/tasks 均 done，`isPlanningComplete: true`；这仅表示规划就绪，不表示任务已实施。

规划检查确认：10 个 Modified Capabilities 与 10 个 delta 目录一致；20 条 MODIFIED Requirement 的原 canonical 场景标题均保留；文件为 UTF-8/LF、无尾部空白、单 EOF 换行；26 项实施任务全部未勾选。场景标题保留检查不替代对正文语义的独立审查。

校验时 tracked diff 与 staged diff 均为空。原 Reviewer 文件、HEAD、分支、真实 index 与 .git/config 均保持不变；没有改动 src、测试、canonical specs 或旧 Run。

## 5. 交接

本轮原地修订 9 份既有规划文件，新增 `specs/delivery-finalization/spec.md` 及本 Author 交接说明。无需恢复 Explore 或新建 Change。保持本次提案中的轻量 Archive、safe retry、partial 停止和 raw 证据保护方向，不引入通用恢复平台或 Git 转换平台。

下一步：独立 `review-propose`，重点核对 RP-01 的完整消费链与 RP-02 的索引输入/输出语义。本轮到此停止，不进入 Apply，不发布安装或执行 Git commit/push。
