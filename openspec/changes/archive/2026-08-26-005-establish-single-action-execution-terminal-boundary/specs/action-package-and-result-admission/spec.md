## ADDED Requirements

### Requirement: Result admission binds to the exact current prepared Action and Run occurrence
系统 SHALL 在 admission 时同时比较 ActionPackage、exact current Action 与 exact current Run occurrence。只有 package ActionIdentity 与 current Action identity 完全一致、package/current state 均完全为 `prepared`、package runId 与 exact current Run occurrence runId 完全一致时，candidate Result 才有资格继续 admission；任一 mismatch SHALL fail closed。

#### Scenario: Reject a stale prior occurrence of the same Standard Action after lifecycle contraction
- **WHEN** 一个旧 ActionPackage 与当前 Action 拥有相同 ActionIdentity、role 与 `prepared` lifecycle state，但 package runId 不等于 exact current Run occurrence runId
- **THEN** 系统 SHALL reject 该 candidate

#### Scenario: Admit exact current prepared occurrence freshness inputs
- **WHEN** package/current Action identity、`prepared` state 与 exact current Run occurrence 均完全一致
- **THEN** 系统 SHALL 允许 candidate Result 进入后续 Result linkage / authority-slot admission checks

#### Scenario: Reject removed or terminal lifecycle states at admission
- **WHEN** package 或 exact current Action 使用 `resumed`、`terminal` 或其他非 `prepared` lifecycle state
- **THEN** 系统 SHALL fail closed，且不得把该 state normalize 为 executable state

## MODIFIED Requirements

### Requirement: ActionPackage freezes the exact current execution boundary
系统 SHALL 提供一个纯 package-formation seam，从已经通过既有 structural validation 的 exact current `CurrentAction` 与 current `RunContextRecord`（或字段等价的 canonical facts）形成一个 closed ActionPackage。formation SHALL 要求 context 的 ActionIdentity 与 current Action identity 完全一致、context lifecycle state 与 current state 完全一致且均为 `prepared`，并要求 context role 精确等于该 Standard Action 的 deterministic execution role；随后 SHALL 复用 context 中的 exact Run occurrence/runId、该 expected execution role、显式 OwnerAuthorityFact 或其 absence、以及 `previousRunId` predecessor provenance。任一 mismatch、`terminal`/null lifecycle state 或已移除的 `resumed` state SHALL fail closed，且系统 SHALL NOT 形成可执行 ActionPackage。ActionPackage SHALL NOT 以新的 PackageId / ResultId 替代既有 Run occurrence 作为本 capability 的 execution correlation identity。

#### Scenario: Package a prepared current Action
- **WHEN** exact current Action 与 exact current Run occurrence 均属于同一 Standard Action，current state 为 `prepared`
- **THEN** 系统 SHALL 形成保留 exact run/action/role/state/authority/predecessor facts 的 ActionPackage

#### Scenario: Reject terminal package input
- **WHEN** 用于形成 ActionPackage 的 current Action/context lifecycle state 为 `terminal`、null、`resumed` 或其他非 `prepared` 值
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 形成可执行 ActionPackage

#### Scenario: Reject mismatched package-formation facts
- **WHEN** current Run context 的 ActionIdentity 或 lifecycle state 与 exact current Action 不一致，或 context role 不等于该 Standard Action 的 deterministic execution role
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 从这些 facts 形成 ActionPackage

#### Scenario: Package a re-execution occurrence for the same prepared Action
- **WHEN** exact same current Action 已保持为 `prepared A`，且调用边界为 A 提供新的 valid Run context / Run occurrence
- **THEN** 系统 SHALL 能够直接从 existing `prepared A` 与新的 exact Run context 形成新的 ActionPackage，而不得要求再次 prepare A 或引入 `resumed`

## REMOVED Requirements

### Requirement: Result admission binds to the exact current Action state and Run occurrence
**Reason**: The previous requirement treats both `prepared` and `resumed` as executable current states and includes prepare-to-resume freshness behavior; the lifecycle is being contracted to `prepared | terminal`.

**Migration**: Use the added `Result admission binds to the exact current prepared Action and Run occurrence` requirement. Exact run occurrence freshness remains mandatory, but only `prepared` is executable.
