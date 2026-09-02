## MODIFIED Requirements

### Requirement: Trusted Guidance is frozen only after Action selection and before Agent execution
系统 SHALL 在 exact current Standard Action 已由既有 lifecycle / authority boundary 决定之后，且在任何 product Action Guidance preparation/execution HOW 被执行之前，解析并冻结该 Action 的 exact Guidance identity进同一个 ActionPackage。若 invocation 正在从空/terminal slot 暂存新的 prepared candidate，系统 MAY 使用该 staged exact Action identity形成 ActionPackage，但 SHALL NOT 在 package-bound preparation成功前把 staged candidate提交为新的 externally current Action。Guidance resolution SHALL NOT 选择或改变 Standard Action、execution role、Owner authority、Policy legality、Reviewer verdict、Verification truth 或 next Action；Guidance resolution failure SHALL 在任何 product Guidance HOW callback 之前结束当前 invocation attempt。

#### Scenario: Valid Guidance reaches the bounded execution package
- **WHEN** invocation 已拥有 exact prepared或staged-prepared Action identity，且其 canonical Guidance entry 成功解析
- **THEN** 系统 SHALL 在任何 product Guidance HOW执行前把 exact Guidance identity冻结进 ActionPackage，并 SHALL 让 preparation与后续 execution消费同一个 exact package Guidance identity

#### Scenario: Guidance resolution failure prevents Agent execution
- **WHEN** exact invocation target 的 canonical Guidance entry解析失败
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 调用 package-bound preparation或Action execution callback

#### Scenario: Guidance cannot change the already-decided Action
- **WHEN** exact current invocation target 已确定为 `review-propose`
- **THEN** Guidance resolution或package-bound preparation SHALL NOT 将其改为其他 Standard Action、Role或 next Action

#### Scenario: Package identity changes when canonical Guidance bytes change
- **WHEN** exact Action、Run context和其他 package facts不变，但 canonical Guidance file bytes改变
- **THEN**后续 invocation形成的 ActionPackageRef SHALL 改变，且 preparation与execution SHALL 都受该新 exact package identity约束
