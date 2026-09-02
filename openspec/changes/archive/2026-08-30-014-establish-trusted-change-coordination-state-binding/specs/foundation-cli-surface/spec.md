## ADDED Requirements

### Requirement: CLI resolves trusted Delivery-Change coordination state before lifecycle use
对于 `status` 与 `next`，CLI SHALL 以 exact repository root、Delivery ID 与 Change ID 定位 repository-owned durable Delivery coordination truth，并在报告 Change state 或构造 Policy facts 前解析唯一 trusted canonical `ChangeState`。CLI SHALL fail closed on missing/mismatched Delivery identity、missing/duplicate exact Change、invalid state，或其他无法得到唯一 canonical coordination fact 的输入；resolver SHALL read only and SHALL NOT mutate Delivery state、Owner authority、OpenSpec Change artifacts、Run/Result 或 Git。

当 durable exact Change state 为 `active` 时，resolver SHALL 仅在以下条件同时满足时把该 state 视为 lifecycle-enterable `active`：存在 structural-valid OwnerAuthorityFact，且 `decision=activate-change`、exact Delivery ID、exact Change ID、`scope=["explore"]`；并且该 Change 的所有 direct `dependsOn` target 在同一 exact Delivery coordination truth 中唯一存在且 state 为 `completed`。缺少 matching provenance、wrong Delivery/Change、任何非 exact `scope=["explore"]`、missing/duplicate dependency target 或 dependency state 非 `completed` 时 SHALL fail closed，且 MUST NOT 将该 Change 提升为 lifecycle-enterable `active`。

对于 `planned`、`completed`、`cancelled`，historical activation provenance SHALL NOT 将 current state self-upgrade 为 `active`。CLI MUST NOT 建立第二 current-state store、coordination registry、background reconciliation 或 generic Owner-authority subsystem。

#### Scenario: Planned Change cannot self-upgrade through caller input
- **WHEN** durable exact Change state 为 `planned`，即使 caller 尝试提供或伪造 `active` assertion
- **THEN** trusted resolution SHALL 保持 canonical `planned`，且 `next` 进入 Policy 后 SHALL NOT 获得 active-Change lifecycle legality

#### Scenario: Planned Change may report incomplete direct dependency without integration failure
- **WHEN** durable exact Change state 为 `planned`，且其 direct `dependsOn` target 当前 state 不是 `completed`
- **THEN** trusted resolution SHALL 仍可报告 canonical `planned`，且 MUST NOT 仅因 dependency 尚未 completed 将普通 planned coordination state 视为 resolver integration failure；dependency-completion eligibility SHALL 仅在 durable state=`active` 时执行

#### Scenario: Exact Owner activation makes active state lifecycle-enterable
- **WHEN** durable exact Change state 为 `active`，matching structural-valid OwnerAuthorityFact 为 `decision=activate-change`、exact Delivery/Change、exact `scope=["explore"]`，且所有 direct dependencies 均为 `completed`
- **THEN** resolver SHALL 产生 canonical lifecycle-enterable `active` 供 `status` / `next` 使用

#### Scenario: Structurally valid wrong-scope activation fails closed
- **WHEN** durable exact Change state 为 `active` 且 only matching structural-valid `activate-change` fact 的 scope 为 `checkpoint`、`propose`、`archive`、`["activate-change","explore"]` 或其他非 exact `["explore"]`
- **THEN** resolver SHALL fail closed，且 MUST NOT 产生 lifecycle-enterable `active`

#### Scenario: Activation authority cannot cross Change or Delivery identity
- **WHEN** Owner activation fact 属于另一个 Change 或另一个 Delivery
- **THEN** resolver SHALL NOT 将该 fact 用于当前 exact Delivery + Change 的 active eligibility

#### Scenario: Direct dependency must be completed for durable active
- **WHEN** durable exact Change state 为 `active`，且该 Change 声明 direct `dependsOn`，而任一 target missing、duplicated、invalid 或 state 不是 `completed`
- **THEN** resolver SHALL fail closed，且该 Change MUST NOT 成为 lifecycle-enterable `active`

#### Scenario: Completed or cancelled state is not revived by old activation evidence
- **WHEN** current durable Change state 为 `completed` 或 `cancelled` 且历史中仍存在 matching `activate-change` OwnerAuthorityFact
- **THEN** resolver SHALL 保持 current durable state，且 MUST NOT 从历史 activation provenance 推导 `active`

## MODIFIED Requirements

### Requirement: CLI current-Run authority is always explicit, including explicit absence
当 command 需要 current-Run choice 时，caller/host SHALL 显式提供该 choice：存在 current Run 时提供 exact current Run occurrence reference 以及构造受控 Run address 所需的 exact Delivery、Change 与 Change-start facts；`next` 在 trusted coordination resolver 已将 exact Change 解析为 lifecycle-enterable `active` 且尚无 current Run 时 MAY 显式提供 JSON `currentRunId:null` 表示 canonical CurrentAction slot 为空。exact-run form SHALL 使用既有 canonical Run occurrence parser/addressing/read contract 读取且只读取该 occurrence；explicit-null form SHALL 不读取任何 Run，并 SHALL 直接产生 `currentAction=null`、`currentRunContext=null`、`currentRunResult=null` 的 Policy facts。省略/undefined currentRunId MUST NOT 被归一化为 explicit null。Run history ordering SHALL 只具有 reporting 意义，MUST NOT 通过 max sequence、mtime、directory order、Git history 或其他 implicit latest heuristic 选择 current Run 或推断其不存在。

#### Scenario: Exact selected Run is read
- **WHEN** caller 提供 canonical DeliveryId、ChangeId、Change start sequence 与 exact canonical runId
- **THEN** CLI SHALL parse exact runId、通过 controlled durable Run address 读取该 occurrence，并 SHALL 仅以该 selected Run 作为 current-Action source

