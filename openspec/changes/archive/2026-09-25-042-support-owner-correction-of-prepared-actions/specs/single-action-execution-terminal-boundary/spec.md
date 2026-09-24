## MODIFIED Requirements

### Requirement: Invocation entry establishes or reuses exactly one prepared current Action
系统 SHALL 接受一个已由外部 boundary 选择的 canonical Standard Action identity 作为一次 invocation target。若 exact same target 已经是 externally committed `prepared A`，系统 SHALL 复用该 exact prepared CurrentAction。若 current slot 为空，或 current slot 为不同 identity 的 terminal Action 且既有 structural prepare rule 允许 replacement，系统 SHALL 在 invocation 内部只暂存 structurally valid `A/prepared` candidate；在 package-bound preparation/readiness 成功前 SHALL NOT 将该 staged candidate 暴露为新的 externally committed current Action。若 exact current 为 `prepared` Author A，且同一 exact Owner correction boundary 已允许不同的 revise target B，系统 SHALL 可通过有界 supersession transition 暂存 `B/prepared` candidate；只有新 occurrence 的开始及必要完整记录经保存和读回后，B 才能成为对外 current。其他 current-slot/target 组合 SHALL fail closed。本 capability SHALL NOT 决定 target 的 Policy eligibility。

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

## ADDED Requirements

### Requirement: Prepared supersession start and failure are ordered and non-destructive
系统 SHALL 在新 revise 业务工作前验证 exact current Run、Owner boundary、target、Run address、GuidanceRef 和 ActionPackage，create-once 保存真实新 `action.md` 并读回。开始保存前失败 SHALL 保持旧 prepared current 与所有旧 bytes；开始后的中断或 machine 文件部分保存 SHALL 保留 partial、报告 exact failure 并 STOP，不得自动清理、重试、补结果或执行下一 Action。只有新 Run 完整、admission 与 chain readback 均成功，系统 SHALL 报告新 current/terminal continuation fact。

#### Scenario: Pre-start rejection leaves old current intact
- **WHEN** Owner authority、Policy、target、package 或新地址核对在写入 `action.md` 前失败
- **THEN** 旧 prepared Run SHALL 仍是 current，且其三文件/proof 原 bytes SHALL 不变

#### Scenario: Partial successor stops without rollback guess
- **WHEN** 新 revise 的开始 descriptor 已保存，但读回或后续 context/result 保存失败
- **THEN** 系统 SHALL 保留 partial 并报告，STOP；不得把旧 Run 改成 terminal、把 partial 当完整 current 或自动重演

#### Scenario: Revised Author action returns to independent Review
- **WHEN** 新 revise Author Action 真实完成并以合法 PASS Result terminalize
- **THEN** 系统 SHALL 只报告该 revise 的正常 `review-*` boundary 并 STOP；Reviewer verdict 必须来自后续独立 Action
