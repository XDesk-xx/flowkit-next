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

publication/review/merge SHALL 由既有外部有界 mechanics 承担。callback success、PR id、返回 SHA 或自签摘要 SHALL 不作为 acceptance truth。Terminal SHALL 从 canonical targetMainRef 实读 acceptedMainCommit，并由既有可信 source 与 Git 对象核验本次 exact finalCommit、Owner 明确操作、原 target prestate 和实际接受关系；不能仅凭相同内容或任意 target SHA 放行。

系统 SHALL NOT 从 Final 取得 v2 产品 projection 作 equality 门槛，不遍历 accepted object 的历史 Runs 或读取 Full Test 日志来重新验收 Delivery。实际授权操作涉及哪些对象与关系仍 SHALL 核对；不能证明接受来源则 STOP，不自动选择别的 merge/rebase 关系。Git 失败 SHALL 不撤销已发生 Final。

#### Scenario: Accept repository-accepted main from Git observation
- **WHEN** Git 实读目标对象与本次 finalCommit 的已授权接受关系、来源有效
- **THEN** terminal SHALL 使用真实 SHA，不要求 Final 全仓 projection 或历史 evidence

#### Scenario: Ignore callback-reported accepted-main SHA as truth
- **WHEN** callback 成功但实读 target 不符或接受关系/来源不能确认
- **THEN** 系统 SHALL 拒绝并 STOP，不自动重试或伪报接受

#### Scenario: Stop on target-main drift instead of automatic rebase
- **WHEN** target 变化不能由本次操作及原 prestate 解释
- **THEN** 系统 SHALL STOP，交 Owner 核对，不自动 rebase/冲突修正

#### Scenario: 产品一致但必要执行证据丢失
- **WHEN** 产品相同但本次 Git 操作/接受关系的必要来源不可确认
- **THEN** Integration SHALL 拒绝；历史 proof 不在本次 Git 消费集合时 SHALL NOT 自动升级为 blocker

#### Scenario: 无关历史可追加
- **WHEN** Git 操作与来源有效，仅追加无关 Run 或非产品文档
- **THEN** 系统 SHALL 不因 Final 摘要或历史材料变化要求重开 Change/Full Test

### Requirement: Accepted main becomes next Delivery base and terminal execution stops

成功 terminal SHALL 绑定 deliveryFinalizationRef、preIntegrationHead、checkpointOperation、Git 实读 finalCommit、targetMainRef、targetMainPreIntegrationCommit、acceptedMainCommit 与相等的 nextDeliveryBase。SHALL NOT 包含 finalizedCandidateRef 或 requiredEvidence。

Integration ref SHALL 保持 repository-integration:sha256:<64 lowercase hex>，输入为 UTF-8 flowkit-repository-integration、0x00、无 BOM/newline 的固定 JSON；顺序 SHALL 为 deliveryId、deliveryFinalizationRef、preIntegrationHead、checkpointOperation、finalCommit、targetMainRef、targetMainPreIntegrationCommit、acceptedMainCommit。checkpointOperation 按 kind、适用时 checkpointCommit 排序。derive/validator SHALL 同步并用 golden vectors 验证；旧字段不静默删除重签。

外部 review metadata SHALL 仅作审计；nextDeliveryBase 是 Git 定位事实，不作为下一 Start 或 manager 安装身份门槛。Terminal SHALL STOP，不 tag/release/激活下一 Delivery/更换 manager。

#### Scenario: Return exact accepted-main next-base continuity
- **WHEN** 本次 Git 操作与实际接受关系已核验
- **THEN** terminal SHALL 记录真实 acceptedMainCommit 和相等 nextDeliveryBase 并 STOP

#### Scenario: Terminal success does not activate release or next Delivery
- **WHEN** Integration 成功
- **THEN** 系统 SHALL 不产生新 Owner authority 或自动下一操作

### Requirement: Repository Integration preserves state-first continuity without transport lifecycle modes
Repository Integration preparation/execution SHALL 只要求exact finalized state、required Git history与required environment可验证。若这些exact state已经可用 SHALL 直接verify/reuse；若缺失 SHALL STOP preparation并允许在lifecycle外恢复最小缺失state，再通过同一operation重新prepare。Core SHALL NOT引入local/detached/shared/bundle/ZIP execution mode，也 SHALL NOT要求mandatory source snapshot、Git bundle或dependency archive。

#### Scenario: Reuse shared exact state
- **WHEN** exact finalized working tree、Git history与required environment已经存在且identity验证通过
- **THEN** Repository Integration SHALL 直接使用同一operation contract继续，而 SHALL NOT人工创建transport handoff

#### Scenario: Restore missing state without changing lifecycle semantics
- **WHEN** exact required repository/history/environment state缺失
- **THEN** preparation SHALL STOP直到最小exact state被外部恢复并重新验证，随后 SHALL 使用同一`delivery-repository-integration` operation，而 SHALL NOT切换到新的transport/execution lifecycle type

### Requirement: Integration 按明确操作创建或复用 checkpoint

checkpointOperation SHALL 保持 create-new 或包含 exact SHA-1 checkpointCommit 的 reuse-existing，由可信 host 按 Owner 明确输入绑定。create-new SHALL 从 bound preIntegrationHead 产生恰好一个普通 commit，并实读验证 parent、count=1 和 clean poststate；reuse-existing SHALL 验证已授权来源、exact object、clean 与本次 prestate，不调用新建 callback，不强制额外 commit。

删除与 Final v2 projection 相等的条件；本次实际 commit、Owner 操作与接受来源核验 SHALL 保持，不能把任意同内容对象当授权对象。两路径在 acceptance 前 SHALL 重验 target prestate。mutation 后失败 SHALL 明示已有实际效果，不盲目重试、回滚或撤销 Final。本 Change SHALL 不扩展 Git 操作种类。

#### Scenario: 明确新建一个普通 commit
- **WHEN** create-new 权限有效且实读唯一正确 parent 的 commit
- **THEN** host SHALL 验证对象、操作来源与 clean 后进入 acceptance

#### Scenario: 新建路径拒绝错误提交形状
- **WHEN** create-new 产生零个、多个或错误 parent 的 commit
- **THEN** 系统 SHALL 拒绝，不继续 terminal acceptance

#### Scenario: 已授权 checkpoint 直接复用
- **WHEN** reuse-existing 对象、来源、prestate 与 clean 有效
- **THEN** host SHALL 复用该 SHA，不制造额外 commit

#### Scenario: commit 成功但 acceptance 失败
- **WHEN** commit 已形成但接受失败
- **THEN** 系统 SHALL 报告实际 commit 并 STOP，重新调用须按权限/对象重核，不自动补交

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
