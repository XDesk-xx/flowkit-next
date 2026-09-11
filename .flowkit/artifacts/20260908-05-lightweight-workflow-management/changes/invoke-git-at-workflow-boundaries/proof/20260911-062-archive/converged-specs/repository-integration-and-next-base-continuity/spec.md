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

系统 SHALL 提供可实际执行并验收的最小 Node 宿主参考入口，供已有 Agent 在独立 Owner 授权下使用 Git/远端工具。入口 SHALL 明确 target repository、具体操作、branch、适用的 remote/ref、提交路径或复用对象及权限来源；不得从 dirty 集合、Review/PASS/Final 或 caller 自签声明推断权限。普通 Start 后 commit、Change checkpoint 和 push SHALL 不要求 Final、Integration package 或 PR/merge；仅 Delivery Integration 消费已确认 Final。

已有 CLI 与 checkpoint evaluator SHALL 保持只读，既有 Policy 只计算边界；宿主不创建新 Standard Action、Git Run、Owner decision 或自动执行循环。PR/merge SHALL 使用既有工具或人工交接，不要求全 provider 原生实现。

#### Scenario: Ordinary checkpoint and push do not require Final
- **WHEN** 普通 Git 节点的现有合法边界、明确权限、target 与操作范围成立
- **THEN** 宿主 SHALL 可只完成请求的 commit 或 push，不读取 Final/Full Test/Archify，不自动接着 PR/merge

#### Scenario: No authority means no Git write
- **WHEN** 权限缺失、操作/target 不符或可信授权来源不可取得
- **THEN** 宿主 SHALL 在 Git 写入前停止；仅有授权外形或自签 hash 不放行

#### Scenario: Manager and target are separate
- **WHEN** Agent 使用安装根自有宿主模块访问无 Flowkit scripts/Skills 的 target
- **THEN** 实际 Git cwd/读写 SHALL 属于 target，资产来自 manager，不复制或回退到 target 同名模块

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
