# stable-action-command-execution Specification

## Purpose
为已由可信 Policy 选定的单个 Standard Action 提供固定发行命令，跨独立进程安全保存真实开始与结果，并在既有三文件 Run 和权限边界内区分 partial、冲突与完成。

## Requirements

### Requirement: Fixed Action command accepts only bounded data and exact intent

发行 `flowkit action start` 与 `flowkit action finish` SHALL 只接收严格解析的数据请求；target、Delivery、Change、exact Action 与实际 Role SHALL 与可信上下文一致。仅在既有 Policy 需要 Owner correction 时，实际接收 Owner 指令的受信 Agent 宿主 MAY 在 start 请求中提交一份完整、来源可归责的 `OwnerAuthorityFact`（含真实 `sourceRef`，可引用 conversation）；manager SHALL 按现有结构校验与 exact Policy scope/identity/decision 校验该 fact，并绑定进本次 package/开始记录。`sourceRef` 不是密码学证明，manager 不从聊天或任意文件自动创造 Owner 输入；宿主对真实 Owner 指令的对应负责。普通 Action SHALL 不因新命令额外要求该 fact。命令行可见 target 与 JSON target 冲突、重复或未知 authority-bearing 字段 SHALL 被拒绝。请求 SHALL NOT 接受可执行脚本、回调、动态模块、caller 自填 current/next、Run 序号、GuidanceRef 或 ActionPackage 作为权限。每个请求 SHALL 仅处理一个已明确 Action，不执行下一动作。

#### Scenario: Legal exact intent
- **WHEN** target、Role、exact Action 与当前唯一合法 Policy boundary 匹配
- **THEN** start SHALL 仅尝试该 Action 的受控开始，不执行该 Action 的实质工作或下一个 Action

#### Scenario: Conflicting or forged authority input
- **WHEN** 请求的目标、Role、Action 不符，Owner fact 形状或 exact Policy decision/identity/scope 不匹配，或提供可执行/内部 authority 字段
- **THEN** 命令 SHALL 在创建新 Run 文件前拒绝并指出冲突，不从 caller 数据改写 Policy 或安装来源

### Requirement: Start commits a recognizable current-manager descriptor before work

start SHALL 重新读取可信 coordination、OpenSpec、唯一完整前序链及 Policy，并由当前 manager 的固定规则核对 Role、适用 Owner authority、与各 Action 已有合同一致的 package-bound 机器 readiness、当前安装 Guidance、受控 occurrence 与必要 Git 原始字节。仅机器可判条件由命令验证；实质 Author/Reviewer 判断仍归该角色，archive 的固定准备须包含既有 canonical convergence、适用检查与 completion-transition readiness，不能以恒定 ready 或宿主自签布尔值替代。所有可在开始前确定的拒绝 SHALL 发生在首次 Run 文件写入前。成功开始 SHALL create-once 写 `action.md`，使用原有 `# Action started` 标题及其后单个有界 JSON 对象；新命令记录的对象 SHALL 含 `formatVersion: 1`、`commandOrigin: "flowkit-action-start"`、`changeStartSequence`、完整 `actionPackage` 与 matching `preparedContext`。此 marker 仅识别新命令格式，SHALL NOT 单独证明来源或权限。响应 SHALL 给出受控 Run 定位值与实际已写状态；开始写入或读回未确认时 SHALL 不报告可开始业务。

#### Scenario: Start and work ordering
- **WHEN** 当前事实全部满足开始条件且目标 occurrence 尚未使用
- **THEN** start SHALL 保存并读回新格式 `action.md` 后报告已开始，Agent 此后才可进行该次业务工作

#### Scenario: Preflight or create-once failure
- **WHEN** package-bound readiness、Guidance、Owner/Role、前序链、Git bytes 或新文件创建任一检查失败
- **THEN** start SHALL 不报告已开始；已写 bytes SHALL 保留并准确区分未写与写后未确认，不清理或重占 occurrence

