## MODIFIED Requirements

### Requirement: Invocation entry establishes or reuses exactly one prepared current Action

系统 SHALL 接受一个已由外部 boundary 选择的 canonical Standard Action identity 作为一次 invocation target。若 exact same target 已经是 externally committed `prepared A`，系统 SHALL 复用该 exact prepared CurrentAction。若 current slot 为空，或 current slot 为不同 identity 的 terminal Action 且既有 structural prepare rule 允许 replacement，系统 SHALL 在 invocation 内部只暂存 structurally valid `A/prepared` candidate；在 package-bound admission/readiness 成功前 SHALL NOT 将该 staged candidate 暴露为新的 externally committed current Action。若 exact current 为 `prepared` Author A，且同一 exact Owner correction boundary 已允许不同的 revise target B，系统 SHALL 可通过有界 supersession transition 暂存 `B/prepared` candidate；只有新 occurrence 的开始及必要完整记录经保存和读回后，B 才能成为对外 current。

对于已由 Policy 验证的 retryable terminal Archive，invocation SHALL 复用 action-lifecycle 的专用 Archive retry contract 暂存同 semantic identity 的新 prepared candidate，并绑定新 occurrence 与原 failed Run；不得复用旧 occurrence 或复制另一套 retry state machine。对于已由同一 exact Policy 核准的普通 Author FAIL correction，invocation SHALL 校验原 terminal context/result、active Change 和 Owner fact；目标 prepared context SHALL 绑定同一 authority、直接 failed parent 与新 occurrence。三个同名 revise SHALL 复用 action-lifecycle 专门结构边，其他合法不同 identity 使用原 prepare。缺少失败来源的裸 READY SHALL NOT 开放同名 entry。失败来源仅为封闭内部输入，不新增 caller CLI 字段。其他 current-slot/target 组合 SHALL fail closed。本 capability SHALL NOT 决定 target 的 Policy eligibility。

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

#### Scenario: Stage the same revise after its terminal failure

- **WHEN** exact terminal revise FAIL/null 和 Owner correction 已核准，目标新 context 绑定同一 authority/parent
- **THEN** invocation SHALL 仅暂存新 prepared candidate，通过 package admission/readiness 后才发布 current，不执行下一 Action

#### Scenario: Reject a bare boundary for same-revise entry

- **WHEN** same terminal revise 请求没有可验证原失败 pair/Owner，或目标 context 的 parent/authority 不一致
- **THEN** invocation SHALL fail closed，不准备或执行新 occurrence

#### Scenario: Keep failed preparation unpublished

- **WHEN** 新 correction candidate 暂存后 package/readiness 被拒绝
- **THEN** invocation SHALL 不发布新 current、不执行业务，旧 terminal occurrence SHALL 保持
