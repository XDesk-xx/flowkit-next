## 1. Delivery Full Test package contracts

- [x] 1.1 在现有 Delivery-operation domain 增加 closed `DeliveryFullTestOperationFacts` 与 exact `delivery-full-test` package variant，并用 tests 验证 current candidate、non-empty ordered checks、duplicate/mismatched checkRef、wrong Guidance/Delivery/extra fields 均 fail closed，同时保证 `delivery-start` regression PASS。
- [x] 1.2 增加 exact Formal Full Test Owner-authority recognizer，要求 `authorize-formal-full-test` + exact Delivery + absent `changeId` + singleton `["delivery-full-test"]`，并用 tests 验证 broader/mismatched/malformed authority 不获得 execution eligibility。

## 2. Exact project-local check resolution and execution

- [x] 2.1 复用 `ApplicableCheckDeclaration` / `deriveApplicableCheckRef` 建立保持输入顺序的 Full Test resolved-check helper，拒绝 duplicate check id/ref 且不扫描/infer repository commands，并用 tests 证明 order 是 package identity的一部分。
- [x] 2.2 建立 bounded Delivery Full Test host：trusted host重新派生 current candidate、解析 exact Guidance、形成 package、按 package order执行 checks，并用 tests证明它复用 neutral process mechanics但不构造 Standard Action/ActionPackage。

## 3. Evidence admission and correction semantics

- [x] 3.1 实现 compact Full Test execution/result admission identity，绑定 exact package/candidate/check refs；在 terminal admission重新派生 candidate，并用 tests验证 candidate drift拒绝 stale evidence、candidate+checkRef exact equality才允许 prior PASS reuse。
- [x] 3.2 实现 same-candidate external correction rerun规则：material check identity变化只使受影响 PASS失效并重跑；repository/canonical candidate变化立即 STOP，不执行 mutation，并用 tests覆盖 same-candidate 与 new-candidate 两条路径。
- [x] 3.3 用跨平台 fixture tests证明 semantic obligation可使用不同 platform mechanics，但不得跳过/弱化 obligation；若需要 repository test-byte correction则走 new-candidate STOP路径。

## 4. Canonical Guidance and regression proof

- [x] 4.1 新增 `skills/delivery/full-test/SKILL.md`，只描述 generic package-bound check execution、exact admission、same/new candidate correction与 STOP HOW，并用 content-bound Guidance resolver test确认文件可被 exact `delivery-full-test` mapping解析且不包含 flowkit-next 六条命令作为通用 catalog。
- [x] 4.2 使用 flowkit-next 当前六条 gate 作为 repository-local Full Test plan fixture运行完整 domain/acceptance proof，并验证 Standard Action/Applicable Check/Delivery Start regressions、OpenSpec strict、typecheck/build/format/lint/dependency/entropy/git diff checks 全部 PASS；确认无 Registry/Planner/finding DB/candidate invalidation/automatic correction-Git authority/Change 3–5 scope drift。
