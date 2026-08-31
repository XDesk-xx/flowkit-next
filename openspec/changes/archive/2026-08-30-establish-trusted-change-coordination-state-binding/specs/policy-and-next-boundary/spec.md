## MODIFIED Requirements

### Requirement: Policy is a pure closed legality decision seam
系统 SHALL 仅基于已经由上游 composition seam 验证/解析完成的 canonical Change structural state、zero-or-one CurrentAction、terminal 时对应的 exact current RunContextRecord + RunResultRecord，以及可选的 explicit Owner correction request 计算当前 legal boundary。Policy SHALL 将输入 `ChangeState` 视为已经完成 exact Delivery + Change coordination/provenance/dependency binding 的 canonical fact；Policy MUST NOT 自行读取/解析 Delivery manifest、hard dependencies、activation OwnerAuthorityFact、OpenSpec filesystem/CLI 或 Git 来决定该 ChangeState。Policy decision SHALL 只允许以下三类 closed result：`READY_ACTION(actionId)`、`READY_CHECKPOINT_EVALUATION`、`BLOCKED(reason)`。Policy SHALL NOT 执行 Standard Action、创建 Run/Result/OwnerAuthorityFact、修改 Change/Action state、读取 OpenSpec filesystem/CLI、执行 Git mutation、调度/poll 下一 Action 或把 READY 解释为 host 已被授权且必须立即 invocation。Policy 继续拥有其 contract 已明确规定的 Policy-specific Owner correction eligibility（例如 `revise-action`），该 eligibility MUST NOT 被 trusted Change coordination resolver 吞并或泛化。

#### Scenario: Report a legal Action without executing it
- **WHEN** canonical resolved facts 唯一确定当前 legal Standard Action 为 `apply`
- **THEN** Policy SHALL 返回 `READY_ACTION(apply)` 并 STOP，且不得执行 apply、创建 Run 或生成 Owner authority

#### Scenario: Consume resolved active without resolving activation provenance
- **WHEN** Policy 收到 exact Delivery/Change identity 与 canonical resolved `changeState=active`
- **THEN** Policy MAY 按既有 active-Change normal matrix 计算 legal boundary，但 MUST NOT 读取 manifest、检查 `activate-change` scope、解析 direct dependencies 或查询 Owner decision provenance

#### Scenario: Preserve Policy-owned revise-action correction eligibility
- **WHEN** terminal Action 的 normal boundary 与 reported-boundary consistency 已满足，且 caller 提供 explicit Owner correction request
- **THEN** Policy SHALL 继续按本 capability 的 `revise-action` exact decision/identity/scope contract 判断 correction eligibility，而不得把该判断委托给 trusted Change coordination resolver

#### Scenario: Reject malformed Policy facts
- **WHEN** Policy input 包含未知 Change/Action state、非法 StandardActionId、malformed OwnerAuthorityFact/correction request、terminal CurrentAction 缺少所需 exact current RunContext/Result pair、Run linkage 不一致，或其他无法作为 canonical facts 解释的输入
- **THEN** Policy SHALL fail closed 为 `BLOCKED(invalid-policy-input)` 或更具体的本 capability blocked reason，且不得 normalize、补默认值、读取 repository truth 或猜测 legal boundary