#### Scenario: Archive preparation blocks before mutation
- **WHEN** `archive` 的 exact review candidate 已漂移、canonical convergence dry-run 或适用验证失败、projectOrdinal 冲突，或 completion-transition readiness 不满足
- **THEN** start SHALL 在 archive 业务写入与新 `action.md` 前 blocked，保留先前 terminal `review-apply` 与候选 bytes，不把 Reviewer 审查或宿主布尔声明当成准备 PASS

#### Scenario: Reviewer readiness does not perform review
- **WHEN** `review-propose` 有完整、匹配的 Author Proposal Run 和可读规划产物
- **THEN** start MAY 确认机器输入就绪，但 SHALL 不判断需求质量或生成 `approved` verdict；独立 Reviewer 仍须执行实质审查

### Requirement: Finish reconstructs only the exact new start across processes

finish SHALL 从受控 target、Change、唯一 Run 组和 start 给出的定位值找到 exact `action.md`，严格解析上述版本格式，并核对原始 bytes、`changeStartSequence`、ActionPackage、prepared context、当前可信安装 Guidance、已绑定的 exact Owner fact、前序链及协调/Policy 关系。对于 conversation `sourceRef`，finish SHALL 使用开始时已绑定的 fact 核对来源引用、Policy eligibility 与 package/context 一致性，不要求重新读取不可供 CLI 访问的聊天，也不允许 finish 注入另一 fact。handle 与 JSON marker SHALL 只是定位及对照数据，不得独立形成 current 或授权。当前安装内容身份变化、开始记录损坏、前序漂移、Owner fact 不一致或旧格式未知 partial SHALL fail closed；历史完整三文件 SHALL 仍按其原始身份读取，不追溯重签。安装位置改变但 canonical Guidance path 与 bytes 相同 SHALL 不独立导致失败。

#### Scenario: Independent process finishes matching start
- **WHEN** start 进程已退出，新的 finish 进程读取新格式、未完成且全部来源与链核对一致的开始记录
- **THEN** finish SHALL 可将其与本次真实角色结果关联，无须 `.tmp` 内存对象或 caller 重填内部 package

#### Scenario: Unknown or drifted start
- **WHEN** occurrence 是旧未知 partial、descriptor/前序损坏，或当前安装 Guidance/已绑定 Owner fact 与开始时不一致
- **THEN** finish SHALL 指出具体不一致并停止，不将目录存在或 JSON marker 当成接管许可

### Requirement: Finish admits a real role result and preserves partial outcomes

finish SHALL 接收实际执行者提交的角色对应结论，先经既有 exact package/current/occurrence/result admission，再以拟保存的 terminal 或 prepared context/result 调用现有 Policy 做写前 outcome 与 reported `nextBoundary` 一致性预检；可检测的非法 outcome token 或 boundary SHALL 在首次 `context.json/result.json` 写入前拒绝。真实 Author `FAIL` 且 `nextBoundary=null` MAY 按现有 Run-chain 例外持久化为 terminal blocked，不伪装 PASS 或续行。Reviewer `rejected` 即使 `nextBoundary=null`，现有 Policy 返回 `unrecognized-reviewer-verdict` 且 canonical Run-chain 不接受；本 Change 的固定 finish SHALL 在首次 machine 文件写入前拒绝该 token，报告 exact started occurrence 未完成，保留已有 `action.md` 与实际材料，不把它改写成 `changes-requested`、`approved`、Author `FAIL` 或已确认 terminal。其他未识别字符串同样不得以结构 admission 写成 confirmed。`archive` 的 Policy 输入 SHALL 使用已完成业务后可信 materialized `completed` coordination/transition facts，不能假设 active 或由 caller 自称 completed。Author SHALL 不得提交 Reviewer verdict，命令 SHALL 不生成 Verification PASS。必要 proof SHALL 在接纳前按当前引用核对 target、Delivery/Change/Run 归属、regular/readable、SHA-256、原始 Git bytes 与结论一致性；无必要新 proof 时 SHALL 不创建空目录。首次结束 SHALL 仅 create-once 保存缺少的 `context.json` 与 `result.json`，完成三文件、必要材料、唯一 canonical chain 与 Policy 决定读回后才报告 confirmed completion；`confirmed` 只表示记录与链已确认，不表示业务 PASS。写入部分成功 SHALL 保留所有 bytes 并报告 exact incomplete/written-unconfirmed，不补成功、不自动重做业务。

