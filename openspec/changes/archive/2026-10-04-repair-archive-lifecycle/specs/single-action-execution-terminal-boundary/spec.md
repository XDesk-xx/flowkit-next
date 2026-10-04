## MODIFIED Requirements

### Requirement: Invocation entry establishes or reuses exactly one prepared current Action
系统 SHALL 接受一个已由外部 boundary 选择的 canonical Standard Action identity 作为一次 invocation target。若 exact same target 已经是 externally committed `prepared A`，系统 SHALL 复用该 exact prepared CurrentAction。若 current slot 为空，或 current slot 为不同 identity 的 terminal Action 且既有 structural prepare rule 允许 replacement，系统 SHALL 在 invocation 内部只暂存 structurally valid `A/prepared` candidate；在 package-bound admission/readiness 成功前 SHALL NOT 将该 staged candidate 暴露为新的 externally committed current Action。若 exact current 为 `prepared` Author A，且同一 exact Owner correction boundary 已允许不同的 revise target B，系统 SHALL 可通过有界 supersession transition 暂存 `B/prepared` candidate；只有新 occurrence 的开始及必要完整记录经保存和读回后，B 才能成为对外 current。

对于已由 Policy 验证的 retryable terminal Archive，invocation SHALL 复用 action-lifecycle 的专用 Archive retry contract 暂存同 semantic identity 的新 prepared candidate，并绑定新 occurrence 与原 failed Run；不得复用旧 occurrence 或复制另一套 retry state machine。其他 current-slot/target 组合 SHALL fail closed。本 capability SHALL NOT 决定 target 的 Policy eligibility。

#### Scenario: Internally prepare an empty current slot
- **WHEN** current slot 为空且 invocation target 为 canonical Standard Action A
- **THEN** invocation entry SHALL 可在本次 invocation 内暂存 structurally valid `A/prepared` candidate，但 SHALL NOT 在 package-bound preparation 成功前把它提交为 externally current Action

#### Scenario: Reuse the same prepared Action for a later invocation
- **WHEN** exact current Action 已为 `A/prepared`，且外部 boundary 再次选择执行同一个 canonical Action A
- **THEN** invocation entry SHALL 复用 existing `A/prepared`，不得调用会被拒绝的 duplicate `prepare A`

#### Scenario: Reject a different target over a prepared Action
- **WHEN** current slot 为 `A/prepared` 但 invocation target 为不同的 B，且不存在对此 exact A/B 有效的 Owner correction boundary
- **THEN** invocation entry SHALL fail closed，而不得替换 current Action

#### Scenario: Stage authorized prepared supersession
- **WHEN** current 为 `prepared` Author A、Policy 已对同一 A/B 和 exact Owner authority 返回 `READY_ACTION(B)`，且 structural supersession 允许 B
- **THEN** invocation entry SHALL 仅暂存 `B/prepared`，并 SHALL 以新 occurrence、前序指针、authority 和 canonical GuidanceRef 形成新 ActionPackage；不得先改写 A

#### Scenario: Stage only an eligible Archive retry
- **WHEN** exact failed Archive 的 retry boundary 已核准且新 occurrence 有效
- **THEN** invocation SHALL 使用专用结构转换及同一个新 ActionPackage，保留旧 terminal 结果；无有效 boundary 时拒绝

### Requirement: Package-bound preparation can block before a newly prepared Action is committed
当 invocation 需要从空/terminal current slot 建立新的 prepared Action 时，系统 SHALL 在同一个 exact ActionPackage identity 下执行只读 admission/readiness。若该 step BLOCK/FAIL 于 Action execution 之前，系统 SHALL NOT 调用 Action execution callback，SHALL NOT 暴露/提交 staged prepared candidate，并 SHALL 返回 pre-invocation current Action unchanged。若 preparation PASS，系统才可使用/提交 exact prepared candidate并继续既有 execution/admission/terminal flow。该行为 SHALL NOT 新增 Action、lifecycle state、PreparationPackage、Preparation Run 或 rollback lifecycle。

Archive 的该 step SHALL 仅验证 Flowkit lifecycle、Review/candidate、identity、ordinal、Guidance 和记录完整性，不执行原生 archive/validate 预演、repository/dependency snapshot 或项目检查。原生 archive 的成功、失败和 rollback SHALL 属于已经开始的 Archive Run，不能被挪到 preparation 以避免形成失败记录。

#### Scenario: Blocked preparation preserves the terminal review boundary
- **WHEN** current Action 为 terminal `review-apply`，Policy 已选择 exact `archive`，但 Flowkit admission 发现候选漂移或 identity/ordinal 无效
- **THEN** invocation SHALL 返回原 current unchanged，不调用 archive execution callback，也不暴露新的 archive/prepared

#### Scenario: Successful preparation continues the existing Action execution
- **WHEN** package-bound preparation for exact Action A PASS
- **THEN** invocation SHALL continue with the same exact ActionPackage into existing Action execution/result-admission/terminalization behavior without creating a second preparation identity

#### Scenario: Native validation fails after an Archive Run starts
- **WHEN** Flowkit admission 通过而真实 OpenSpec archive 的 delta validation 失败
- **THEN** 该失败 SHALL 记录在已开始的 Archive Run，不能报告成未进入 Archive 的 preparation failure
