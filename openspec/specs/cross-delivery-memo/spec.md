## Purpose

提供一个 project-level、Owner-gated、non-blocking 的 durable Memo contract，用于保存已经发现或提出、值得长期保留但当前明确不进入正式 Delivery / Change scope 的 concern，并在未来 Delivery planning 时以只读方式重新暴露。

## Requirements

### Requirement: Project Memo uses one closed deterministic durable document
系统 SHALL 将 Cross-Delivery Memo collection 表示为唯一 project-level JSON document `.flowkit/memos.json`，其 canonical shape SHALL 为 `{ formatVersion: 1, memos: [...] }`。缺失文件 SHALL 表示空 collection；存在文件 SHALL 通过 closed schema validation，未知字段、错误 `formatVersion`、非法 record、重复 `memoId` 或非 canonical ordering SHALL fail closed，且不得把 invalid existing document 静默解释或覆盖为空 collection。`memoId` SHALL 使用既有 canonical `SemanticId` grammar，serialized `memos` SHALL 按 `memoId` bytewise ASCII lexicographic order 严格递增。

#### Scenario: Treat a missing Memo document as empty
- **WHEN** repository 中不存在 `.flowkit/memos.json`
- **THEN** read/list capability SHALL 得到有效的空 Memo collection，且无需创建文件

#### Scenario: Reject an invalid existing Memo document
- **WHEN** `.flowkit/memos.json` 存在但包含未知字段、非法 formatVersion、duplicate memoId、invalid Memo record 或非 canonical memo ordering
- **THEN** Memo capability SHALL fail closed，且不得用空 document 覆盖该文件

#### Scenario: Produce deterministic Memo ordering
- **WHEN** valid Memo records 被持久化
- **THEN** `.flowkit/memos.json` 中的 `memos` SHALL 按 exact `memoId` bytewise ASCII lexicographic order 存储

### Requirement: Memo record represents one project concern with optional hierarchical provenance
每个 Memo SHALL 使用 closed JSON-compatible record，且只包含 `memoId`、`state`、`title`、`note`、`source`、`createdByOwnerAuthorityRef` 与 `resolution`。同一个 record MAY 表示 future idea、observed issue、risk、technical debt、follow-up 或 improvement，而 SHALL NOT 要求 `kind`、priority、tag、assignee、due date、comments 或 dependency metadata。`source` SHALL 为 null 或严格层级 provenance：Delivery-only、Delivery+Change、Delivery+Change+Run；Change without Delivery 或 Run without Change SHALL invalid。Delivery/Change identifier SHALL 使用 canonical semantic-id grammar；Run provenance SHALL 使用既有 canonical Run occurrence/runId parsing rules。Source SHALL 仅为 informational provenance，不得成为 Owner authority、当前 formal scope 或 OpenSpec truth。

#### Scenario: Accept a project concern with no source provenance
- **WHEN** Owner 授权保存一个 project-level concern 且不声明 Delivery provenance
- **THEN** Memo SHALL 允许 `source = null`，且 Memo identity 仍仅由 `memoId` 决定

#### Scenario: Accept exact hierarchical Run provenance
- **WHEN** source 同时提供 canonical DeliveryId、ChangeId 与一个通过既有 Run occurrence/runId parser 的 canonical runId
- **THEN** Memo record SHALL 接受该 provenance 作为 informational source

#### Scenario: Reject incoherent provenance
- **WHEN** source 提供 ChangeId 却没有 DeliveryId，或提供 runId 却没有 ChangeId，或 runId 不满足既有 canonical Run occurrence/runId contract
- **THEN** Memo record SHALL fail closed

### Requirement: Memo mutations require explicit eligible Owner authority while reads do not
`create`、`promote` 与 `dismiss` mutation SHALL 只消费调用方已经建立且通过既有 structural validation 的 canonical `OwnerAuthorityFact`。Memo capability SHALL NOT mint、infer、repair、default 或 persist Owner authority facts；它 SHALL 仅在 Memo record 中保存实际使用的 authority `ref`，且所有 stored Owner authority ref SHALL 满足既有 canonical `owner:<64 lowercase hex>` ref grammar。Create authority SHALL 使用 exact `decision=create-memo` 与 exact single-element `scope=[memoId]`；dismiss authority SHALL 使用 exact `decision=dismiss-memo` 与 exact `scope=[memoId]`。`get` 与 `list open` SHALL 为 read-only 且 SHALL NOT 要求 Owner authority。Memo source provenance SHALL NOT 替代或限制 mutation authority。

#### Scenario: Create a Memo with explicit matching Owner authority
- **WHEN** caller 提供 structural-valid OwnerAuthorityFact，`decision=create-memo`、`scope=[memoId]`，且该 memoId 尚不存在
- **THEN** capability SHALL 创建 exact memoId 的 `open` Memo，并把 authority `ref` 记录为 `createdByOwnerAuthorityRef`

#### Scenario: Reject implicit or mismatched create authority
- **WHEN** create 缺失 OwnerAuthorityFact，或 authority structural-invalid，或 decision/scope 不精确匹配 `create-memo` 与 `[memoId]`
- **THEN** create SHALL fail closed，且不得持久化 Memo

#### Scenario: Read open Memos without mutation authority
- **WHEN** caller 只执行 get 或 list-open operation
- **THEN** capability SHALL NOT 要求或生成 OwnerAuthorityFact

