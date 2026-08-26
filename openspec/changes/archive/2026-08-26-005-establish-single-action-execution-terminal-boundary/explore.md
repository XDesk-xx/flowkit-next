# Explore — establish-single-action-execution-terminal-boundary

## Outcome

```text
PASS
```

本次 Explore（经 Owner scope correction 修订）证明两件事：第一，当前 Foundation 的真实 single-Action happy path **不需要 `resumed` 独立 lifecycle state**；第二，`prepare` 有必要作为建立唯一 `CurrentAction/prepared` 的内部 structural seam，但 **不应成为 Standard Action、独立 Run/Result、普通用户可见阶段或独立 STOP boundary**。

推荐进入 Proposal 时：

1. 将 `action-lifecycle` 从 `prepared / resumed / terminal` 收缩为 `prepared / terminal`；
2. 删除 `resume` lifecycle event / transition；
3. 将 ActionPackage 可执行 state 收缩为仅 `prepared`；
4. 将 single-Action boundary 定义为一次完整 Standard Action invocation：Core 内部 prepare + package formation → execute exactly one Standard Action → Core 内部 admission + terminal → report continuation fact → STOP；
5. 明确 `prepare` 不产生独立 StandardActionId、Run/Result 或 STOP；
6. 不计算 legal next Action，不引入 crash recovery / retry orchestration / scheduler / automatic next。

---

## 1. Delivery plan correction absorbed before activation

Exact checkpoint base:

```text
b0a38849aed94476e67245d89a31c7106f9d266d
```

在本 Change 激活前，Owner 明确要求先修正尚未激活的 Delivery plan，而不是继续把 `resume` 当成既定目标。

Plan correction:

```text
old planned Change 5:
establish-resume-and-single-action-terminal-boundary

new planned Change 5:
establish-single-action-execution-terminal-boundary
```

并将：

```text
establish-cross-delivery-memo-contract
```

正式插入：

```text
Policy
→ Cross-Delivery Memo
→ mutation / Git checkpoint
```

该 correction 只修改未来 Delivery plan / Agent guidance / derived planned architecture，不修改已归档 OpenSpec canonical specs、production source 或 tests。

Owner plan-correction authority:

```text
owner:421b658f34c85ff2c12a081ecf545f223ce74f3ac688c3ce42a31f06cf00210a
```

Current Explore activation authority:

```text
owner:877f623baf32e76a3b5e1c45fa40a3b3b16d36b856ade136ba15b77f6e42c01f
```

Owner scope-correction authority for the revised `prepare` boundary:

```text
owner:9496aa06cd4c354743a79bbe156eb24cbc469a1f3815ae1874c9baf3ff371718
```

历史 Change 1–4 与其 Run facts 保持不变。

---

## 2. Owner scope correction — `prepare` is internal, not a lifecycle stop

049 Explore 的 `resumed` 结论保持有效，但其流程图把 `prepare` 放在顶层箭头中，容易误读为旧 Flowkit 那种独立阶段：

```text
prepare
→ STOP
→ later execute Action
```

Owner 明确修正该解释。当前真实目标是：

```text
one Standard Action invocation

  [Core internal] prepare CurrentAction
  [Core internal] form exact ActionPackage
          ↓
  execute exactly one Standard Action
          ↓
  [Core internal] admit exact Result
  [Core internal] terminalize exact current Action
          ↓
  report continuation fact
          ↓
  STOP
```

因此本 Explore 新增一个必须证明的问题：

> `prepare` 是否只是内部 structural lifecycle event，还是需要成为独立 Standard Action / Run / STOP boundary？

该修订不扩大产品范围，只收紧既有 Change 5 的外部行为边界。

---

## 3. Real problem boundary

当前已经存在：

```text
Action lifecycle
  one current Action slot
  prepared / resumed / terminal

Run persistence
  exact Change-scoped Run occurrence
  repeated executions can have distinct Run occurrences

ActionPackage
  exact current Action
  exact current Run occurrence
  role
  lifecycle state
  authority / predecessor provenance

Result admission
  exact package/current Action/current Run matching
  Author/Reviewer outcome-slot separation
  no Standard Action Verification verdict
  reported nextBoundary remains opaque data
```

本 Change 真正需要解决的是：

> 如何把已经存在的 prepare + exact package + exact admission 组合成 exactly-one-current-Action completion boundary，并判断既有 `resumed` state 是否仍然提供当前真实需求无法替代的语义？

本 Change **不负责**：

```text
Policy legal next-Action selection
automatic next Action execution
Owner happy-path authorization policy
crash recovery
process interruption recovery
WAL / transaction / retry registry
scheduler
multi-Agent orchestration
provider transport
Git checkpoint
OpenSpec integration
CLI
Delivery Full Test
```

---

