# Flowkit：Prepared Run Proof 与 Change Checkpoint 兼容性修复建议

> 状态：建议记录 / 暂不要求立即实现  
> 发现日期：2026-09-25  
> 来源项目：LearningPlatform / D07  
> 触发 Change：`student-learning-workflow-and-draft-recovery`  
> 关联 Run：`20260924-089-apply`、`20260925-092-apply`

## 1. 问题摘要

Flowkit 已经支持合法的 `prepared` Run 后续接续：

- Owner correction / supersession
- same-action continuation

例如：

```text
089 apply (prepared)
  ↓ Owner correction
090 revise-propose
```

以及：

```text
092 apply (prepared)
  ↓ human checkpoint completed
093 apply
```

这些 Run 链已经能被新版 Flowkit canonical policy / run-chain 正确识别。

但是 Change checkpoint 的 managed evidence 校验仍假定：

```text
proof owning Run 必须 lifecycleState === "terminal"
```

因此，当一个合法保留的 `prepared` Run 产生了 proof，且这些 proof 在后续 Change checkpoint 时第一次进入 Git，Git host 会拒绝 checkpoint。

这造成：

```text
prepared supersession / continuation
```

与：

```text
managed proof checkpoint admission
```

之间存在语义不一致。

## 2. 实际复现

LearningPlatform D07 H：

```text
Delivery:
d07-stable-classroom-product

Change:
student-learning-workflow-and-draft-recovery
```

### 2.1 Owner correction

```text
20260924-089-apply
state = prepared

089 apply prepared
→ 090 revise-propose
```

089 保持真实历史：

```text
lifecycleState = prepared
authorConclusion = null
nextBoundary = null
```

不应事后改成 PASS / FAIL / terminal。

### 2.2 Same-action continuation

```text
20260925-092-apply
state = prepared
checkpoint = human-ui-confirmation-pending

092 apply prepared
→ 093 apply
```

093 terminal PASS，092 保留原始 checkpoint 状态。

## 3. 当前 blocker

当前实现位于：

```text
dist/internal/managed-evidence-checkpoint.js
```

核心逻辑要求：

```js
context.lifecycleState === "terminal"
```

而 `requireNewManagedEvidenceBytes(root)` 会校验本次首次进入 Git 的：

```text
.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/**
```

因此合法 prepared Run 的 proof 无法首次进入 checkpoint。

LearningPlatform H 中实际受影响的是：

```text
089 prepared:
- native-entry-runtime-boundary-diagnosis.json
- ui-checkpoint-readiness.json
- ui-feedback-round-1.json

092 prepared:
- browser-acceptance.json
- apply-checkpoint-readiness.json
```

## 4. 不应采用的规避方式

不应：

- 删除 prepared Run proof；
- 故意漏提交 proof；
- 把 prepared Run 事后改成 terminal；
- 把 089/092 伪造成 PASS；
- force commit / force push；
- 为通过 checkpoint 而重写历史。

这些 proof 是真实历史材料，Run Result / proof provenance 应完整保留。

## 5. 当前 workaround

LearningPlatform H 已使用一次人工受控 Git checkpoint：

1. 以 Reviewer-approved candidate 构造 exact path whitelist；
2. 纳入 H Run / proof、相关 Memo、OpenSpec archive / canonical spec；
3. 验证全部 dirty path，范围外文件为 0；
4. 精确 stage；
5. 验证 staged set == 预期范围；
6. 单 commit；
7. 验证 commit parent / 文件集合；
8. exact SHA 非强制 push；
9. `ls-remote` 读回远端 SHA。

最终：

```text
checkpoint commit:
9acca314882c6d6a43977233784878c22e0e67c6

remote:
refs/heads/delivery/d07-stable-classroom-product

remote SHA:
9acca314882c6d6a43977233784878c22e0e67c6
```

该 workaround 没有修改历史、删除 proof 或混入范围外文件。

但它绕过了 Flowkit Git host，因此只适合作为临时恢复方式。

## 6. 推荐修复语义

不要简单改成：

```text
terminal || prepared
```

推荐允许两类 proof owner。

### A. Terminal Run

现有逻辑完全不变。

### B. Canonically superseded / continued Prepared Run

只有同时满足严格条件时允许：

```text
1. RunContextRecord 合法
2. RunResultRecord 合法
3. lifecycleState === prepared
4. authorConclusion == null
5. reviewerVerdict == null
6. verificationVerdict == null
7. nextBoundary == null

8. proofRef 被 Result.facts.proofRefs 唯一声明
9. path / deliveryId / changeId / runId 一致
10. bytes + SHA256 精确匹配

11. prepared Run 不是 canonical chain 当前 tip
12. 有且只有一个 canonical child
13. child.previousRunId === preparedRunId
14. 不存在 fork
15. parent → child edge 被现有 Flowkit Policy 判定为合法
```

