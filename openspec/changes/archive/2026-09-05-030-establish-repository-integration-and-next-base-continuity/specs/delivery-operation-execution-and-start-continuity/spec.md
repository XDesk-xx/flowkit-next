## ADDED Requirements

### Requirement: Repository Integration package binds exact finalized continuity Git prestate and exact Git authority
`delivery-repository-integration` SHALL 使用既有 `DeliveryOperationPackage` envelope 的一个closed concrete facts variant，绑定trusted `DeliveryFinalizationRecord` identity、existing `finalizedCandidateRef`、exact `preIntegrationHead`、exact Delivery branch、`targetMainRef`、`targetMainPreIntegrationCommit`与accepted base/history facts。Package SHALL 要求exact `authorize-repository-integration` singleton Owner authority与matching content-bound `skills/delivery/repository-integration/SKILL.md` Guidance。Trusted preparation SHALL 从current repository/Git与Delivery Final owners验证/形成这些facts，而 SHALL NOT接受caller覆盖candidate、commit/ref、accepted-main或authority identity。

Package SHALL NOT预声明terminal `acceptedMainCommit`；该identity只可在repository acceptance后由trusted Git observation形成。任一extra/malformed/stale/mismatched facts、authority或Guidance SHALL fail closed。

#### Scenario: Form a valid Repository Integration package
- **WHEN** exact Delivery、trusted Delivery Final continuity、matching finalized candidate与Git prestate、matching canonical Guidance及exact singleton repository-integration authority全部一致
- **THEN** system SHALL 形成 executable `DeliveryOperationPackage` 的 `delivery-repository-integration` concrete variant

#### Scenario: Reject stale or caller-substituted Git facts
- **WHEN** caller提供stale/forged candidate、HEAD、branch、target-main prestate、predeclared accepted-main SHA、wrong/broader authority或wrong Guidance
- **THEN** package formation SHALL fail closed，并 SHALL NOT从Delivery Final/Reviewer/Verification/Run prose推断缺失Git authority或terminal identity

#### Scenario: Existing Delivery operation boundaries remain unchanged
- **WHEN** 新增`delivery-repository-integration` concrete variant
- **THEN** accepted `delivery-start`、`delivery-full-test`、`delivery-architecture-finalization`与`delivery-final` package validation/execution semantics SHALL 保持各自exact authority/STOP边界，且 Repository Integration SHALL NOT改写这些operation为Git/promotion lifecycle或自动选择下一Delivery
