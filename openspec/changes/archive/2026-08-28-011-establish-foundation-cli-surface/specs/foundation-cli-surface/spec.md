## Purpose

为 Flowkit Foundation 提供一个最小、可构建、可执行且 fail-closed 的 CLI surface，把既有 lifecycle、Run persistence、Policy、managed-tool 与 OpenSpec observation 能力暴露为显式机器接口，同时保持当前 Delivery 的外部治理与 bootstrap 开发边界不变。

## ADDED Requirements

### Requirement: Foundation CLI has one real runnable package/bin surface
系统 SHALL 提供一个可由受支持 host Node runtime 执行的单一 `flowkit` CLI entrypoint，并 SHALL 通过 repository build contract 将 production TypeScript emit 为该 entrypoint 可加载的 JavaScript。CLI command catalog SHALL 封闭为本 capability 明确规定的 command；未知 command SHALL fail closed。该 build/bin surface MUST NOT 将 Node `22.23.2` 提升为 managed-tool exact runtime authority。

#### Scenario: Build produces a runnable flowkit entrypoint
- **WHEN** repository 在满足 `package.json#engines.node` 的 host Node 上执行批准的 production build
- **THEN** build SHALL 产生 package-declared `flowkit` entrypoint，且该 entrypoint SHALL 能由 host Node 启动并解析受支持 command

#### Scenario: Compatible host Node differs from detached fixture patch
- **WHEN** CLI 在满足 repository Node compatibility declaration 但 patch version 不等于 `22.23.2` 的 host 上启动
- **THEN** CLI SHALL NOT 仅因 patch version 不同而拒绝启动

#### Scenario: Unknown command is requested
- **WHEN** caller 请求不在 `status`、`next`、`doctor` 中的 command
- **THEN** CLI SHALL fail closed with a machine-distinguishable command/input diagnostic，且 MUST NOT 将未知 command 转发给其他 subsystem

### Requirement: CLI current-Run authority is always explicit, including explicit absence
当 command 需要 current-Run choice 时，caller/host SHALL 显式提供该 choice：存在 current Run 时提供 exact current Run occurrence reference 以及构造受控 Run address 所需的 exact Delivery、Change 与 Change-start facts；`next` 在 active Change 尚无 current Run 时 MAY 显式提供 JSON `currentRunId:null` 表示 canonical CurrentAction slot 为空。exact-run form SHALL 使用既有 canonical Run occurrence parser/addressing/read contract 读取且只读取该 occurrence；explicit-null form SHALL 不读取任何 Run，并 SHALL 直接产生 `currentAction=null`、`currentRunContext=null`、`currentRunResult=null` 的 Policy facts。省略/undefined currentRunId MUST NOT 被归一化为 explicit null。Run history ordering SHALL 只具有 reporting 意义，MUST NOT 通过 max sequence、mtime、directory order、Git history 或其他 implicit latest heuristic 选择 current Run 或推断其不存在。

#### Scenario: Exact selected Run is read
- **WHEN** caller 提供 canonical DeliveryId、ChangeId、Change start sequence 与 exact canonical runId
- **THEN** CLI SHALL parse exact runId、通过 controlled durable Run address 读取该 occurrence，并 SHALL 仅以该 selected Run 作为 current-Action source

#### Scenario: Higher-sequence disconnected Run also exists
- **WHEN** selected Run 之外还存在 sequence 更高但不属于 caller-selected authority 的合法 durable Run
- **THEN** CLI SHALL 忽略该 Run 对 current-Action/Policy composition 的影响，且 MUST NOT 因 sequence 更高而选择它

#### Scenario: Explicitly represent an active Change with no current Run
- **WHEN** `next` caller 提供 active Change structural facts 且 exact `currentRunId` 为 JSON `null`
- **THEN** CLI SHALL 不读取任何 Run， SHALL 以 `currentAction=null`、`currentRunContext=null`、`currentRunResult=null` 调用 canonical Policy，并 MUST NOT 扫描 history 来证明或替代该 explicit absence

#### Scenario: Run choice is omitted or malformed
- **WHEN** command contract 要求 current-Run choice 但 caller 省略该字段、提供 undefined-equivalent/malformed value，或 non-null runId 无法通过 canonical occurrence parser/addressing contract
- **THEN** CLI SHALL fail closed，且 MUST NOT 将 missing input 当成 explicit null，也 MUST NOT fallback 到 history scan 或 implicit latest selection

