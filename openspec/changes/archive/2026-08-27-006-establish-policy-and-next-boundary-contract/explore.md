# Explore — establish-policy-and-next-boundary-contract

## 1. Owner goal and current boundary

Delivery `20260824-01-foundation-lifecycle-kernel` 已完成前五个 Foundation Change。当前 Change 的目标不是 scheduler / orchestrator，而是补上前五个 contract 刻意留下的治理空位：

> 基于 canonical lifecycle / authority / Run / Result / single-Action facts，确定当前 **legal boundary**；若无法安全确定，则返回 deterministic blocked diagnosis。

Policy 只决定 **legality**。它不得：

- 执行被选中的 Action；
- 自动创建 Run / Result；
- 自动创建 Owner authority；
- 把 `READY(action)` 解释为“host 已被授权/必须立即执行”；
- 执行 Git mutation / checkpoint；
- 替代 OpenSpec formal Change authority。

`058 review-explore` 对 057 提出的三个 blocker 已由 059 修订并在 060 re-review 中确认 closed。`060 review-explore` 新发现一个 lifecycle compatibility blocker：bounded Owner correction 可能选择 exact same terminal revise Action，而现有 lifecycle 明确拒绝 `terminal A → prepare A`。本次 Revise Explore 只修 `RE-060-001`，不扩大 Change scope，也不修改既有 lifecycle contract。

---

## 2. Durable existing facts

### 2.1 Identity / authority

现有 canonical contract 已固定：

- Standard Action catalog 恰好 10 个；
- Author / Reviewer execution role 与 Owner authority 分离；
- `OwnerAuthorityFact` 的 structural validity 不等于某个 boundary 的 Policy eligibility；
- Review approved、Verification PASS、Action terminal 都不能隐式生成 Owner authority。

因此 Policy 可以消费显式 authority fact，但不得制造 authority fact。

### 2.2 Action lifecycle / invocation

当前 lifecycle 只有：

```text
prepared
terminal
```

single-Action invocation 已固定：

```text
selected legal Standard Action
→ internal prepare/reuse prepared Action
→ exact new Run occurrence
→ ActionPackage
→ execute exactly one Action
→ exact Result admission
→ terminal
→ report
→ STOP
```

结构事实：

- `prepared A` 时，不同 Action 无法替换它；
- 后续 invocation 可复用 exact `prepared A`，以新的 Run occurrence 区分 execution occurrence；
- `terminal A → prepare A` 被 lifecycle fail closed；`terminal A → prepare B` 仅在 `B` 为不同 exact Action identity 时才可建立新的 prepared slot；
- 因此 Policy 在 `prepared A` 上只需报告唯一 legal Action 仍是 `A`，而任何 terminal 后的 `READY_ACTION(B)` 都必须与现有 lifecycle 的 structural entry contract 相容，不需要 resume/retry framework。

### 2.3 Canonical Run / Result vocabulary

当前 `RunResultRecord` canonical shape 明确保留：

```text
authorConclusion
reviewerVerdict
verificationVerdict
nextBoundary
```

现有 domain tests 也直接使用：

```text
authorConclusion = "PASS"
reviewerVerdict = "approved"
```

Persistence 只验证 bounded wire shape，不赋予任意 string lifecycle semantics。

因此 Policy V1 的 outcome vocabulary 应基于 **当前 canonical RunResultRecord contract + tests**，而不是要求历史 external-orchestrator payload 已统一使用同一字段名。

历史 `authorRevisionConclusion` 等 legacy wire shape 只保留为历史事实，不进入新 Policy contract。

---

## 3. Corrected proof A — deterministic ordering 与 invocation authority 必须分离

### 3.1 42/42 history 真正证明了什么

对已完成 Change 的 observable Action transition 做 audit，11 个历史实际出现的 mapping 共 42 个 Run，42/42 与以下 ordering 一致：

```text
explore PASS                 → review-explore
revise-explore PASS          → review-explore
review-explore approved      → propose
review-explore changes-*     → revise-explore
propose PASS                 → review-propose
revise-propose PASS          → review-propose
review-propose approved      → apply
review-propose changes-*     → revise-propose
apply PASS                   → review-apply
review-apply approved        → archive
archive PASS                 → checkpoint
```

