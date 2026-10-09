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
start SHALL 重新读取可信coordination、必要OpenSpec上下文、唯一前序链及Policy，核对Role、适用Owner authority、各Action机器readiness、Guidance、受控occurrence及必要Git原始证据字节。实质Author/Reviewer判断仍归角色。Archive readiness SHALL 只包含自有lifecycle admission、可信approved Review/candidate、projectOrdinal及identity完整性；不调用原生validate/archive预演、不执行项目checks或repository/dependency snapshot。原生task/delta/collision/rollback失败 SHALL 发生在真实started Run内。

成功开始 SHALL create-once写并读回action.md，保留 `# Action started`、有界JSON、formatVersion=1、commandOrigin=flowkit-action-start、changeStartSequence、actionPackage和matching preparedContext。新Archive另有archiveContractVersion=2，且新请求不接受applicableChecks；旧字段给明确迁移诊断，不静默跳过。marker不是权限证明。所有admission可判拒绝 SHALL 在首次Run写前发生；写入或读回不确定时不得报告可开始业务。

#### Scenario: Start and work ordering
- **WHEN** 当前事实满足admission且occurrence未使用
- **THEN** start SHALL 保存读回descriptor后才允许本次实际工作

#### Scenario: Preflight or create-once failure
- **WHEN** admission、Guidance、Owner/Role、前序链、证据Git bytes或create-once失败
- **THEN** start SHALL 不报告已开始，并保留已写bytes、区分not-written与written-unconfirmed

#### Scenario: Archive preparation blocks before mutation
- **WHEN** Archive候选在Review后漂移、Policy不符、ordinal或identity无效
- **THEN** start SHALL 在业务和新descriptor前拒绝，保留原边界；原生validation或项目check不属于这里的阻断

#### Scenario: Reviewer readiness does not perform review
- **WHEN** review-propose有完整匹配的Author和可读规划
- **THEN** start SHALL 只确认机器就绪，不生成approved；独立Reviewer仍执行实质审查

#### Scenario: Retry start preserves its failed direct predecessor
- **WHEN** terminal Archive安全失败且新明确archive请求通过重新admission
- **THEN** start SHALL 用专用retry transition建立新occurrence，parent指向原失败；Review通过唯一失败链解析而不是冒充直接parent

### Requirement: Finish reconstructs only the exact new start across processes

finish SHALL 从受控 target、Change、唯一 Run 组和 start 给出的定位值找到 exact `action.md`，严格解析上述版本格式，并核对原始 bytes、`changeStartSequence`、ActionPackage、prepared context、当前可信安装 Guidance、已绑定的 exact Owner fact、前序链及协调/Policy 关系。对于 conversation `sourceRef`，finish SHALL 使用开始时已绑定的 fact 核对来源引用、Policy eligibility 与 package/context 一致性，不要求重新读取不可供 CLI 访问的聊天，也不允许 finish 注入另一 fact。handle 与 JSON marker SHALL 只是定位及对照数据，不得独立形成 current 或授权。当前安装内容身份变化、开始记录损坏、前序漂移、Owner fact 不一致或旧格式未知 partial SHALL fail closed；历史完整三文件 SHALL 仍按其原始身份读取，不追溯重签。安装位置改变但 canonical Guidance path 与 bytes 相同 SHALL 不独立导致失败。

#### Scenario: Independent process finishes matching start
- **WHEN** start 进程已退出，新的 finish 进程读取新格式、未完成且全部来源与链核对一致的开始记录
- **THEN** finish SHALL 可将其与本次真实角色结果关联，无须 `.tmp` 内存对象或 caller 重填内部 package

#### Scenario: Unknown or drifted start
- **WHEN** occurrence 是旧未知 partial、descriptor/前序损坏，或当前安装 Guidance/已绑定 Owner fact 与开始时不一致
- **THEN** finish SHALL 指出具体不一致并停止，不将目录存在或 JSON marker 当成接管许可

### Requirement: Finish admits a real role result and preserves partial outcomes
finish SHALL 接收真实角色结论，验证exact package/current/occurrence/result、候选、proof和reported boundary后才写machine文件。普通Author FAIL/null可保持terminal blocked；Reviewer rejected/null须经exact候选绑定保存terminal并返回review-rejected，不重标changes-requested/approved；unknown token或冲突boundary写前拒绝。Author不得填写Reviewer verdict，命令不得生成Verification PASS。

