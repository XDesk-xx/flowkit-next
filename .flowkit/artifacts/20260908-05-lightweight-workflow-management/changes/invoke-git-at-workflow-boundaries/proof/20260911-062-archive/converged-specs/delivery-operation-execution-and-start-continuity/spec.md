# delivery-operation-execution-and-start-continuity Specification

## Purpose

为 Flowkit Delivery-level execution 建立 closed exact-operation、content-bound canonical Guidance 与 minimal execution package contract，并以 Delivery Start 首次证明 accepted-base continuity、显式 authority 与固定点提交边界。

## Requirements

### Requirement: Delivery operation identity is closed and maps deterministically to canonical Guidance

系统 SHALL 只接受四个 canonical `DeliveryOperationId`：`delivery-start`、`delivery-full-test`、`delivery-final`、`delivery-repository-integration`。每个 exact operation SHALL 通过固定 1:1 映射唯一对应 canonical repository-relative Delivery Guidance path；未知 literal、已退役的 `delivery-architecture-finalization`、alias、模糊匹配、动态 registration/ranking SHALL fail closed。identity SHALL 只表达 already-decided execution，不决定下一 operation、Change activation、Reviewer/Verification truth 或 Git authority。

#### Scenario: Resolve the canonical Guidance path for Delivery Start
- **WHEN** already-decided operation 为 `delivery-start`
- **THEN** 系统 SHALL 唯一解析 `skills/delivery/start/SKILL.md`

#### Scenario: Reject unknown Delivery operation
- **WHEN** operation 不在四值集合中，包括 `delivery-architecture-finalization`
- **THEN** 系统 SHALL 拒绝，不通过 alias/discovery 转换，不返回 optional、skip 或空成功结果

#### Scenario: Operation identity cannot advance the Delivery lifecycle
- **WHEN** valid operation 已识别
- **THEN** 该 identity SHALL NOT 推导 next operation、Owner authority、Change state 或 mutation permission

### Requirement: Delivery Guidance identity is exact, content-bound, and product-canonical

系统 SHALL 只从 trusted manager 安装根与 exact `DeliveryOperationId` 解析 Delivery Guidance，绑定 exact canonical manager-relative path 与 exact file-content SHA-256。canonical entry SHALL 为 readable regular file；missing、unreadable、non-regular、symlink、wrong-operation mapping 或 content mismatch SHALL fail closed。caller / Agent SHALL NOT 任意指定 Guidance path/content identity，product execution SHALL NOT fallback 到 target 同名资产、`.agents/skills/**`、conversation memory、Run prose 或 repository-wide discovery。

四个既有 operation 的 package preparation 与 execution read SHALL 使用同一 manager 来源，保持既有 content mismatch 检查。项目输入、输出、Git/测试 cwd、coordination、Run 和必要 artifacts SHALL 仍指向 target；系统 SHALL NOT 用 manager 根替换项目事实根。其余 operation facts、权限和生命周期要求保持不变。

#### Scenario: Guidance byte drift changes exact identity
- **WHEN** canonical Delivery Guidance path 不变但 bytes 改变
- **THEN** 后续解析的 `contentSha256` SHALL 不同，旧内容绑定不因此获得新的有效性

#### Scenario: Wrong or redirected Guidance fails closed
- **WHEN** `delivery-start` 被绑定到其他 Guidance、`.agents/skills/**`、symlink 或 non-regular entry
- **THEN** 系统 SHALL 不形成 executable Delivery Guidance identity

#### Scenario: Missing product Guidance does not use bootstrap fallback
- **WHEN** manager 的 Start Guidance 缺失，但 target 同名文件或 bootstrap HOW 存在
- **THEN** preparation SHALL fail closed，不读取这些替代文件

#### Scenario: Split roots remain consistent through preparation and execution
- **WHEN** 任一既有 Delivery operation 在 manager 与 target 分离时完成 preparation 并读取冻结的 Guidance
- **THEN** 两次访问 SHALL 都使用 manager entry，项目事实及实际项目写入 SHALL 留在 target，同名 target 文件不接管 HOW

