## 1. Delivery package variant

- [x] 1.1 在 `delivery-operation-execution` 中增加 closed `delivery-architecture-finalization` operation facts/package validator，绑定 passed candidate/execution、Current/Planned content identity 与 fixed system-view prestate，并验证 non-null Owner authority fail closed；用 unit/domain tests证明 Start/Full Test unchanged、Final/Repository Integration仍 fail closed。
- [x] 1.2 增加 trusted preparation逻辑，从 terminal passed Full Test outcome与current repository bytes派生 package facts，不接受 caller 覆盖 candidate/architecture/system-view identity；用 stale candidate、failed Full Test、hash/prestate drift 反例测试验证 fail closed。

## 2. Fixed derived-output finalization host

- [x] 2.1 新增 bounded Architecture Finalization host/domain seam，让 derived logic只返回六个 named output content/result，trusted host自行映射到 Actual、两份 thin compare与 Workflow/Lifecycle/Data Flow 六个固定 slots；用测试证明 caller-selected/arbitrary output path没有可用接口。
- [x] 2.2 实现 staged validation/materialization/admission：只有六槽所需内容全部验证通过才写入/admit compact exact closure refs/hashes；用失败 validation/partial output反例证明不会形成成功 closure。
- [x] 2.3 实现 product-truth correction STOP：derived logic无法在六槽内正确收敛时返回 bounded correction-required/STOP，host不修改 source/OpenSpec/product truth；用 fixture反例证明六槽之外 bytes不被 finalization写入。

## 3. Canonical diagram continuity

- [x] 3.1 实现 Workflow/Lifecycle/Data Flow fixed baseline continuity：missing baseline可首次 materialize、existing unchanged semantics exact-byte preserve、changed represented semantics才更新；用 fixture tests覆盖 missing Workflow/Lifecycle与 existing Data Flow preserve。
- [x] 3.2 通过现有 managed Archify resolution执行需要的 exact validation/compare mechanics，并用 tests证明 invalid derived Architecture/system view fail closed；不得扩展 Foundation CLI为 Architecture runner或新增 diagram registry/path framework。

## 4. Canonical Guidance and convergence proof

- [x] 4.1 新增 generic `skills/delivery/architecture-finalization/SKILL.md`，冻结 package/Guidance validation、six-slot derived closure、baseline continuity、product-truth correction STOP 与 operation-boundary STOP；验证 Guidance不包含 D04专属 Actual bytes、项目专属路径发现逻辑或 next-operation authority。
- [x] 4.2 跑 focused/domain regression、OpenSpec strict、managed Archify fixture validation、typecheck/build/format/lint/dependency/entropy/git diff checks，并确认 Apply未 materialize真实 D04 Actual/final system views；全部 PASS 后更新 tasks为完成并生成 Apply Run。
