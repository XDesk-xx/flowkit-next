## MODIFIED Requirements

### Requirement: Project Change ordinal is a durable sequence fact assigned only when a Change first actually enters Explore

`semantic ChangeId` SHALL remain the canonical Change identity. A Change that actually enters Explore SHALL have exactly one durable `projectOrdinal` project-wide monotonic sequence / archive-naming fact persisted on its exact Delivery Change coordination entry. For product-managed execution, canonical `skills/actions/explore/SKILL.md` SHALL own the assignment/persistence HOW only after Flowkit/Owner has already made exact Explore current/legal. During D03/D04 independent self-development, existing `.agents/skills/explore-proof-based/SKILL.md` SHALL independently own the same bootstrap assignment/persistence HOW and SHALL NOT consume candidate `skills/actions/explore/SKILL.md`. A planned-only Change SHALL NOT reserve or carry a `projectOrdinal`. Once assigned, `projectOrdinal` SHALL remain stable through review/propose/apply/archive and SHALL remain consumed if that explored Change is later cancelled. The number SHALL NOT become Policy authority, Owner authority, Action identity, Run identity, `changeStartSequence`, ActionPackage identity or a replacement Change identity.

无基线自动首值 1 的 fresh 例外 SHALL 仅用于 canonical product-managed first Explore；独立 bootstrap SHALL 保留原无基线的 bounded Owner 决定与自身记录格式，不套用 canonical descriptor predicate。已赋值复用/max+1/唯一性/取消消费纪律保持共同适用。

Ordinal derivation SHALL 首先校验所有相关 Delivery manifests 的 assigned 值为全项目唯一的正安全整数；当前已赋值 SHALL 复用，已有其他值 SHALL 取 max+1，溢出 SHALL 拒绝。仅当无任何 assigned 值时，首值 1 SHALL 要求以下 fresh predicate 全部成立：regular/unlinked/readable 的已初始化 runtimeFamily=new project 与有效 projectId；全部 Delivery YAML 名称/id/entries 有效，当前 entry 有可信 active activation provenance，其他 entries 均 planned 且无 ordinal；唯一 OpenSpec active 为当前 Change；start 前无任何 Run，continuation 仅有当前 exact first Explore 的有效 descriptor、previousRunId=null、无 context/result、原 root/Guidance/target/Run 一致；Change-scoped artifacts 无先前或 orphan 材料，continuation 仅允许当前已验证 Run 的 proof；archive 根 absent 或可判定为空。未知、linked、unreadable、malformed、bootstrap、partial、其他 occurrence/active/cancelled/completed 或历史 archive SHALL 阻断无基线分支，不将 absence 单独当 fresh 证明。

fresh 判定 SHALL 只影响首次 Explore readiness，不在 Init/Start/Activate/只读查询中写 ordinal。canonical descriptor 成功后产品 Explore HOW SHALL 重读上述事实和 manifest bytes、确认无漂移后仅在 exact current entry 持久化一次；已有 ordinal SHALL 不改写。新 terminal Explore PASS 的 finish SHALL 校验持久值有效、唯一且与 Result 相同；真实 FAIL/null 和合法非终态 SHALL 保持原接纳规则，不因尚未编号而禁止记录失败。Delivery-level Full Test、Memo、临时文件 SHALL NOT 作为 Change ordinal 消费记录；无基线但有历史 SHALL 继续要求 bounded Owner bootstrap，不创建 seed/计数器/预留锁，不迁移历史。

#### Scenario: First actual Explore owns ordinal materialization without deciding legality

- **WHEN** Flowkit/Owner has already made an exact Change's `explore` Action current/legal and that exact Change has no `projectOrdinal`
- **THEN** the applicable product or independent bootstrap Explore HOW SHALL derive the next project-wide ordinal from valid durable assigned facts and persist it exactly once on the exact Change coordination entry; only product-managed execution SHALL use 1 after the closed fresh-project predicate above succeeds, while independent bootstrap without a baseline SHALL retain its bounded Owner decision boundary; assignment SHALL NOT create activation or legality authority

#### Scenario: Bootstrap Explore remains independent from product candidate

- **WHEN** flowkit-next itself performs D03/D04 Explore through the independent `.agents` development plane
- **THEN** `.agents/skills/explore-proof-based/SKILL.md` SHALL perform the same projectOrdinal assignment/persistence discipline without reading or executing `skills/actions/explore/SKILL.md`

#### Scenario: Planned-only Change does not reserve a number

- **WHEN** an exact Delivery Change remains `planned` and has never actually entered Explore
- **THEN** its coordination entry SHALL have no `projectOrdinal`, and the next numeric value SHALL remain unassigned until an actual Explore materializes it

#### Scenario: Current explored Change preserves its assigned number

- **WHEN** an exact Change has already entered Explore and its coordination entry records a valid assigned `projectOrdinal`
- **THEN** every later Action for that exact Change SHALL preserve that ordinal unchanged without substituting Run sequence, `changeStartSequence` or physical group prefix

#### Scenario: Explored then cancelled Change keeps the gap

- **WHEN** a Change was assigned `projectOrdinal: 8` after actually entering Explore and is later cancelled
- **THEN** `008` SHALL remain consumed and SHALL NOT be compacted or reused by a later Change

#### Scenario: Assign one on a verified fresh first Explore

- **WHEN** 完整 fresh predicate 成立且 exact first Explore 已合法建立 descriptor
- **THEN** 产品 Explore HOW SHALL 重读后仅写当前 entry projectOrdinal=1，不从 Run sequence 推导编号

#### Scenario: Continue the current first Explore descriptor

- **WHEN** 无 assigned baseline，只有当前已验证 first Explore descriptor 和归属正确当前 proof
- **THEN** fresh predicate SHALL 允许该 continuation，不把它当既往消费；HOW/finish SHALL 核对真实持久值

#### Scenario: Reject missing ordinal history instead of reseeding

- **WHEN** 无 assigned baseline 但存在 complete/partial/bootstrap Run、orphan proof、未知/归档 entry 或非 planned 其他 entry
- **THEN** 系统 SHALL 拒绝自动首值 1，不修复/删除历史，不以目录空缺消除已发现历史

#### Scenario: Reject malformed or drifting ordinal inputs

- **WHEN** assigned 值重复/非法/溢出，或 HOW 写前发现 manifest/eligibility 漂移
- **THEN** 系统 SHALL 拒绝，不重新编号，不创建第二份 ordinal truth

#### Scenario: Use an existing valid baseline without a fresh-project gate

- **WHEN** 项目有合法唯一 assigned baseline，当前无编号
- **THEN** HOW SHALL 按原 max+1 规则分配，不要求已使用项目满足 fresh predicate

#### Scenario: Keep bootstrap initialization outside the product fresh exception

- **WHEN** 独立 bootstrap 无已赋值基线，且自身已有 action.md/context.json 开始记录
- **THEN** bootstrap HOW SHALL 保留原明确 bounded Owner 决定边界，不调用产品 predicate/Guidance、不删除 context.json 冒充 canonical descriptor-only，也不声称自动获得首值 1
