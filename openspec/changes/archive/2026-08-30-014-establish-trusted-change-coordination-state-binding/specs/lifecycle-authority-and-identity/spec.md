## MODIFIED Requirements

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

`decision` 与 `scope` 通过 structural validation 只表示 wire fact canonical；structural validator SHALL NOT 因 structural validity 自行创造任何 lifecycle-boundary eligibility。某个 decision/scope 是否满足某个具体 lifecycle boundary SHALL 由拥有该 boundary 语义的 downstream contract 精确识别：trusted Change coordination resolution MAY 在 pure Policy 之前只识别 exact `activate-change` provenance 以推导 exact Delivery + Change 的 canonical `ChangeState`；Policy 已明确拥有的 authority decision（例如 `revise-action` correction eligibility）仍 SHALL 由 Policy 自己识别。任何 boundary-specific recognizer MUST NOT 将 structural-valid fact 泛化为其他 Owner authority。

#### Scenario: Consume explicit Owner authorization
- **WHEN** 一个操作要求 Owner authorization 且输入包含 structural-valid、与当前 Delivery/Change/scope 对应的显式 Owner authority ref
- **THEN** 系统 SHALL 能够引用该 fact 作为 authority input，而不需要从 Review、Verification、terminal Action 或其他派生状态推断授权；是否满足具体 boundary SHALL 由拥有该 boundary 语义的 downstream contract 精确判断

#### Scenario: Trusted coordination resolution recognizes exact activation provenance
- **WHEN** trusted Change coordination resolution 需要判断 durable `active` 是否具有 lifecycle-enterable provenance
- **THEN** 它 MAY 仅为推导 canonical `ChangeState` 识别 structural-valid `decision=activate-change`、exact Delivery/Change identity 与该 activation boundary 要求的 exact scope，且 MUST NOT 因此获得其他 Owner decision 的 eligibility authority

#### Scenario: Reject inferred Owner authorization
- **WHEN** 输入只有 approved Review、PASS Verification 或 terminal Action result，而没有所需显式 Owner authority fact
- **THEN** 系统 SHALL 视 Owner authorization 为缺失并 fail closed

#### Scenario: Reject malformed Owner authority wire fact
- **WHEN** authority object 缺失任一必填字段、包含 `changeId: null`、`ref` 不是 `owner:<64 lowercase hex>`、`sourceRef` 含 whitespace/control char、`scope` 为空/重复/非递增，或包含未知额外字段
- **THEN** structural validator SHALL fail closed，且不得自动修复该 fact

#### Scenario: Structural validity does not create Policy eligibility
- **WHEN** `decision` 与 `scope` 都满足 canonical wire grammar，但该 exact lifecycle boundary 不识别该 decision/scope 组合
- **THEN** Foundation structural validator MAY 接受该 wire fact，但系统 SHALL NOT 因此推导该 lifecycle boundary 的 Owner authorization eligibility

### Requirement: Identity and authority validation is deterministic and serialization-safe
系统 SHALL 对 identity、role、state 与 authority fact 的结构与 semantic identifier 格式执行确定性的 runtime validation；同一有效输入 SHALL 产生相同 canonical fact，非法或缺失字段 SHALL 被拒绝，且 contract SHALL 可稳定序列化为普通数据而不依赖进程内 registry identity。validator SHALL 验证输入已经 canonical，而 SHALL NOT 通过 trim/lowercase/alias resolution、默认值注入、`scope` 排序或字段推导改变输入语义。结构 validator SHALL NOT 自行判断某个 Owner decision 对特定 lifecycle boundary 的 semantic eligibility；boundary-specific eligibility SHALL 由拥有该 boundary 的 downstream contract 显式识别，且 SHALL 保持 decision / Delivery / Change / scope 精确绑定。

#### Scenario: Validate the same fact consistently
- **WHEN** 相同的合法 authority/identity payload 被重复验证
- **THEN** 系统 SHALL 产生等价 canonical domain fact，且结果 SHALL 不依赖动态注册顺序或进程内对象身份

#### Scenario: Reject malformed semantic identity
- **WHEN** Delivery 或 Change identity 为空、格式非法或无法作为 canonical semantic reference
- **THEN** 系统 SHALL fail closed，而不得自动修复、生成替代 key 或接受模糊别名

#### Scenario: Keep boundary eligibility out of the structural validator
- **WHEN** 同一个 structural-valid OwnerAuthorityFact 被不同 downstream lifecycle boundaries 检查
- **THEN** structural validator SHALL 只返回同一 wire-validity 结论，而每个 boundary-owning contract SHALL independently enforce only its exact decision/identity/scope eligibility rule
