## ADDED Requirements

### Requirement: Delivery Full Test package facts bind one exact candidate, one exact ordered check set, and exact Full Test authority
`delivery-full-test` SHALL 使用一个 closed operation-facts contract，绑定 trusted current repository `candidateRef` 与非空 exact ordered project-local Formal Full Test checks；每个 check SHALL 使用 existing applicable-check declaration semantics 并携带由其 exact material identity 派生的 `checkRef`。Package formation SHALL 保留声明顺序、拒绝 duplicate check id/ref、拒绝 declaration/checkRef mismatch，并 SHALL 要求 structural-valid `OwnerAuthorityFact` 精确满足 `decision=authorize-formal-full-test`、exact current Delivery、`changeId` absent 与 scope exactly `["delivery-full-test"]`。这些 facts/authority SHALL 只支持已决定的 `delivery-full-test` execution，不得决定 correction、Git、finalization 或 next-operation lifecycle。

#### Scenario: Form a valid Delivery Full Test package
- **WHEN** exact Delivery、`delivery-full-test` Guidance、trusted current candidate、non-empty ordered resolved checks 与 exact Full Test Owner authority 全部匹配
- **THEN** 系统 SHALL 形成 executable `DeliveryOperationPackage` 的 `delivery-full-test` concrete variant，同时保持原有 `delivery-start` package 行为不变

#### Scenario: Reject stale candidate, malformed checks, or wrong Full Test authority
- **WHEN** candidate 不是 trusted current candidate、ordered checks 存在 duplicate/mismatched declaration/checkRef，或 authority decision/Delivery/changeId/scope 不精确匹配
- **THEN** `delivery-full-test` package formation SHALL fail closed

#### Scenario: Full Test package cannot fabricate an Action execution envelope
- **WHEN** `delivery-full-test` 需要执行 project-local checks
- **THEN** 系统 SHALL 复用 existing check declaration/ref/process mechanics，但 SHALL NOT 构造假的 Standard Action / ActionPackage 作为 Delivery Full Test 的 execution authority