#### Scenario: Real result accepted
- **WHEN** 真实工作已完成、角色结论与本次 package 匹配、proof 核对通过且两文件保存读回成功
- **THEN** finish SHALL 报告 exact terminal 或真实 prepared failure，并让独立查询读到同一记录

#### Scenario: Context saved but Result save fails
- **WHEN** `context.json` create-once 成功而 `result.json` 保存或读回失败
- **THEN** 命令 SHALL 报告 partial/written-unconfirmed 与 exact Run 路径，保留 `action.md/context.json`，不得宣称 terminal 或自动修复

#### Scenario: Wrong reported boundary is rejected before first Result write
- **WHEN** `review-propose` 的候选 Result 为 `approved` 但 `nextBoundary=archive`，或使用未识别 Reviewer verdict
- **THEN** finish SHALL 经现有 Policy 预检拒绝且不写 `context.json/result.json`；不得只凭结构 admission 把会使后续 status/next 失效的结果报告为 confirmed

#### Scenario: Rejected Reviewer judgment is not a terminal Run in this Change
- **WHEN** 实际 Reviewer 提交 `rejected` 与 `nextBoundary=null`，而当前 Policy 与 Run-chain 仍不支持该 terminal verdict
- **THEN** finish SHALL 在首次 machine 文件写入前拒绝，保留 `action.md` 与真实材料并报告 incomplete；不得重标为 `changes-requested`、伪造可读 terminal 或继续下一 Action

#### Scenario: Complete bytes are not a valid canonical continuation
- **WHEN** 两个 machine 文件写入后，唯一链或 Policy 读回仍无法确认本次 exact tip
- **THEN** finish SHALL 保留已写 bytes 并报告 written-unconfirmed，不以单个 `readDurableRun()` 的结构读回宣布完成

### Requirement: Duplicate finish and successor competition do not repeat effects

finish SHALL 在写前区分当前仅有新开始记录、合法完整记录、部分写入及竞争 successor。对已完成相同请求，SHALL 仅只读确认同一已存结果或返回明确重复拒绝；冲突结果 SHALL 拒绝且不覆盖。部分写入 SHALL 不由普通重复 finish 自动补写。默认顺序单写者；并发争用 SHALL 以 create-once/唯一链约束拒绝或产生明确未确认诊断，不引入通用锁服务。

#### Scenario: Lost response after confirmed completion
- **WHEN** 同一 finish 请求在已保存完整同值 Run 后重发
- **THEN** 命令 SHALL 不重执行业务或写入，且仅在逐项核对完全一致后只读确认，否则明确拒绝重复

#### Scenario: Conflicting retry or competing successor
- **WHEN** 重发的结论不同、已存在部分写入，或同一前序出现竞争 successor
- **THEN** 命令 SHALL fail closed，不覆盖、回退旧 tip、自动重试工作或选取任一竞争分支

### Requirement: Fixed proof helper reports exact material facts without authority inflation

发行 `flowkit proof inspect` SHALL 对一个已明确 target/Delivery/Change/Run 下的必要文件返回 exact 受控路径、byte count、SHA-256 与 Git 原始字节检查结果；finish SHALL 独立重新核对每个提交的必要引用。helper 不创建 Reviewer/Verification/Owner 结论，不扫描无关历史 proof，不复制或修改材料。

#### Scenario: Inspect retained proof
- **WHEN** 指定材料位于本次受控 proof 目录且 regular、可读、未逃逸 target
- **THEN** helper SHALL 返回该 exact 文件的可核对事实，不据此宣称内容真实或工作 PASS

#### Scenario: Invalid material
- **WHEN** 文件缺失、链接逃逸、归属不符、不可读或 Git bytes 规则不满足
- **THEN** helper 与相关 finish SHALL 给出有界拒绝，不把 hash 或历史 PASS 当成当前结果

### Requirement: Prepared Owner correction uses the same bounded command path