## 7. 必须支持的两个合法 prepared 场景

### 7.1 Owner supersession

```text
089 apply prepared
→ 090 revise-propose
```

child 带合法 `ownerAuthority`，并且 policy 对 ownerCorrection 返回：

```text
ready-action revise-propose
```

则 089 proof 可以进入 checkpoint。

### 7.2 Same-action continuation

```text
092 apply prepared
→ 093 apply
```

prepared parent 正常 policy 返回：

```text
next = apply
```

child 为同 Action，且整条 Run chain 无 fork，则 092 proof 可以进入 checkpoint。

## 8. 推荐实现方式

优先复用现有 canonical Run chain，不要在 managed-evidence checker 里重写一套状态机。

当前已有：

```text
listChangeRunHistory(...)
resolveRunChain(...)
policyForRecord(...)
evaluatePolicyAndNextBoundary(...)
```

建议新增内部 helper，例如：

```ts
async function proofOwnerIsCheckpointEligible(
  root,
  deliveryId,
  changeId,
  runId
): Promise<boolean>
```

语义：

```text
terminal
→ true

prepared
→ load canonical Run history
→ validate entire chain
→ find exact owner Run
→ confirm owner Run is not tip
→ find unique child
→ confirm legal Flowkit edge
→ true

otherwise
→ false
```

然后 `declaredProof()` 不再硬编码 terminal-only。

## 9. 推荐测试

### PASS

```text
terminal Run declared proof
→ PASS
```

```text
apply prepared
→ owner-authorized revise-propose

prepared Run declared proof
→ PASS
```

```text
apply prepared
→ apply continuation

prepared Run declared proof
→ PASS
```

### FAIL

```text
prepared current tip
→ FAIL
```

```text
prepared + illegal child
→ FAIL
```

```text
prepared + fork
→ FAIL
```

```text
proof 未在 Result 唯一声明
→ FAIL
```

```text
proof bytes / SHA mismatch
→ FAIL
```

```text
prepared Run 却带 authorConclusion / reviewerVerdict / nextBoundary
→ FAIL
```

## 10. 兼容性要求

修复不能改变：

- terminal proof admission；
- partial `action.md` only Run 仍拒绝；
- current prepared tip 仍拒绝；
- fork / disconnected / illegal policy edge 仍拒绝；
- Owner supersession 不创建新 lifecycle state；
- 不把 prepared 改为 cancelled；
- 不重写历史 Run；
- 不降低 proof SHA / bytes / Git index 校验；
- checkpoint 不自动修复 Run。

## 11. 是否需要立即实现

**不需要立即实现。**

LearningPlatform H 当前已经通过安全 workaround 完成：

```text
archive
checkpoint
push
```

而且 worktree clean。

因此建议先作为 Flowkit backlog / 下一轮升级输入保存。

以下情况再实现即可：

1. Flowkit 下一次统一升级；
2. 再次出现 prepared Run proof 首次进入 Git；
3. 希望 Change checkpoint 恢复全部走 Flowkit Git host；
4. 对 prepared supersession / continuation 做完整生命周期收口。

## 12. 修复前的临时规则

如果未来再次出现：

```text
prepared Run 有正式 proof
→ 后续合法 supersede/continuation
→ checkpoint Git host 因 terminal-only evidence admission 拒绝
```

不要改历史或删 proof。

在 Owner 明确授权 checkpoint/push 后，可以采用本次 H 的人工 exact-scope checkpoint：

```text
Reviewer-approved candidate
+ exact Run/proof
+ canonical archive/spec
+ relevant Memo
→ exact whitelist
→ zero unexpected paths
→ stage
→ verify staged set
→ single commit
→ verify commit paths/parent
→ exact non-force push
→ remote SHA readback
```

并明确记录为：

```text
temporary Flowkit Git-host compatibility workaround
```

而不是新的正常流程。

## 13. 最终结论

这是一个真实 Flowkit compatibility gap：

```text
prepared supersession / continuation
已经进入 canonical lifecycle

但

managed evidence checkpoint
仍采用 terminal-only proof owner 模型
```

推荐长期修复为：

```text
terminal proof
OR
canonically superseded/continued prepared proof
```

prepared 分支必须经过 canonical Run-chain + Policy edge 验证，不能简单放宽。

当前可以暂缓实现，只先记录。