未实际出现的两个 revise-apply 分支仍只是 canonical Standard Action symmetry evidence：

```text
review-apply changes-requested → revise-apply
revise-apply PASS              → review-apply
```

### 3.2 42/42 没有证明什么

历史 ordering **不能证明**：

```text
apply/archive execution 不需要任何外部 invocation request
```

也不能证明：

```text
fresh OwnerAuthorityFact 永远不可能被某个未来 host boundary 要求
```

真实历史混合存在：

- 早期 external orchestration 使用显式 `authorize-apply` / `authorize-archive` Owner facts；
- 后期也存在 Reviewer approved 后由用户明确请求继续执行，但不创建新的 OwnerAuthorityFact。

因此 057 将 42/42 ordering evidence 用来证明 execution-authority removal，结论过宽。

### 3.3 修正后的 governance boundary

Policy V1 只回答：

```text
what boundary is legal now?
```

例如：

```text
READY(action = apply)
```

只表示 `apply` 是当前 deterministic legal Standard Action。

它 **不表示**：

- Policy 自动调用 apply；
- host 必须立即执行；
- 一个外部 operator request 已经存在；
- Policy 自动生成 OwnerAuthorityFact；
- 所有 host 都必须或都不必须额外要求 invocation authority。

实际 invocation 属于 external host / 后续 CLI integration seam。本 Change 不定义 scheduler，也不把普通 legal-boundary calculation 再包装成 `authorize-apply/archive` Policy gate。

OwnerAuthorityFact 在本 Change 中只需要用于 **明确的 exceptional correction** eligibility；Git/checkpoint 等其他显式 authority boundary 仍由后续 Change 定义。

---

## 4. Corrected proof B — post-archive precedence

### 4.1 Reviewer counterexample

Archive 成功后真实 durable state 是：

```text
Change.state = completed
CurrentAction = terminal archive
Result.authorConclusion = PASS
```

057 先执行：

```text
Change != active → BLOCKED(change-not-active)
```

因此会把本应存在的 checkpoint-evaluation boundary 吃掉。

### 4.2 Minimum corrected precedence

Policy 必须先识别 **唯一合法的 post-archive exception**：

```text
change.state == completed
+ currentAction == terminal archive
+ exact terminal Result matches archive
+ authorConclusion == PASS
→ CHECKPOINT_EVALUATION
```

之后才应用 generic non-active guard：

```text
planned / completed / cancelled
且不满足上面的 exact post-archive shape
→ BLOCKED(change-not-active)
```

同时：

```text
change.state == active
+ terminal archive
+ PASS
→ BLOCKED(archive-completion-state-mismatch)
```

原因：`archive PASS` 在 repository materialization 尚未把 Change 收敛为 `completed` 前，不应提前宣称 checkpoint-evaluation 已成立。

因此 checkpoint-evaluation 依赖 **exact completed archive materialization fact**，不是只依赖 Action result string。

### 4.3 Focused executable proof

临时 proof model 覆盖：

- completed + terminal archive + PASS → checkpoint-evaluation；
- completed + terminal non-archive → blocked；
- active + terminal archive + PASS → blocked；
- active initial / prepared / Author / Reviewer normal branches。

结果：`10/10 PASS`。

该 proof 只验证 precedence model，不是 production implementation。

---

## 5. Corrected proof C — reported boundary consistency 必须先于 Owner correction

### 5.1 两个规则本身都需要保留

现有 contract 要求：

1. admitted `nextBoundary` 是 opaque reported fact，不具有 Policy authority；
2. 若它与 deterministic normal boundary 冲突，应 fail closed，避免隐藏 handoff drift；
3. Owner 可以在 normal path 进入下一阶段前，明确要求 bounded revise-only correction。

真实案例：

```text
049 explore PASS
→ normal boundary = review-explore
→ reported nextBoundary = review-explore
→ Owner 主动发现问题
→ correction = revise-explore
→ 050 revise-explore
```

### 5.2 Correct evaluation order

Policy 必须分两层计算：

```text
authoritative facts
↓
1. compute deterministic NORMAL boundary
↓
2. compare admitted reported nextBoundary against NORMAL boundary
↓
3. only after normal consistency passes,
   evaluate explicit bounded Owner correction
↓
FINAL legal boundary
```