Archive SHALL 分别校验completed PASS、安全failed FAIL和partial FAIL的真实绑定材料及实际业务状态。只有completed PASS需要可信completed coordination与archived查询形态；安全failed使用可信active/current；可验证terminal partial保持可读与archive-recovery-required，即使业务coordination部分写入或无法可靠解析，也不能伪造completed/active或阻止记录已确认失败。无法验证descriptor/父链或machine写入不完整时仍为incomplete，不补结果。新的Author成功候选可按专门合同增加实测candidateGit机械事实，不改角色结论；同值duplicate只能消费原已存事实。

proof SHALL 核对target/Delivery/Change/Run、regular/readable、SHA-256、原始Git bytes及完整声明；无必要proof不建空目录。首次结束仅create-once保存缺少的context.json/result.json，完整三文件、必要材料、唯一链及对应Policy/query读回后才confirmed；confirmed不是业务PASS。机器partial保持written-unconfirmed，不覆盖或自动重做业务。

#### Scenario: Real result accepted
- **WHEN** 真实工作结论与package匹配、proof有效且保存读回成功
- **THEN** finish SHALL 报告exact terminal或合法prepared failure，使独立查询读到同一记录

#### Scenario: Context saved but Result save fails
- **WHEN** context.json成功而result.json保存或读回失败
- **THEN** finish SHALL 保留已有文件并报written-unconfirmed，不宣称terminal或自动补写

#### Scenario: Wrong reported boundary is rejected before first Result write
- **WHEN** approved review-propose报告nextBoundary=archive或使用未知verdict
- **THEN** finish SHALL 写前拒绝，不能只凭结构合法报告confirmed

#### Scenario: Rejected Reviewer judgment persists as terminal stopped
- **WHEN** 真实Reviewer rejected/null具有合法角色和exact Author绑定
- **THEN** finish SHALL 保存terminal三文件和known blocked链，不伪装业务PASS或执行下一Action

#### Scenario: Rejected Reviewer judgment is not a terminal Run in this Change
- **WHEN** rejected的角色/候选绑定无效或nextBoundary非null
- **THEN** finish SHALL 在首次machine写前拒绝，不能重标verdict绕过

#### Scenario: Complete bytes are not a valid canonical continuation
- **WHEN** machine文件已写但唯一链/Policy读回不能确认exact tip
- **THEN** finish SHALL 保留bytes报written-unconfirmed，不以单个文件结构通过宣布完成

#### Scenario: Failed Archive is confirmed without archived status
- **WHEN** Archive安全失败、active前态与真实材料可证、三文件成功保存
- **THEN** finish SHALL confirmed terminal FAIL，独立query为active/current且next可计算archive，不要求archived状态

#### Scenario: Business partial is not a partial machine record
- **WHEN** Archive业务recovery-required，但实际失败材料、descriptor和唯一父链有效
- **THEN** finish SHALL 可保存完整terminal partial并使查询blocked；若machine保存失败则另报incomplete

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

当 Policy 允许 Owner 对 active Change 的 exact 完整 prepared Author Run 作 revise correction 时，受信 Agent 宿主 SHALL 从明确覆盖当前续跑的真实 Owner 指令形成并提交现有 OwnerAuthorityFact，可用真实 conversation sourceRef。已存在且覆盖该续跑的授权可作为来源，SHALL NOT 要求每轮重复询问；仅因父 Run 保存 authority SHALL NOT 推定本轮获授权。命令 SHALL NOT 自行生成权限，也不要求新增 Delivery manifest 授权记录。

start SHALL 核对 fact 的结构、decision=revise-action、Delivery/Change、单元素 revise scope、原 prepared 三文件和四槽 null、合法 correction edge、既有 machine readiness 与唯一 successor。该入口 SHALL 包括三个同 identity revise 的新 occurrence，使用既有编号分配、指向 exact current tip 的 previousRunId，并在写前重新核对 current 未变化；不得接受 caller 自选 parent 或内部 READY token。exact fact/sourceRef SHALL 绑定新 package、action.md 和随后 context.json。

finish 与 inspect SHALL 从开始记录恢复同一 fact，并重建相同 parent/Policy/结构/package/Guidance binding，不依赖临时宿主或对话可重读，也不得在 finish 替换 authority。前序 Run、Proof 与原始 bytes SHALL 保留，不能被 terminalize、覆盖或伪装 PASS。每个新 occurrence SHALL 可如实 finish 为完整 prepared/null，后续另一合法 invocation 可创建下一同名 occurrence；真实 terminal PASS SHALL 继续满足现有 Author artifact/candidate/proof/check admission 并要求其自己的独立 Review。每次 invocation SHALL 只处理一个 Action并 STOP，不自动下一轮或 Review。

