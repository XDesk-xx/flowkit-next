## MODIFIED Requirements

### Requirement: Invocation entry establishes or reuses exactly one prepared current Action
系统 SHALL 接受一个已由外部 boundary 选择的 canonical Standard Action identity 作为一次 invocation target。若 exact same target 已经是 externally committed `prepared A`，系统 SHALL 复用该 exact prepared CurrentAction。若 current slot 为空，或 current slot 为不同 identity 的 terminal Action且既有 structural prepare rule 允许 replacement，系统 SHALL 在 invocation 内部只暂存 structurally valid `A/prepared` candidate；在 package-bound preparation/readiness 成功前 SHALL NOT 将该 staged candidate 暴露为新的 externally committed current Action。其他 current-slot/target 组合 SHALL fail closed。本 capability SHALL NOT 决定 target 的 Policy eligibility。

#### Scenario: Internally prepare an empty current slot
- **WHEN** current slot 为空且 invocation target 为 canonical Standard Action A
- **THEN** invocation entry SHALL 可在本次 invocation 内暂存 structurally valid `A/prepared` candidate，但 SHALL NOT 在 package-bound preparation成功前把它提交为 externally current Action

#### Scenario: Reuse the same prepared Action for a later invocation
- **WHEN** exact current Action 已为 `A/prepared`，且外部 boundary 再次选择执行同一个 canonical Action A
- **THEN** invocation entry SHALL 复用 existing `A/prepared`，不得调用会被拒绝的 duplicate `prepare A`

#### Scenario: Reject a different target over a prepared Action
- **WHEN** current slot 为 `A/prepared` 但 invocation target 为 B 且 `B != A`
- **THEN** invocation entry SHALL fail closed，而不得替换 current Action

### Requirement: Each invocation binds execution to one new exact Run occurrence and ActionPackage
每次实际 Standard Action invocation SHALL 使用 exact invocation target、当前/暂存的 exact prepared Action identity、一个 exact current Run occurrence/context 与 exact canonical GuidanceRef 形成一个 ActionPackage；同一个 externally committed `prepared A` 的后续再次 invocation SHALL 使用新的 exact Run occurrence 来区分 execution occurrence，而 SHALL NOT 通过 `resumed`、retry counter、attempt id、PackageId、PreparationPackage 或 ResultId 建立第二套 execution identity。形成的 package SHALL 满足既有 ActionPackage closed validation contract，并 SHALL 是该 invocation 中 package-bound preparation与后续 execution 的同一 exact package identity。

#### Scenario: Form the first exact execution package
- **WHEN** invocation target A 可被 structurally staged 为 `A/prepared`，且当前 Run context 与 canonical GuidanceRef 均有效
- **THEN** 系统 SHALL 从该 exact staged prepared identity、exact Run occurrence与 exact GuidanceRef 形成一个 ActionPackage，并在 preparation成功前不得把 staged prepared identity 暴露为新的 externally current Action

#### Scenario: Re-execute the same prepared Action with a new Run occurrence
- **WHEN** 前一次 invocation 未能 admission Result而 externally current Action 保持 `A/prepared`，且后续 invocation 获得新的 exact Run occurrence/context
- **THEN** 系统 SHALL 从同一 `A/prepared` 与新的 Run context 形成新 ActionPackage，旧 occurrence/package SHALL NOT 被当作当前 execution occurrence

## ADDED Requirements

### Requirement: Package-bound preparation can block before a newly prepared Action is committed
当 invocation 需要从空/terminal current slot 建立新的 prepared Action 时，系统 SHALL 在同一个 exact ActionPackage identity 下执行一个只读 preparation/readiness step。若该 step BLOCK/FAIL 于 Action execution 之前，系统 SHALL NOT 调用 Action execution callback，SHALL NOT 暴露/提交 staged prepared candidate，并 SHALL 返回 pre-invocation current Action unchanged。若 preparation PASS，系统才可使用/提交 exact prepared candidate并继续既有 execution/admission/terminal flow。该行为 SHALL NOT 新增 Action、lifecycle state、PreparationPackage、Preparation Run 或 rollback lifecycle。

#### Scenario: Blocked preparation preserves the terminal review boundary
- **WHEN** current Action 为 terminal `review-apply`，Policy 已选择 exact `archive` target，且 package-bound archive readiness BLOCKS before archive execution
- **THEN** invocation SHALL 返回原 terminal `review-apply` current Action unchanged，SHALL NOT 调用 archive execution callback，并 SHALL NOT 暴露新的 `archive/prepared` current Action

#### Scenario: Successful preparation continues the existing Action execution
- **WHEN** package-bound preparation for exact Action A PASS
- **THEN** invocation SHALL continue with the same exact ActionPackage into existing Action execution/result-admission/terminalization behavior without creating a second preparation identity