## 4. Proof P1 — All Standard Actions complete directly from `prepared`

Question:

> 是否存在任何 Standard Action 必须先进入 `resumed` 才能形成 ActionPackage、admit exact Result 并 terminalize？

Focused executable proof 对全部 10 个 Standard Actions 执行：

```text
empty current slot
→ prepare A
→ A/prepared
→ form exact ActionPackage from prepared Run context
→ admit exact Result against exact current Run occurrence
→ terminal A
```

Actions covered:

```text
explore
review-explore
revise-explore
propose
review-propose
revise-propose
apply
review-apply
revise-apply
archive
```

Observed:

```text
10 / 10 prepare                PASS
10 / 10 package formation      PASS
10 / 10 exact Result admission PASS
10 / 10 terminal transition    PASS
10 / 10 duplicate terminal     REJECTED
10 / 10 terminal resume        REJECTED
10 / 10 same-identity reprepare REJECTED
```

Decision impact:

```text
`resumed` is not required by the normal Standard Action completion path.
```

Boundary:

该 proof 不声称未来永远不会需要 restart/recovery capability；它只证明当前 Foundation Delivery 的真实 happy path 不需要它。

---

## 5. Proof P2 — A new Run occurrence already represents re-execution without `resumed`

Question:

> 如果同一 semantic Standard Action 需要再次执行，是否必须把 CurrentAction 从 `prepared` 切到 `resumed` 才能区分新旧执行？

Focused proof 使用同一个：

```text
CurrentAction = review-explore / prepared
```

并形成两个不同 Run occurrences：

```text
20260826-050-review-explore
20260826-051-review-explore
```

两个 package 均可从同一个 `prepared` CurrentAction 与各自 exact Run context 形成。

Admission against current occurrence `051`：

```text
old package 050 → REJECT
new package 051 → ACCEPT
```

Observed:

```text
same CurrentAction state = prepared
execution identity distinction = Run occurrence
stale execution rejection = exact runId/current occurrence check
```

Decision impact:

```text
Run occurrence already owns execution-attempt distinction.
`resumed` must not duplicate Run/attempt identity semantics.
```

这与既有 Action lifecycle 原则“semantic Action identity 不引入 Run/attempt identity”一致。

---

## 6. Proof P3 — No independent current capability requires `resumed`

Canonical current-spec scan：

```text
action-lifecycle
  defines resumed itself

action-package-and-result-admission
  accepts resumed because lifecycle currently exposes it

run-result-persistence
  no resume/resumed requirement

lifecycle-authority-and-identity
  only states that Action lifecycle is a separate concern;
  it does not require resumed behavior
```

因此当前依赖关系是：

```text
Action lifecycle defines resumed
        ↓
ActionPackage supports resumed
```

而不是：

```text
independent real requirement
        ↓
requires resumed
```

Decision impact:

`resumed` 当前是自我维持的 contract complexity；没有第三个独立 capability 证明它必须存在。

---

## 7. Proof P4 — `prepare` is a structural event, not a Standard Action or Run occurrence

Question:

> 是否需要把 `prepare` 暴露成一个独立 lifecycle Action，形成自己的 Run/Result，并在 prepare 后 STOP？

Focused executable proof 直接使用当前 canonical domain：

```text
STANDARD_ACTIONS count = 10
isStandardActionId("prepare") = false
transitionCurrentAction(null, { type: "prepare", identity: explore })
  → explore / prepared
formatRunOccurrenceId({ actionId: "prepare", ... })
  → null
```

Observed：

```text
prepare is accepted as ActionLifecycleEvent         YES
prepare establishes CurrentAction/prepared         YES
prepare is StandardActionId                        NO
prepare can own canonical RunOccurrence            NO
```

这不是偶然的 API 形状，而是当前模型的边界组合：

```text
ActionLifecycleEvent.prepare
→ targets a real StandardActionId identity
→ establishes the single current Action

RunOccurrence.actionId
→ MUST be StandardActionId
→ therefore cannot represent a separate "prepare" execution
```

Decision impact：

```text
keep prepare as an internal deterministic structural transition
do not add prepare to StandardActionId
do not create prepare Run/Result
do not make prepare an ordinary STOP boundary
```

`prepared` state itself remains useful because it represents the real interval:

```text
current Action established
+ Result not yet admitted
```

and enforces the single-current-Action invariant before completion.

Proof artifacts were execution-local only：

```text
script sha256  = 817c1cbf16f850306e7e38158c4e96dec7ca6e1dfc9f60063b23d57d434e6d6a
result sha256  = 3276631eae8e5bb578497e8d43cfeb10cb3e652483940dc1de37d5bf03f0b901
```

---

## 8. Why keeping `resumed` would cost real complexity

保留 `resumed` 会要求后续所有相关 seam 长期维护：