已完整记录的 finish SHALL 继续仅允许既有相同结果的幂等读回；改变结果、state 或 authority SHALL 拒绝。普通 prepared reuse 的 READY SHALL NOT 授权新 start；普通 Author 的同名重复 start、prepared Reviewer、Archive、forward skip 或不完整前序 SHALL NOT 通过此入口。

#### Scenario: Authorized prepared correction
- **WHEN** exact prepared Author Run、Owner 来源及 revise target 均满足 correction 合同
- **THEN** 新 start SHALL 形成指向该 Run 的唯一 successor 开始记录，而旧 Run 保持原样；新三文件完成保存并读回后才报告新的完整 current tip

#### Scenario: Unsupported correction
- **WHEN** Owner 来源缺失、Role/Action 不匹配或前序既非合法 prepared Author、也非已有合同支持的合法 terminal correction
- **THEN** 命令 SHALL 在新 occurrence 创建前拒绝，不把一般 Review/FAIL 当成 Owner 授权

#### Scenario: Conversation-sourced Owner instruction survives process exit
- **WHEN** 受信宿主依据明确 Owner 输入提交 exact fact，其 sourceRef 指向 conversation，且 prepared correction 已成功开始
- **THEN** 独立 finish/inspect 进程 SHALL 从 action.md 中绑定的 package/context 核对同一 fact 与 Policy，不要求聊天复制到 target 或新 Owner registry，也不得让 finish 替换该 fact

#### Scenario: Continue multiple prepared revise rounds through fixed commands
- **WHEN** 某个 revise 阶段的完整 prepared R1 经授权 start R2，真实工作后 finish R2 为 prepared/null，再依据覆盖当前续跑的 Owner 授权 start R3
- **THEN** 每轮 start、独立 inspect、finish、status/next 和历史读回 SHALL 使用同一合法 edge；R1/R2 原件不变，R3 的真实 PASS 后续 SHALL 只交接到其自身的独立 Review

#### Scenario: Reject current drift and duplicate finish mutation
- **WHEN** 写前 exact parent/tip 已变化，出现竞争/不完整 occurrence，或对完整旧 Run 提交不同结果
- **THEN** 命令 SHALL 拒绝并保留已存在 bytes；已写 partial SHALL 保留并报告 incomplete，不清理、接管或补造成功

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

### Requirement: Successful Explore artifacts are admitted before finish and legacy identities are verified before Review

`action finish` SHALL require a terminal successful `explore` or `revise-explore` Result to contain both `facts.exploreArtifact` and `facts.exploreSha256`. The path SHALL be exactly `openspec/changes/<current semantic changeId>/explore.md` relative to the target repository root, and the SHA-256 SHALL match that target's existing regular, readable, non-linked file. Missing, partial, wrong-path, malformed or drifted identity SHALL be rejected before the first `context.json` or `result.json` write; `artifactHashes` SHALL NOT substitute for either dedicated field on this new write path. Existing Author `FAIL` and nonterminal outcome rules SHALL remain unchanged.

For a previously confirmed terminal successful `explore` or `revise-explore` Result only, `review-explore` SHALL accept a compatibility identity when **both** dedicated fields are absent and `artifactHashes` contains exactly one path ending in `/explore.md`, exactly equal to the path for that Result's semantic `changeId`. Its declared SHA-256 and the current file SHALL pass the same exact artifact checks before Review starts. A partial dedicated pair, conflicting identity, ambiguous Explore path, wrong Change, malformed hash, missing file or hash drift SHALL be rejected. Compatibility SHALL read the saved Result without rewriting it, and SHALL preserve all other Review readiness, declared-proof, Role and Policy checks.

#### Scenario: Future successful Explore omits dedicated identity

- **WHEN** a new terminal successful `explore` or `revise-explore` Result has a matching `artifactHashes` entry but lacks either `exploreArtifact` or `exploreSha256`
- **THEN** `action finish` SHALL reject it before creating either terminal machine file and preserve the prepared Run and existing artifact bytes

#### Scenario: Future successful Explore supplies exact identity

- **WHEN** both dedicated fields name the exact current Change Explore file and its matching SHA-256, with all other finish conditions satisfied
- **THEN** `action finish` MAY confirm the Run under its existing create-once and Policy rules

#### Scenario: Existing MenDi-shaped Result is reviewed without mutation

- **WHEN** a confirmed terminal successful Explore Result lacks both dedicated fields, has one exact current-Change `explore.md` entry in `artifactHashes`, and that entry matches the current file bytes
- **THEN** `review-explore` SHALL use that verified identity for readiness without changing the existing Result, and an independent Reviewer MAY start the already-legal Action

#### Scenario: Legacy ambiguity or drift fails closed

