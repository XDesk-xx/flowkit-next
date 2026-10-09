# Review Propose

- Change：`allow-prepared-author-same-stage-continuation`
- 日期：2026-10-09
- 基线：`main / 0e0d8106d2cdf632e9aacbc61311cbe6e6d762db`
- 结论：**approved**
- Findings：无阻断项。

## 当前步骤与结论

本次独立审查 proposal、design、四份 delta specs、tasks 及 Explore 依据，判断其是否足以进入实现。沿用 Owner 指定的直接 OpenSpec 方式；本报告不是 Flowkit Run。固定 manager 的 status/next 返回 `context-inconsistent`（当前 Change 无 coordination），不能据此声称 Runtime 已形成 Apply 边界；doctor 与精确 OpenSpec 1.10.0 严格校验通过。

方案将 normal prepared reuse 与经 Owner correction 创建新 occurrence 明确分开。新增许可仅限三个 revise 的同 identity prepared 后继；完整 current pair、四槽 null、active Change、reached-stage 与 exact Owner scope 继续由既有 Policy 校验。历史读取强制核对 child authority，不能因默认 READY 同名而跳过。更严格历史读取的 BREAKING 行为及普通 prepared 历史兼容范围均已说明。

## 复杂度与最小性

复用 supersedePreparedAction、现有 correction 输入和 Run/descriptor/package 身份，无新增状态、字段、命令或 retry engine。已核对 start、prepared helper、finish、inspect 和链解析的实际调用：设计要求先复用，仅调整确有缺口的消费者，与现有结构相符。普通 prepare、terminal FAIL correction、安全 Archive retry、duplicate finish 和 partial 行为有明确保留及回归任务。

Guidance 字节冻结有 descriptor SHA 兼容依据；说明放到 onboarding，不需为此次修复改写旧 package。多轮 R1→R2→R3、跨进程命令、授权反例、唯一 tip 和前序字节不变都有可执行验收路径，详细程度与跨层授权变更相称。

## 新内容与范围

四个 capability 的改动可追溯到 Explore E01–E03 和既有主规格，未发现额外业务需求或通用化扩张。历史授权校验属于新增同名续跑的必要约束。Run 015、337 refs 和当前安装路径是兼容样本与观测值，不作为永久序号、容量或安装身份合同。

## 独立核对

- 直接从当前源码重建 18 个 Policy/结构探针与 9 个历史链探针，逐项结果与 Explore evidence 一致。均为内存 fixture，未持久化合成 Run/Owner fact。
- 两份相关 baseline 测试共 16 项通过；这证明当前基线可重现，不表示新功能已实现。
- 固定 manager 对 LearningPlatform 原 Run 015 的 status/next/inspect 只读读回与 Explore 一致：complete prepared，不能在原 occurrence 中变更式 finish。
- 原三文件 SHA-256 与 Explore 一致，查询前后不变；337 个 proof 引用逐项 regular/non-linked、bytes/SHA-256 匹配，共 3,083,257 bytes。
- 11 个 `skills/actions/**` 文件与当前固定安装 SHA-256 一致。此核对仅验证资产身份，未使用 candidate Reviewer Guidance 进行本次审查。
- OpenSpec 严格校验通过，无 issues；delta 的既有 Requirement/Scenario 保留范围与主规格一致。

精确审查输入 SHA-256、只读回执及探针结果见 [review-propose-20261009.json](evidence/review-propose-20261009.json)。

## 交接边界

Proposal 可作为实现依据。Apply 仍需完成 tasks 中的新行为、候选安装及旧 descriptor 兼容验收；本次 Windows 基线核对不声明 Linux acceptance 或 Formal Full Test PASS。停止于本次 review-propose；未执行实现、manager 更新、原项目新 Run、Archive 或 Git 操作。
