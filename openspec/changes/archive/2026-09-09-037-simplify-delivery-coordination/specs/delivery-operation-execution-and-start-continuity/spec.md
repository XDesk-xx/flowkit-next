## MODIFIED Requirements

### Requirement: Delivery Start package facts are minimal and anchored to exact accepted repository truth

Start SHALL 仅绑定本项目身份、Owner 选定规划引用与固定 Delivery manifest 的局部 prestate，不要求 acceptedBaseCommit、HEAD、首个 commit、全仓 clean 或任何架构材料。规划引用 SHALL 从 target 实读并匹配 Owner 范围，不以 caller hash 替代来源。Owner authority SHALL 为匹配 Delivery、无 changeId 的 create-delivery 且 scope 包含 delivery-start；本 operation SHALL NOT 解释或执行 Git scope。

Start SHALL 检查目标归属、同名覆盖、活动目标歧义、不安全路径及本次目标/规划漂移。无关未提交文件 SHALL NOT 单独阻断。既有精确匹配内容 SHALL 可验证复用；不符内容 SHALL NOT 静默覆盖。

#### Scenario: Accept exact Delivery Start facts and authority
- **WHEN** 本项目、规划、目标与 Start authority 匹配，Git 已初始化但尚无首个 commit
- **THEN** 系统 SHALL 允许 Start，不要求 SHA、Git checkpoint 或图表历史

#### Scenario: Reject stale base or wrong planning reference
- **WHEN** 本次固定目标或规划 bytes 与 preparation 不符
- **THEN** 系统 SHALL 拒绝该写入；HEAD 改变本身 SHALL NOT 构成 Start drift

#### Scenario: Reject missing bounded Start authority
- **WHEN** authority 缺失、Delivery 不符、含 changeId 或没有 delivery-start scope
- **THEN** 系统 SHALL 不形成可执行 Start package

#### Scenario: Unrelated dirty files do not become target conflicts
- **WHEN** 无关文件未提交而 manifest/规划目标无冲突
- **THEN** Start SHALL 可完成并保留这些无关 bytes

### Requirement: Delivery Final package binds exact accepted closure facts and exact Final authority

Final SHALL 从可信宿主的完成来源、本项目 manifest required IDs、空 active OpenSpec 集合与当前有效 Full Test 派生 closed package。facts SHALL 仅绑定 projectId、coordinationPrestateRef、completedRequiredChangeIds、有界 changeCompletions、fullTestAttempt、verifiedCandidateRef 和 fullTestExecutionRef；verifiedCandidateRef SHALL 表示 Full Test inputRef。changeCompletions SHALL 按 manifest 顺序覆盖全部 required Changes 的 accepted archive 与关联 approved review-apply，不含全部历史 Run 或 Full Test outcome 快照。

系统 SHALL 保持 exact finalize-delivery singleton authority、manager content-bound Guidance 与来源/归属/完整性校验；SHALL NOT 接受 caller 缩小集合、任意 outcome/approved 布尔值、自签来源或旧 requiredEvidence/finalizedCandidateRef/架构字段。Package SHALL 不产生 Git 权限或选择下一 operation。

#### Scenario: Form a valid Delivery Final package
- **WHEN** 有界完成事实、当前测试、Guidance 和 Final authority 全部有效
- **THEN** host SHALL 形成直接关联当前 Full Test 的 package，不重放祖先 admission

#### Scenario: Reject caller-substituted or stale Final facts
- **WHEN** 来源不明、缺 required Change、当前测试失效、归属不符或提供旧字段
- **THEN** host SHALL 拒绝，不靠空 evidence、dummy SHA 或自洽 hash 补齐

#### Scenario: Final package cannot select repository integration
- **WHEN** Final package 形成或执行完毕
- **THEN** 系统 SHALL 不选择 Integration、不取得 Git authority

### Requirement: Repository Integration package binds exact finalized continuity Git prestate and exact Git authority

Integration SHALL 从本项目 completed manifest 实读最小 Final record，绑定 deliveryFinalizationRef、preIntegrationHead、Delivery branch、targetMainRef、targetMainPreIntegrationCommit、现有 Git accepted-base provenance 与 checkpointOperation。SHALL NOT 要求 Final 全 package、finalizedCandidateRef、requiredEvidence、替代整仓摘要或历史证据遍历。

checkpointOperation SHALL 仍仅为 create-new 或包含 exact SHA-1 checkpointCommit 的 reuse-existing，并由可信 host 依据独立 Owner 输入绑定；singleton authorize-repository-integration authority、manager Guidance、Git 对象/来源/prestate 核验保持。acceptedMainCommit SHALL 仅在 acceptance 后从 Git 实读，不能预声明。此处 Git base SHALL NOT 回流为 Start 或下一 Delivery 的 SHA 门槛。

#### Scenario: Form a valid Repository Integration package
- **WHEN** 实读 Final 已完成，Owner 指定 Git 操作与目标/prestate/来源有效
- **THEN** host SHALL 冻结该操作，不读取旧 Final evidence snapshot

#### Scenario: Reject stale or caller-substituted Git facts
- **WHEN** HEAD/target/operation 或复用对象漂移，或 caller 预声明 accepted main
- **THEN** 系统 SHALL 拒绝，不静默重绑定或自动重整历史

#### Scenario: Existing Delivery operation boundaries remain unchanged
- **WHEN** Integration 形成或完成
- **THEN** 其他 operations 的各自 authority/STOP SHALL 保持，不自动转换生命周期

### Requirement: Delivery Start 在内容完成边界返回可核验记录

Start SHALL 仅以固定 manifest 为业务输出，验证真实内容、project/Delivery/规划范围并读回；已有匹配内容直接复用，缺必要项目材料则明确报告，不强制 Git history 或 transport。成功 SHALL 返回 contentCompletion，包含 projectId、deliveryId、planningReference 与唯一 coordinationRef（artifact/contentSha256/bytes），不含 acceptedBaseCommit、candidateRef、validation 快照或 fixedPointCommit。

Start SHALL NOT 接受只有 validated 标记的成功，也 SHALL NOT 要求伪造 Git/OpenSpec 工具 PASS 报告作为内容 receipt。Start SHALL 不执行 commit callback；独立 Git 节点另行授权。写入失败 SHALL 区分 not-written、written-unconfirmed、unknown，不伪报无副作用，不自动重试/回滚。完成或失败后 SHALL STOP，不创建 Delivery Run。

#### Scenario: 无 Git 权限也可完成内容
- **WHEN** Start authority 与真实 manifest 验证通过，无 checkpoint 请求
- **THEN** terminal SHALL 返回 contentCompletion，不访问 Git mutation 或 Archify

#### Scenario: validated 标记不能充当证明
- **WHEN** 只有 validated，或 manifest 缺失、目标/规划不符、来源无法确认
- **THEN** 系统 SHALL 拒绝内容完成，不生成空 receipt

#### Scenario: 显式 checkpoint 独立核验
- **WHEN** Owner 同时提出 Start 后 commit
- **THEN** Start SHALL 只完成自身内容并 STOP；Git 操作由独立授权节点执行，不内嵌提交

#### Scenario: 已有 exact 状态无需强制 transport
- **WHEN** 本项目/规划/manifest 的必要状态可直接读取
- **THEN** Start SHALL 验证复用，不要求 ZIP/bundle、Git 固定点或架构 runtime

#### Scenario: Start write cannot be confirmed
- **WHEN** callback 已可能写入但抛错或后续读回失败
- **THEN** host SHALL 有界读回并报告实际 mutationStatus，不一律宣称 not-written 或成功