- **WHEN** a confirmed Result has one dedicated field only, conflicting dedicated and hash identities, multiple `explore.md` entries, a path for another Change, an invalid SHA-256, a linked or missing file, or changed bytes
- **THEN** `review-explore` SHALL reject before creating its start record and SHALL NOT repair, rewrite or synthesize the Author Result

#### Scenario: Non-success outcome retains its boundary

- **WHEN** an Author submits a genuine unsuccessful or nonterminal Explore outcome
- **THEN** this new successful-artifact rule SHALL NOT reclassify that outcome as PASS, create a Review edge, or impose a fabricated Explore artifact identity

### Requirement: Successful Propose and Apply Results satisfy candidate readiness before terminal write

For a new terminal Author `PASS` Result of `propose` or `revise-propose`, `action finish` SHALL require the exact current Change's managed OpenSpec planning status to be complete. `facts.artifactHashes` SHALL contain the project-root-relative paths for that Change's `proposal.md`, `design.md`, and `tasks.md`; each SHALL identify an existing regular, readable, non-linked file with matching SHA-256. Every other declared planning hash SHALL remain subject to the existing current-Change path allowlist and byte check. Missing or invalid required identity, incomplete planning, or drift SHALL be rejected before the first terminal `context.json` or `result.json` write, preserving the prepared Run and artifacts.

For a new terminal Author `PASS` Result of `apply` or `revise-apply`, `action finish` SHALL require a nonempty `facts.artifactHashes` map and SHALL apply the same project-root-relative candidate-file path, regular-file, no-link, readability, SHA-256, and byte-match rules used by `review-apply`. Missing, malformed, inaccessible, linked, or drifted candidate identity SHALL be rejected before the first terminal machine-file write. The new checks SHALL NOT turn a genuine Author `FAIL` or nonterminal outcome into a successful candidate or impose a fabricated candidate artifact on it.

`review-propose` and `review-apply` SHALL continue to recheck the current files and their other existing readiness conditions independently. Previously confirmed Results SHALL retain their original bytes and current Review read rules; this requirement SHALL NOT retroactively demand new Propose hash coverage from them. A file changed after finish MAY still block Reviewer start.

#### Scenario: Incomplete planning cannot produce a successful Propose Result

- **WHEN** a new terminal Author `PASS` `propose` or `revise-propose` Result supplies valid hashes but managed OpenSpec reports planning incomplete
- **THEN** finish SHALL reject before terminal machine-file creation and preserve the prepared Run

#### Scenario: Required Propose identity is missing or invalid

- **WHEN** a new terminal Author `PASS` Propose Result omits any of the exact `proposal.md`, `design.md`, or `tasks.md` hash keys, or a required or other declared planning file fails the existing path and byte checks
- **THEN** finish SHALL reject before terminal machine-file creation even if the remaining declared entries are valid

#### Scenario: Complete Propose candidate is admitted

- **WHEN** managed planning is complete, all three required current-Change planning paths and every additional declared planning path pass their checks, and all other finish conditions hold
- **THEN** finish MAY confirm the Propose Run under its existing create-once and Policy rules; Review SHALL still recheck its current inputs

#### Scenario: Apply candidate hash is missing or invalid

- **WHEN** a new terminal Author `PASS` `apply` or `revise-apply` Result has no candidate hash map or one of its declared entries is malformed, linked, missing, unreadable, or changed
- **THEN** finish SHALL reject before terminal machine-file creation and preserve the prepared Run and existing candidate bytes

#### Scenario: Valid Apply candidate is admitted and later rechecked

- **WHEN** the new terminal Author `PASS` Apply Result declares a nonempty valid candidate hash map and satisfies all other finish conditions
- **THEN** finish MAY confirm the Run, while `review-apply` SHALL independently recheck the saved identities against current files

#### Scenario: Historical and unsuccessful outcomes keep their boundaries

- **WHEN** an existing confirmed Result is read, or an Author submits a genuine `FAIL` or nonterminal outcome
- **THEN** this new-write rule SHALL NOT rewrite the existing Result, impose retroactive Propose hash coverage, create a successful Review edge, or require a fabricated successful candidate identity

### Requirement: Review finish closes exact Author binding before terminal write

每个新 terminal Reviewer Result SHALL 在 machine 文件首次写入前声明 `facts.reviewedRunId`，其值 SHALL 等于该 Review descriptor 的 `previousRunId` 与真实唯一 terminal Author Run。已有 `reviewedAuthorRunId` SHALL 与其一致；声明的 candidate map SHALL 与该 Author 的可信 effective identity 一致。三个 review 阶段 SHALL 保留各自已有产物、proof 和角色合同；review-apply 与 Archive SHALL 消费同一 exact binding。旧完整 Review 不因缺新字段而被改写或拒绝一般只读展示，但新下游 mutation SHALL NOT 仅凭旧 approved token 绕过缺失绑定。

