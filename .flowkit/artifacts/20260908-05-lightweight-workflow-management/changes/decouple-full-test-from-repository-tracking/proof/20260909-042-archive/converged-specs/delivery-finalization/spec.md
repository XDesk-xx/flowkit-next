# delivery-finalization Specification

## Purpose

为 Delivery Final 提供只消费 complete accepted prerequisites 的 exact、bounded closure contract，记录可供后续 repository integration 使用的 candidate continuity，并在不取得 Git 或 next-operation authority 的边界停止。

## Requirements

### Requirement: Delivery Final consumes complete exact prerequisite outcomes

Final SHALL 从 canonical coordination、read-only OpenSpec active observation 与真实 terminal passed Full Test 验证 prerequisites。Delivery SHALL active，required Changes SHALL 全部 completed，active OpenSpec set SHALL empty；Full Test 的 Delivery、candidate、execution 与实际来源 SHALL 一致，当前 Full Test SHALL 来自 target coordination 指向的唯一 attempt，当前测试相关输入 SHALL 等于其 inputRef，不使用 Git v2 candidate 相等作为测试有效性。Final SHALL 不要求 Architecture outcome、六槽图、架构 closure 或 post-Architecture candidate。

Final SHALL 取得全部 required Change 的 accepted archive/review 与必要完整性链接，并验证 Full Test 可取回完整来源；集合由 canonical required Change IDs 和可信已接受事实确定，caller 不得缩小。系统 SHALL 不将 standalone digest、boolean、Run prose 或无真实来源的自洽 JSON 当作执行事实；D04 bootstrap 历史不自动解释为 canonical product Run。

#### Scenario: Prepare from complete accepted prerequisites
- **WHEN** coordination、empty active set、passed Full Test、直接匹配的当前 attempt 测试输入 和必要证据均有效，且没有图或 Architecture outcome
- **THEN** 系统 SHALL 形成精确 package，保留 Change acceptance 与 Full Test → Final 关系

#### Scenario: Reject incomplete Change or active OpenSpec state
- **WHEN** required Change 未完成、Delivery prestate 不符或 active OpenSpec set 非空
- **THEN** Final SHALL 在 mutation 前拒绝

#### Scenario: Reject stale or partial verification
- **WHEN** Full Test 失败、未完成、来源缺失/不符，或当前 attempt 不匹配或测试相关输入已变化
- **THEN** Final SHALL 拒绝，不从旧 PASS、摘要或架构结果重建当前验证

#### Scenario: Reject stale or partial verification and Architecture facts
- **WHEN** caller 用 stale/partial Full Test 或已退役的 Architecture outcome 作为当前 Final 前置
- **THEN** Final SHALL 拒绝；该保留场景按新合同不再校验六槽，而是拒绝旧架构输入形状

#### Scenario: 缩小证据集合不能通过
- **WHEN** required Changes 为 A/B，但仅有 A 的证据，或 B 的必要链接缺失/错误
- **THEN** Final SHALL 拒绝，不因 completed 字段或 candidate 相同而放行

### Requirement: Delivery Final requires one exact bounded Owner authority

Final SHALL 仅接受 structural-valid `OwnerAuthorityFact`：`decision=finalize-delivery`、exact current Delivery、`changeId` absent、scope exactly `["delivery-final"]`。Change activation、Full Test authority、null、Review approval、Verification PASS、terminal Run、Git/handoff scope SHALL NOT 继承或组合为 Final mutation authority。

#### Scenario: Accept exact Delivery Final authority
- **WHEN** decision、Delivery、absent Change 与 singleton scope 精确匹配
- **THEN** Final SHALL 将该 authority 绑定进 package

#### Scenario: Reject missing inherited or broader authority
- **WHEN** authority 缺失、目标不符、含 changeId、来自其他 decision 或含额外 scope
- **THEN** Final SHALL 在 mutation 前拒绝

### Requirement: Trusted host owns one exact Delivery coordination closure

Final SHALL 使用 operation-local fixed coordination target。Derived/Agent execution SHALL 只消费 content-bound Guidance 和 defensive package，返回 bounded ready/correction result，不获得 caller-selected output path 或 Git capability。Trusted host SHALL 在执行前后重验 package-bound prerequisite/current attempt/test-input/coordination prestate，仅将 canonical Delivery coordination 从 exact active/passed/pending prestate 窄写为 completed/passed/completed，绑定真实 Full Test lineage，不增加架构字段。Invalid result、prestate/repository drift、materialization/readback failure SHALL NOT 产生成功 terminal。

#### Scenario: Materialize the bounded coordination closure
- **WHEN** package、Guidance、prestate 和 bounded result 均有效且无 drift
- **THEN** host SHALL 只写 canonical coordination closure 并重读其 exact identity，保持所有非目标 bytes/字段顺序，不写其他 repository surface

#### Scenario: Stop on correction or drift before terminal admission
- **WHEN** execution 要求 product/canonical correction，或 prerequisite/test-input/Guidance/coordination 在 admission 前漂移
- **THEN** Final SHALL fail closed 或 correction-required STOP，不产生完成事实、不自动启动 correction/verification

### Requirement: Terminal Delivery Final records exact causal continuity and stops without Git

