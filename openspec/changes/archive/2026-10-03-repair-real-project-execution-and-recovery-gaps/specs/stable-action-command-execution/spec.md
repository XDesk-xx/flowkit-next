## ADDED Requirements

### Requirement: Review finish closes exact Author binding before terminal write

每个新 terminal Reviewer Result SHALL 在 machine 文件首次写入前声明 `facts.reviewedRunId`，其值 SHALL 等于该 Review descriptor 的 `previousRunId` 与真实唯一 terminal Author Run。已有 `reviewedAuthorRunId` SHALL 与其一致；声明的 candidate map SHALL 与该 Author 的可信 effective identity 一致。三个 review 阶段 SHALL 保留各自已有产物、proof 和角色合同；review-apply 与 Archive SHALL 消费同一 exact binding。旧完整 Review 不因缺新字段而被改写或拒绝一般只读展示，但新下游 mutation SHALL NOT 仅凭旧 approved token 绕过缺失绑定。

#### Scenario: Missing or conflicting binding stays incomplete
- **WHEN** Reviewer 未提供 reviewedRunId、绑定另一 Author 或 alias/candidate 声明冲突
- **THEN** finish SHALL 在写 context/result 前拒绝、指出 expected identity，并保留开始记录和实际材料

#### Scenario: Consistent Review can be consumed by Archive
- **WHEN** 新 review-apply 已以 exact Author binding 和候选身份完成并 approved
- **THEN** Archive SHALL 复用该绑定且不再因同一缺失字段首次阻断

### Requirement: Candidate admission rejects Git-filtered byte drift

新 apply/revise-apply PASS、review-apply start 和 finish SHALL 对 exact candidate `artifactHashes` 的现存文件核对 raw SHA-256及 raw/Git-filtered object identity。存在差异、filter 执行失败或候选属性/bytes漂移 SHALL 在对应新记录写前拒绝并列出相关路径，不自动 normalize 或承认映射。intentional -text proof SHALL 保持既有原字节合同；不存在的 deletion 不能以虚假文件 hash 表示。

#### Scenario: CRLF candidate is refused before independent acceptance
- **WHEN** candidate raw hash 与按目标 Git attributes 过滤后的 hash 不同
- **THEN** Author PASS 或 Reviewer terminal 写入 SHALL 被阻断，需按项目规则重新形成候选及独立审查

#### Scenario: Exact raw evidence and LF source remain valid
- **WHEN** candidate raw与filtered身份一致且其他原有合同有效
- **THEN** 该字节 guard SHALL 通过，不从同值 hash生成 Reviewer或Verification PASS

### Requirement: Fixed Action inspection exposes partial facts without granting recovery

发行 CLI SHALL 提供 `action inspect`，请求只包含既有共同 target和 exact runId，严格解析并核对可见目标。它 SHALL 只读呈现 descriptor、三文件完整性、相关 diagnostic refs、真实可验证 Archive效果、remaining steps与 canContinue，不写 Run、纠正文件或phase材料。partial SHALL 不被伪称完整 prepared/terminal/current。旧未知格式、wrong root、Guidance drift、fork或mixed effects SHALL 明确 blocked/unknown。

#### Scenario: Inspect a descriptor-only Archive
- **WHEN** 原 target 中存在合法 archive start descriptor且 machine文件未写
- **THEN** inspect SHALL 给 exact Run与可验证副作用/剩余步骤，普通 status/next仍严格报告 incomplete

#### Scenario: Claimed effect does not authorize retry
- **WHEN** caller曾报告 none而现在 target/spec/coordination不能证明完整prestate或poststate
- **THEN** inspect SHALL 报 unknown且 canContinue=false，不建议重放或创建替代Run

### Requirement: Fixed terminal correction adds only proven missing identities

发行 CLI SHALL 提供数据型 `action correct`，输入为共同 target、runId、原 role、OwnerAuthorityFact、expectedRunHashes三文件SHA、封闭additions及 nullable candidateEvidenceRef。Owner fact SHALL 为 decision=correct-run-metadata、same Delivery/Change、scope=[correct-run-metadata]且对应真实Owner来源；宿主归责，不由CLI认证或创造聊天授权。该命令 SHALL 仅接纳 active Change的完整 canonical terminal Run：当前 Author tip、当前 terminal Review直接前序Author，或当前 terminal Review自身。已archived/Final/未知bootstrap/冲突后继 SHALL 拒绝。