当既有 Policy 允许 Owner 对 exact prepared Author Run 作 revise correction 时，受信 Agent 宿主 SHALL 从本次明确 Owner 指令形成并提交现有 `OwnerAuthorityFact`，可用真实 conversation `sourceRef`；它不是命令自行生成的授权或必须预先写入 Delivery manifest 的新记录。start SHALL 以现有 `startPreparedOwnerCorrectionRun` 等价边界核对 fact 的结构、`decision=revise-action`、Delivery/Change、单元素 revise scope、原 prepared 三文件、合法 correction edge 与唯一 successor，并把 exact fact/sourceRef 绑定到新 package、`action.md` 和随后 `context.json`；finish SHALL 从开始记录恢复该 fact 并重新核对同一 Policy/linkage，不依赖临时宿主对象或对话可重读。前序 Run、proof 与原始 bytes SHALL 保留，不能被 terminalize、覆盖或伪装 PASS。

#### Scenario: Authorized prepared correction
- **WHEN** exact prepared Author Run、Owner 来源及 revise target 均满足既有 correction 合同
- **THEN** 新 start SHALL 形成指向该 Run 的唯一 successor，而旧 Run 保持原样

#### Scenario: Unsupported correction
- **WHEN** Owner 来源缺失、Role/Action 不匹配或前序并非可 correction 的 prepared Author Run
- **THEN** 命令 SHALL 在新 occurrence 创建前拒绝，不把一般 Review/FAIL 当成 Owner 授权

#### Scenario: Conversation-sourced Owner instruction survives process exit
- **WHEN** 受信宿主依据明确 Owner 输入提交 exact fact，其 `sourceRef` 指向 conversation，且 prepared correction 已成功开始
- **THEN** 独立 finish 进程 SHALL 从 `action.md` 中绑定的 package/context 核对同一 fact 与 Policy，不要求聊天复制到 target 或新 Owner registry，也不得让 finish 替换该 fact

### Requirement: Fixed finish enforces complete proof declarations for its own new Run

对本次固定 `action start` 建立的新 Run，`action finish` SHALL 在首次写入 `context.json` 或 `result.json` 前，从唯一 canonical Run 分组确定本 Run 的编号 Proof 目录，同时检查对应语义目录是否存在。仅有一个目录时，SHALL 将该目录实际文件集合与本次 Result 的显式 `proofRefs` 做 exact 闭合集核对；两者并存 SHALL 拒绝，不能只扫描其中一个。每个实际文件 SHALL 恰有一个同 Delivery/语义 Change/Run 归属的引用，路径、regular-file/no-link、可读性、bytes、SHA-256、用途与目标 Git 原始字节规则 SHALL 有效；多余、遗漏、重复、不安全或不可解释条目 SHALL 拒绝本次 finish，并保留已存在的开始记录与材料。无新材料时，两种正式 Proof 目录 SHALL 均不存在且 `proofRefs` SHALL 为显式空数组。该核对只读取本 Run 的两个精确候选目录；历史 Run 不追溯迁移，后继 Action 可按当前判断只引用此前已声明材料的相关子集。它不判断 Author/Reviewer 实质结论，也不改变 prepared proof checkpoint 准入规则。

#### Scenario: Three files but one declared

- **WHEN** 本 Run 的唯一正式 proof 目录有三个真实文件，而 finish Result 仅声明其中一个或提交空数组
- **THEN** finish SHALL 在 terminal machine 文件创建前拒绝，指出不完整声明并保留该 Run 的已有 bytes

#### Scenario: Complete current Run proof set

- **WHEN** 本 Run 唯一正式 proof 目录全部实际文件均被唯一、完整且字节匹配地声明
- **THEN** finish SHALL 继续既有 package、Policy 和 Result admission 流程；proof 闭合集本身 SHALL NOT 产生业务 PASS

#### Scenario: No new material

- **WHEN** 本 Run 未生成必要 proof、编号与语义正式 proof 目录均不存在，Result 明确提供 `proofRefs: []`
- **THEN** 该证据检查 SHALL 通过且 SHALL NOT 创建空目录或制造文件

