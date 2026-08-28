## Context

参见 `proposal.md` 的 Why。当前仓库仍是初始化 skeleton：没有 production domain implementation，也没有 formal tests；Delivery 01 由 external authority 管理。已批准的 `explore.md` 同时给出两个必须在 Proposal 阶段解决的设计选择：角色模型应避免 Owner 被误当作 Standard Action executor；identity representation 应保持 semantic、fail-closed 且不引入第二个 key/registry。

## Goals / Non-Goals

**Goals:**
- 用一组小型、普通数据结构冻结 Delivery / Change / Action identity 与 authority vocabulary。
- 让 Owner authority、Author execution、Reviewer verdict、Verification evidence 在类型与 runtime validation 两层都保持可区分。
- 为后续 Change 提供稳定 import boundary，同时保持 serialization-friendly、无 registry、可 deterministic validate。
- 为第一批 domain contract 建立最小 TypeScript 与 targeted unit-test 基线。

**Non-Goals:**
- 不定义 Action 的 prepared / resumed / terminal 状态机或 single-current-Action invariant。
- 不实现 Run / Result persistence、Policy eligibility、next-boundary、mutation declaration、Git checkpoint、OpenSpec adapter 或 CLI。
- 不让 candidate runtime 接管 Delivery 01，也不建立自动 next / 自动 Owner decision。
- 不修改 `AGENTS.md` 来承载动态 lifecycle state。

## Decisions

### 1. 使用 semantic string + boundary validator，而不是 `key + id` 或进程内 registry

DeliveryId 与 ChangeId 保持可序列化的 semantic string；ChangeId 使用唯一 semantic id，不提供 `key` alias。ActionId 使用封闭的 Standard Action literal catalog。runtime validator 在输入边界验证 canonical 格式并返回普通数据，不依赖动态 registry identity。

**理由:** 当前 Delivery/OpenSpec path、dependency 与 Run identity 已全部使用 semantic id；普通 string + validator 最容易跨 JSON/进程/session 稳定恢复。

**拒绝的替代方案:** branded-only 值在 runtime 不能独立证明合法性；`key + id` 会恢复旧项目双重 identity；registry 会引入当前 Delivery 明确排除的动态平台复杂度。

#### Canonical semantic identifier grammar

本 Change 冻结一个唯一的 `SemanticId` grammar，供它自己负责验证的 `DeliveryId`、`ChangeId`、Owner `decision` 与 Owner `scope` token 共用：

```text
ASCII only
length: 1..128
regex: ^[a-z0-9]+(?:-[a-z0-9]+)*$
```

因此 canonical 输入必须：

- 仅包含 lowercase ASCII letters、digits 与单个 `-` 分隔符；
- 以 `[a-z0-9]` 开始和结束；
- 不包含 uppercase、underscore、dot、slash、backslash、whitespace、empty segment 或连续 `--`；
- validator 不执行 trim、lowercase、separator replacement、alias lookup 或自动修复。

示例：

```text
valid:
20260824-01-foundation-lifecycle-kernel
establish-lifecycle-authority-and-identity-contracts
authorize-propose

invalid:
Foundation
change_id
change/id
.change
change-
-change
change--id
 change
```

`Standard Action` 不通过该开放 grammar 决定合法性，而继续使用 Decision 5 的十个封闭 literals catalog。

### 2. 角色采用 `ActorRole` 与 `ActionExecutionRole` 两层，而不是让 Owner 进入 Standard Action execution role

定义：

```text
ActorRole = owner | author | reviewer
ActionExecutionRole = author | reviewer
AuthoritySource = owner | author | reviewer | verification
```

Owner 可以作为 actor/authority source，但 Standard Action executor 只能是 Author 或 Reviewer。Verification 不建模为 actor role，而是独立 authority/evidence source。

**理由:** 结构上阻止“Owner 因有授权所以可替代 Author/Reviewer 执行”的混淆，同时保留 Owner 作为显式 authority participant。

**拒绝的替代方案:** 单一 `Role = owner|author|reviewer|verification` 会把 actor、execution role 与 evidence source 混为一层，后续 Policy 更容易错误推导 authority。

### 3. Owner authority fact 使用显式 ref + decision + scope，不把 eligibility 写进本 Change

Foundation contract 定义一个精确、可序列化且 fail-closed 的 `OwnerAuthorityFact` wire shape：

```ts
interface OwnerAuthorityFact {
  readonly ref: string;
  readonly decision: string;
  readonly deliveryId: string;
  readonly changeId?: string;
  readonly sourceRef: string;
  readonly scope: readonly string[];
}
```

字段规则固定为：

