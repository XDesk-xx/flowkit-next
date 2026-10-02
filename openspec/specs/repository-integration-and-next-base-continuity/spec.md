# repository-integration-and-next-base-continuity Specification

## Purpose
为 already-finalized exact Delivery 提供 bounded repository integration 与 next-base continuity：在 exact Owner Git authority 下形成 one ordinary Delivery Final commit，通过 repository 自身的 review/merge mechanics 被接受后，从 Git 重新读取 accepted main 并将其作为 next base，然后 STOP；不建立 Git provider、promotion lifecycle 或 automatic next-Delivery authority。

## Requirements

### Requirement: Repository Integration consumes exact Delivery Final continuity and exact Git prestate

Integration SHALL 从 target completed manifest 实读本项目/Delivery 的最小 Final record 与既有 Git observation，绑定 Final ref、preIntegrationHead、Delivery branch、targetMainRef、targetMainPreIntegrationCommit、现有 Git acceptedBaseCommit/provenance 与明确 checkpointOperation。SHALL NOT 要求完整 Final package、requiredEvidence、finalizedCandidateRef 或替代整仓摘要，不重复 Final 的 Change/Full Test 验收。

Final source SHALL 来自受控固定 manifest，且 reader 必须依据有效 confirmationRef 返回 completed；单有 completed 字段、Owner 引用、caller boolean/digest 或 provider 摘要 SHALL 不构成成功 Final。preparation 与 Git mutation 前 SHALL 重验此确认；null/缺失/mismatch/unconfirmed SHALL 拒绝，不调用 Git callback、不补写确认、不重新验收 Final。Git accepted-base 来源与对象核验 SHALL 保持，不回流为 Start 或下一 Delivery SHA 准入；acceptedMainCommit 不预声明，相关 commit 仍为 SHA-1。

#### Scenario: Prepare from exact finalized and Git prestate
- **WHEN** 实读 Final 完成事实与 Owner 指定 Git 操作、来源、HEAD/branch/target/base 匹配
- **THEN** Integration SHALL 冻结 package，不要求 Full Test 日志或祖先 Run 快照

#### Scenario: New session cannot promote an unconfirmed Final
- **WHEN** Final 第一笔写后读回失败或输入漂移，确认未发布，全新会话调用 Integration preparation
- **THEN** Integration SHALL 拒绝成功资格且不执行 Git，即使 manifest 已写 completed 和五项结果关联

#### Scenario: New session accepts durably confirmed Final
- **WHEN** 全新会话读到同次 Final 复验后发布的有效 confirmationRef，其他 Git 权限与前置成立
- **THEN** Integration SHALL 可准备，不重放 Final/Full Test；确认已提交但响应丢失亦只读辨认真实提交事实，不自动重跑

#### Scenario: Reject stale finalized or Git prestate
- **WHEN** Final 完成关联或本次 HEAD/branch/target/base/操作不符
- **THEN** host SHALL 拒绝，不用内容等价静默重绑定或自动 rebase

#### Scenario: Accepted main is not predeclared
- **WHEN** 仍处于 preparation
- **THEN** package SHALL 不包含或信任 expected acceptedMainCommit

### Requirement: Repository Integration requires one exact singleton Owner Git authority

Integration SHALL 保持 structural-valid authority：decision=authorize-repository-integration、exact Delivery、absent changeId、scope exactly ["delivery-repository-integration"]。该 authority SHALL 与 Owner 本次明确决定的 checkpointOperation、目标及 Git/Final prestate 一起绑定重验；相同 scope 外形 SHALL 不授权任意选择新建、复用、squash、rebase 或 merge。Review/Verification/Final/checkpoint status、较宽 scope SHALL 不能继承或组合成此权限。

#### Scenario: Accept exact repository-integration authority

- **WHEN** singleton authority 与独立 Owner 操作、Delivery、target 及 exact prestate 一致
- **THEN** host SHALL 将权限与该具体操作冻结到 package，不赋予后续自动 Git 权限

#### Scenario: Reject broader inherited or stale authority

- **WHEN** 权限缺失/不符、含 Change/额外 scope、操作未经明确决定或原 prestate 漂移
- **THEN** execution SHALL 拒绝，要求新的可信 preparation/authority 核对

### Requirement: Repository review and merge remain provider-external while terminal Git truth is independently observed