#### Scenario: Missing or conflicting binding stays incomplete
- **WHEN** Reviewer 未提供 reviewedRunId、绑定另一 Author 或 alias/candidate 声明冲突
- **THEN** finish SHALL 在写 context/result 前拒绝、指出 expected identity，并保留开始记录和实际材料

#### Scenario: Consistent Review can be consumed by Archive
- **WHEN** 新 review-apply 已以 exact Author binding 和候选身份完成并 approved
- **THEN** Archive SHALL 复用该绑定且不再因同一缺失字段首次阻断

### Requirement: Fixed Action inspection exposes partial facts without granting recovery
action inspect SHALL 保留共同target/exact runId封闭请求，严格核对可见目标，只读呈现descriptor、machine完整性、diagnostic refs、真实Archive效果、remaining和canContinue，不写Run/phase/correction。descriptor-only或machine partial不得冒充完整current；完整terminal partial则应明确显示真实已记录失败与recovery-required，不误报文件缺失。wrong root、Guidance drift、fork、mixed/unknown或旧未知格式 SHALL 明确阻断。

#### Scenario: Inspect a descriptor-only Archive
- **WHEN** 原target有合法Archive descriptor而machine尚未写
- **THEN** inspect SHALL 提供exact locator与可验证效果，普通status/next仍报告incomplete而非空闲

#### Scenario: Claimed effect does not authorize retry
- **WHEN** caller曾说none但真实source/spec/coordination不能证明安全前态或成功后态
- **THEN** inspect SHALL 报unknown、canContinue=false，不建议重放或替代Run

#### Scenario: Inspect an immutable terminal partial
- **WHEN** 三文件完整且记录为Archive partial
- **THEN** inspect SHALL 区分完整失败记录与未完成业务，只提供显式恢复所需事实，不自动解锁普通retry

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

fixed start SHALL 接纳既有active terminal阶段Owner revise、known rejected对应revise、六个普通Author exact terminal FAIL/null的合法Owner revise和安全failed Archive后的窄revise-propose/revise-apply，同时保留prepared Author correction。Owner fact SHALL 为既有revise-action、same target、single requested scope并绑定新package/descriptor/context；新Run指向原tip，不改旧结果。Archive correction核对安全active与原失败链，不要求待修候选仍等于旧Review；直接Archive retry仍要求同候选。

unknown outcome、不满足专门correction合同的普通Author FAIL、invalid chain、prepared Reviewer、partial/completed Archive或reported conflict SHALL 不被Owner fact兜底。普通Action不新增Owner审批。

固定 start/inspect/finish/current-run-chain SHALL 对普通 Author FAIL/null 使用 policy-and-next-boundary 的同一 correction 合同；不同 identity 使用原 prepare，三个同名 revise 使用专门新 occurrence 结构边。start SHALL 从真实 current pair 和 Owner 请求形成 descriptor/preparedContext，绑定直接失败 parent 和原 scope；inspect/finish/chain SHALL 从 descriptor、exact parent 和原绑定 Owner fact 重建，不接受 caller 手填内部 boundary/parent/witness，不在 finish 新造 authority。bare READY SHALL NOT 代替失败来源。固定入口 SHALL 不代执行 Author 业务或自动下一 Action。Owner correction 的 Policy/结构可进入 SHALL 不豁免原机器 readiness；缺 ordinal、coordination、runtime 或必要 proof 时 SHALL 按原适用规则拒绝新开始，不因 FAIL 重新分配编号。

#### Scenario: Explicit revise follows known rejection

- **WHEN** review-apply rejected/null有效且Owner授权same Change的revise-apply
- **THEN** start SHALL 经Policy/结构核对建立唯一Author successor，不改原verdict

#### Scenario: Unknown verdict cannot be rescued by Owner fact

- **WHEN** Review outcome或原记录/绑定无法验证
- **THEN** start SHALL 拒绝，不按known rejection续行

#### Scenario: Candidate correction after failed Archive remains reachable

- **WHEN** 安全failed Archive后需要改delta/源码且Owner授权对应revise
- **THEN** start SHALL 允许合法修订接原failed parent，后续重新形成候选和独立Review；不得先要求旧candidate unchanged而锁死修订

#### Scenario: Read back one failed Author correction through every seam

- **WHEN** 六个普通 Action 任一合法 FAIL/null 经 exact Owner revise start，真实工作后 inspect/finish 和独立查询
- **THEN** 各入口 SHALL 得到同一 occurrence/parent/authority 和可进入边界；新 PASS 后 SHALL 指向对应 Review