#### Scenario: Relocation does not redefine project facts
- **WHEN** 同 bytes 的 manager 安装移位后访问同一个 target
- **THEN** Guidance path/content identity SHALL 不变，系统 SHALL 不搬迁或清理 target 历史，也不以 manager 路径改变项目测试配置

### Requirement: DeliveryOperationPackage binds exact already-decided execution facts without owning lifecycle authority
系统 SHALL 从 exact Delivery identity、already-decided valid `DeliveryOperationId`、与该 operation 精确匹配的 `DeliveryGuidanceRef`、通过该 operation closed validator/resolver 得到的 exact `operationFacts`，以及该 boundary 所需的 structural-valid existing `OwnerAuthorityFact` 或 explicit `null` 形成 closed `DeliveryOperationPackage`。任一 wrong Delivery identity、wrong operation/Guidance mapping、malformed or mismatched operation facts、missing/mismatched required authority、unknown extra package field 或 stale exact-state fact SHALL fail closed。Package SHALL NOT 复制 Standard Action 的 `CurrentAction` prepared/terminal state、Action role、Action Run occurrence 或 Action Policy ownership，也 SHALL NOT 创建新的 candidate/state identity subsystem。

#### Scenario: Form a valid exact Delivery operation package
- **WHEN** exact Delivery identity、already-decided operation、matching exact Guidance、validated operation facts 与该 operation 所要求的 exact authority facts 全部一致
- **THEN** 系统 SHALL 形成一个只冻结这些 exact execution facts 的 `DeliveryOperationPackage`

#### Scenario: Reject wrong Guidance or wrong Delivery identity
- **WHEN** package formation 的 Guidance 不对应 exact operation，或 Delivery identity 与 validated operation facts / authority target 不一致
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 形成 executable package

#### Scenario: Package cannot select another operation
- **WHEN** package 已针对 `delivery-start` 形成
- **THEN** package formation / execution SHALL NOT 将其改写为其他 Delivery operation、自动 activate Change 或决定 next boundary

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

### Requirement: Candidate Delivery execution remains independent from D04 bootstrap acceptance
D04 当前 Delivery 的 self-development SHALL 继续使用 repository-local `.agents/skills/**` bootstrap/fallback HOW；candidate `skills/delivery/**` 与 `DeliveryOperationPackage` SHALL NOT 作为证明同一 D04 candidate 正确性的 lifecycle/acceptance authority。该隔离 SHALL NOT 要求 Stable Core 完成后删除、同步或自动收敛 `.agents/skills/**`。

#### Scenario: D04 does not self-prove with candidate Delivery Start Guidance
- **WHEN** Change 1 实现 `skills/delivery/start/SKILL.md` 与 candidate Delivery package mechanism
- **THEN** 当前 D04 的 acceptance SHALL 仍由独立 bootstrap/Reviewer/Verification/Owner boundaries 证明，而不得把 candidate Start Guidance 当作其自身接受权威

### Requirement: Delivery Full Test package facts bind one exact candidate, one exact ordered check set, and exact Full Test authority
`delivery-full-test` SHALL 使用一个 closed operation-facts contract，绑定本次 `attemptId`、`configRef`、项目范围的 `inputRef` 与非空 exact ordered project-local Formal Full Test checks；每个 check SHALL 使用 显式 program/args/cwd 与实际工具/声明环境 semantics 并携带由其 exact material identity 派生的 `checkRef`。Package formation SHALL 保留声明顺序、拒绝 duplicate check id/ref、拒绝 declaration/checkRef mismatch，并 SHALL 要求 structural-valid `OwnerAuthorityFact` 精确满足 `decision=authorize-formal-full-test`、exact current Delivery、`changeId` absent 与 scope exactly `["delivery-full-test"]`。这些 facts/authority SHALL 只支持已决定的 `delivery-full-test` execution，不得决定 correction、Git、finalization 或 next-operation lifecycle。