publication/review/merge SHALL 由已有 Agent/宿主调用既有工具或有界人工交接；callback success、PR id、返回 SHA 或自签摘要 SHALL 不作为 acceptance truth。terminal SHALL 从本次真实接受目标读取 acceptedMainCommit，并通过已有可信来源核对 exact finalCommit、Owner 指定操作及接受关系。涉及远端时，单独本地 refs/heads 或旧 tracking ref SHALL 不足以证明远端接受；本地 canonical ref 必须与本次远端查询和真实接受来源一致。

系统 SHALL NOT 从 Final 取得全仓 projection 作 equality 门槛，不遍历 accepted object 的历史 Runs，不读取 Full Test 日志重新验收 Delivery。不能证明本次操作的接受来源 SHALL 报告未完成/不可确认并 STOP，不自动选择别的 merge/rebase 关系。Git 失败 SHALL 不撤销已发生 Final。

#### Scenario: Accept repository-accepted main from Git observation
- **WHEN** 本次目标读回与 exact finalCommit 的授权接受关系、真实来源有效
- **THEN** terminal SHALL 使用实际 SHA；远端目标还须有本次远端读回，不要求 Final 全仓 projection 或历史 evidence

#### Scenario: Ignore callback-reported accepted-main SHA as truth
- **WHEN** callback 成功但 target 不符、仅有 PR id/本地 ref，或接受关系来源不能确认
- **THEN** 系统 SHALL 不报 terminal，读回可用效果并 STOP，不盲重试

#### Scenario: Stop on target-main drift instead of automatic rebase
- **WHEN** target 变化不能由本次已授权操作和原 prestate 解释
- **THEN** 系统 SHALL STOP 交 Owner 核对，不自动 rebase、覆盖或冲突修正

#### Scenario: 产品一致但必要执行证据丢失
- **WHEN** 产品内容相同但本次 Git 操作/接受关系的必要来源不可确认
- **THEN** Integration SHALL 不报成功；不在本次消费集合的历史 proof 不自动成为 blocker

#### Scenario: 无关历史可追加
- **WHEN** Git 操作与真实接受来源有效，仅追加无关 Run 或非产品文档
- **THEN** 系统 SHALL 不因 Final 摘要或历史材料变化要求重开 Change/Full Test

#### Scenario: Remote acceptance awaits a human
- **WHEN** 本地 checkpoint 已确认，但 PR/merge 尚未完成或工具不可用
- **THEN** host SHALL 交接已确认 checkpoint 和剩余步骤，不声称 accepted-main，不强制创建第二个 commit 或原生支持所有 provider

### Requirement: Accepted main becomes next Delivery base and terminal execution stops

成功 terminal SHALL 保留 deliveryFinalizationRef、preIntegrationHead、checkpointOperation、Git 实读 finalCommit、targetMainRef、targetMainPreIntegrationCommit、acceptedMainCommit 与相等 nextDeliveryBase；SHALL NOT 包含 finalizedCandidateRef 或 requiredEvidence。

Integration ref SHALL 保持 repository-integration:sha256:<64 lowercase hex>，输入为 UTF-8 flowkit-repository-integration、0x00、无 BOM/newline 的固定 JSON；顺序为 deliveryId、deliveryFinalizationRef、preIntegrationHead、checkpointOperation、finalCommit、targetMainRef、targetMainPreIntegrationCommit、acceptedMainCommit。create-new projection SHALL 按 kind、paths、commitMessage、commitShape 排序；paths 按规范化 exact 路径排序且唯一；非 null commitShape 按 parents、count 排序，parents 保留 Git parent 顺序。reuse-existing SHALL 按 kind、checkpointCommit 排序。derive/clone/validator SHALL 同步并以 golden vectors 验证，不静默给旧形状补值重签。

外部 review metadata SHALL 仅作审计；nextDeliveryBase 是 Git 定位事实，不是下一 Start 或 manager 安装准入条件。terminal SHALL STOP，不 tag/release/激活下一 Delivery/更换 manager，也不把本次结果回写进必须再次提交的内容以制造 SHA 循环。

#### Scenario: Return exact accepted-main next-base continuity
- **WHEN** 本次 Git 操作与实际接受关系均已核验
- **THEN** terminal SHALL 记录真实 acceptedMainCommit 和相等 nextDeliveryBase 后 STOP，不要求再 commit 结果中的 SHA