### Requirement: Memo state is a closed one-way three-state model
Memo state SHALL 只允许 `open | promoted | dismissed`。新 Memo SHALL 总是 `open` 且 `resolution = null`。唯一 durable transitions SHALL 为 `open → promoted` 与 `open → dismissed`；`promoted` 与 `dismissed` SHALL terminal。Defer SHALL 由“不执行 mutation”表示，因此 SHALL 不存在 `deferred` state 或 `defer` mutation。State 与 resolution SHALL 精确一致：promoted Memo 的 resolution SHALL 为 `kind=promoted` 加 target DeliveryId、target ChangeId 与 Owner authority ref；dismissed Memo 的 resolution SHALL 为 `kind=dismissed` 加 Owner authority ref。

#### Scenario: Defer an open Memo without mutation
- **WHEN** Owner 选择当前 Delivery 不处理一个 open Memo
- **THEN** 不执行 Memo mutation，Memo SHALL 保持 `open` 且 `resolution = null`

#### Scenario: Reject a second transition from terminal Memo state
- **WHEN** caller 尝试 promote 或 dismiss 一个已经 `promoted` 或 `dismissed` 的 Memo
- **THEN** mutation SHALL fail closed，且原 terminal record 保持不变

#### Scenario: Reject inconsistent state and resolution
- **WHEN** record 声明 `open` 但 resolution 非 null，或 terminal state 与 resolution kind/required fields 不一致
- **THEN** Memo validation SHALL fail closed

### Requirement: Promotion records an already-established target and is authority-bound
`promote` SHALL 只接受一个 caller-supplied concrete target `{ deliveryId, changeId }`，且两个 identifier SHALL canonical。用于 promotion 的 OwnerAuthorityFact SHALL structural-valid、使用 exact `decision=promote-memo`、exact `scope=[memoId]`，并 SHALL 同时包含与 target 精确相同的 `deliveryId` 与 `changeId`；任一不匹配 SHALL fail closed。Memo capability SHALL 只记录该 target 与 authority ref，SHALL NOT 创建 Delivery/Change、扫描 OpenSpec/filesystem 来推断 target existence，或把 Memo 内容自动转化为 OpenSpec requirement。Target 已由调用方正式建立是 integration precondition。

#### Scenario: Promote to the exact authority-bound target
- **WHEN** open Memo 的 caller-supplied target 为 Delivery D / Change C，且 promotion authority 为 `decision=promote-memo`、`deliveryId=D`、`changeId=C`、`scope=[memoId]`
- **THEN** Memo SHALL transition 为 `promoted` 并记录 exact D/C 与 authority ref

#### Scenario: Reject a promotion target that differs from Owner authority
- **WHEN** supplied target 的 DeliveryId 或 ChangeId 与 promotion authority 不精确相同
- **THEN** promote SHALL fail closed，且 Memo SHALL 保持 `open`

#### Scenario: Do not create the promoted target
- **WHEN** promote 接收 caller-supplied target
- **THEN** Memo capability SHALL NOT 创建或修改 Delivery manifest / OpenSpec Change 来建立该 target

### Requirement: Open Memo consumption is deterministic and non-blocking
Capability SHALL 支持按 memoId 读取单条 validated Memo，以及列出全部 validated `state=open` Memo。`list open` SHALL 按 canonical memoId 顺序返回。该 read seam MAY 被未来 Delivery Start 使用来向 Owner 暴露尚未 formalize 的 concern，但 open Memo 的存在、数量或内容 SHALL NOT 阻止 Delivery Start、改变 Standard Action legality 或产生 next-boundary authority。

#### Scenario: List only open Memos in deterministic order
- **WHEN** document 同时包含 open、promoted 与 dismissed records
- **THEN** list-open SHALL 只返回 open records，并按 memoId canonical order 返回

#### Scenario: Open Memos do not gate Delivery progression
- **WHEN** 一个 repository 存在一个或多个 valid open Memos
- **THEN** 它们的存在 SHALL NOT 自身产生 blocker、Standard Action、Run/Result 或 Policy decision

### Requirement: Memo remains isolated from lifecycle, execution truth and specification truth
Cross-Delivery Memo SHALL 是独立 project concern sidecar，而 SHALL NOT 成为 `StandardActionId`、CurrentAction、RunContext/RunResult、ActionPackage、PolicyFacts、reported `nextBoundary`、Reviewer/Verification verdict、Delivery backlog authority 或 OpenSpec specification truth。Memo write MAY 在另一个 Standard Action 执行期间由 explicit Owner instruction 触发，但 SHALL NOT 为 Memo 自身创建 Standard Action、Run 或 STOP boundary。本 capability 对 `.flowkit/memos.json` 的窄 ownership SHALL NOT 被解释为通用 repository mutation declaration、Git checkpoint/commit authority、scheduler、issue tracker、database/index/WAL/locking 或 multi-writer coordination contract。

#### Scenario: Persist a Memo without changing the current Action boundary
- **WHEN** Owner 在某个正在进行的 Standard Action 期间明确授权 create Memo
- **THEN** Memo write SHALL NOT 改变 CurrentAction、创建 Memo Run 或改变该 Standard Action 的正常 STOP/next-boundary contract

#### Scenario: Keep Memo outside Policy facts
- **WHEN** valid lifecycle/Policy evaluation 与 repository 中存在的 Memo collection 同时发生
- **THEN** Policy legality SHALL 继续只由其 canonical PolicyFacts 决定，Memo SHALL NOT 成为 Policy input 或 blocker

#### Scenario: Keep Memo outside OpenSpec truth
- **WHEN** 一个 Memo 被创建、保持 open、promoted 或 dismissed
- **THEN** Memo record 本身 SHALL NOT 成为 formal specification truth；只有正常 Delivery/OpenSpec lifecycle 建立的 Change/spec artifacts 才承担该职责