仅允许补齐 Author apply/revise-apply PASS缺失/空 artifactHashes，或 Reviewer缺失 reviewedRunId/reviewedAuthorRunId。Author map SHALL 来自原Result已声明、完整校验的该Run candidate-manifest proof并与当前候选身份一致；Reviewer值 SHALL 等于唯一direct Author。已有非空值不被替换。role、outcome、verdict、nextBoundary、occurrence、previousRunId、proofRefs和实际候选bytes SHALL NOT 修改。原terminal三文件 SHALL 保持原bytes；每Run最多一个外部create-once correction，通过统一effective view消费。该操作 SHALL 不创建Standard Action Run或新lifecycle state。

#### Scenario: Reviewer repairs its own missing exact binding
- **WHEN** Owner明确授权、原Review三文件匹配expected hashes、真实Reviewer提交缺失binding且前序/候选一致
- **THEN** 命令 SHALL 追加correction、重新读回原件与effective facts并STOP，不覆盖原Result

#### Scenario: Current worktree cannot fabricate historical candidate
- **WHEN** Author只有当前候选bytes，没有原Result声明的有效candidate-manifest proof
- **THEN** correction SHALL 拒绝并交接真实revise/review路径，不将当前hash追认为历史身份

#### Scenario: Correction replay is read-only or refused
- **WHEN** 相同请求重复或同Run已存在不同correction/partial材料
- **THEN** 完全一致且全部验证通过的重投 SHALL 只读确认，其他 SHALL 保留原件并拒绝，不覆盖或形成多条correction链

### Requirement: Terminal revise start preserves exact Owner and predecessor facts

fixed start SHALL 接纳既有Policy允许的active terminal阶段Owner revise及已识别rejected的对应revise，同时保留prepared Author correction合同。Owner输入 SHALL 为既有revise-action exact target/single revise scope，绑定进新package/descriptor/context；新Run指向原tip，原terminal verdict与bytes保持不变。unknown outcome、Author FAIL、invalid chain、prepared Reviewer、completed/archive重开或reported conflict SHALL 不被Owner fact兜底。普通Action不新增Owner审批。

#### Scenario: Explicit revise follows known rejection
- **WHEN** review-apply rejected terminal与nextBoundary=null有效，Owner明确授权same Change的revise-apply
- **THEN** start SHALL 在Policy和structural enterability通过后创建唯一Author successor，不修改原Reviewer结论

#### Scenario: Unknown verdict cannot be rescued by Owner fact
- **WHEN** Review outcome无法识别或原记录/绑定无效
- **THEN** start SHALL 拒绝，不能把它按known rejected续行

## MODIFIED Requirements

### Requirement: Finish admits a real role result and preserves partial outcomes

finish SHALL 接收实际执行者提交的角色对应结论，先经既有 exact package/current/occurrence/result admission，再以拟保存的 terminal 或 prepared context/result 调用现有 Policy 做写前 outcome 与 reported `nextBoundary` 一致性预检；可检测的非法 outcome token 或 boundary SHALL 在首次 `context.json/result.json` 写入前拒绝。真实 Author `FAIL` 且 `nextBoundary=null` MAY 按现有 Run-chain 例外持久化为 terminal blocked，不伪装 PASS 或续行。真实 Reviewer `rejected` 且 `nextBoundary=null` SHALL 在角色、exact候选绑定与其余准入通过后按terminal保存；Policy SHALL 返回已识别 `review-rejected` blocked，canonical链 SHALL 保持可读。该known outcome不伪装成 `changes-requested`、`approved` 或 Author `FAIL`，不自动续行；非null reported boundary仍在首次machine写入前拒绝。其他未识别字符串同样不得以结构 admission 写成 confirmed。`archive` 的 Policy 输入 SHALL 使用已完成业务后可信 materialized `completed` coordination/transition facts，不能假设 active 或由 caller 自称 completed。Author SHALL 不得提交 Reviewer verdict，命令 SHALL 不生成 Verification PASS。必要 proof SHALL 在接纳前按当前引用核对 target、Delivery/Change/Run 归属、regular/readable、SHA-256、原始 Git bytes 与结论一致性；无必要新 proof 时 SHALL 不创建空目录。首次结束 SHALL 仅 create-once 保存缺少的 `context.json` 与 `result.json`，完成三文件、必要材料、唯一 canonical chain 与 Policy 决定读回后才报告 confirmed completion；`confirmed` 只表示记录与链已确认，不表示业务 PASS。写入部分成功 SHALL 保留所有 bytes 并报告 exact incomplete/written-unconfirmed，不补成功、不自动重做业务。