#### Scenario: Terminal success does not activate release or next Delivery
- **WHEN** Integration 成功
- **THEN** 系统 SHALL 不产生新 Owner authority 或自动下一操作

#### Scenario: Operation projection is canonical and content-bound
- **WHEN** 操作对象属性仅重排，或授权路径/消息/形状改变
- **THEN** derive/validator SHALL 分别保持相同 ref 或得到不同 ref；旧缺字段形状不得静默补签

### Requirement: Repository Integration preserves state-first continuity without transport lifecycle modes
Repository Integration preparation/execution SHALL 只要求exact finalized state、required Git history与required environment可验证。若这些exact state已经可用 SHALL 直接verify/reuse；若缺失 SHALL STOP preparation并允许在lifecycle外恢复最小缺失state，再通过同一operation重新prepare。Core SHALL NOT引入local/detached/shared/bundle/ZIP execution mode，也 SHALL NOT要求mandatory source snapshot、Git bundle或dependency archive。

#### Scenario: Reuse shared exact state
- **WHEN** exact finalized working tree、Git history与required environment已经存在且identity验证通过
- **THEN** Repository Integration SHALL 直接使用同一operation contract继续，而 SHALL NOT人工创建transport handoff

#### Scenario: Restore missing state without changing lifecycle semantics
- **WHEN** exact required repository/history/environment state缺失
- **THEN** preparation SHALL STOP直到最小exact state被外部恢复并重新验证，随后 SHALL 使用同一`delivery-repository-integration` operation，而 SHALL NOT切换到新的transport/execution lifecycle type

### Requirement: Integration 按明确操作创建或复用 checkpoint

checkpointOperation SHALL 由可信宿主按 Owner 明确输入绑定。create-new SHALL 包含非空 exact 提交路径集合、commitMessage 和 commitShape；commitShape SHALL 为 explicit null 或 Owner 指定的 exact parents/count，不默认填入一个普通提交。reuse-existing SHALL 只绑定已授权的 exact SHA-1 checkpointCommit，不调用新建 callback，不因无关 dirty 要求额外提交。

新建 SHALL 在实际 commit 前核对完整 index 与授权路径，并在执行后从 Git 核对新对象、实际变更范围和指定形状；没有真实新对象的成功回执 SHALL 拒绝。未指定形状不授权额外 squash/rebase/多提交；宿主 SHALL 仍按 Owner 的具体操作执行。删除全仓 clean、与 Final v2 projection 相等及无条件 parent/count 门槛；不删除真实冲突、目标漂移、对象来源和权限核对。复用不因未涉及的 index/worktree 内容单独失败。

两路径在 acceptance 前 SHALL 重验本次 target prestate 与已确认 Final。mutation 后失败 SHALL 明示实际效果，不盲重试、回滚或撤销 Final；本 Change 不增加自动 Git 操作种类。

#### Scenario: 明确新建一个普通 commit
- **WHEN** Owner 明确要求一个普通 commit 并绑定对应 parents/count
- **THEN** host SHALL 验证该指定形状、实际范围与来源，保留无关工作后进入 acceptance

#### Scenario: 新建路径拒绝错误提交形状
- **WHEN** 未形成实际新 commit，或实际 parents/count 不满足 Owner 显式指定值
- **THEN** 系统 SHALL 拒绝继续 acceptance，报告已观察到的效果，不重复 commit

#### Scenario: 已授权 checkpoint 直接复用
- **WHEN** reuse-existing 对象、来源与本次目标有效，存在无关未提交内容
- **THEN** host SHALL 复用该 SHA，不制造额外 commit、不修改无关 index/worktree

#### Scenario: commit 成功但 acceptance 失败
- **WHEN** commit 已形成但接受失败或待人工完成
- **THEN** 系统 SHALL 报告实际 commit 与未完成接受步骤并 STOP，不自动补交或撤销 Final

#### Scenario: No implicit ordinary-commit constraint
- **WHEN** Owner 的已明确操作没有附加 parents/count 约束，commitShape 为 null
- **THEN** 系统 SHALL 不套用单普通提交形状检查，仍核对实际新对象、范围和授权操作，不自行选择额外操作

### Requirement: Integration consumes architecture-free Final without restoring retired prerequisites

