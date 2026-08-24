# lifecycle-authority-and-identity Specification

## Purpose
为 Flowkit Foundation 提供唯一、可验证且 fail-closed 的 lifecycle authority 与 semantic identity 基础，使后续 Action lifecycle、Run persistence、Policy 和 integration 共享同一组可序列化事实，而不复制 Owner、Reviewer、Verification 或 OpenSpec 的权威边界。

## Requirements

### Requirement: Canonical semantic identity
系统 SHALL 为 Delivery、Change 与 Action 使用 canonical semantic identity；Change SHALL 只有一个 semantic `id` 作为生命周期身份，`group` SHALL 仅作为组织元数据而不得参与 identity、依赖解析或生命周期目标选择。

本 capability 自己负责验证的 `DeliveryId`、`ChangeId`、Owner `decision` 与 Owner `scope` token SHALL 使用同一个 canonical `SemanticId` grammar：

```text
ASCII only
1..128 chars
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

validator SHALL NOT trim、lowercase、replace separators、resolve aliases 或自动修复非 canonical 输入。

#### Scenario: Resolve a planned Change by semantic id
- **WHEN** 下游能力引用 `establish-lifecycle-authority-and-identity-contracts`
- **THEN** 系统 SHALL 仅以该 semantic Change id 解析目标，且不得要求或生成第二个 `key` 身份

#### Scenario: Group metadata is not a lifecycle target
- **WHEN** Change 带有 `group: foundation`
- **THEN** 系统 SHALL 将 `foundation` 仅作为组织元数据，且不得把 group 当作可 activate、review、archive 或 checkpoint 的 lifecycle node

#### Scenario: Accept canonical semantic ids
- **WHEN** DeliveryId 为 `20260824-01-foundation-lifecycle-kernel` 且 ChangeId 为 `establish-lifecycle-authority-and-identity-contracts`
- **THEN** 系统 SHALL 接受二者为 canonical `SemanticId`

#### Scenario: Reject non-canonical semantic ids
- **WHEN** identity 使用 uppercase、underscore、dot、slash、whitespace、leading/trailing `-`、连续 `--` 或长度超出 1..128
- **THEN** 系统 SHALL fail closed，且不得通过 normalize 或 alias 机制把它转换成合法 identity

### Requirement: Canonical Standard Action identity
系统 SHALL 使用一个固定且可验证的 Standard Action identity catalog；未知 Action literal SHALL 被拒绝，而不得通过动态 registry、别名或模糊匹配接受。

#### Scenario: Accept a known Standard Action
- **WHEN** 输入 Action literal 为 `propose`
- **THEN** 系统 SHALL 将其识别为 canonical Standard Action identity

#### Scenario: Reject an unknown Action literal
- **WHEN** 输入 Action literal 不在当前 Standard Action contract 中
- **THEN** 系统 SHALL fail closed 并拒绝把该 literal 当作合法 Action identity

### Requirement: Owner and execution roles are distinct
系统 SHALL 将 Owner authority 与 Standard Action execution role 分离；Author 与 Reviewer SHALL 是 Standard Action execution roles，Owner SHALL 提供 authority fact 而不得被当作 Author 或 Reviewer 的替代执行角色。

#### Scenario: Author executes an Author action
- **WHEN** 一个 Standard Action 的 contract 要求 Author 执行
- **THEN** 系统 SHALL 只接受 Author execution role，并不得因存在 Owner authority 而把 Owner 当作执行者

#### Scenario: Reviewer remains independent
- **WHEN** 一个 review Action 被执行
- **THEN** 系统 SHALL 将 Reviewer execution role 与被审阅 Author role 分离，并保留独立 verdict authority

### Requirement: Verification is independent evidence authority
系统 SHALL 将 Verification 作为独立 evidence authority；Verification 结果 SHALL 不得等价为 Owner authorization、Reviewer verdict 或 Git authority。

#### Scenario: Verification passes without creating Owner authority
- **WHEN** Verification evidence 为 PASS
- **THEN** 系统 SHALL 仅记录 correctness evidence，且不得据此生成或推断 Owner authorization

### Requirement: Owner authority facts are explicit and referenceable
系统 SHALL 只从显式、可引用且 scope-bound 的 Owner authority fact 获得 Owner authority；Review verdict、Verification result、Action terminal 状态或其他派生事实 SHALL 不得隐式创造 Owner authority。

`OwnerAuthorityFact` SHALL 是 JSON-compatible object，并 SHALL 只允许以下字段：

```ts
interface OwnerAuthorityFact {
  readonly ref: string;          // required
  readonly decision: string;     // required
  readonly deliveryId: string;   // required
  readonly changeId?: string;    // optional; absent only, null rejected
  readonly sourceRef: string;    // required
  readonly scope: readonly string[]; // required
}
```

结构规则 SHALL 为：

- `ref`: `^owner:[0-9a-f]{64}$`；
- `decision`: canonical `SemanticId`；
- `deliveryId`: canonical `SemanticId`；
- `changeId`: absent 或 canonical `SemanticId`，`null` / empty string 均非法；
- `sourceRef`: printable ASCII、1..512 chars、`^[!-~]{1,512}$`；其 scheme/内容在本 capability 中保持 opaque；
- `scope`: 1..32 个 canonical `SemanticId` 的 JSON array；元素不得重复，并必须按 bytewise ASCII lexicographic order 严格递增；
- 除上述字段外出现未知额外字段 SHALL fail closed；
- structural validator SHALL NOT 生成 `ref`、补默认字段、排序/去重 `scope` 或推断 authority。

`decision` 与 `scope` 通过 structural validation 只表示 wire fact canonical；某个 decision/scope 是否满足某个 lifecycle boundary 的 recognition / eligibility SHALL 由后续 Policy contract 决定。

#### Scenario: Consume explicit Owner authorization
- **WHEN** 一个操作要求 Owner authorization 且输入包含 structural-valid、与当前 Delivery/Change/scope 对应的显式 Owner authority ref
- **THEN** 系统 SHALL 能够引用该 fact 作为 authority input，而不需要从其他状态推断授权；是否满足该 boundary 的 Policy eligibility 由后续 Policy 决定

#### Scenario: Reject inferred Owner authorization
- **WHEN** 输入只有 approved Review、PASS Verification 或 terminal Action result，而没有所需显式 Owner authority fact
- **THEN** 系统 SHALL 视 Owner authorization 为缺失并 fail closed

#### Scenario: Reject malformed Owner authority wire fact
- **WHEN** authority object 缺失任一必填字段、包含 `changeId: null`、`ref` 不是 `owner:<64 lowercase hex>`、`sourceRef` 含 whitespace/control char、`scope` 为空/重复/非递增，或包含未知额外字段
- **THEN** structural validator SHALL fail closed，且不得自动修复该 fact

#### Scenario: Structural validity does not create Policy eligibility
- **WHEN** `decision` 与 `scope` 都满足 canonical `SemanticId` grammar，但后续 Policy 不认识该 decision 或认为 scope 不满足当前 boundary
- **THEN** Foundation structural validator MAY 接受该 wire fact，但系统 SHALL NOT 因此推导 Owner authorization eligibility

### Requirement: Delivery and Change structural state literals are closed
系统 SHALL 为 Delivery 与 Change 使用封闭的结构状态 literal 集，并 SHALL 拒绝未知状态值；本 capability 只定义基础结构状态与 identity，不定义 Standard Action 的 prepared/resumed/terminal state machine。

#### Scenario: Accept a known Change state
- **WHEN** Change state 为 `planned`、`active`、`completed` 或 `cancelled` 之一
- **THEN** 系统 SHALL 将其识别为有效结构状态

#### Scenario: Reject an unknown lifecycle state
- **WHEN** Delivery 或 Change state 使用未知 literal
- **THEN** 系统 SHALL fail closed 并返回无效 domain fact，而不得自动归一化为已知状态

### Requirement: Identity and authority validation is deterministic and serialization-safe
系统 SHALL 对 identity、role、state 与 authority fact 的结构与 semantic identifier 格式执行确定性的 runtime validation；同一有效输入 SHALL 产生相同 canonical fact，非法或缺失字段 SHALL 被拒绝，且 contract SHALL 可稳定序列化为普通数据而不依赖进程内 registry identity。validator SHALL 验证输入已经 canonical，而 SHALL NOT 通过 trim/lowercase/alias resolution、默认值注入、`scope` 排序或字段推导改变输入语义。结构 validator SHALL NOT 自行判断某个 Owner decision 对特定 lifecycle boundary 的 Policy eligibility。

#### Scenario: Validate the same fact consistently
- **WHEN** 相同的合法 authority/identity payload 被重复验证
- **THEN** 系统 SHALL 产生等价 canonical domain fact，且结果 SHALL 不依赖动态注册顺序或进程内对象身份

#### Scenario: Reject malformed semantic identity
- **WHEN** Delivery 或 Change identity 为空、格式非法或无法作为 canonical semantic reference
- **THEN** 系统 SHALL fail closed，而不得自动修复、生成替代 key 或接受模糊别名
