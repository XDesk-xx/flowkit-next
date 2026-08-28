# single-action-execution-terminal-boundary Specification

## Purpose
为 Flowkit Core 定义一次 Standard Action invocation 的最小组合边界，使内部 current-Action establishment/reuse、exact ActionPackage execution、Result admission 与 terminalization 在一次调用中闭合，并在结果报告后只 STOP 一次而不自动推进下一 Action。

## Requirements

### Requirement: Invocation entry establishes or reuses exactly one prepared current Action
系统 SHALL 接受一个已由外部 boundary 选择的 canonical Standard Action identity 作为一次 invocation target。若 current slot 为空，或 current slot 为不同 identity 的 terminal Action且既有 structural prepare rule 允许 replacement，系统 SHALL 内部 prepare target 并得到 exact `prepared` CurrentAction；若 exact same target 已经是 `prepared A`，系统 SHALL 复用该 exact prepared CurrentAction，而 SHALL NOT 再次发出 `prepare A`。其他 current-slot/target 组合 SHALL fail closed。本 capability SHALL NOT 决定 target 的 Policy eligibility。

#### Scenario: Internally prepare an empty current slot
- **WHEN** current slot 为空且 invocation target 为 canonical Standard Action A
- **THEN** invocation entry SHALL 内部建立 exact `A/prepared` current Action，并继续同一次 invocation，而不得在 prepare 后形成独立 STOP

#### Scenario: Reuse the same prepared Action for a later invocation
- **WHEN** exact current Action 已为 `A/prepared`，且外部 boundary 再次选择执行同一个 canonical Action A
- **THEN** invocation entry SHALL 复用 existing `A/prepared`，不得调用会被拒绝的 duplicate `prepare A`

#### Scenario: Reject a different target over a prepared Action
- **WHEN** current slot 为 `A/prepared` 但 invocation target 为 B 且 `B != A`
- **THEN** invocation entry SHALL fail closed，而不得替换 current Action

### Requirement: Each invocation binds execution to one new exact Run occurrence and ActionPackage
每次实际 Standard Action invocation SHALL 使用一个 exact current Run occurrence/context 形成其 ActionPackage；同一个 `prepared A` 的后续再次 invocation SHALL 使用新的 exact Run occurrence 来区分 execution occurrence，而 SHALL NOT 通过 `resumed`、retry counter、attempt id、PackageId 或 ResultId 建立第二套 execution identity。形成的 package SHALL 满足既有 ActionPackage closed validation contract。

#### Scenario: Form the first exact execution package
- **WHEN** invocation 已获得 exact `A/prepared` 与一个匹配 A 的 valid current Run context
- **THEN** 系统 SHALL 形成绑定该 exact Run occurrence 的 ActionPackage，并只执行 package 指定的 Standard Action A

#### Scenario: Re-execute the same prepared Action with a new Run occurrence
- **WHEN** 前一次 invocation 未能 admission Result而 `A/prepared` 保持不变，且后续 invocation 获得新的 exact Run occurrence/context
- **THEN** 系统 SHALL 从同一 `A/prepared` 与新的 Run context 形成新 ActionPackage，旧 occurrence/package SHALL NOT 被当作当前 execution occurrence

### Requirement: Successful admission terminalizes only the exact current Action
系统 SHALL 仅在 candidate Result 通过既有 exact Result admission 后，才在同一次 invocation 内 terminalize package/current Action 所指向的 exact same canonical ActionIdentity。terminal transition 失败 SHALL 使 invocation fail closed，且 SHALL NOT 报告该 Action 已完成。

#### Scenario: Admit then terminalize the exact prepared Action
- **WHEN** candidate Result 对 exact current `A/prepared` 与 exact current Run occurrence admission 成功
- **THEN** 系统 SHALL terminalize exact A、保留 admitted Result，并将 invocation 视为 terminal completion

#### Scenario: Do not terminalize an unadmitted Result
- **WHEN** candidate Result admission 失败
- **THEN** 系统 SHALL NOT terminalize current Action，也 SHALL NOT 制造成功 completion fact

### Requirement: Admission failure preserves the prepared Action and stops the invocation
candidate Result admission 失败时，系统 SHALL 保持 exact current Action 为 `prepared`，报告 bounded failure/blocked fact，并结束当前 invocation。系统 SHALL NOT 自动 retry、resume、创建 recovery state、执行下一 Action 或修改当前 Action identity。

#### Scenario: Failed admission leaves the exact Action prepared
- **WHEN** exact `A/prepared` 的 candidate Result 因 Run、Action、state、role 或 outcome-slot mismatch 而 admission 失败
- **THEN** invocation SHALL 以 failure 结束且 current Action 仍为 exact `A/prepared`

#### Scenario: Failed admission does not start another attempt automatically
- **WHEN** 当前 invocation 因 admission failure 结束
- **THEN** 系统 SHALL STOP，且 SHALL NOT 自动创建新 Run occurrence 或再次执行 A

### Requirement: Invocation reports result facts and stops exactly once without interpreting Policy
一次 invocation 成功时，系统 SHALL 报告 admitted Result 与 terminal current-Action fact；失败时 SHALL 报告 bounded failure fact。若 admitted Result 包含 `nextBoundary`/continuation value，系统 SHALL 将其保持为 opaque reported data。无论成功或失败，本 capability SHALL 在当前 invocation boundary 后 STOP，且 SHALL NOT 判断 legal next Action、自动 prepare/execute 下一 Action、创建 Owner authority 或 formal Verification verdict。

#### Scenario: Successful invocation reports opaque continuation and stops
- **WHEN** exact Result admission 与 terminalization 均成功，且 admitted Result 携带 `nextBoundary`
- **THEN** 系统 SHALL 报告该 admitted Result/terminal fact并原样保留 `nextBoundary`，随后 STOP，而不得解释或执行该 boundary

#### Scenario: Failure reports and stops without next execution
- **WHEN** invocation entry、package formation、Result admission或terminal transition任一 fail closed
- **THEN** 系统 SHALL 报告 bounded failure并 STOP，且 SHALL NOT 自动执行其他 Standard Action