因此：

```text
normal   = review-explore
reported = review-explore
correction = revise-explore
matching correction authority
→ READY(revise-explore)
```

合法 correction 不会因为它故意不同于 normal boundary 而产生 conflict。

反例：

```text
normal   = review-explore
reported = propose
correction = revise-explore
matching correction authority
→ BLOCKED(reported-boundary-conflict)
```

Owner correction 不能掩盖原始 Action 已经报告了错误 handoff fact。

Focused proof 对这两个 precedence case 均 PASS。

---

## 6. Corrected proof D — Policy 不得返回 Core 无法进入的 READY Action

### 6.1 Reviewer counterexample

060 独立枚举了 bounded Owner correction 与现有 Action lifecycle 的组合。059 的 reached-stage revise set 本身没有 forward skip，但它遗漏了 exact current terminal Action identity：

```text
terminal revise-explore
+ Owner correction revise-explore
→ Policy 059 would report READY(revise-explore)
→ Core prepare(revise-explore) rejects exact terminal A → prepare A
```

同类反例还有：

```text
terminal revise-propose → correction revise-propose
terminal revise-apply   → correction revise-apply
```

这不是 retry/resume 问题，而是 Policy legal-boundary 输出必须与已经存在的 lifecycle structural entry seam 组合一致。

### 6.2 Reuse the existing lifecycle seam; do not duplicate it

Proposal 不应重新定义一套“可 prepare”规则。Policy 在最终输出 `READY_ACTION(target)` 前只需要验证候选 Action 对 exact current slot **structurally enterable**：

```text
currentAction == null
→ existing lifecycle prepare(target) must succeed

currentAction == prepared A
→ target must be exact A
→ reuse prepared A; do NOT prepare again

currentAction == terminal A
→ existing lifecycle prepare(target) must succeed
```

因此 terminal slot 上天然得到：

```text
target identity == exact terminal A
→ prepare rejects
→ BLOCKED(action-boundary-not-enterable)

target identity != exact terminal A
+ lifecycle prepare accepts
→ candidate may remain READY
```

这条 gate 适用于 normal boundary 与 Owner-corrected boundary，保证 Policy 永远不广告一个 Core 当前无法进入的 Standard Action。它只是 composition invariant，不是新的 lifecycle state machine。

### 6.3 Focused executable proof

proof 直接调用当前 `transitionCurrentAction` 枚举：

- normal terminal Policy transitions：`12/12` structurally preparable；
- bounded Owner correction combinations：`15/18` structurally preparable；
- 被拒绝的 `3/18` 恰好是：

```text
revise-explore → revise-explore
revise-propose → revise-propose
revise-apply   → revise-apply
```

修订后的 Policy 会把这 3 个候选在最终 READY emission 前 fail closed，因此：

```text
normal READY candidates structurally enterable     = 12/12
Owner-correction READY candidates enterable         = 15/15
exact-same terminal revise candidates advertised    = 0/3
```

如果 Owner 仍希望再次执行 exact same revise Action，当前 Foundation 必须先经过另一个不同 lifecycle Action，使 current terminal identity 改变；Policy 不创建 reset、resume、retry 或 terminal-loosening shortcut。

---

## 7. Normal boundary matrix

### 6.1 Exact post-archive boundary — highest state precedence

```text
completed Change
+ terminal archive
+ exact matching Result
+ authorConclusion == PASS
→ CHECKPOINT_EVALUATION
```

reported consistency token 建议仍使用既有 handoff literal：

```text
checkpoint
```

Policy decision kind 可以是结构化 `CHECKPOINT_EVALUATION`，不要求把 Result wire literal 改成同名。

其他 non-active Change：

```text
→ BLOCKED(change-not-active)
```

### 6.2 Active initial / in-flight

```text
active Change
+ currentAction == null
→ READY(explore)

active Change
+ currentAction == prepared A
→ READY(A)
```

`READY(A)` 是 legality report，不是自动 invocation。

### 6.3 Active terminal Author actions

```text
terminal explore + PASS
→ review-explore

terminal revise-explore + PASS
→ review-explore

terminal propose + PASS
→ review-propose

terminal revise-propose + PASS
→ review-propose

terminal apply + PASS
→ review-apply

terminal revise-apply + PASS
→ review-apply
```