#### Scenario: Reject bad authority before creating the successor

- **WHEN** Owner scope/target/decision 错误或缺失，或 current pair stale
- **THEN** start SHALL 拒绝且不创建新 descriptor，旧 Run SHALL 不变

#### Scenario: Reject changed evidence during inspect or finish

- **WHEN** 原 descriptor/parent/linkage/Owner 绑定不再有效
- **THEN** inspect/finish/chain SHALL fail closed，不用新的 caller authority 掩盖历史变化

#### Scenario: Keep other terminal and partial outcomes bounded

- **WHEN** 同名 terminal PASS、UNKNOWN、Reviewer 或 Archive partial/machine partial 请求套用普通失败 correction
- **THEN** 固定入口 SHALL 保持原拒绝/恢复边界，不重开或补写旧 Run

#### Scenario: Keep machine readiness after a failed correction is authorized

- **WHEN** exact 普通 Author FAIL/null 的 Owner correction 已通过 Policy/结构核对，但 revise-explore 所需持久 ordinal 缺失
- **THEN** start SHALL 在 descriptor 创建前按 project-ordinal-invalid 拒绝，旧失败 bytes 不变；有已消费历史 SHALL 不通过 fresh 首值 1 绕过

### Requirement: Candidate admission binds raw bytes to supported Git storage identity
新成功Author候选 SHALL 在保留raw identity的同时由manager只读生成并核对有界candidateGit绑定，覆盖既有artifactHashes或Explore专用identity的exact文件集合，包括相关 stage-0 indexBasis。caller声明该字段时须与实测完全相同；缺失时由manager生成；不能以其产生Author PASS、Reviewer或Verification权限。Review start/finish SHALL 验证原raw候选、必要proof、有效规则及其索引输入与预期输出关系，仍绑定exact reviewedRunId。索引仍为绑定输入，或已经是满足既有 mode/path 合同的预期 blob，不构成投影漂移；其他相关索引变化须在新接纳前拒绝，不能重算预期追认旧Review。

系统 SHALL 只支持 identity 或可验证的 Git 内建 CRLF→LF 文本投影，预期 blob 必须对应同一 raw、有效属性/设置和相关 index 前态下普通 staging 成功时的存储内容，不含 renormalize 的特殊语义。自动文本模式下，相关 index 已含非 binary CRLF（包括 mixed）的普通条目时 SHALL 保留当前 raw 为 identity；该规则包含 text=auto 及继承 core.autocrlf=true/input 的自动动作。显式 text 不套用该 auto 保留分支；自动模式的 LF/absent 对照按其实际文本判定处理。不能仅以无 -w 的 hash-object --path 输出认定实际 staging 的 blob，也不能将 binary 或 lone CR 错当作非 binary CRLF 索引依据。

clean/EOL 内容与普通 add 的最终 index SHALL 分别判断，不能因显式 text 就承诺 add 必定执行转换。若原普通 stage-0 blob bytes 等于当前 raw，但受支持 clean/EOL 内容不同，系统 SHALL 在保存成功候选前明确 unsupported，并指出路径及 stat-cache 跳过与实际转换的歧义；不得改选旧 blob 为通用 identity 或保存猜测的 LF。该拒绝 SHALL 不依赖 stat/时间戳，raw 不变而仅 stat 改变时仍拒绝，不持久增加 stat 字段或数据库。Review/Archive 输入核对 SHALL 使用相同边界；已核实预期输出按既有输出合同核对，不重绑历史。其他不能证明普通 staging 结果的 cache/索引状态亦须前置拒绝，raw 修改或 stat 不同单独不构成转换必然发生的证明。

active clean filter、working-tree-encoding、ident 转换不得执行或默认为 EOL。仅 EOL 分支须证明有效文本动作、安全 UTF-8/no-NUL 及预期 bytes 只移除了 CRLF 中的 CR；不 trim、不处理 lone CR、不改 BOM/编码或重新序列化。候选生成与 Review 的投影校验 SHALL 不写真实或临时 index/object/worktree，不执行 add 试算、touch、refresh、renormalize、修改配置或复制开发环境。不能可靠解释的转换或索引状态 SHALL 在保存成功候选前明确 unsupported，而不先保存猜测的 blob。合法 raw!=blob 不作为内容漂移；真实 raw/规则/相关索引冲突、未知转换和 map/hash 不符仍拒绝。预期 blob 不保证后续 Git 命令成功，真实安全转换拒绝或执行错误不得被忽略或通过关闭设置绕过。