Integration SHALL 在 preparation、执行重验和 terminal 一致消费经有效 confirmationRef 确认的新最小 Final record 与实际 Git 来源，不要求 Architecture outcome、图文件、requiredEvidence、finalizedCandidateRef、Full Test 日志或旧全包。singleton Git authority、明确操作与真实对象/接受关系 SHALL 保持。新 contract SHALL NOT 给旧结果丢字段重签或补确认；历史 bytes 原样保留。

#### Scenario: Accept a new Final with no architecture inputs
- **WHEN** 新 Final 来源和已授权 Git 操作事实有效，未提供架构或 evidence 快照
- **THEN** Integration SHALL 可完成既有 acceptance 并读回 accepted-main

#### Scenario: Reject obsolete Final as new execution input
- **WHEN** caller 提供旧 Full Final package/架构字段/projection 作为新输入
- **THEN** Integration SHALL 拒绝，不做 dummy 字段兼容或历史迁移

#### Scenario: Removal of architecture does not waive Git or evidence checks
- **WHEN** 本次 Git authority/prestate/对象或接受来源不符
- **THEN** Integration SHALL 拒绝并 STOP，不因 Final 已完成而放行

### Requirement: Git workflow nodes use an explicit supported host without owning Action lifecycle

系统 SHALL 在发行 `flowkit` 中提供固定 `git checkpoint`、`git push`、`git integrate` 命令，复用既有受控 Git host 能力。Agent/宿主 SHALL 在调用前依据真实 Owner 指令确定 exact target、操作、branch、remote/ref、提交路径或复用对象及 `sourceRef`；CLI 不读取聊天，也不以请求 JSON 的存在、Review/PASS/Final、dirty 集合或自签 hash 推断授权。固定命令 SHALL 按操作校验 Agent 提交的 Owner authority 与 Git request 完全一致，在 Git 写前重验当前 Policy/Final、index、对象和目标等既有前置，并保留现有精确范围与部分效果规则。CLI 对 Owner 来源的结构/一致性校验 SHALL NOT 被描述为独立认证聊天；执行者对真实 Owner 输入的 attestation 仍是宿主责任。普通 Start 后 commit、Change checkpoint 和 push SHALL 不要求 Final、Integration package 或 PR/merge；仅 Delivery Integration 消费已确认 Final。

Change checkpoint SHALL 使用现有 `authorize-checkpoint`、exact Change、`scope=["checkpoint"]` 与 Policy evaluator；普通 Start checkpoint SHALL 使用同 decision/scope、exact Delivery、无 changeId 且绑定本次完整 Git operation；push SHALL 使用 `authorize-push`、`scope=["push"]` 与 exact Delivery/可选 Change、commit 和 remote/ref；Integration SHALL 使用现有 `authorize-repository-integration` singleton 与 exact checkpointOperation。一个命令的 fact SHALL NOT 自动授权另一命令，同一 Owner 消息即使明确授权多个 Git 步骤也必须分别绑定并执行。CLI SHALL 对 operation 中的完整路径、commit message/shape 或复用 SHA 做 exact 对照，而不只检查 fact 的外形。

`status`/`next` 与 checkpoint authorization evaluator SHALL 保持只读，Policy 只计算边界；只有独立调用的 exact `git` 写命令可执行相应 Git 操作。该命令 SHALL NOT 创建新 Standard Action、Git Run、Owner decision 或自动执行循环。PR/merge SHALL 使用既有工具或人工交接，不要求全 provider 原生实现。

#### Scenario: Ordinary checkpoint and push do not require Final
- **WHEN** 普通 Git 节点的现有合法边界、Agent 已观察的明确 Owner 权限、target 与操作范围成立
- **THEN** 固定命令 SHALL 可只完成请求的 commit 或 push，不读取 Final/Full Test/Archify，不自动接着 PR/merge

#### Scenario: No authority means no Git write
- **WHEN** Agent 未提交本次真实 Owner 决定，或 authority/操作/target/sourceRef/当前前置不符
- **THEN** 固定命令 SHALL 在 Git 写入前停止；CLI 不从结构外形、Review/PASS 或聊天关键字补造权限

#### Scenario: Manager and target are separate
- **WHEN** Agent 使用安装根自有固定命令访问无 Flowkit scripts/Skills 的 target
- **THEN** 实际 Git cwd/读写 SHALL 属于 target，资产来自 manager，不复制或回退到 target 同名模块