成功 terminal SHALL 绑定 verified Full Test inputRef/attempt execution、completed coordination、`requiredEvidence` 和窄写后 v2 `finalizedCandidateRef`，不含 Architecture closure 或 post-Architecture candidate。Final ref SHALL 保持 `delivery-finalization:sha256:<64 lowercase hex>`；输入为 UTF-8 `flowkit-delivery-finalization`、一个 `0x00`、无 BOM/newline 的固定 JSON projection。

Projection SHALL 按顺序为 deliveryId、operationId、exact ownerAuthority（ref/decision/deliveryId/sourceRef/scope，不合成 absent changeId）、operationFacts、guidanceRef（path/contentSha256）、coordinationRef（artifact/contentSha256/bytes）、finalizedCandidateRef。operationFacts SHALL 依次为 verifiedCandidateRef、fullTestExecutionRef、coordinationPrestateRef（artifact/contentSha256/bytes）、manifest-order completedRequiredChangeIds、requiredEvidence；requiredEvidence SHALL 使用下述固定形状和顺序；不包含自身 derived ref。

Validator 与 Integration SHALL 重建相同 projection；只重排 input property 不改变 ref，included value、ordered array 或 evidence 改变 SHALL 改变 ref。旧架构字段、缺字段或 mismatch SHALL 拒绝，不忽略旧字段再重签。历史 bytes 保留且不升级为新 terminal。完整读回后 SHALL STOP，不执行/授权 Git、transport、Integration 或 next Delivery。

#### Scenario: Return exact finalized candidate continuity
- **WHEN** 窄写完成且 exact readback，所有来源仍有效
- **THEN** terminal SHALL 记录 verified 测试输入 → finalized Git 投影及证据/ref，然后 STOP；不虚构中间架构 candidate

#### Scenario: Delivery Final reference is independently rederived
- **WHEN** input property 仅重排，或 included value/array/evidence 改变
- **THEN** validator SHALL 分别重得同一/不同 ref，拒绝缺字段/旧架构字段/mismatch，并以新 golden vectors 固定 projection

#### Scenario: Delivery Final PASS does not create Git authority
- **WHEN** Final 成功
- **THEN** 系统 SHALL 不 commit，Integration 另需明确 Owner Git authority

既有 verifiedCandidateRef 字段 SHALL 承载 Full Test inputRef；finalizedCandidateRef 仍为独立 Git v2 投影，二者不得直接比较为同一候选。既有 projection 字段顺序不变，validator/直接 Integration 消费者 SHALL 同步值域；本条不扩大其他 Git 前置。

### Requirement: 必要证据是 Final 的有限前置快照而非可选清单

`requiredEvidence` SHALL 精确为有序 `{projectId, deliveryId, changeClosures, fullTest}`，不包含 architecture。changeClosures SHALL 按 canonical manifest required Change 顺序完整覆盖，每项为 `{changeId, archiveRunId, reviewApplyRunId, runs}`；runs 覆盖绑定 archive/review 的必要 previous/input 完整性链，可信 owner 确认边界，按 runId UTF-8 排序，每项 `{runId, artifacts}`。artifacts SHALL 精确为 action.md/context.json/result.json 的受控地址与 `{artifact, contentSha256, bytes}`。fullTest SHALL 为 `{executionRef, sourceRef, artifacts}`；artifacts 按 artifact UTF-8 排序，保存完整 outcome/所需执行证据，不用 PASS/digest 替代来源。

快照 SHALL 从 project identity、manifest 与实际 owner 材料派生重验，不产生 Verification/Review authority、Registry、数据库或 evidence lifecycle。sourceRef SHALL 来自被绑定的执行 owner，而非 Agent 自填或自签 hash。完整读取、现行 schema/admission、归属、Reviewer verdict、archive acceptance 与实际来源 SHALL 分别核验；无可信终点或缺失/损坏/歧义则拒绝，不猜最近目录，不截断必要链接，不把所有历史都当必需。消费者 SHALL 不再要求架构来源 reader 或遍历架构证据。

#### Scenario: 必需 Run 缺失或损坏
- **WHEN** candidate 相同，但必要 Run 三文件缺失、hash/bytes 不符或 role/verdict/地址链非法
- **THEN** Final/Integration SHALL 拒绝，不因产品 hash 排除 Run 而接受

#### Scenario: 无关历史追加不影响覆盖
- **WHEN** 必要材料仍有效，仅追加不被前置链依赖的历史
- **THEN** 系统 SHALL 不将追加自动升级为必要证据或产品变化

#### Scenario: 错项目或自签来源拒绝
- **WHEN** outcome 仅 hash 自洽而无可信来源，或 project/Delivery/Change 不匹配
- **THEN** 系统 SHALL 拒绝，不用 standalone sourceRef 替代实际保存/取回

#### Scenario: 外部证据必须可真实取回
- **WHEN** 历史 Full Test 来源位于仓库外
- **THEN** 历史读取 SHALL 保持原 owner 边界且不强制迁移；新 Full Test/Final SHALL 只消费 target 当前 attempt，不能用历史外部来源替换当前结果

#### Scenario: 无架构证据的完整输入
- **WHEN** required Change 链与 Full Test 完整有效，输入不提供 architecture 或架构 reader
- **THEN** 系统 SHALL 接受该必要证据形状，不访问架构材料，不要求“不适用”声明

Full Test 来源 SHALL 由 target 当前 attempt reader 派生；caller 不得任意替换 outcome 或选择旧 PASS。只读相关当前开始/命令/结果引用，不复制整份 outcome 到第二个存储。Change closure 既有覆盖规则 SHALL 保持。
