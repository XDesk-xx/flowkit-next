## Purpose

为 Flowkit 提供一个只读、fail-closed 的 repo-local OpenSpec machine observation capability，通过已验证的受管 OpenSpec runtime 获取正式 Change 事实，同时保持 OpenSpec lifecycle 与 Flowkit Policy/authority 完全分离。

## ADDED Requirements

### Requirement: OpenSpec observation uses only the exact managed OpenSpec runtime
系统 SHALL 只通过既有 managed-tool resolution contract 获取 `openspec` runtime，并使用该已验证 entrypoint 执行本 capability 允许的只读 machine observation。系统 MUST NOT 从 PATH、global installation、shell lookup 或其他 runtime location 选择 OpenSpec。

#### Scenario: Managed OpenSpec is available
- **WHEN** caller 请求一个受支持的 OpenSpec observation，且 `resolveManagedTool("openspec")` 成功返回 exact managed runtime
- **THEN** 系统 SHALL 仅使用该 runtime 的 validated entrypoint 执行 observation

#### Scenario: Conflicting PATH OpenSpec exists
- **WHEN** PATH 中存在不同 identity 的 `openspec` executable，同时 managed OpenSpec runtime 有效
- **THEN** observation SHALL 继续使用 managed runtime，且 MUST NOT 调用 PATH executable

#### Scenario: Managed OpenSpec cannot be resolved
- **WHEN** existing managed-tool resolver 因 lock、`FLOWKIT_HOME`、runtime identity 或 entrypoint 问题 fail closed
- **THEN** observation SHALL 停止并保留该 managed-tool resolution failure，而 MUST NOT fallback 到其他 OpenSpec runtime

### Requirement: V1 exposes only two closed read-only observations
系统 SHALL 只提供两个 repo-local read-only OpenSpec observation：观察当前 active Change 集合，以及观察一个 exact Change 的 formal artifact/planning status。系统 MUST NOT 暴露 generic arbitrary OpenSpec command executor，也 MUST NOT 在本 capability 中执行 mutating/workflow-driving OpenSpec operations。

#### Scenario: Observe active Change set
- **WHEN** caller 请求 repository 的 active OpenSpec Change observation
- **THEN** 系统 SHALL 基于 OpenSpec `list --json` 返回 machine-validated Change identifiers，而不扫描 `openspec/changes/**`

#### Scenario: Observe exact Change status
- **WHEN** caller 提供 canonical Change identifier 并请求其 formal status observation
- **THEN** 系统 SHALL 基于 OpenSpec `status --change <id> --json` 返回该 Change 的 machine-validated schema/planning/artifact observation

#### Scenario: Arbitrary OpenSpec command is requested
- **WHEN** caller 试图通过本 capability 请求 `instructions`、`context`、`validate`、`show`、`new change`、`archive` 或任意自定义 argument sequence
- **THEN** 系统 SHALL 不提供该 command surface，且 MUST NOT 将请求转发给 OpenSpec

### Requirement: Successful observations bind exactly to the requested repository root
系统 SHALL 将 caller 提供的 repository root 与成功 OpenSpec observation 返回的 `root.path` 使用当前 host canonical path semantics 进行精确比较。二者不完全一致时 observation MUST fail closed；系统 MUST NOT 接受 OpenSpec nearest-root 向上解析到另一个 parent project 的结果。

#### Scenario: OpenSpec reports the exact requested root
- **WHEN** successful machine observation 的 reported `root.path` canonicalizes 后与 requested repository root 精确一致
- **THEN** 系统 MAY 返回该 observation

#### Scenario: Nested or wrong cwd binds to a parent OpenSpec project
- **WHEN** OpenSpec 成功返回 machine JSON，但 reported `root.path` canonicalizes 后不同于 requested repository root
- **THEN** 系统 SHALL fail closed with a machine-distinguishable root-mismatch integration diagnostic

### Requirement: Active Change observation projects only required formal identity facts
Active Change observation SHALL 只投影 Flowkit 当前需要的 formal Change identifier 集合。每个 returned Change identifier SHALL 满足既有 canonical `ChangeId` / semantic-id contract。系统 MUST NOT 将 OpenSpec 的 task counts、timestamps、free-text status 或其他 list payload fields 自动提升为稳定 Flowkit contract。

#### Scenario: OpenSpec returns valid active Changes
- **WHEN** `list --json` 返回 exact-root、shape-valid machine document，且其中 Change names 均为 canonical Change identifiers
- **THEN** 系统 SHALL 返回这些 Change identifiers 作为 transient active Change observation

#### Scenario: OpenSpec returns an invalid Change identifier shape
- **WHEN** successful `list --json` payload 包含不满足 canonical ChangeId grammar 的 Change name
- **THEN** 系统 SHALL fail closed with an invalid-machine-shape integration diagnostic