Run/proof/raw日志和按项目属性标为binary/-text的字节敏感内容 SHALL 保持原bytes；Git投影不能替代原始执行/测试证据。deletion仍按真实删除表示，不制造文件hash。旧无candidateGit记录不自动生成历史投影，raw==blob兼容路径外需真正新候选和独立Review。

#### Scenario: Supported CRLF candidate can be independently accepted
- **WHEN** raw为CRLF、有效Git规则只形成LF blob、实测投影及其他候选条件有效
- **THEN** 新Author/Reviewer接纳 SHALL 允许该差异，保存raw与blob绑定，不重写工作区

#### Scenario: Exact raw evidence and LF source remain valid
- **WHEN** raw证据保持identity，或LF源码的投影等于raw且其余条件有效
- **THEN** guard SHALL 通过，不从同值hash生成审查或测试PASS

#### Scenario: Explicit CRLF working-tree policy is supported
- **WHEN** `.cmd/.bat` 被标为text eol=crlf且真实raw为CRLF、普通staging可证明为LF并通过上述支持边界
- **THEN** 接纳 SHALL 按合法EOL投影核对，不要求Author改成违反该工作区规则的LF文件

#### Scenario: Unknown filter or real content drift stays rejected
- **WHEN** 有主动filter/encoding/ident转换，或raw候选/绑定规则发生未授权变化
- **THEN** 接纳 SHALL 明确拒绝且不执行任意filter、不normalize、不继承旧Review

#### Scenario: Automatic text preserves an existing CRLF index
- **WHEN** 先有 i/crlf，随后启用 text=auto，raw 从 old CRLF 修改为 new CRLF，其他候选条件有效
- **THEN** 新候选 SHALL 保存 new CRLF 的 identity blob 及原 indexBasis，Review SHALL 按同一依据核对，不采用无索引命令给出的 LF 预测

#### Scenario: Inherited auto conversion and forced text remain distinct
- **WHEN** 分别使用属性未指定但继承 autocrlf=true/input、显式 text，以及 auto 下 LF/absent 索引对照
- **THEN** 接纳 SHALL 按普通 staging 的相应索引敏感行为生成可验证 blob，不把所有 CRLF 或所有 eol=lf 输入统一归类

#### Scenario: An unexpected index basis blocks new admission
- **WHEN** 相关 index 不再是绑定输入或预期输出，存在未合并/非普通/未知条目，或输入读取期间发生漂移
- **THEN** 新候选或 Review 接纳 SHALL 在结果写前明确拒绝，不修改索引、重算旧绑定或留到 checkpoint 才发现错误预测

#### Scenario: Duplicate finish does not recalculate historical projection
- **WHEN** 同值finish重投且该Run已有完整candidateGit与原结果
- **THEN** 命令 SHALL 只读核对已存机械事实，不为旧Run重算、改hash或重执行业务

#### Scenario: Attribute-only normalization cannot guess ordinary add output
- **WHEN** raw 等于旧 i/crlf blob，仅属性从 -text 变为 text eol=crlf，clean 内容为 LF，而非 racy stat cache 可使普通 add 保留旧 CRLF
- **THEN** 候选形成 SHALL 在成功 Result 保存前明确 unsupported，不保存 LF 预期、不通过实际 add 试算或触碰时间戳解锁

#### Scenario: Timestamp-only change does not widen supported admission
- **WHEN** 上述 raw、规则与原 index blob 均未改变，仅 stat 改变后普通 add 可输出 LF
- **THEN** 候选形成 SHALL 仍按同一保守边界拒绝，不将 stat 变化当成 durable 转换证明；absent 或原 index 已等于预期内容的对照不因该拒绝被阻断

### Requirement: First Explore readiness admits only verified fresh ordinal initialization

canonical product-managed first Explore readiness SHALL 使用 author-action-guidance 的完整 fresh predicate，在无 assigned baseline 且所有来源可判定时允许候选 ordinal=1；已有 baseline SHALL 按原复用/max+1。start SHALL 不写 ordinal；合法 descriptor-only 当前 first Explore continuation SHALL 不被误判为已消费历史，重复 start/create-once SHALL 仍保持原规则。实际 Explore HOW SHALL 重读后写 exact coordination entry；新 terminal Explore PASS 的 finish SHALL 核对真实持久 ordinal 与 Result 一致，不消费临时候选值作为 durable truth。发现历史而无编号 SHALL 拒绝，不用 Init/Activate 预分配或新 seed 绕过。

#### Scenario: Start and finish a verified fresh first Explore

- **WHEN** project/coordination/OpenSpec/history/artifact/archive 全部满足 fresh predicate
- **THEN** start SHALL 建立真实 descriptor 并保持 manifest 未编号；HOW 写 1 后 finish SHALL 接纳一致 Result

