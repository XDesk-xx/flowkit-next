# delivery-finalization Specification

## Purpose

为 Delivery Final 提供只消费 complete accepted prerequisites 的 exact、bounded closure contract，记录可供后续 repository integration 使用的 candidate continuity，并在不取得 Git 或 next-operation authority 的边界停止。

## Requirements

### Requirement: Delivery Final consumes complete exact prerequisite outcomes
Delivery Final SHALL 从 canonical Delivery coordination、read-only OpenSpec active Change observation、terminal passed Full Test outcome 与 terminal Architecture Finalization outcome验证 complete prerequisites。Exact Delivery SHALL 处于 active、所有 required Changes SHALL completed、OpenSpec active Change set SHALL empty；Full Test 与 Architecture outcome SHALL 在 Delivery、verified candidate、Full Test execution、Architecture output identities上 internally consistent，六个 fixed Architecture outputs SHALL 仍解析为 matching regular-file bytes，current repository candidate SHALL 等于 Architecture Finalization记录的 post-materialization candidate。Caller-provided booleans、arbitrary paths、standalone digests 或 Run prose SHALL NOT 替代这些完整事实。

#### Scenario: Prepare from complete accepted prerequisites
- **WHEN** exact Delivery coordination、empty OpenSpec active set、passed Full Test、trusted Architecture terminal、六个 fixed outputs 与 current repository candidate 全部一致
- **THEN** Delivery Final SHALL 允许形成 exact execution package，并 SHALL 保留 accepted Full Test → Architecture causal linkage

#### Scenario: Reject incomplete Change or active OpenSpec state
- **WHEN** 任一 required Change 未 completed、Delivery不在 expected pre-final state，或 OpenSpec仍报告任一 active Change
- **THEN** Delivery Final SHALL fail closed before coordination mutation

#### Scenario: Reject stale or partial verification and Architecture facts
- **WHEN** Full Test不是 internally consistent terminal PASS、Architecture terminal与其Delivery/candidate/execution不一致、任一fixed output缺失/非regular/hash或bytes不匹配，或current candidate不等于post-materialization candidate
- **THEN** Delivery Final SHALL fail closed，且 SHALL NOT 从摘要状态或独立 digest 推断 prerequisite acceptance

### Requirement: Delivery Final requires one exact bounded Owner authority
Delivery Final SHALL 只接受 structural-valid `OwnerAuthorityFact` 精确满足 `decision=finalize-delivery`、exact current Delivery、`changeId` absent 与 scope exactly `["delivery-final"]`。Change activation、Full Test authority、Architecture Finalization的`null` authority、Review approval、Verification PASS、terminal Run或更宽的Git/handoff scope SHALL NOT 被继承、组合或解释为 Delivery Final mutation authority。

#### Scenario: Accept exact Delivery Final authority
- **WHEN** Owner authority的decision、Delivery、absent Change与singleton scope全部精确匹配
- **THEN** Delivery Final SHALL 将该exact authority绑定进`delivery-final` package

#### Scenario: Reject missing inherited or broader authority
- **WHEN** authority缺失、目标不匹配、包含`changeId`、来自其他decision，或scope包含Git/handoff/其他额外权限
- **THEN** Delivery Final package formation SHALL fail closed before mutation

### Requirement: Trusted host owns one exact Delivery coordination closure
Delivery Final SHALL 使用一个 operation-local fixed coordination target。Derived/Agent execution SHALL 只消费 content-bound Guidance与defensive package input并返回bounded ready/correction result，SHALL NOT 获得caller-selected output path或Git capability。Trusted host SHALL 在执行前后重验package-bound prerequisite/candidate/coordination prestate，只将canonical Delivery coordination从exact active/pending prestate转换为completed/passed/completed closure，并绑定exact Full Test与Architecture lineage。Invalid result、prestate drift、repository drift或materialization failure SHALL NOT产生terminal success。

#### Scenario: Materialize the bounded coordination closure
- **WHEN** exact package、Guidance、prestate与bounded execution result均有效且执行期间没有drift
- **THEN** trusted host SHALL 只materialize canonical Delivery coordination closure、重读其exact identity，并 SHALL NOT写入其他repository surface

#### Scenario: Stop on correction or drift before terminal admission
- **WHEN** bounded execution要求product/canonical correction，或package-bound prerequisite、candidate、Guidance、coordination bytes在admission前发生变化
- **THEN** Delivery Final SHALL fail closed或返回correction-required STOP，且 SHALL NOT产生completed terminal closure或自动启动correction/verification

### Requirement: Terminal Delivery Final records exact causal continuity and stops without Git
成功的 Delivery Final terminal SHALL content-bind verified Full Test candidate及execution、trusted Architecture Finalization closure、Architecture post-materialization candidate、exact completed coordination artifact，以及host在该bounded closure后通过existing repository candidate contract派生的`finalizedCandidateRef`，并 SHALL 形成`delivery-finalization:sha256:<64 lowercase hex>` closure ref。该ref SHALL 对UTF-8 domain tag `flowkit-delivery-finalization`、一个single `0x00` byte及无BOM/newline的`JSON.stringify` projection bytes依次做SHA-256。Projection SHALL 由validator重建，并按顺序只包含trusted `deliveryId`；`operationId`；exact Final `ownerAuthority {ref, decision, deliveryId, sourceRef, scope}`；ordered Final `operationFacts`；`guidanceRef {path, contentSha256}`；completed `coordinationRef {artifact, contentSha256, bytes}`；以及`finalizedCandidateRef`。Ordered operation facts SHALL 依次包含`verifiedCandidateRef`、`fullTestExecutionRef`、`architectureFinalizationRef`、`architectureMaterializedCandidateRef`、`coordinationPrestateRef {artifact, contentSha256, bytes}`与manifest-order `completedRequiredChangeIds`；projection SHALL NOT包含derived Delivery Final ref自身，且absent `changeId` SHALL NOT被合成。Terminal validator与后续consumer SHALL 使用同一projection重算；golden vector SHALL 冻结domain/projection顺序，input property reordering SHALL NOT改变ref，任一included value或`completedRequiredChangeIds` array order改变 SHALL 改变ref。实现 SHALL NOT依赖Run prose或generic canonicalization。Terminal SHALL 在返回该compact lineage后STOP；它 SHALL NOT执行或授权commit、branch、push、PR、merge、tag、accepted-main读取、source handoff、repository integration、next operation或next Delivery。

#### Scenario: Return exact finalized candidate continuity
- **WHEN** bounded Delivery coordination closure完成并被exact重读
- **THEN** terminal SHALL 记录完整`verified → architecture-materialized → finalized` candidate lineage与content-bound closure identity，然后STOP

#### Scenario: Delivery Final reference is independently rederived
- **WHEN** trusted Final package、completed coordination与finalized candidate values不变但caller property order改变，或任一included value/`completedRequiredChangeIds` array order发生变化
- **THEN** validator SHALL 使用fixed prefix/domain与ordered projection分别重得同一ref或不同ref，并 SHALL reject malformed或mismatched supplied ref

#### Scenario: Delivery Final PASS does not create Git authority
- **WHEN** Delivery Final返回terminal success
- **THEN** repository SHALL 仍保持未commit的finalized state，后续repository integration SHALL 需要独立Owner Git authority
