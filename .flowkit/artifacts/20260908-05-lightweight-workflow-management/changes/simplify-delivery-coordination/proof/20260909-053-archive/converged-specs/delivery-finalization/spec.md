# delivery-finalization Specification

## Purpose

为 Delivery Final 提供只消费 complete accepted prerequisites 的 exact、bounded closure contract，记录可供后续 repository integration 使用的 candidate continuity，并在不取得 Git 或 next-operation authority 的边界停止。

## Requirements

### Requirement: Delivery Final consumes complete exact prerequisite outcomes

Final SHALL 从 canonical coordination、只读 OpenSpec、可信已接纳完成来源及当前 Full Test 消费 prerequisites。Delivery SHALL active，manifest required Changes SHALL 全部 completed，active OpenSpec set SHALL empty；集合不得由 caller 缩小。各 Change SHALL 有唯一 accepted archive 与直接关联 approved review-apply，身份、Role、terminal、链接、来源及相关完整性有效。

Full Test SHALL 来自 target fullTestAttempt 指向的当前真实完整 PASS，实际来源/项目/Delivery/execution 匹配，当前输入等于 inputRef。失败、partial、开始未完成、必要材料缺失/损坏、输入改变 SHALL 拒绝，不回用旧 PASS。SHALL NOT 使用 Git candidate、架构结果或 standalone hash 代替这些事实；bootstrap 历史不得转成 canonical 产品 Run。

#### Scenario: Prepare from complete accepted prerequisites
- **WHEN** 上述 required 完成事实、空 active set 和当前测试有效且没有任何图
- **THEN** Final SHALL 可准备，不遍历全部原始 proof 或重放祖先 admission

#### Scenario: Reject incomplete Change or active OpenSpec state
- **WHEN** required Change 未完成、完成来源不符或 active set 非空
- **THEN** Final SHALL 在写入前拒绝并指出具体事实

#### Scenario: Reject stale or partial verification
- **WHEN** 当前 attempt 失败/未完成、材料无效或测试输入变化
- **THEN** Final SHALL 拒绝，不用旧 PASS 重建当前验证

#### Scenario: Reject stale or partial verification and Architecture facts
- **WHEN** caller 用旧测试或 Architecture outcome 补充当前资格
- **THEN** Final SHALL 拒绝这些替代输入，不要求任何架构证明

#### Scenario: 缩小证据集合不能通过
- **WHEN** manifest required 为 A/B，但仅 A 存在 accepted completion
- **THEN** Final SHALL 指出 B 的缺口，不仅凭 completed 字段放行

### Requirement: Delivery Final requires one exact bounded Owner authority

Final SHALL 仅接受 structural-valid `OwnerAuthorityFact`：`decision=finalize-delivery`、exact current Delivery、`changeId` absent、scope exactly `["delivery-final"]`。Change activation、Full Test authority、null、Review approval、Verification PASS、terminal Run、Git/handoff scope SHALL NOT 继承或组合为 Final mutation authority。

#### Scenario: Accept exact Delivery Final authority
- **WHEN** decision、Delivery、absent Change 与 singleton scope 精确匹配
- **THEN** Final SHALL 将该 authority 绑定进 package

#### Scenario: Reject missing inherited or broader authority
- **WHEN** authority 缺失、目标不符、含 changeId、来自其他 decision 或含额外 scope
- **THEN** Final SHALL 在 mutation 前拒绝

### Requirement: Trusted host owns one exact Delivery coordination closure

host SHALL 限定固定 manifest 目标，在写入前重验相关完成事实、当前 attempt/输入、Guidance 和目标 prestate；Agent 只返回 bounded ready/correction，不获得任意输出路径或 Git capability。host SHALL 窄写 completed/passed/completed 与必要 Final 关联，保留 fullTestAttempt 和全部非目标 bytes/字段顺序，不复制 outcome、Run 快照或架构字段。