#### Scenario: Chat source is outside CLI visibility
- **WHEN** Agent 基于真实 Owner 指令提交匹配的 `sourceRef` 与 operation，但 CLI 本身没有聊天读取能力
- **THEN** CLI SHALL 按本次宿主 attestation 与现有 Git 前置处理，不建立 Codex 桌面监听器，也不声称独立证明消息真实性

### Requirement: Commit scope is checked against the real index without a global clean gate

host SHALL 在暂存前和 commit 前按 Git 原生路径读取整个 index，对照本次授权 exact 文件集合；范围外 staged、未合并条目或相关目标冲突 SHALL 在 commit 前报告并 STOP，不擅自 unstage/reset/覆盖。限定 add 的参数不能代替完整 index 核对。rename/delete SHALL 覆盖实际涉及路径，不把目录/glob/路径穿越当作未经限定的授权。

此处范围 SHALL 指 index 相对本次 HEAD 的全部待提交差异，unborn HEAD 使用空树；SHALL NOT 将所有未变的已跟踪文件要求纳入授权列表。每笔 Git 写入前 SHALL 重验本次权限与相关目标，不因最初通过检查就忽略后来观察到的变化。

无关未暂存或未跟踪文件 SHALL 保留原 bytes，不单独阻断；push/reuse 不涉及 index 内容时 SHALL 不因无关 staged 失败。commit 后 SHALL 核对实际提交路径与本次范围，发现 callback 越界则报告已有效果而非成功或自动回滚。空白诊断与材料保留 SHALL 独立于 Git 权限、Full Test 选择和源码 PASS，不改历史 bytes 来消除诊断。

#### Scenario: Existing unrelated staged file cannot be included
- **WHEN** Owner 只授权 A，index 已含 B
- **THEN** host SHALL 指出 B 并在暂存/commit 前停止，A/B/index 均不因自动清空或扩大范围而改变

#### Scenario: Unrelated dirty work survives scoped commit
- **WHEN** index/目标符合范围且无真实冲突，仅有无关未暂存/未跟踪文件
- **THEN** host SHALL 完成本次限定提交并保持无关内容，不要求全仓 clean

#### Scenario: Scope drift before commit is observed
- **WHEN** 暂存后 commit 前 index 出现范围外条目或相关目标漂移
- **THEN** host SHALL 不 commit，明确已经发生的暂存效果并 STOP，不自动恢复 index

#### Scenario: Reuse or push leaves unrelated index alone
- **WHEN** 已授权操作仅复用或推送一个已核验对象
- **THEN** host SHALL 不清空无关 staged、不要求提交无关内容，仍核对该对象、分支和本次目标

### Requirement: Git partial effects are reported without automatic recovery

host SHALL 将本次已确认效果、失败/待人工步骤、尚不可确认部分分别交接。写命令失败、响应丢失或接受尚未完成时 SHALL 做有界只读确认后 STOP，不从错误推断未写入，不从可读 local commit 推断远端完成。无法确认 SHALL 如实保留未知，不伪报 terminal。

后续调用 SHALL 重新核对既有对象、实际状态及 Owner 的具体操作；复用已完成 checkpoint 不要求重复提交。结果 SHALL 不自动回写为需要再次 commit 的 repository 资格文件，不创建结果库或新 Run schema。真实必要材料按目标项目边界保存，日志不替代 Git owner。

#### Scenario: Commit succeeded but its response was lost
- **WHEN** Git 已产生 commit，宿主随后抛错或无法确认回执
- **THEN** outcome SHALL 记录可读的新 HEAD 和失败步骤，无可读事实则标记未知；不再次 commit、不自动执行 push

#### Scenario: Publication failure does not erase checkpoint
- **WHEN** 本地 commit 已确认，但 push/PR/merge 失败或待人工处理
- **THEN** outcome SHALL 保留 checkpoint 引用和未完成步骤，不撤销 Final、不重开 Change、不盲重试

#### Scenario: Readback cannot establish the result
- **WHEN** 写入后 Git 或远端查询不可用
- **THEN** host SHALL 报告效果不可确认并 STOP，不自动执行恢复命令或用旧成功结果补齐

### Requirement: Create-new checkpoint preserves new managed evidence bytes

