## MODIFIED Requirements

### Requirement: ActionPackage freezes the exact current execution boundary
系统 SHALL 提供一个 closed package-formation seam，从已经通过既有 structural validation 的 exact current `CurrentAction`、current `RunContextRecord`（或字段等价的 canonical facts）与该 Action 已由 trusted canonical Guidance resolver 形成的 exact `GuidanceRef` 形成一个 closed ActionPackage。formation SHALL 要求 context 的 ActionIdentity 与 current Action identity 完全一致、context lifecycle state 与 current state 完全一致且均为 `prepared`，并要求 context role 精确等于该 Standard Action 的 deterministic execution role；`GuidanceRef` 的 canonical path SHALL 精确对应 current Action 的 `StandardActionId`，并 SHALL 携带 exact canonical content identity。随后 ActionPackage SHALL 复用 context 中的 exact Run occurrence/runId、该 expected execution role、显式 OwnerAuthorityFact 或其 absence、以及 `previousRunId` predecessor provenance，并额外冻结 exact `GuidanceRef`。任一 Run/Action/role/state mismatch、missing/invalid/wrong-Action GuidanceRef、`terminal`/null lifecycle state 或已移除的 `resumed` state SHALL fail closed，且系统 SHALL NOT 形成可执行 ActionPackage。ActionPackage SHALL 具有自己的 exact closed validation envelope，而 SHALL NOT 因新增 execution-only Guidance identity 改变 durable `RunContextRecord` / `context.json` schema。ActionPackage SHALL NOT 以新的 PackageId / ResultId 替代既有 Run occurrence 作为本 capability 的 execution correlation identity。

#### Scenario: Package a prepared current Action
- **WHEN** exact current Action 与 exact current Run occurrence 均属于同一 Standard Action，current state 为 `prepared`，且 trusted resolver 已形成与该 Action 对齐的 valid exact GuidanceRef
- **THEN** 系统 SHALL 形成保留 exact run/action/role/state/authority/predecessor facts 与 exact GuidanceRef 的 ActionPackage

#### Scenario: Reject terminal package input
- **WHEN** 用于形成 ActionPackage 的 current Action/context lifecycle state 为 `terminal`、null、`resumed` 或其他非 `prepared` 值
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 形成可执行 ActionPackage

#### Scenario: Reject mismatched package-formation facts
- **WHEN** current Run context 的 ActionIdentity 或 lifecycle state 与 exact current Action 不一致，或 context role 不等于该 Standard Action 的 deterministic execution role
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 从这些 facts 形成 ActionPackage

#### Scenario: Reject missing or wrong-Action Guidance identity
- **WHEN** package formation 缺失 GuidanceRef，或 GuidanceRef canonical path 不对应 exact current Action 的 `StandardActionId`
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 形成可执行 ActionPackage

#### Scenario: Preserve durable RunContext schema while packaging Guidance
- **WHEN** valid RunContext facts 与 valid exact GuidanceRef 被组合成 ActionPackage
- **THEN** Guidance identity SHALL 只存在于 execution package contract 中，且 SHALL NOT 要求向 durable `context.json` 增加 Guidance field

#### Scenario: Package a re-execution occurrence for the same prepared Action
- **WHEN** exact same current Action 已保持为 `prepared A`，且调用边界为 A 提供新的 valid Run context / Run occurrence 与当前 canonical GuidanceRef
- **THEN** 系统 SHALL 能够直接从 existing `prepared A`、新的 exact Run context 与 exact GuidanceRef 形成新的 ActionPackage，而不得要求再次 prepare A 或引入 `resumed`