第一笔内容写入 SHALL 同时设置 finalization.confirmationRef=null。写后精确读回、相关完成事实、当前 attempt/输入与必要材料复验全部成功后，host SHALL 才以第二笔局部窄写发布 confirmationRef=本次 deliveryFinalizationRef；发布前 SHALL 核对目标未漂移并紧邻发布复核当前 attempt/输入。确认的原子替换 SHALL 是成功提交点；SHALL NOT 在其后追加决定该次成功资格的业务验收。

明确未改目标的失败 SHALL 报告 mutationStatus=not-written；内容已写但未确认、或确认发布后的读回/响应无法确认 SHALL 报告 written-unconfirmed 并区分失败阶段；无法确认替换是否发生 SHALL 报告 unknown。失败调用 SHALL NOT 虚报 terminal，也 SHALL NOT 自动回滚、补确认或继续下一操作。仅有 completed 不构成成功。

#### Scenario: Materialize the bounded coordination closure
- **WHEN** 前置、Guidance、bounded result 与目标 prestate 有效
- **THEN** host SHALL 先写未确认内容，在上述复验通过后窄写确认引用，读回真实结果并保留两笔写入的非目标 bytes

#### Scenario: Stop on correction or drift before terminal admission
- **WHEN** 写前要求 correction 或相关事实/目标 drift
- **THEN** Final SHALL 不写完成并 STOP；无关非产品文件追加 SHALL 不单独构成 drift

#### Scenario: Report failure after replacement truthfully
- **WHEN** 完成内容已替换，但读回失败或当前测试输入漂移导致复验不通过
- **THEN** Final SHALL 保留 null confirmationRef，返回 written-unconfirmed 和具体原因；全新会话 SHALL 读为 unconfirmed，无成功 record，不自动回滚或重开 Changes

#### Scenario: Confirmation publication cannot be acknowledged
- **WHEN** 所有必要复验通过，确认发布时或之后的读回/响应失败
- **THEN** 本次 SHALL 不虚报 terminal；全新会话 SHALL 仅在实际存在完整匹配 confirmationRef 时辨认为已成功提交，否则维持 unconfirmed，不自动重试或补确认

### Requirement: Terminal Delivery Final records exact causal continuity and stops without Git

Final SHALL 在既有 manifest finalization 中只保存 state=completed、ownerAuthorityRef、sourceRef、fullTestAttempt、verifiedCandidateRef、fullTestExecutionRef、confirmationRef。confirmationRef SHALL 在内容阶段为 null，仅由同次 host 完成全部必要复验后发布为本次局部 ref；Owner 授权引用 SHALL NOT 代替成功确认。SHALL 不保存 gitCheckpoint、重复 formalVerificationCandidate、requiredEvidence 或 finalizedCandidateRef；其他非目标字段 SHALL 保留。

只读结果 SHALL 包含 projectId、deliveryId、上述五个关联字段及 deliveryFinalizationRef。ref SHALL 为 flowkit-delivery-finalization + 0x00 + 固定序 JSON 的 SHA-256，输出 delivery-finalization:sha256:<64 lowercase hex>；projection 顺序 SHALL 为 projectId、deliveryId、ownerAuthorityRef、sourceRef、fullTestAttempt、verifiedCandidateRef、fullTestExecutionRef，UTF-8 无 BOM/newline，不含 ref 自身。此局部引用 SHALL NOT 包含 Git/全 manifest 摘要或历史材料。

跨会话 reader SHALL 从 project/固定 manifest 核对完成字段、当前协调中的 attempt 与 finalization 关联一致且 confirmationRef 等于重建的局部 ref，才返回 completed/record。完成内容存在但确认 null/缺失/不符或必要关联不可读 SHALL 返回 unconfirmed/record=null；未进入完成状态 SHALL 返回 not-completed。confirmationRef SHALL 不包含在自身摘要 projection 中，SHALL 不从 completed、Owner ref 或自签 hash 自动补写。