在已有 Owner 授权、scope 与完整 index 检查成立后，create-new checkpoint 宿主 SHALL 在提交前对本次新增的 managed Run/proof exact 路径核对 index blob 与当前原始文件 bytes 一致。新增 Run 三文件 SHALL 以本次真实 create-once 文件为原始来源核对 index。新增 managed proof SHALL 有所属 Run Result 中唯一且身份匹配的 `proofRef`，其 path、bytes、SHA-256 SHALL 与 index 和当前文件一致；缺失、重复、无法对应或不一致时 SHALL 停止提交，报告 exact 路径和实际已发生的暂存效果，不自动清空或改写 index。不得以当前文件与 index 一致替代已声明 proof 的记录身份。

对 `terminal` owner，宿主 SHALL 保留已有准入和原始字节行为。对 `prepared` owner，只有所属 Run 的三文件完整、context/result 身份一致、author/reviewer/verification/next 四个结果槽均为 null，并且该 owner 在本次 checkpoint 候选 Git 树的完整 canonical Run 链中有唯一合法直接后继且不是 tip，宿主才 SHALL 接纳其新增 proof。该链 SHALL 按既有 Run 链和 Policy 规则验证唯一根、同目标、唯一 identity/sequence、完整记录、无 fork/断链及合法 successor edge；Owner correction SHALL 有匹配的已保存 authority，同 Action continuation SHALL 满足既有 Policy。证明此链所需的 Run 文件与 proof owner Result SHALL 来自提交前 HEAD 加待提交 index 构成的候选树；只存在于未提交工作区的后继或与候选树冲突的文件 SHALL NOT 提供准入。partial Run、当前 prepared tip、伪 verdict、非法 edge 或不可验证链 SHALL 拒绝。

此检查 SHALL 只消费本次新增 proof 明确需要的所属 Change Run 链，不追溯扫描无关历史证据；不得给 push、复用或其他 Git 节点增加 index 写入，不创建 Git、Owner 或 Reviewer authority，也不补写或改写历史 Run/Proof。

#### Scenario: New evidence is staged without transformation
- **WHEN** Owner 已授权 create-new checkpoint，新增 terminal Run 的 index blob 与 create-once 文件一致，新增 proof 的 index/当前文件与 Result 中唯一 `proofRef` 的身份、path、bytes、SHA-256 一致
- **THEN** 宿主 SHALL 可继续既有 scope、空白诊断与 commit 核验流程

#### Scenario: Prepared proof with Owner correction is in a closed candidate chain
- **WHEN** 完整 prepared Author Run 的新增 proof 满足唯一声明及原始字节检查，且候选树中的完整 canonical 链以合法 Owner-linked revise Run 为其唯一直接后继
- **THEN** 宿主 SHALL 允许该 proof 继续既有 checkpoint 流程，不修改 prepared Run 的原始状态或证据

#### Scenario: Prepared proof with same-Action continuation is in a closed candidate chain
- **WHEN** 完整 prepared Author Run 的新增 proof 满足唯一声明及原始字节检查，且候选树中的完整 canonical 链以合法同 Action 新 occurrence 为其唯一直接后继
- **THEN** 宿主 SHALL 允许该 proof 继续既有 checkpoint 流程，不把前驱伪装成 terminal

#### Scenario: Prepared successor exists only in worktree
- **WHEN** proof owner 是 prepared，合法后继只在未提交工作区存在，而 HEAD 与待提交 index 组成的候选树中没有其完整 Run
- **THEN** 宿主 SHALL 在 commit 前拒绝该 proof，保留本次已发生的 stage 并报告原因

#### Scenario: Candidate chain is incomplete or invalid
- **WHEN** prepared owner 是当前 tip，或候选树包含 partial Run、缺文件、断链、fork、重复 identity/sequence、非法 successor edge、错误 Owner correction、伪 verdict 或互相冲突的 Run bytes
- **THEN** 宿主 SHALL 在 commit 前拒绝本次新增 prepared proof，不用工作区或未来可能的 continuation 补足链

#### Scenario: Attributes drift before commit
- **WHEN** 本次新 Run/proof 的 index blob 因 Git clean 转换或属性漂移而不同于原始字节
- **THEN** 宿主 SHALL 在 commit 前停止并报告差异及已发生的 stage，保留 index 而不自行修复或继续 push

