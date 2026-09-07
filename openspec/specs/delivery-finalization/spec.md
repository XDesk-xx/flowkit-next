# delivery-finalization Specification

## Purpose

为 Delivery Final 提供只消费 complete accepted prerequisites 的 exact、bounded closure contract，记录可供后续 repository integration 使用的 candidate continuity，并在不取得 Git 或 next-operation authority 的边界停止。

## Requirements

### Requirement: Delivery Final consumes complete exact prerequisite outcomes

Final SHALL 从 canonical coordination、read-only OpenSpec active observation、真实 terminal passed Full Test 与 terminal Architecture outcomes 验证 prerequisites。Delivery SHALL active，所有 required Changes SHALL completed，active OpenSpec set SHALL empty；Full Test/Architecture 的 Delivery、verified candidate、execution、outputs SHALL 一致，六槽 SHALL 仍匹配 regular-file bytes，当前 v2 candidate SHALL 等于 Architecture post-materialization candidate。

Final SHALL 同时取得所有 required Change 的 accepted archive/review 及必要完整性链接，并验证 Full Test/Architecture 的可取回完整来源；该集合 SHALL 由 canonical required Change IDs 和可信已接受前置事实确定，不由 caller 选择较小集合。系统 SHALL 不将 standalone digest、boolean、Run prose 或自洽但无来源的完整 JSON 当成真实执行。D04 bootstrap 历史 SHALL 不被自动解释为 canonical product Run。

#### Scenario: Prepare from complete accepted prerequisites

- **WHEN** coordination、empty active set、Full Test、Architecture、六槽、v2 candidate 及全部必要证据覆盖/来源一致
- **THEN** 系统 SHALL 形成精确 package，保留 Change acceptance 与 Full Test → Architecture 因果关系

#### Scenario: Reject incomplete Change or active OpenSpec state

- **WHEN** required Change 未 completed、Delivery 不在 expected prestate 或 active OpenSpec set 非空
- **THEN** Final SHALL 在 mutation 前拒绝

#### Scenario: Reject stale or partial verification and Architecture facts

- **WHEN** Full Test 非有效 PASS、Architecture lineage 不符、六槽缺失/非 regular/hash 或 bytes 不匹配、或候选不符
- **THEN** Final SHALL 拒绝，不从摘要重建接受事实

#### Scenario: 缩小证据集合不能通过

- **WHEN** required Changes 为 A、B，但只提供 A 的 archive/review，或 B 来源错误/所需链接缺失
- **THEN** Final SHALL 拒绝，不因两个 Change 的 completed 字段或产品 candidate 相同而放行

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

成功 terminal SHALL 绑定 verified Full Test candidate/execution、trusted Architecture closure、post-materialization candidate、completed coordination、`requiredEvidence` 和闭合后的 v2 `finalizedCandidateRef`。Final ref 外形 SHALL 保持 `delivery-finalization:sha256:<64 lowercase hex>`；输入仍为 UTF-8 `flowkit-delivery-finalization`、一个 `0x00`、无 BOM/newline 的固定 JSON projection。

Projection SHALL 按顺序为 deliveryId、operationId、exact ownerAuthority（ref/decision/deliveryId/sourceRef/scope，不合成 absent changeId）、operationFacts、guidanceRef（path/contentSha256）、coordinationRef（artifact/contentSha256/bytes）、finalizedCandidateRef。operationFacts SHALL 依次为 verifiedCandidateRef、fullTestExecutionRef、architectureFinalizationRef、architectureMaterializedCandidateRef、coordinationPrestateRef（artifact/contentSha256/bytes）、manifest-order completedRequiredChangeIds、requiredEvidence。requiredEvidence SHALL 使用本 capability 的固定形状/顺序；projection 不包含自身 derived ref。

