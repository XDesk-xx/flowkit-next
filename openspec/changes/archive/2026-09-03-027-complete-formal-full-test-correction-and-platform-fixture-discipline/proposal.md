## Why

Change 1 已建立 exact Delivery-operation package 与 canonical Delivery Guidance，但 `delivery-full-test` 仍没有 concrete package facts / execution contract。D04 需要把 Formal Full Test 绑定到 exact current candidate、exact ordered project-local check set 与显式 Owner authority，并冻结“纯环境修正可保持同一 candidate、repository/canonical mutation 必须结束当前尝试并以新 candidate 重启”的边界。

## What Changes

- 为现有 `DeliveryOperationPackage` 增加唯一的 `delivery-full-test` concrete facts variant：绑定 exact current `candidateRef`、exact ordered project-local Formal Full Test checks 及其 content-bound `checkRef`，并拒绝 unknown/duplicate/mismatched facts。
- 复用现有 `ApplicableCheckDeclaration` / `deriveApplicableCheckRef` 作为 project-local check identity vocabulary；package 保留 Owner 已定义的 Full Test 顺序，不扫描 package scripts、不发现命令、不创建 `FullTestPlanId` / Registry / Planner。
- 要求 exact `OwnerAuthorityFact`：`decision=authorize-formal-full-test`、exact Delivery、无 `changeId`、scope 恰为 `["delivery-full-test"]`。该 authority 只允许执行 Full Test，不包含 correction、Change、Git、Architecture Finalization、Delivery Final 或 next-operation authority。
- 新增 canonical `skills/delivery/full-test/SKILL.md`，只描述通用执行 / correction / STOP HOW；flowkit-next 当前六条 gate 仅作为本仓库 D04 proof fixture，不进入通用产品 Guidance。
- Formal Full Test result/admission 绑定 exact candidate 与 exact material check identities：纯 environment / fixture / command-setup 修正若 repository candidate 未变，可在同一 candidate 上重跑受影响 checks；任何 repository/canonical mutation 都结束当前尝试、进入独立 Owner-controlled correction/revise flow，并以新 candidate 重新授权/重启 Full Test。
- 平台 fixture mechanics 可以不同，但 semantic proof obligation 不得弱化。

## Capabilities

### New Capabilities
- `formal-full-test-execution-and-correction`: 定义 exact project-local Full Test check set 的执行、evidence admission、same-candidate external correction、new-candidate repository correction 与 platform-fixture discipline。

### Modified Capabilities
- `delivery-operation-execution-and-start-continuity`: 为既有 exact Delivery-operation package 增加 `delivery-full-test` concrete facts / authority variant，而不改变 Delivery Start 已接受行为。

## Impact

- 主要影响 `src/domain/delivery-operation-execution.ts`，并新增 bounded `delivery-full-test` host/domain seam、对应 unit/domain tests 与 `skills/delivery/full-test/SKILL.md`。
- 复用现有 applicable-check candidate/check identity、process mechanics 与 `OwnerAuthorityFact`；不得伪造 ActionPackage 来运行 Delivery Full Test。
- 不修改 Standard Action lifecycle / Policy，不新增 Full Test lifecycle、Registry/Planner、finding database、candidate invalidation subsystem、automatic correction/Git authority，也不实现 Change 3–5。