Author conclusion 非 exact `PASS`：

```text
→ BLOCKED(unrecognized-or-unsuccessful-author-outcome)
```

`active + terminal archive + PASS` 不是这里的普通 Author branch；它必须等待/要求 exact Change completed materialization：

```text
→ BLOCKED(archive-completion-state-mismatch)
```

### 6.4 Active terminal Reviewer actions

```text
review-explore:
  approved          → propose
  changes-requested → revise-explore

review-propose:
  approved          → apply
  changes-requested → revise-propose

review-apply:
  approved          → archive
  changes-requested → revise-apply
```

其他 verdict / null：

```text
→ BLOCKED(unrecognized-reviewer-verdict)
```

### 6.5 Terminal Result identity

所有 terminal mapping 在解释 outcome 前都必须要求：

```text
exact current Action identity
== exact terminal Result action identity
```

缺失或不匹配：

```text
→ BLOCKED(terminal-result-missing-or-mismatched)
```

---

## 8. Reported nextBoundary consistency

Policy 先得到 `normalBoundary`，再检查 terminal Result 的 reported `nextBoundary`：

```text
null
→ 不阻止 normal Policy calculation

exact match normal reported token
→ consistency PASS

non-null conflict
→ BLOCKED(reported-boundary-conflict)
```

Action boundary 的 canonical reported token 可直接使用 StandardActionId。

Checkpoint-evaluation 的 existing handoff token 使用：

```text
checkpoint
```

Policy 不允许 reported value 覆盖 normal computation。

---

## 9. Bounded Owner correction — normal consistency 之后的 exceptional layer

Owner correction 不是 normal action invocation authority，也不是 generic jump。

它只处理：

> 当前 terminal Action 已产生一致的 normal handoff，但 Owner 在进入下一阶段前明确要求回到一个 revise boundary 修正已到达阶段或更早阶段。

最小允许集：

```text
current reached stage = explore
→ revise-explore

current reached stage = propose
→ revise-propose | revise-explore

current reached stage = apply
→ revise-apply | revise-propose | revise-explore
```

约束：

- current Action 为 `prepared` 时不能切换 correction target；
- correction 只允许 revise family；
- 不允许 forward-skip Reviewer；
- 不允许 `archive` 作为 correction；
- correction candidate 仍必须通过统一的 structural-enterability gate；特别是 exact same terminal revise Action 不能立即再次成为 READY；
- completed post-archive boundary 不在本 correction model 中重新打开；
- Change cancel / Delivery reorder / promotion 不是此 correction contract。

Correction evaluation 必须要求 matching explicit OwnerAuthorityFact。Proposal 应固定一个单一 canonical correction authority recognition，而不是继续继承历史多种 `authorize-*` normal-path token。

如果 correction request 存在但：

```text
authority absent
→ BLOCKED(owner-authority-required)

authority malformed / identity/scope mismatch
→ BLOCKED(owner-authority-rejected)

requested action 不属于允许的 revise set
→ BLOCKED(unsupported-owner-correction)

candidate Action 与 exact current slot 的 lifecycle entry 不相容
→ BLOCKED(action-boundary-not-enterable)
```

057 的真实 049 → 050 case 在新 precedence 下仍合法：current terminal 是 `explore`，correction target 是不同的 `revise-explore`，现有 lifecycle 可 prepare。

而：

```text
terminal revise-explore + correction revise-explore
terminal revise-propose + correction revise-propose
terminal revise-apply + correction revise-apply
→ BLOCKED(action-boundary-not-enterable)
```

---

## 10. Minimum Policy shape after revision

Proposal 应保持一个纯、closed、serialization-safe decision seam。

最小概念：

```text
PolicyFacts
  change structural state
  current Action slot
  exact terminal RunResultRecord when terminal
  optional explicit OwnerCorrectionRequest
      requested revise Action
      matching OwnerAuthorityFact
        │
        ▼
Policy normal-boundary calculation
        │
        ├─ reported-boundary consistency
        │
        └─ optional bounded correction overlay
        │
        ▼
structural-enterability gate
  null slot     → lifecycle prepare candidate
  prepared A    → exact A reuse only
  terminal A    → lifecycle prepare candidate
        │
        ▼
PolicyDecision
  READY_ACTION(actionId)
  READY_CHECKPOINT_EVALUATION
  BLOCKED(reason)
```

