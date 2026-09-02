## 1. Delivery exact-operation contracts

- [x] 1.1 实现 closed five-value `DeliveryOperationId` 与 deterministic `skills/delivery/**/SKILL.md` mapping，并用 unit tests 验证 5/5 exact mapping、unknown/alias input fail closed。
- [x] 1.2 实现 content-bound `DeliveryGuidanceRef` resolver/validator，并用 unit tests 验证 exact path/hash、byte drift、missing/unreadable/non-regular/symlink/wrong-operation 与 `.agents` fallback 均按 contract fail closed。

## 2. Minimal package and Delivery Start facts

- [x] 2.1 实现 stable `DeliveryOperationPackage` envelope 与 per-operation closed facts validation seam，并用 unit tests 验证 wrong Delivery/operation/Guidance/facts/extra fields/required authority mismatch fail closed，且 package 不包含 Action lifecycle/Run/role semantics。
- [x] 2.2 实现 `DeliveryStartOperationFacts` 与 exact `create-delivery` boundary recognition，并用 tests 验证 accepted base、planning-reference identity/hash、`delivery-start` scope 与 optional `single-delivery-start-fixed-point-commit` scope 的 exact eligibility。

## 3. Delivery Start execution HOW

- [x] 3.1 新增 canonical `skills/delivery/start/SKILL.md`，覆盖 exact accepted-base/clean-start verification、state-first reuse-or-restore、manifest + Current + Planned + compare materialization/validation、commit-authority STOP rule 与 fixed-point closure，并用 Guidance resolver test验证真实 entry 可被 exact content identity 解析。
- [x] 3.2 建立 bounded Delivery Start host/callback execution seam，并用 tests证明 package形成前先验证 canonical Git/planning facts、callback消费同一个 exact package/Guidance identity、无 commit authority时不产生 Git mutation、有 bounded authority时至多形成一个 fixed-point commit并 STOP。

## 4. Regression and scope proof

- [x] 4.1 保持 accepted Action Guidance/ActionPackage/single-Action tests 全部 PASS，并验证本 Change没有修改 Standard Action lifecycle/Policy semantics。
- [x] 4.2 运行 applicable unit/domain tests、`openspec validate establish-delivery-operation-execution-and-start-continuity --strict`、`openspec validate --all --strict`、`git diff --check`，并确认 Change 2–5 concrete HOW、Registry/Router/Planner、CLI auto-run、`.agents` product projection、self-hosting takeover 与 automatic Git authority 均未进入 actual change set。
