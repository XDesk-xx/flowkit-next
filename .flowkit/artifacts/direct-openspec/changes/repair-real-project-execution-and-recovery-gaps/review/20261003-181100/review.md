# 三项修复的补充复审

Verdict: **changes-requested**

Change: `repair-real-project-execution-and-recovery-gaps`
Git: `main` / `7ccd269bae0fa550fa6fd61b660c98390dd7937e`，当前 worktree candidate；exact 输入见各检查 `command.json#sourceInputs`。

本会话曾参与原 Apply，本次只检查另一会话随后实施的三项修正及其受影响路径，不提供整个 Change 的独立批准。沿用 Owner 已授权的直接 OpenSpec / no-Runs 模式，保存本次真实复审材料，不伪造 canonical Reviewer Run。外部安装 manager 的 status/next 实际返回 `context-inconsistent: OpenSpec Change has no coordination`；doctor 为 PASS / OpenSpec `1.10.0`。

## 仍需修正

1. **P1 — 新 Review 合法完成后，corrected Author 又变得不可消费。** `src/cli/run-effective-facts.ts:350-361` 无条件要求直接 terminal Review 的 `effectiveFacts.artifactHashes` 等于 corrected Author map，而 `src/cli/review-candidate.ts:28-33` 和 `design.md:17` 明确允许 Review 不声明这个 map。实际 fixed CLI 复现：Author correction → Review start → finish（exact `reviewedRunId`、省略 map）均成功；随后 Author effective read 抛出 `Correction cannot inherit inconsistent or unproven direct Review`。approved 场景的 next 返回 ready `archive`，但 Archive start 返回 `start-unconfirmed` / `effect=not-written`；rejected 场景在正确 `revise-action` / `revise-apply` Owner fact 下，同样阻断 revise start。显式声明一致 map 的三种 verdict 对照均可读，全部原 Author 三文件 hashes 保持不变。新增 `action-correction-continuation.test.ts:130-133` 仅覆盖声明 map 的 approved 场景，漏掉合同允许的省略路径。最小修正须让新 Review 的准入与后续 effective 消费一致，补充省略 map 的正常／拒绝续行回归，同时保留历史来源不足、候选冲突、fork 和 partial-machine 的 fail-closed 约束；不能把该字段直接升级为未批准的必填合同。

2. **P2 — 当前候选仍缺所要求的平台验收。** `verification.md:92` 如实说明这次修正没有重跑完整 opt-in native Windows Archive 或 Linux detached 验收。当前 production dependency/readiness/effective-view 和 native acceptance 已变化；旧 native 成功材料涉及的 6 个源码／测试文件 SHA-256 与当前不一致，且新的 reporter／回归不在旧输入集合内，见 `native-input-comparison.json`。因此 tasks `8.1/8.2` 的既有勾选不能提供本次修正后候选的平台通过证据。最小补齐是在最终修复输入上执行合同要求的 native Windows + pnpm11 真实 Archive 成功／失败、实际领域与完整 checks、source hash／junction／shim 读回，并执行受影响 Linux 回归；保留旧材料并如实记录当前范围，不用旧 PASS 抵扣。此项是验收缺口，不声称已观察到平台执行失败。

## 原发现收敛与验证

- 原 descriptor-only 阻断：原 Reviewer probe 已能 correction → start → approved finish，留下完整三文件；本次 P1 是完成后的另一合法分支遗漏。
- workspace 内部链接：source scan 识别嵌套依赖根，copy/重定位闭合到 scratch；真实 readiness fixture 能写 scratch dependency，source 保持原 bytes，逃逸链接仍拒绝。
- 暂态 `406`：已改为实际 reporter 文件身份集合；新增文件与缺少 shard／文件的真实子进程回归通过。

本次独立执行 focused **13/13 PASS，0 skip**，原问题 probe PASS；另运行 6 个 map/verdict 组合和 2 个 downstream fixed CLI 反例。四组进程全部 exit0 / `sourceUnchanged=true`；probe 的 exit0 表示观察正常完成，反例在 JSON 中明确记为阻断，不表示产品路径 PASS。

修复方 domain **409/409**、常规 acceptance **7 PASS /1 opt-in skip**、typecheck、gate、build、dependency-health、entropy、ownership、probe 的 9 份实际命令材料，各自 210 项输入与当前 SHA-256 一致。此处为证据核对；本次没有重复全量平台验收。`git diff --check` exit0。

当前步骤：三项修复的补充复审完成；未修改 Author 源码、tests、规划或 verification，未修改历史 verdict／Run，未执行 Git mutation、安装升级、archive 或下一 Action。复杂度／最小性：现有 helper 和受影响测试内的必要修正，未见新增控制平面。**scope drift: NONE**。

证据：`probe-results.json`、`downstream-results.json`、`probe/`、`downstream/`、`originalProbe/`、`focused/`、`fix-evidence-audit.json`、`native-input-comparison.json`、`manager-{status,next,doctor}/`、`git-facts.json`；原始流按 Buffer bytes 保存，程序／参数／实际时间／退出／输入身份见各 `command.json`。

STOP：本报告不构成整个 Change 的独立批准、Verification PASS、Owner 或 Git authority。