#### Scenario: Real result accepted
- **WHEN** 真实工作已完成、角色结论与本次 package 匹配、proof 核对通过且两文件保存读回成功
- **THEN** finish SHALL 报告 exact terminal 或真实 prepared failure，并让独立查询读到同一记录

#### Scenario: Context saved but Result save fails
- **WHEN** `context.json` create-once 成功而 `result.json` 保存或读回失败
- **THEN** 命令 SHALL 报告 partial/written-unconfirmed 与 exact Run 路径，保留 `action.md/context.json`，不得宣称 terminal 或自动修复

#### Scenario: Wrong reported boundary is rejected before first Result write
- **WHEN** `review-propose` 的候选 Result 为 `approved` 但 `nextBoundary=archive`，或使用未识别 Reviewer verdict
- **THEN** finish SHALL 经现有 Policy 预检拒绝且不写 `context.json/result.json`；不得只凭结构 admission 把会使后续 status/next 失效的结果报告为 confirmed

#### Scenario: Rejected Reviewer judgment persists as terminal stopped
- **WHEN** 实际 Reviewer 提交 `rejected` 与 `nextBoundary=null`，且角色、exact Author绑定和其他准入有效
- **THEN** finish SHALL create-once保存并读回完整terminal三文件和known blocked链，报告confirmed而非业务PASS；不得重标changes-requested或执行下一Action

#### Scenario: Rejected Reviewer judgment is not a terminal Run in this Change
- **WHEN** Reviewer虽然提交rejected，但角色/候选绑定无效或nextBoundary非null
- **THEN** finish SHALL 在首次machine文件写前拒绝并保留开始记录与实际材料；该无效结果不得成为confirmed terminal，也不能重标changes-requested绕过准入

#### Scenario: Complete bytes are not a valid canonical continuation
- **WHEN** 两个 machine 文件写入后，唯一链或 Policy 读回仍无法确认本次 exact tip
- **THEN** finish SHALL 保留已写 bytes 并报告 written-unconfirmed，不以单个 `readDurableRun()` 的结构读回宣布完成

### Requirement: Prepared Owner correction uses the same bounded command path

当既有 Policy 允许 Owner 对 exact prepared Author Run 作 revise correction 时，受信 Agent 宿主 SHALL 从本次明确 Owner 指令形成并提交现有 `OwnerAuthorityFact`，可用真实 conversation `sourceRef`；它不是命令自行生成的授权或必须预先写入 Delivery manifest 的新记录。start SHALL 以现有 `startPreparedOwnerCorrectionRun` 等价边界核对 fact 的结构、`decision=revise-action`、Delivery/Change、单元素 revise scope、原 prepared 三文件、合法 correction edge 与唯一 successor，并把 exact fact/sourceRef 绑定到新 package、`action.md` 和随后 `context.json`；finish SHALL 从开始记录恢复该 fact 并重新核对同一 Policy/linkage，不依赖临时宿主对象或对话可重读。前序 Run、proof 与原始 bytes SHALL 保留，不能被 terminalize、覆盖或伪装 PASS。

#### Scenario: Authorized prepared correction
- **WHEN** exact prepared Author Run、Owner 来源及 revise target 均满足既有 correction 合同
- **THEN** 新 start SHALL 形成指向该 Run 的唯一 successor，而旧 Run 保持原样

#### Scenario: Unsupported correction
- **WHEN** Owner 来源缺失、Role/Action 不匹配或前序既非合法 prepared Author、也非本 Change 支持的合法 terminal correction
- **THEN** 命令 SHALL 在新 occurrence 创建前拒绝，不把一般 Review/FAIL 当成 Owner 授权

#### Scenario: Conversation-sourced Owner instruction survives process exit
- **WHEN** 受信宿主依据明确 Owner 输入提交 exact fact，其 `sourceRef` 指向 conversation，且 prepared correction 已成功开始
- **THEN** 独立 finish 进程 SHALL 从 `action.md` 中绑定的 package/context 核对同一 fact 与 Policy，不要求聊天复制到 target 或新 Owner registry，也不得让 finish 替换该 fact