reader SHALL 不依赖聊天 package、不重新执行 Final/Review/测试，不将只读辨认已提交事实视为新实施或测试 PASS。新 validator/Integration SHALL 同步确认条件；旧无确认记录不得自动升级，历史原样可读不迁移。正常成功与确认前失败 SHALL 有不同持久输入；确认提交成功但响应丢失 SHALL 可由实际标记只读恢复认识，不触发自动执行。

#### Scenario: Return exact finalized candidate continuity
- **WHEN** Final 内容读回与相关复验完成，成功确认已发布并读回
- **THEN** 系统 SHALL 返回关联当前 Full Test 的最小 record 并 STOP，不生成 Git candidate 或第二结果文件

#### Scenario: Delivery Final reference is independently rederived
- **WHEN** input property 仅重排或包含值改变
- **THEN** validator SHALL 分别得到相同或不同局部 ref；缺字段/旧形状/mismatch SHALL 拒绝

#### Scenario: Delivery Final PASS does not create Git authority
- **WHEN** Final 成功
- **THEN** 系统 SHALL 不 commit/transport/Integration/激活下一 Delivery，不产生 Git 权限

#### Scenario: Read completion in a new session
- **WHEN** 新会话读取具有有效 confirmationRef 的同一 manifest，只有无关文档/历史追加
- **THEN** reader SHALL 重建同一 Final record，不要求旧聊天 package、全仓摘要或历史 proof

#### Scenario: Content completion without confirmation is not Final success
- **WHEN** 第一笔写后读回失败、输入漂移或确认发布前中断，之后由全新会话读取同一 completed manifest
- **THEN** reader SHALL 因无有效 confirmationRef 返回 unconfirmed，不能只靠重算局部 hash 取得成功资格

### Requirement: Final 消费相关已接纳终点而不建立第二证据快照

系统 SHALL 由可信宿主的既有完成来源能力定位 manifest 所选 Change 的唯一 archive 与其直接关联 review-apply，从 target 受控地址读回三文件并核对已接纳来源、归属、terminal/Role/verdict/linkage 和必要 bytes 完整性。普通 caller SHALL NOT 任意注入 reader JSON、地址、approved 或自签 hash 取得完成资格；来源能力缺失 SHALL 报告 completion-source-unavailable，而非临时生成一个成功记录。

本次 changeCompletions SHALL 仅含每个 required Change 的 changeId、archiveRunId、reviewApplyRunId、archiveResultRef、reviewResultRef，按 manifest 顺序，用于相关事实重验，不持久复制为完成数据库。SHALL NOT 重放所有祖先 ActionPackage/admission、扫描整个 artifacts 或要求长期保留所有原始实验来通过 Final。Action owner 的严格执行和完整性合同 SHALL 保持不变。

#### Scenario: 必需 Run 缺失或损坏
- **WHEN** 相关 archive/review 三文件缺失、bytes/归属/Role/verdict/linkage 不符
- **THEN** Final SHALL 拒绝并指出该 Change，不用 hash 自洽放行

#### Scenario: 无关历史追加不影响覆盖
- **WHEN** 相关完成来源有效，仅追加无关历史或 .tmp 不存在
- **THEN** Final SHALL 不扩大 required 集合，不重验无关 proof，不要求清理或转存

#### Scenario: 错项目或自签来源拒绝
- **WHEN** 返回的记录结构合法，但不是受控已接纳来源，或存在多个无法确定的 archive
- **THEN** Final SHALL 报告来源缺失/歧义，不按最大目录号猜测

#### Scenario: 外部证据必须可真实取回
- **WHEN** 读取历史外部 Full Test 记录
- **THEN** 历史 SHALL 原样按原 owner 可读；当前 Final SHALL 只消费 target 当前 attempt，不迁移或用历史补齐当前

#### Scenario: 无架构证据的完整输入
- **WHEN** required 完成来源与当前 Full Test 有效且没有架构来源
- **THEN** Final SHALL 可完成；必要材料保留原处，不删除、不新增“不适用”证明
