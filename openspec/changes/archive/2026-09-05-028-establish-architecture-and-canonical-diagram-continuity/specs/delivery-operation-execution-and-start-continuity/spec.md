## ADDED Requirements

### Requirement: Delivery Architecture Finalization package binds exact passed verification and derived-input prestate without Owner mutation authority
`delivery-architecture-finalization` SHALL 使用现有 `DeliveryOperationPackage` envelope 的一个 closed concrete facts variant，绑定 exact passed `verifiedCandidateRef`、exact `fullTestExecutionRef`、Current/Planned Architecture exact content identity 与 Workflow/Lifecycle/Data Flow fixed system-view prestate。Trusted preparation host SHALL 从 current repository 与 trusted terminal passed Full Test outcome验证/形成这些 facts，而 SHALL NOT 接受 caller 提交 reusable candidate/architecture identity覆盖 canonical facts。该 operation 的 `ownerAuthority` SHALL 为 explicit `null`；non-null Full Test/Delivery Final/Git/other Owner authority SHALL fail closed。Package SHALL 只绑定已经由 trusted Delivery boundary/caller决定的 `delivery-architecture-finalization` WHAT 与 exact HOW/context，不得决定 next operation。

#### Scenario: Form a valid Architecture Finalization package
- **WHEN** exact Delivery、matching canonical Architecture Finalization Guidance、trusted passed Full Test candidate/execution identity、exact Current/Planned content identity与fixed system-view prestate全部一致，且 `ownerAuthority=null`
- **THEN** 系统 SHALL 形成 executable `delivery-architecture-finalization` concrete `DeliveryOperationPackage`

#### Scenario: Reject stale proof, mismatched architecture inputs, or smuggled Owner authority
- **WHEN** current candidate 不等于 passed Full Test candidate、Full Test execution identity不一致、Current/Planned/system-view prestate stale/mismatched，或 package 携带 non-null Owner authority
- **THEN** package formation SHALL fail closed，并 SHALL NOT 从 Full Test authority、Delivery Final authority或 Git authority推导 Architecture Finalization permission

#### Scenario: Existing Delivery Start and Full Test package behavior remains unchanged
- **WHEN** 新增 `delivery-architecture-finalization` concrete variant
- **THEN** accepted `delivery-start` 与 `delivery-full-test` package validation/execution semantics SHALL 保持不变，且 `delivery-final` / `delivery-repository-integration` 仍 SHALL fail closed直到其各自 Change 实现