### Requirement: status reports selected formal facts without advancing lifecycle
`flowkit status` SHALL 以显式 caller-owned repository、Delivery、Change structural facts 与 exact selected durable Run 为输入，并 MAY 组合既有只读 OpenSpec active/exact-Change observation，返回 deterministic machine-readable status document。`status` MUST NOT 调用 Policy 来创造 next boundary，MUST NOT 从 history ordering 推断 currentness，且 MUST NOT 修改 lifecycle、Run/Result、OpenSpec、Memo、Archify 或 Git state。

#### Scenario: Report exact selected Run and OpenSpec facts
- **WHEN** caller 提供合法 explicit structural facts 与 exact selected Run，且 approved OpenSpec observations 成功
- **THEN** `status` SHALL 返回与这些 exact facts 对应的 machine-readable status，并 SHALL NOT 自动准备或执行任何 Standard Action

#### Scenario: Reporting data cannot create authority
- **WHEN** status output 包含 durable history 或 OpenSpec planning/readiness facts
- **THEN** 这些 facts SHALL 仅用于报告，且 MUST NOT 被 CLI 提升为 current-Run authority、Policy decision、Reviewer/Verification verdict、Owner authority 或 Git permission

### Requirement: next delegates lifecycle legality exclusively to canonical Policy
`flowkit next` SHALL 从 caller-supplied exact Delivery/Change structural facts与 explicit current-Run choice 构造 canonical Policy input，并 SHALL 只调用既有 Policy contract 得到 `ready-action`、`ready-checkpoint-evaluation` 或 `blocked` decision。对于 explicit `currentRunId:null`，CLI SHALL 传递 `currentAction=null` 与 null terminal facts；对于 terminal selected Run，CLI SHALL 使用该 exact Run 的 matching context/result；对于 prepared selected Run，CLI SHALL NOT 制造 terminal context/result。CLI MUST NOT 内置或复制 lifecycle transition table，也 MUST NOT 执行 Policy 返回的 Action。

#### Scenario: Terminal selected Run produces the Policy decision
- **WHEN** exact selected Run 是 terminal 且其 context/result linkage 合法
- **THEN** `next` SHALL 将该 exact terminal facts 与 caller structural facts 交给 canonical Policy，并原样报告 Policy decision

#### Scenario: Prepared selected Run does not gain terminal facts
- **WHEN** exact selected Run 的 lifecycle state 为 `prepared`
- **THEN** `next` SHALL 以 null terminal RunContext/Result 构造 Policy facts，且 MUST NOT 从其他 Run 或 history 制造 terminal evidence

#### Scenario: Active Change with no current Run reaches canonical Explore boundary
- **WHEN** Change 为 `active` 且 caller 对 `next` 显式提供 `currentRunId:null`
- **THEN** `next` SHALL 以 null CurrentAction/RunContext/Result 调用 canonical Policy，并 SHALL 原样返回 Policy 的 `READY_ACTION(explore)` decision，而不得创建 Run、扫描 history 或自动执行 Explore

#### Scenario: Policy returns blocked
- **WHEN** canonical Policy 对 supplied facts 返回 `blocked(reason)`
- **THEN** `next` SHALL 将该 closed Policy decision 作为合法 machine outcome 返回，且 MUST NOT 将 blocked 自动转换成新的 Action、Owner correction 或 process/integration failure

### Requirement: Checkpoint authorization is a separate exact Owner gate and never Git execution
当且仅当 canonical Policy decision 为 `ready-checkpoint-evaluation` 时，CLI/host surface MAY 对 separately supplied Owner authority fact 执行 checkpoint authorization evaluation。授权 SHALL 仅在 authority structural-valid 且 `decision=authorize-checkpoint`、exact `deliveryId`、exact `changeId`、`scope=[checkpoint]` 全部匹配时成立。该 evaluator SHALL 只报告 authorization fact，MUST NOT 执行或调度 `git add`、`git commit`、`push`、`merge`、`tag` 或其他 repository mutation。

#### Scenario: Exact checkpoint authority matches
- **WHEN** Policy 为 `ready-checkpoint-evaluation`，且 caller 提供 exact matching `authorize-checkpoint` OwnerAuthorityFact
- **THEN** evaluator SHALL 返回 checkpoint authorized machine fact，同时 SHALL 不修改 Git repository