#### Scenario: Higher-sequence disconnected Run also exists
- **WHEN** selected Run 之外还存在 sequence 更高但不属于 caller-selected authority 的合法 durable Run
- **THEN** CLI SHALL 忽略该 Run 对 current-Action/Policy composition 的影响，且 MUST NOT 因 sequence 更高而选择它

#### Scenario: Explicitly represent an active Change with no current Run
- **WHEN** trusted coordination resolver 已将 exact Change 解析为 lifecycle-enterable `active` 且 `next` caller 显式提供 exact `currentRunId:null`
- **THEN** CLI SHALL 不读取任何 Run， SHALL 以 `currentAction=null`、`currentRunContext=null`、`currentRunResult=null` 调用 canonical Policy，并 MUST NOT 扫描 history 来证明或替代该 explicit absence

#### Scenario: Run choice is omitted or malformed
- **WHEN** command contract 要求 current-Run choice 但 caller 省略该字段、提供 undefined-equivalent/malformed value，或 non-null runId 无法通过 canonical occurrence parser/addressing contract
- **THEN** CLI SHALL fail closed，且 MUST NOT 将 missing input 当成 explicit null，也 MUST NOT fallback 到 history scan 或 implicit latest selection

### Requirement: status reports selected formal facts without advancing lifecycle
`flowkit status` SHALL 以显式 caller-owned repository、Delivery/Change identity、Change-start facts 与 exact selected durable Run 为输入，并 SHALL 在报告 `changeState` 前通过同一 trusted coordination resolver 得到 exact Delivery + Change 的 canonical coordination state；caller MUST NOT 提供 authority-bearing `changeState`。`status` MAY 组合既有只读 OpenSpec active/exact-Change observation，返回 deterministic machine-readable status document。`status` MUST NOT 调用 Policy 来创造 next boundary，MUST NOT 从 history ordering 推断 currentness，且 MUST NOT 修改 lifecycle、Run/Result、OpenSpec、Memo、Archify、Delivery coordination truth 或 Git state。

#### Scenario: Report exact selected Run and OpenSpec facts
- **WHEN** caller 提供合法 exact identity/current-Run inputs，trusted coordination resolution 成功，且 approved OpenSpec observations 成功
- **THEN** `status` SHALL 返回 resolved canonical `changeState`、exact selected Run 与对应 OpenSpec facts，并 SHALL NOT 自动准备或执行任何 Standard Action

#### Scenario: Caller cannot override reported Change state
- **WHEN** durable trusted Change state 与 caller 试图声称的 state 不一致
- **THEN** `status` SHALL 只报告 trusted resolved state，且 authority-bearing caller `changeState` SHALL 不属于当前 request contract

#### Scenario: Reporting data cannot create authority
- **WHEN** status output 包含 durable history、resolved coordination state 或 OpenSpec planning/readiness facts
- **THEN** 这些 facts SHALL 仅用于报告，且 MUST NOT 被 CLI 提升为 current-Run authority、Policy decision、Reviewer/Verification verdict、额外 Owner authority 或 Git permission

### Requirement: next delegates lifecycle legality exclusively to canonical Policy
`flowkit next` SHALL 从 exact repository/Delivery/Change identity、trusted resolved canonical `ChangeState` 与 explicit current-Run choice 构造 canonical Policy input，并 SHALL 只调用既有 Policy contract 得到 `ready-action`、`ready-checkpoint-evaluation` 或 `blocked` decision。caller MUST NOT 提供 authority-bearing `changeState`。对于 explicit `currentRunId:null`，CLI SHALL 传递 `currentAction=null` 与 null terminal facts；对于 terminal selected Run，CLI SHALL 使用该 exact Run 的 matching context/result；对于 prepared selected Run，CLI SHALL NOT 制造 terminal context/result。CLI MUST NOT 内置或复制 lifecycle transition table，也 MUST NOT 执行 Policy 返回的 Action。

#### Scenario: Terminal selected Run produces the Policy decision
- **WHEN** exact selected Run 是 terminal、其 context/result linkage 合法且 trusted coordination resolution 成功
- **THEN** `next` SHALL 将该 exact terminal facts 与 resolved canonical Change state 交给 canonical Policy，并原样报告 Policy decision

#### Scenario: Prepared selected Run does not gain terminal facts
- **WHEN** exact selected Run 的 lifecycle state 为 `prepared`
- **THEN** `next` SHALL 以 null terminal RunContext/Result 构造 Policy facts，且 MUST NOT 从其他 Run 或 history 制造 terminal evidence

#### Scenario: Active Change with no current Run reaches canonical Explore boundary
- **WHEN** trusted resolver 已将 exact Change 解析为 lifecycle-enterable `active` 且 caller 对 `next` 显式提供 `currentRunId:null`
- **THEN** `next` SHALL 以 resolved `active` 与 null CurrentAction/RunContext/Result 调用 canonical Policy，并 SHALL 原样返回 Policy 的 `READY_ACTION(explore)` decision，而不得创建 Run、扫描 history 或自动执行 Explore

#### Scenario: Untrusted active claim cannot reach Policy as active
- **WHEN** durable coordination/provenance/dependency facts 不足以解析 lifecycle-enterable `active`
- **THEN** `next` SHALL fail closed before Policy receives an authoritative `active` fact，且 MUST NOT 以 caller assertion 替代 trusted resolution

#### Scenario: Policy returns blocked
- **WHEN** canonical Policy 对 trusted resolved facts 返回 `blocked(reason)`
- **THEN** `next` SHALL 将该 closed Policy decision 作为合法 machine outcome 返回，且 MUST NOT 将 blocked 自动转换成新的 Action、Owner correction 或 process/integration failure