```text
prepared | resumed union
prepare → resumed transition
resumed → resumed transition
prepared/resumed package formation
prepared/resumed admission
state freshness mismatch checks
prepared-package / resumed-current stale scenario
resumed-package / prepared-current stale scenario
Run context serialization support
extra test matrix
```

但当前真实行为已经由：

```text
CurrentAction semantic identity
+
exact Run occurrence
```

分别承担“是什么 Action”和“是哪一次执行”。

因此继续保留 resumed 会重复表达 execution occurrence/re-entry concerns，而没有增加当前必要的 product capability。

---

## 9. Minimum lifecycle direction

Proposal-ready target：

```text
CurrentActionSlot
  empty
  or
  A/prepared
  or
  A/terminal
```

Transitions：

```text
empty
→ prepare A
→ A/prepared

A/prepared
→ terminal A
→ A/terminal

A/terminal
→ prepare B where B != A
→ B/prepared
```

Reject：

```text
prepare over prepared
terminal identity mismatch
duplicate terminal
same-identity reprepare after terminal
unknown lifecycle literal
resume event / resumed literal after contract migration
```

Policy eligibility remains outside this structural matrix。

---

## 10. Minimum single-Action invocation / terminal composition

当前三个既有 Core seam：

```text
transitionCurrentAction(... prepare ...)
formActionPackage(...)
admitActionResult(...)
```

已经覆盖 internal preparation + exact execution package + exact Result validation。`prepare` 不需要也不允许变成第四个外部阶段。

缺失的是把这些 seam 组合成**一次完整 Standard Action invocation**的 contract：

```text
legal Standard Action identity already selected

→ [internal] prepare exact current Action
→ [internal] form exact ActionPackage
→ execute exactly one Standard Action
→ [internal] admitActionResult

if admission fails:
  no terminal claim
  current Action remains prepared
  report failure/blocked fact
  STOP once

if admission succeeds:
  [internal] terminalize exact same current Action
  preserve admitted Result
  surface reported continuation fact as opaque data
  STOP once
```

这里的 `continuation fact` 不是 legal next Action decision。

Later Policy owns：

```text
review approved → ?
changes-requested → ?
apply → ?
archive → ?
blocked → ?
```

本 Change 只保证：

```text
one invocation
→ at most one current Action completion
→ terminal
→ report
→ STOP
```

---

## 11. Failed/invalid execution boundary

本 Change 不建立“中断恢复”模型。

如果 candidate Result 无法 admission：

```text
Result not admitted
→ no terminal transition
→ current semantic Action remains non-terminal (`prepared` in the proposed simplified model)
→ STOP
```

后续是否允许新的 Run occurrence再次执行同一个 Action，应由 later execution/Policy boundary基于 durable facts 决定；不需要预先创建 `resumed` state、retry counter、nonce registry 或 crash-recovery subsystem。

---

## 12. Expected Proposal impact

若 Reviewer 接受本 Explore，Proposal 应只包含以下 contract 变化：

### Modify existing `action-lifecycle`

```text
prepared / resumed / terminal
→ prepared / terminal

remove resume event and resume transitions
keep single slot / prepare / terminal / absorbing / Policy separation
```

### Modify existing `action-package-and-result-admission`

```text
ExecutableActionLifecycleState
prepared | resumed
→ prepared

remove prepare↔resume state-freshness scenarios
keep exact current Run occurrence freshness
keep exact Result linkage / role / outcome-slot separation
```

### Add minimal single-Action invocation capability

```text
prepare = internal structural transition only
ActionPackage formation = internal Core seam
execute exactly one Standard Action
Result admission = internal Core seam
terminal transition = internal Core seam
report admitted Result + opaque continuation fact
STOP exactly once after the invocation boundary
```

Explicitly reject any Proposal shape that introduces:

```text
prepare StandardActionId
prepare Run/Result
prepare-only STOP
user-visible prepare lifecycle stage
```

No other capability is required by current proof.

---

## 13. Explicit non-goals

```text
prepare as Standard Action / independent Run / independent STOP boundary
resume/restart/crash-recovery framework
process continuation
partial Run recovery
retry registry / attempt counter beyond existing Run occurrence
new execution identity
PackageId / ResultId
scheduler
automatic next Action
Policy legality
Owner authorization policy
multi-Agent orchestration
transport/provider framework
mutation/Git checkpoint
OpenSpec adapter
CLI
Delivery Verification
```

---

## 14. Stop condition

Explore can stop successfully because：

```text
real happy path bounded             YES
all 10 Standard Actions proofed     YES
re-execution identity proofed       YES
external dependency on resumed      NONE FOUND
prepare external-stage necessity    NO; internal seam proofed
minimum contract direction clear    YES
new subsystem required              NO
```

Result：

```text
PASS
→ review-explore
```