Validator 与 Integration SHALL 重建相同 projection；字段顺序调整不改变 ref，任一值、ordered array 或证据绑定变化 SHALL 改变 ref。旧缺少 requiredEvidence 的 closure SHALL 不可 admitted 为新合同，历史 bytes 不重写。系统 SHALL 仅完成既有 coordination 窄写入，保持其他字段/顺序/bytes，完整读回后 STOP；不得执行或授权 Git、transport、Integration 或 next Delivery。

#### Scenario: Return exact finalized candidate continuity

- **WHEN** bounded coordination closure 成功并 exact readback，所有来源仍有效
- **THEN** terminal SHALL 记录 verified → architecture-materialized → finalized 三阶段各自候选、必要证据及 content-bound ref，然后 STOP

#### Scenario: Delivery Final reference is independently rederived

- **WHEN** caller 仅调整 object property order，或修改任一 included value/ordered array/requiredEvidence
- **THEN** validator SHALL 分别重得同一或不同 ref，拒绝缺字段及 mismatch；golden vectors SHALL 覆盖新 projection

#### Scenario: Delivery Final PASS does not create Git authority

- **WHEN** Final 返回 terminal success
- **THEN** 系统 SHALL 不 commit，后续 Integration SHALL 另需 Owner 的明确 Git authority

### Requirement: 必要证据是 Final 的有限前置快照而非可选清单

`requiredEvidence` SHALL 仅含有序字段 `{projectId, deliveryId, changeClosures, fullTest, architecture}`。changeClosures SHALL 按 canonical manifest required Change 顺序完整覆盖，每项为 `{changeId, archiveRunId, reviewApplyRunId, runs}`；runs SHALL 覆盖绑定 archive/review 的既有必要 previous/input 完整性链，由可信 owner 确认边界，按 runId UTF-8 bytes 排序，每项为 `{runId, artifacts}`。artifacts SHALL 精确为 action.md、context.json、result.json 的受控地址与 `{artifact, contentSha256, bytes}`，不接受任意 path。fullTest SHALL 为 `{executionRef, sourceRef, artifacts}`，architecture SHALL 为 `{architectureFinalizationRef, sourceRef, artifacts}`；两者 artifacts 为对应 owner 保存的完整 outcome/执行证据材料，按 artifact UTF-8 bytes 排序，禁止仅保存 PASS/digest 替代完整来源。

该快照 SHALL 从当前项目 identity、manifest 与各 owner 的完整实际材料派生并重验，不自行产生 Verification/Review authority、不新增 Registry、持久化数据库或独立 evidence lifecycle。可信 sourceRef SHALL 来自被绑定的执行 owner，不由 Agent 自填字符串或自签 hash 建立。完整读取、现行 schema/admission、project/Delivery/Change、Reviewer verdict、archive acceptance 与实际来源 SHALL 分别验证。不存在可信链终点或遇到缺失/损坏/歧义 SHALL 拒绝，而非猜最近目录或把所有历史都当必需。已绑定的必要链接不能任意截断。

#### Scenario: 必需 Run 缺失或损坏

- **WHEN** 候选相同，但已绑定必需 Run 三文件缺一、hash/bytes 不符或 role/verdict/地址链不合法
- **THEN** Final/后续 Integration SHALL 拒绝，不因 Runs 被产品 hash 排除而接受

#### Scenario: 无关历史追加不影响覆盖

- **WHEN** 已绑定必需材料仍完整有效，仅追加不被前置链依赖的历史记录
- **THEN** 系统 SHALL 不将该追加自动升级为必要证据或产品变化

#### Scenario: 错项目或自签来源拒绝

- **WHEN** 完整-looking outcome 仅 hash 自洽但无可信执行来源，或 project/Delivery/Change 不匹配
- **THEN** 系统 SHALL 拒绝；来源的实际保存/取回不能由 standalone sourceRef 代替

#### Scenario: 外部证据必须可真实取回

- **WHEN** 必要 Full Test 或 Architecture 来源保存在仓库外
- **THEN** 消费者 SHALL 通过已验证的 owner 保存/取回边界读取完整事实并核验来源，不要求迁入 Runs，不接受仅可比较的 hash