重要收缩：

- 普通 external invocation request **不是** PolicyFacts 的必要输入；
- Policy 计算 legal boundary 后 STOP；
- host 是否以及何时调用该 legal Action 是 separate execution/integration concern；
- Owner correction request 是唯一需要在本 Change 中额外进入 Policy 的 exceptional request；
- structural-enterability 不复制 lifecycle semantics，而是复用现有 Action lifecycle / prepared-reuse contract 作为最终 READY compatibility gate。

Policy 不读写 filesystem、不 shell out OpenSpec、不创建 Run、不执行 Action、不修改 Change state、不 schedule、不 poll、不创建 Owner fact。

---

## 11. Blocked diagnosis minimum set

Proposal 至少需要 machine-distinguishable：

```text
invalid-policy-input
change-not-active
archive-completion-state-mismatch
terminal-result-missing-or-mismatched
unrecognized-or-unsuccessful-author-outcome
unrecognized-reviewer-verdict
reported-boundary-conflict
owner-authority-required
owner-authority-rejected
unsupported-owner-correction
action-boundary-not-enterable
```

可以在 Proposal 收缩名称，但不能只返回自由文本/boolean。

---

## 12. Explicit non-goals

本 Change 不建立：

- scheduler / queue / daemon；
- automatic next Action execution；
- automatic Owner decisions；
- host/provider invocation authorization framework；
- retry framework / retry counter / resumed state；
- generic workflow DSL；
- dynamic Policy plugin registry；
- OpenSpec state-machine copy；
- artifact filesystem scanner；
- mutation declaration / Git checkpoint authorization implementation；
- Change ordering / Delivery scheduling；
- Cross-Delivery Memo；
- Delivery Full Test / promotion；
- CLI；
- multi-Agent orchestration。

---

## 13. Remaining limitations / deferred boundaries

1. Policy V1 只决定当前 Change 的 Standard Action legal boundary，以及 exact completed archive 后的 checkpoint-evaluation boundary；不选择下一个 Delivery Change。
2. `READY_CHECKPOINT_EVALUATION` 不等于 Git permission；真正 checkpoint authority 由后续 mutation/checkpoint Change 固定。
3. OpenSpec artifact readiness 后续由 thin integration 提供；当前 Policy 不直接读取 OpenSpec filesystem/CLI。
4. Verification 属于独立 authority，不能用 Verification PASS 替代 Reviewer/Owner facts。
5. 普通 Action 的实际 invocation semantics 留给 host/CLI integration；本 Policy 既不要求 fresh durable OwnerAuthorityFact，也不宣称所有 host 都永远不需要外部 invocation request。
6. historical Runs 的 `authorize-apply/archive` 与 legacy outcome wire fields 保持历史事实，不做 retroactive migration，也不作为新 Policy normal-path contract。
7. exact same terminal revise Action 不能通过 Owner correction 立即重新执行；这是既有 terminal lifecycle 的结构限制，不在本 Change 中用 retry/resume/reset 绕过。

---

## 14. Explore conclusion

**PASS after second revision**

`RE-058-001 / 002 / 003` 在 060 中继续 confirmed closed；`RE-060-001` 已通过复用现有 lifecycle structural-entry seam bounded：

- post-archive exact completed/archive/PASS precedence 在 generic non-active guard 之前；
- reported nextBoundary 只与 deterministic normal boundary 比较，Owner correction 在 consistency PASS 后单独应用；
- 42/42 history 只用于 ordering evidence，不再用于推导 external invocation / Owner authority semantics；
- canonical outcome vocabulary 由当前 RunResultRecord contract + domain tests 支撑；
- 所有最终 `READY_ACTION` 都必须与 exact current slot structurally enterable；normal transition `12/12` compatible，Owner correction 的 3 个 exact-same terminal revise candidate 明确 fail closed；
- Policy remains a pure legality seam，不变成 scheduler / execution authority engine。

Proposal 可以基于上述最小模型继续；不修改 terminal absorption，不恢复 `resumed`，也不引入 retry/scheduler/multi-Agent/orchestration subsystem。