#### Scenario: Form a valid Delivery Full Test package
- **WHEN** exact Delivery、`delivery-full-test` Guidance、trusted current test input、non-empty ordered resolved checks 与 exact Full Test Owner authority 全部匹配
- **THEN** 系统 SHALL 形成 executable `DeliveryOperationPackage` 的 `delivery-full-test` concrete variant，同时保持原有 `delivery-start` package 行为不变

#### Scenario: Reject stale candidate, malformed checks, or wrong Full Test authority
- **WHEN** candidate 不是 trusted current candidate、ordered checks 存在 duplicate/mismatched declaration/checkRef，或 authority decision/Delivery/changeId/scope 不精确匹配
- **THEN** `delivery-full-test` package formation SHALL fail closed

#### Scenario: Full Test package cannot fabricate an Action execution envelope
- **WHEN** `delivery-full-test` 需要执行 project-local checks
- **THEN** 系统 SHALL 复用 existing check declaration/ref/process mechanics，但 SHALL NOT 构造假的 Standard Action / ActionPackage 作为 Delivery Full Test 的 execution authority

Full Test package SHALL NOT 使用 caller priorFacts、Git-visible candidate 或标准 Action Run 作为当前尝试配置/身份。只读 package formation 不表示 durable start；必须按 Full Test 开始/发布合同后才执行。其他 Delivery operation identity 与 Start 行为 SHALL 保持。

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

Integration SHALL 从本项目 completed manifest 实读已确认的最小 Final record，绑定 deliveryFinalizationRef、preIntegrationHead、Delivery branch、targetMainRef、targetMainPreIntegrationCommit、现有 Git accepted-base provenance 与 checkpointOperation。SHALL NOT 要求 Final 全 package、finalizedCandidateRef、requiredEvidence、替代整仓摘要或历史证据遍历。

checkpointOperation SHALL 为 closed union：create-new 包含且仅包含 kind、paths、commitMessage、commitShape；reuse-existing 包含且仅包含 kind、checkpointCommit。paths SHALL 是非空唯一排序的 target-relative exact 文件路径集合；commitMessage SHALL 是非空单行文本；commitShape SHALL 是 explicit null 或仅含 parents/count 的 exact 形状，parents 为有序唯一 SHA-1 数组、count 为正整数。reuse-existing checkpointCommit SHALL 为 exact SHA-1。该操作 SHALL 与可信 Owner 来源一致绑定，不从 HEAD/全仓 clean 自动生成形状，不用缺字段兼容旧输入。

singleton authorize-repository-integration authority、manager Guidance、Git 对象/来源/本次 prestate 核验保持；create-new 的 scope 需在实际写入前对照 index。acceptedMainCommit SHALL 仅在真实接受后读取，不能预声明；此处 Git base 不回流为 Start 或下一 Delivery SHA 准入。普通授权 Git 节点不是该 package 的 variant，不因调用 commit/push 就需要 Final。

#### Scenario: Form a valid Repository Integration package
- **WHEN** 实读 Final 已确认，Owner 指定的完整操作、路径/形状或复用对象与 Git 来源/目标/prestate 有效
- **THEN** host SHALL 冻结该 closed operation，不读取旧 Final evidence snapshot 或默认注入 parent/count

#### Scenario: Reject stale or caller-substituted Git facts
- **WHEN** HEAD/target/operation/授权路径或复用对象漂移，输入缺必需字段，或 caller 预声明 accepted main
- **THEN** 系统 SHALL 拒绝，不静默重绑定、补默认值或自动重整历史

#### Scenario: Existing Delivery operation boundaries remain unchanged
- **WHEN** Integration 形成或完成，或普通 Git 节点被单独授权
- **THEN** 各 operation 的 authority/STOP SHALL 保持，普通节点不套用 Final package；CLI/Policy 不取得 Git 写权限

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