### Requirement: Exact Change status projects formal planning and artifact facts without re-deriving readiness
Exact Change status observation SHALL 投影 OpenSpec 返回的 exact Change identifier、schema name、Change root、planning-complete / complete facts，以及每个 artifact 的 identifier、formal readiness status、`requires` 与 `missingDeps`。系统 SHALL 使用 OpenSpec 的 machine facts 原样表达 readiness/dependency relation，而 MUST NOT 读取 Markdown/filesystem 来重新计算 artifact readiness。

#### Scenario: Exact Change status is valid
- **WHEN** `status --change <id> --json` 成功返回 exact-root、shape-valid machine document，且 `changeName` 与 requested Change identifier 精确一致
- **THEN** 系统 SHALL 返回 typed transient status observation containing only the approved planning/artifact fields

#### Scenario: Returned Change identity drifts from the request
- **WHEN** successful status payload 的 `changeName` 与 requested Change identifier 不精确相同
- **THEN** 系统 SHALL fail closed with an invalid-machine-shape integration diagnostic

#### Scenario: Artifact readiness data is malformed
- **WHEN** artifact identifier、formal status、`requires` 或 `missingDeps` 不满足本 capability 接受的 machine shape
- **THEN** 系统 SHALL fail closed，而 MUST NOT 猜测或修复 readiness

### Requirement: OpenSpec formal non-zero outcomes remain distinct from integration failures
系统 SHALL 在 required JSON output 可解析后再区分 process exit status。OpenSpec command 非零退出但返回合法 machine JSON 时，系统 SHALL 将其表示为 machine-distinguishable OpenSpec formal outcome，而 MUST NOT 自动归类为 spawn/process failure；spawn failure、required JSON malformed、successful payload shape invalid 与 root mismatch SHALL 保持独立 integration failure categories。系统 MUST NOT 解析 free-text message 来重新实现 OpenSpec lifecycle semantics。

#### Scenario: Missing Change produces valid OpenSpec machine JSON with non-zero exit
- **WHEN** exact Change status command 非零退出但 stdout 是合法 OpenSpec machine JSON
- **THEN** 系统 SHALL 返回/抛出 closed formal-outcome category，并 MUST NOT 将其标记为 process-failed 或通过英文 message 推断新的 Flowkit lifecycle state

#### Scenario: OpenSpec process cannot start or complete
- **WHEN** managed entrypoint invocation 发生 spawn/process failure 且没有可接受的 formal machine outcome
- **THEN** 系统 SHALL fail closed with a process-failure integration diagnostic

#### Scenario: Required JSON is malformed
- **WHEN** observation command stdout 不是 required valid JSON
- **THEN** 系统 SHALL fail closed with a malformed-machine-output integration diagnostic

### Requirement: OpenSpec observations are transient and carry no Flowkit authority
本 capability 的 OpenSpec observations SHALL 是 transient integration facts。系统 MUST NOT 将 OpenSpec artifact state 持久化为 `.flowkit` mirror/cache，也 MUST NOT 因 OpenSpec observation 自动改变 Policy decision、Action lifecycle、Run/Result、Reviewer/Verification verdict、Owner authority、Git checkpoint authority 或 OpenSpec workflow progression。

#### Scenario: OpenSpec reports planning complete
- **WHEN** exact Change observation reports `isPlanningComplete = true`
- **THEN** 系统 SHALL 仅返回该 formal OpenSpec fact，且 MUST NOT 因此产生 Flowkit `READY_ACTION`、review approval、Verification PASS 或 archive/checkpoint authority

#### Scenario: Observation completes successfully
- **WHEN** 任一 approved read-only observation 成功
- **THEN** 系统 SHALL NOT 写入 `.flowkit` OpenSpec-state mirror/cache，也 SHALL NOT 修改 OpenSpec artifacts

### Requirement: Production OpenSpec integration is independent of bootstrap Skills and self-hosting
本 capability 的 production runtime SHALL NOT 读取或执行 `.agents/skills/**`，SHALL NOT 将当前 OpenSpec Skills 迁移到 Flowkit runtime，并 SHALL NOT 引入 Flowkit self-hosting behavior。当前 development-stage OpenSpec Skills 继续独立驱动 Author/Reviewer 的 OpenSpec workflow。

#### Scenario: Production observation runs with repository-local Skills absent
- **WHEN** approved managed OpenSpec runtime 与 repository formal artifacts 可用，但 `.agents/skills/**` 不参与 production call path
- **THEN** OpenSpec observation capability SHALL 仍仅依赖其正式 runtime/input contract 工作

#### Scenario: Current development workflow uses an OpenSpec Skill
- **WHEN** Author/Reviewer AI 在当前 bootstrap 阶段调用 `.agents/skills/openspec-*`
- **THEN** 该 Skill 使用 SHALL 保持 development orchestration concern，且 MUST NOT 改变本 production capability 的 contract