| field | required | structural rule |
|---|---|---|
| `ref` | yes | `^owner:[0-9a-f]{64}$`；只验证 canonical ref 形状，本 Change 不负责生成或重新计算 digest |
| `decision` | yes | Decision 1 的 `SemanticId` grammar；这里只验证结构，不判断 Policy 是否认识该 decision |
| `deliveryId` | yes | Decision 1 的 `SemanticId` grammar |
| `changeId` | no | 缺省表示 Delivery-scoped fact；若出现必须是 `SemanticId`；`null`、empty string 均拒绝 |
| `sourceRef` | yes | opaque provenance string；printable ASCII、1..512 chars、regex `^[!-~]{1,512}$`；本 Change 不解析 scheme |
| `scope` | yes | JSON array，1..32 个 `SemanticId`；不得重复；必须按 bytewise ASCII lexicographic order 严格递增，validator 不排序/去重/修复 |

wire object 只允许上述六个字段；除了 `changeId` 外全部必填，未知额外字段 SHALL fail closed。validator 返回 plain JSON-compatible data，不注入默认值、不从 Review/Verification/terminal 推导字段。

canonical scope 示例：

```json
["activate-change", "explore"]
```

非 canonical scope 示例：

```json
["explore", "activate-change"]
["propose", "propose"]
[]
```

`decision` 与 `scope` token 的**结构合法性**属于本 Change；某个 decision 是否被当前 Policy 认识、某个 scope token 是否满足具体 lifecycle boundary、以及“某个 Action 在什么状态下需要哪种 Owner decision”都属于后续 Policy Change。一个 structurally valid 但 Policy 未识别的 `decision` / `scope` MUST NOT 因通过 Foundation validator 而获得 eligibility。

**理由:** 先固定 authority fact 的稳定 wire identity 与来源，后续 Policy 才能消费它而不复制 authority storage/identity，同时避免 Apply 临时发明字段语义。

**拒绝的替代方案:** 从 Review PASS、Verification PASS 或 terminal result 自动构造 Owner authority；在本 Change 同时实现 Policy eligibility。

### 4. Delivery / Change state 只定义封闭 literal 与结构合法性，Action lifecycle 留给下一 Change

Delivery state 固定为：

```text
active | completed | cancelled
```

Change state 固定为：

```text
planned | active | completed | cancelled
```

本 Change 可以提供状态 literal validator；是否允许某个语义 transition、以及 Action prepared/resumed/terminal/current 规则，不在本 Change实现。

**理由:** 这足以让后续 domain object 有稳定 shape，同时避免吞入 `establish-action-lifecycle-domain-contract` 与 Policy 的职责。

### 5. Standard Action identity catalog 与 lifecycle state machine 分离

本 Change冻结当前 Standard Action identity literal：

```text
explore
review-explore
revise-explore
propose
review-propose
revise-propose
apply
review-apply
revise-apply
archive
```

这里只证明 identity 是否属于 catalog，不定义 action-to-action transition 或 next eligibility。

**理由:** Run、Review 与后续 Action lifecycle 都必须共享稳定 Action identity；catalog identity 本身不等于 lifecycle policy。

### 6. 最小代码布局保持 domain contract 可组合

计划采用：

```text
src/domain/identity.ts
src/domain/authority.ts
src/domain/state.ts
src/domain/index.ts
```

对应 targeted tests：

```text
tests/unit/domain/identity.test.ts
tests/unit/domain/authority.test.ts
tests/unit/domain/state.test.ts
```

若仓库尚无 TypeScript/test execution baseline，本 Change只增加运行这些 targeted tests 所需的最小 `tsconfig.json` 与 package scripts，不引入新的 runtime dependency；优先使用已有 TypeScript、tsx 与 Node test runner。

**理由:** identity / authority / structural state 分层足够清晰，又不会提前创建 Policy、persistence 或 CLI module。

## Risks / Trade-offs

- **[Risk]** 过早冻结 Owner decision catalog 会吞入后续 Policy → **Mitigation:** 本 Change只冻结 authority fact shape 与 semantic decision-id 格式；decision recognition / eligibility 完全留给 Policy，未识别 decision 在 Policy 层 fail closed。
- **[Risk]** role/source 分层增加少量类型数量 → **Mitigation:** 每层只表达一个语义维度，并通过 re-export 提供稳定 domain import boundary。
- **[Risk]** Delivery/Change state validator 被误当作完整 lifecycle engine → **Mitigation:** specs、命名与 tests 明确只覆盖 closed literals/structural facts，不实现 semantic transition policy。
- **[Risk]** 首个 implementation Change 同时建立 test baseline 可能扩大 mutation surface → **Mitigation:** 只添加 targeted test 所需最小配置/脚本，不引入测试框架依赖或全仓工程重构。

## Migration Plan

这是 greenfield Foundation implementation，没有既有 production domain data 需要迁移。Apply 时新增 domain files、最小验证配置与 targeted tests；若验证失败，可完整回退该 Change 的新增实现文件与配置，不影响 Delivery Start/OpenSpec/architecture truth。