#### Scenario: Permit only the current descriptor continuation

- **WHEN** 当前 first Explore 已建立唯一合法 descriptor、无 machine files，当前 proof 归属有效
- **THEN** readiness SHALL 允许继续，但 SHALL 不把重复 start 当新 occurrence 或把 proof 当编号 authority

#### Scenario: Reject history without an assigned baseline

- **WHEN** 无编号但有 bootstrap/partial/旧 Run/orphan proof/历史 archive 或未知来源
- **THEN** readiness SHALL 拒绝，不产生 ordinal 或修复历史

#### Scenario: Reject missing or conflicting persisted ordinal at finish

- **WHEN** 新 terminal Explore PASS 的 coordination ordinal 缺失、重复或与 Result 不同
- **THEN** finish SHALL 拒绝，不自动写编号或按 Run sequence 补值

#### Scenario: Preserve a genuine failure before ordinal materialization

- **WHEN** 已合法建立 first Explore descriptor，但 HOW 在持久编号前真实失败，提交合法 terminal Author FAIL/null
- **THEN** finish SHALL 保留原失败接纳规则，真实三文件可保存且 query 停在普通 Author failure；不得填造 ordinal/PASS 或阻止记录失败

### Requirement: Finish budget diagnostics precede machine result writes

固定 finish caller facts 和 manager 生成 candidateGit 后的最终 merged facts SHALL 共用 run-result-persistence 的 bytes/depth/nodes 预算测量。caller 超限 SHALL 保留 invalid-request；生成后超限 SHALL 保留 result-admission-rejected 与既有 effect/runId。两者 SHALL 带 foundation-cli-surface 定义的封闭安全 error.budget，subject=result-facts，limit 为对应固定预算，observed/measurement 如实反映完整值或下界。已发现的 schema/非 JSON-compatible 错误 SHALL 不被预算错误遮蔽；预算提前停止 SHALL 不要求遍历未访问部分或声明整个 payload 合法；CLI envelope bytes 超限 SHALL 优先用 request 诊断。

最终 merged facts SHALL 在 context/result 首写前完成预算核对；拒绝 SHALL 保留 action.md 与真实 proof，不写任一 machine file、不伪造 machine partial。真实修正后可按既有合法 descriptor 继续 finish，不清理或覆写终态。所有 refs/hashes/candidate identity SHALL 仍完整验证。

#### Scenario: Diagnose oversized caller facts

- **WHEN** 请求 envelope 合法但 caller facts 超 depth/nodes 预算
- **THEN** finish SHALL 输出 invalid-request 和 result-facts budget，未创建 context/result

#### Scenario: Diagnose generated metadata overflow before writes

- **WHEN** caller facts 合法且未提供 candidateGit，manager 生成并合并候选后超 bytes/nodes/depth
- **THEN** finish SHALL 输出 result-admission-rejected、原 effect/runId 和 budget，保留 descriptor/proof 且两个 machine files 均不存在

#### Scenario: Continue a genuine corrected finish

- **WHEN** 先前仅因 merged budget 被拒绝，真实材料已修正且原 descriptor/其他合法性仍有效
- **THEN** 同 Run finish SHALL 可正常核对/保存/读回，不把先前拒绝声明为终态 PASS

#### Scenario: Diagnose the envelope before nested facts

- **WHEN** 整个 action finish 请求先超过专用 1,048,576 bytes
- **THEN** CLI SHALL 先输出 request bytes 诊断，不宣称 facts validator 已执行

### Requirement: Prepared continuation preserves existing descriptor Guidance compatibility

发布本次 prepared 同名 revise 续跑能力的 manager SHALL 保持现有产品 Action Guidance bytes 及身份不变，避免仅因该修复造成此前合法完整 prepared Author descriptor 的 package/Guidance drift。原记录 SHALL 可通过匹配 target 的只读 status/next/inspect 核对；补充解释 SHALL 不改写历史 descriptor/Result 或绕过 Guidance/hash 校验。此兼容不允许消费本来已漂移、partial 或非法的记录，也不扩大 inspect 为任意历史 Run 续跑接口。

#### Scenario: Inspect a complete prepared descriptor after the repair
- **WHEN** 原 manager 建立的完整 prepared Author Run 及其必要绑定原本有效，修复后的 manager 读取同一原件
- **THEN** 只读查询与当前 tip inspect SHALL 仍确认原 prepared 事实和 Guidance identity，原 Run/Proof 字节不变；新的续跑权限仍需本 capability 的 exact Owner correction 合同