#### Scenario: Invalid own-Run entry or stale reference

- **WHEN** 本 Run 目录或引用包含链接、非普通文件、路径逃逸、失效摘要、缺失文件、重复引用或不可读取条目
- **THEN** finish SHALL 拒绝且不覆盖任何现有 Run/Proof；不得靠只校验已提交引用的子集来报告完成

#### Scenario: Later action needs one prior proof

- **WHEN** 后继 Review 只需读取此前 Run 已完整声明材料的一项
- **THEN** 它 MAY 按需核对并引用该项，且此前 Run 的原始 `proofRefs` SHALL 保持不变；finish SHALL NOT 扫描该历史目录作本次闭合集

#### Scenario: Numbered proof exists but no refs are declared

- **WHEN** canonical Run 分组为 `001-<change-id>`，相同编号的 Proof 目录已有文件，而候选 Result 提交 `proofRefs: []`
- **THEN** finish SHALL 在写 machine 文件前拒绝，不因语义目录不存在而接受空集合

#### Scenario: Both proof layouts exist for one Run

- **WHEN** 同一 Delivery、语义 Change 和 Run 下编号与语义 Proof 目录均存在
- **THEN** finish SHALL 拒绝并报告两个目录，不能任意选择一个目录的声明

### Requirement: Proof inspection and later consumption resolve one exact Run owner

`proof inspect` 与后续 `proofRefs` 消费 SHALL 由真实唯一 Run 分组、语义 `changeId` 和 exact `runId` 共同确定所属 Run；SHALL 接受该 Run 的编号 Proof 路径，且对已保存的语义 Proof 路径保持兼容。若两种目录并存、Run 分组不唯一、引用路径不属于两种精确布局或引用中的语义 `changeId` 与 Run 身份不符，SHALL fail closed。后续消费 SHALL 只检查当前判断需要的引用，不扫描无关历史 Proof。

#### Scenario: LearningPlatform numbered proof is inspected

- **WHEN** 唯一 Run 分组为 `001-role-workspace-and-shared-shell`，引用路径中的 Proof 分组也是 `001-role-workspace-and-shared-shell`，而 `proofRefs.changeId` 是语义 `role-workspace-and-shared-shell`
- **THEN** inspect SHALL 按真实文件检查 bytes、SHA、regular/no-link 与原始 Git bytes，不因编号目录段拒绝

#### Scenario: MenDi semantic proof remains consumable

- **WHEN** 已完成 Run 的引用使用语义 Proof 目录且同 Run 没有编号 Proof 目录
- **THEN** 后续 Action SHALL 按原有归属及完整性规则读取该引用，不要求重写 Result

### Requirement: Proposal artifact hashes use one repository-root-relative contract

成功的 `propose` 或 `revise-propose` Result 中用于交接的 `artifactHashes` SHALL 以 target 项目根为解析根，键 SHALL 精确指向当前语义 Change 的 OpenSpec 规划产物，文件 SHALL 为 target 内可读的真实普通文件且 SHA-256 匹配。fixed finish SHALL 在首次写入 machine 文件前拒绝无效、越界、错误根或不匹配的成功 Result；`review-propose` start SHALL 用同一根和规则复核已接受的前序 Result，不将项目根相对键再拼到 Change 目录下。真实 Author `FAIL` 的现有 Result 边界保持既有规则，不借此伪造成功规划产物。

#### Scenario: Valid Proposal is reviewed

- **WHEN** 前序成功 Propose Result 声明 `openspec/changes/<change-id>/proposal.md` 等规划产物，真实文件与 SHA 匹配
- **THEN** `review-propose` start SHALL 从 target 项目根解析并核对，允许独立 Reviewer 继续实质审查

#### Scenario: Wrong-root or escaped Proposal identity is rejected early

- **WHEN** 成功 Propose Result 的 key 是绝对路径、含路径逃逸、指向其他 Change，或其文件 bytes 与声明 SHA 不符
- **THEN** finish SHALL 在首次写入 machine 文件前拒绝该 Result；Review start 也 SHALL 拒绝漂移的已接受产物，不补造新 Hash