#### Scenario: Proof changes after Result admission
- **WHEN** 已声明 proof 在 Result 接纳后被改动且暂存，index blob 与当前文件一致但与唯一 `proofRef` 的身份、SHA-256 或 bytes 不一致
- **THEN** 宿主 SHALL 在 commit 前停止，报告 exact proof 路径与记录身份不匹配，保留 index

#### Scenario: Missing or ambiguous declaration
- **WHEN** 新增 proof 在所属 Result 中缺少唯一匹配声明、存在重复声明或指向其他 Run/Change
- **THEN** 宿主 SHALL 在 commit 前拒绝，不能以路径存在或摘要碰巧相同替代所属 Result 的声明

#### Scenario: Existing history is outside the forward-only check
- **WHEN** 本次 checkpoint 不含新产生的 managed Run/proof，或仅执行复用/push
- **THEN** SHALL 不遍历旧 Run/proof 作追溯迁移或无关 index 检查

### Requirement: Fixed Git commands preserve exact object and remote readback

`git checkpoint` SHALL 复用完整 index、授权 exact paths、managed evidence 原始 bytes、commit shape/message 与实际 Git 对象核验；`git push` SHALL 仅推送已确认的 exact local commit 到指定 remote/ref 并读回远端 exact ref；`git integrate` SHALL 先消费有效 Final confirmation 与既有 Integration singleton/checkout/object 前置，按已授权 create-new/reuse-existing 操作执行并确认真实接受。三个命令 SHALL 分别调用和 STOP，不从本地 commit 推断 push/merge，也不在部分成功后自动重试、reset、清空 index、回滚或补写 SHA。

#### Scenario: Scoped checkpoint contains unrelated staged file
- **WHEN** Owner 只授权 exact paths A，完整 index 还包含范围外 B
- **THEN** `git checkpoint` SHALL 在 commit 前报告 B 和任何已发生的暂存效果，不扩大提交或清空 index

#### Scenario: Local commit is confirmed but remote push fails
- **WHEN** checkpoint commit 已由 Git 读回，而 `git push` 未获远端 exact ref 接受
- **THEN** 两个命令的结果 SHALL 分别保留本地 commit 与未确认远端状态，不声称已发布或自动重试

#### Scenario: Integration lacks confirmed Final
- **WHEN** manifest completed 但有效 Final confirmationRef 缺失或不匹配
- **THEN** `git integrate` SHALL 在 Git 写入前拒绝，不从 completed 字段或 caller 摘要补造 Final

### Requirement: Managed checkpoint resolves proof paths against the exact semantic Run owner

对本次新增的 managed Proof，create-new checkpoint 写前检查 SHALL 从唯一 canonical Run 分组、exact `runId` 和 Result 的语义 `changeId` 解析归属；SHALL 接受与该 Run 对应的编号 Proof 目录及已被历史 Run 使用的语义 Proof 目录，且保留既有候选 Git 树、index 原始 bytes、唯一 `proofRef`、bytes/SHA 与 prepared/terminal 链检查。同一 Run 的两种 Proof 目录并存、路径中的编号与 Run 分组不符或 Result 的语义身份不符时 SHALL 拒绝，不从目录名推断新的语义 ChangeId。该检查只针对本次新增 managed evidence，不扩展为历史全仓扫描，不产生 Git 授权。

#### Scenario: Numbered proof has a matching Result reference

- **WHEN** 新增 Proof 位于 `changes/001-<change-id>/proof/<run-id>/`，唯一 Run 分组为 `001-<change-id>`，Result 以语义 `<change-id>` 声明该 exact 路径和匹配 bytes/SHA
- **THEN** checkpoint SHALL 在其余授权、候选链、index 与字节检查通过时允许继续，不因编号目录段误判无所属 Run

#### Scenario: Historical semantic proof is committed

- **WHEN** 新增的旧 Run Proof 位于 `changes/<change-id>/proof/<run-id>/`，唯一 Run 与 Result 归属相同，且同 Run 没有编号 Proof 目录
- **THEN** checkpoint SHALL 保持既有准入检查，不要求改写历史路径或 Result

#### Scenario: Ambiguous or falsely named proof cannot be committed

- **WHEN** 同一 Run 两种 Proof 目录均存在，或路径的编号段不等于真实 Run 分组，或 Result 语义 `changeId` 不匹配
- **THEN** checkpoint SHALL 在 commit 前拒绝并保留 index，不自行移动 Proof、改写 Run 或扩大授权范围
