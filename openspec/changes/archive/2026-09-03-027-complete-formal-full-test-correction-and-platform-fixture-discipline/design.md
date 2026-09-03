## Context

见 `proposal.md` 与 approved `explore.md`。Change 1 已实现 closed `DeliveryOperationId`、content-bound `DeliveryGuidanceRef`、stable `DeliveryOperationPackage` 与 `delivery-start` concrete variant。现有 applicable-check seam 已提供 project-supplied `ApplicableCheckDeclaration`、content-bound `deriveApplicableCheckRef`、Git-visible `deriveApplicableCheckCandidateRef` 与 exact process execution mechanics，但它的 `ApplicableCheckExecutionInput` 是 ActionPackage-specific，不能直接拿来包装 Delivery Full Test。

## Goals / Non-Goals

**Goals:**

- 让 `DeliveryOperationPackage` 支持一个 closed `delivery-full-test` variant，绑定 exact candidate、exact ordered project-local checks 与 exact Full Test authority。
- 复用已有 candidate/check/process identity mechanics，同时保持 Delivery 与 Standard Action execution envelope 分离。
- 用 generic `skills/delivery/full-test/SKILL.md` 冻结执行、admission、same-candidate correction、new-candidate STOP/restart 与 platform-fixture discipline。
- 让 flowkit-next 的六条 gate 仅作为本仓库测试 fixture 证明 generic contract，不成为产品 command catalog。

**Non-Goals:**

- `FullTestPlanId`、Registry/Planner、command database、dynamic discovery。
- finding/correction database、candidate invalidation subsystem、new Verification lifecycle。
- 将 Full Test 变成 Standard Action，或让 Full Test authority获得 correction/Git/finalization authority。
- Change 3–5 implementation、历史 archive rewrite、自托管接管。

## Decisions

### 1. Add one concrete Full Test facts variant to the existing Delivery package envelope

在 `delivery-operation-execution` domain 中增加 `DeliveryFullTestOperationFacts`，最小内容为：

```text
candidateRef
orderedChecks[]
  checkId
  program
  args
  configRefs
  toolRefs
  environmentRefs
  checkRef
```

`DeliveryOperationPackage.operationFacts` 变为 closed per-operation union，而不是 generic object。`delivery-start` validator/behavior保持原样；`delivery-full-test` 只走新 validator。

**Why:** Change 1 已经定义 stable envelope，Change 2 只应补 concrete variant，不另造 package family。

### 2. Reuse applicable-check identity vocabulary but preserve Full Test order

复用 `isApplicableCheckDeclaration` 与 `deriveApplicableCheckRef` 验证/解析每个 project-local check；Full Test resolver **不得**复用 Action applicable-check execution input 中按 checkId canonical sort 的 plan，因为 Reviewer 已冻结“Full Test order 是当前 Delivery concrete contract 的一部分”。

实现 SHOULD 提取或新增一个中性的 resolved-check helper：逐项 canonicalize/derive `checkRef`、拒绝 duplicate id/ref，但保持输入顺序。不要修改 accepted Action applicable-check ordering semantics。

**Why:** 共享 identity mechanics，同时避免为了复用 Action envelope 改变 Full Test 顺序或制造 fake ActionPackage。

### 3. Derive the current candidate in the trusted Full Test host, not from caller input

新增 bounded `delivery-full-test` host/domain seam。host 从 canonical repository root 调用现有 `deriveApplicableCheckCandidateRef` 得到 current candidate，再用 Owner-supplied project-local plan + exact authority + resolved canonical Guidance 形成 package。caller 不得提交 reusable candidateRef 覆盖 repository truth。

在 terminal/admission 时再次 derive current candidate；若与 package candidate 不同，拒绝 admission。

**Why:** 直接复用已有 Git-visible candidate identity，避免新 candidate subsystem。

### 4. Full Test authority uses one exact boundary-specific recognizer

复用 `OwnerAuthorityFact` structural validator，新增 `isFormalFullTestAuthorityForDelivery`（名称可按现有风格调整）只识别：

```text
decision = authorize-formal-full-test
deliveryId = exact
changeId = absent
scope = exactly [delivery-full-test]
```

必须使用 exact singleton scope，而不是 `includes`，防止一个 broader fact 越权携带 correction/Git/finalization scopes。

**Alternative rejected:** 新 Delivery authority type/state machine。没有 proof。

### 5. Execute checks through neutral process mechanics, not ActionPackage machinery

Full Test host按 package-bound order逐项执行 resolved checks。低层 process spawn 可复用 `executeExactApplicableCheckProcess` 或提取中性同义 helper；fact/result shape可以复用无 authority 语义的 compact check fact primitives，但 Full Test execution input/result identity不得依赖 `ActionPackage` / `actionPackageRef`。

建议为 Full Test 建立一个小的 content-bound `fullTestExecutionRef`/result admission identity，仅由现有 package identity材料（Delivery package or deterministic package hash）、candidateRef 与 ordered check refs 派生；若现有 package没有 public hash helper，可在本 Change内建立最小 deterministic package-ref helper，而不要扩展为 Registry。

### 6. Same-candidate correction is evidence selection, not a correction lifecycle

Full Test host / Guidance不执行 repository correction。对于纯 external mechanics correction：重新 derive candidate；若仍是 package candidate，则重新 resolve material check identities，只复用 candidate+checkRef 都 exact match 的 prior PASS，并执行其余 affected checks。

一旦 candidate 变化：当前 attempt 立即 STOP，返回“repository/canonical correction required / current evidence not admissible”的 bounded result；后续 mutation 只能由独立 Owner-controlled correction/revise flow处理。新 candidate 重新走 exact Full Test authority/package。

### 7. Product Guidance is generic; repository-local fixture stays outside it

`skills/delivery/full-test/SKILL.md`只规定：validate package/Guidance/authority → execute exact bound checks → exact admission → same/new candidate correction boundary → STOP。不得写死 `pnpm typecheck` 等 flowkit-next commands。

flowkit-next 的六条 gate 只放在 tests/fixture 或当前 D04 verification setup中，用来证明一个 project-local plan可以被 generic host执行。

## Risks / Trade-offs

- **[Risk] Reusing Action check resolver accidentally reorders Full Test checks** → Full Test使用保持输入 order 的独立/neutral resolver，只共享 declaration/ref identity mechanics。
- **[Risk] Broad Owner scope被误当成 Full Test authority** → boundary recognizer要求 exact singleton scope与 absent `changeId`。
- **[Risk] Full Test result type膨胀成 Evidence Platform** → 只保留 package/candidate/check-bound admission所需的 compact execution/result identity，不保存 finding history/database。
- **[Risk] same-candidate correction被实现为 hidden mutation authority** → host只允许外部 mechanics rerun；candidate drift立即 STOP，repository mutation不在该 operation内。
- **[Risk] 为中性 process helper重构 accepted Action code过多** → 优先最小提取/复用，Action public semantics与回归 tests必须保持不变。
