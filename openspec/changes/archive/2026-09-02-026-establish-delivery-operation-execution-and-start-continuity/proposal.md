## Why

D03 已证明 Standard Action 可以在 WHAT 已决定后，通过 content-bound canonical Guidance 与 exact package 可靠交给 Agent 执行；D04 需要把同一执行模式扩展到已经决定的 Delivery-level operation，同时避免让 Agent discovery、Skill Router、第二 Delivery lifecycle 或隐式 Git authority 回到控制平面。

## What Changes

- 新增 closed `DeliveryOperationId` contract，固定 `delivery-start`、`delivery-full-test`、`delivery-architecture-finalization`、`delivery-final`、`delivery-repository-integration` 五个 exact operation identity，并以静态 1:1 规则解析 canonical `skills/delivery/**/SKILL.md`。
- 新增 content-bound `DeliveryGuidanceRef` 与 minimal `DeliveryOperationPackage` contract：package 只绑定 already-decided operation、exact Delivery identity、validated operation-specific facts、existing Owner authority fact/null 与 exact Guidance identity，不拥有 lifecycle/next-operation authority。
- Change 1 只实现并证明第一个 concrete variant：`delivery-start` 的 accepted-base / planning-reference facts、显式 Delivery Start authority、exact-state continuity 与 canonical `skills/delivery/start/SKILL.md`。
- Delivery Start 在 exact accepted base 与 clean repository precondition 上 materialize/validate Start surface；只有 exact bounded start-commit authority 存在时才允许形成一个 ordinary fixed-point commit，否则在 Git mutation 前 STOP。
- 保持 `.agents/skills/**` 为 D04 独立 bootstrap/fallback HOW；product Delivery execution 不 fallback 到 `.agents`，也不要求当前 D04 self-host candidate `skills/delivery/**`。

## Capabilities

### New Capabilities
- `delivery-operation-execution-and-start-continuity`: 定义 already-decided Delivery operation 的 closed identity、content-bound canonical Guidance、minimal exact execution package，以及首个 `delivery-start` operation 的 authority / exact-state / fixed-point continuity contract。

### Modified Capabilities

无。

## Impact

- 新增 bounded Delivery-operation domain/host execution seam 与对应 unit tests；复用现有 `OwnerAuthorityFact`、Git repository truth 与 Action exact-operation pattern 的机械经验，但不修改 Action lifecycle semantics。
- 新增 canonical `skills/delivery/start/SKILL.md`。
- 不新增 CLI Delivery runner、Registry/Router/Planner、candidate/continuation database、dynamic Skill discovery、automatic Git authority 或 `.agents/skills/flowkit-delivery-*` product projection。
- Changes 2–5 以后只补各自 operation-specific facts/HOW；不得重新打开本 Change 已冻结的 closed execution model。