#### Scenario: Owner authority targets another Change
- **WHEN** Policy 为 `ready-checkpoint-evaluation`，但 supplied authority 的 `changeId`、decision 或 scope 任一不匹配
- **THEN** evaluator SHALL 返回 not-authorized machine fact，且 MUST NOT infer permission from Review、Verification 或 terminal archive state

#### Scenario: Policy is not at checkpoint evaluation
- **WHEN** Policy decision 不是 `ready-checkpoint-evaluation`
- **THEN** checkpoint authorization SHALL NOT 被声明成立，即使 caller 提供 structural-valid Owner authority fact

### Requirement: doctor performs only bounded Foundation runtime diagnostics
`flowkit doctor` SHALL 对当前 Foundation CLI 真实运行依赖执行 fail-closed diagnostics：通过既有 managed-tool resolver 验证 exact OpenSpec 与 Archify runtime identity，并通过既有 OpenSpec observation seam 验证 requested repository 的 OpenSpec exact-root observation。Archify SHALL 仅被 resolve，不得在本 command 中被调用生成、比较或验证 Delivery architecture projection。Node SHALL 继续由 repository host compatibility declaration 约束，而不得被 doctor 转换为 exact managed-tool patch lock。

#### Scenario: Managed runtimes and OpenSpec root are valid
- **WHEN** exact managed OpenSpec/Archify 均可解析，且 OpenSpec observation exact-bind requested repository root
- **THEN** `doctor` SHALL 返回 machine-readable PASS diagnostics，而不调用 Archify rendering/materialization

#### Scenario: Managed Archify cannot be resolved
- **WHEN** existing managed-tool resolver 对 Archify fail closed
- **THEN** `doctor` SHALL 报告对应 closed diagnostic，且 MUST NOT fallback 到 PATH/global Archify

#### Scenario: OpenSpec binds to a parent repository root
- **WHEN** OpenSpec observation 成功但 reported root 与 requested repository root 不精确一致
- **THEN** `doctor` SHALL fail closed with the existing root-mismatch integration diagnostic semantics

### Requirement: CLI machine outcomes distinguish valid formal results from command/integration failure
所有 Foundation CLI command SHALL 输出 deterministic machine-readable result。合法的 `status` result、Policy `blocked` decision、checkpoint `authorized=false` 与 bounded doctor diagnostic SHALL 保持为正式 machine outcome；malformed CLI input、无法读取 exact Run、managed-tool/integration failure、invalid machine shape 或 unknown command SHALL 产生 machine-distinguishable failure，并 SHALL 以非零 process exit 结束。CLI MUST NOT 通过解析 free-text message 来重建 domain semantics。

#### Scenario: Policy blocked is a formal result
- **WHEN** `next` 成功构造 canonical Policy facts且 Policy 返回 `blocked(reason)`
- **THEN** CLI SHALL 输出该 blocked decision 作为正式 machine result，而不得把它误分类为 CLI transport/integration failure

#### Scenario: Exact Run cannot be read
- **WHEN** caller 提供的 controlled exact Run address 对应 incomplete/invalid durable record
- **THEN** CLI SHALL 输出 machine-distinguishable failure 并以非零 exit 结束，且 MUST NOT 尝试另选一个 Run

### Requirement: Foundation CLI remains a thin bootstrap-era surface without self-management
本 capability 的 production CLI SHALL 只组合既有 canonical domain/integration seams，MUST NOT 读取或执行 `.agents/skills/**`、自动发现 active Delivery/current Run、建立 current-state registry、执行 Author/Reviewer/provider transport、驱动 OpenSpec mutation/workflow、触发 Archify architecture materialization、执行 Git mutation、运行 Delivery Full Test 或执行 Delivery Final/Owner promotion。

#### Scenario: Bootstrap Skills are absent from production call path
- **WHEN** `flowkit status`、`next` 或 `doctor` 在 production runtime 中执行
- **THEN** command SHALL 不读取/执行 `.agents/skills/**`，并 SHALL 仅依赖其正式 Core/integration input contract

#### Scenario: Archify is managed but not lifecycle authority
- **WHEN** doctor 成功解析 exact managed Archify runtime
- **THEN** CLI SHALL 仅报告 runtime diagnostic，且 MUST NOT 读取 Archify projection 作为 lifecycle truth 或触发 Delivery Start/Final architecture generation
