# repository-integration-and-next-base-continuity Specification

## Purpose
为 already-finalized exact Delivery 提供 bounded repository integration 与 next-base continuity：在 exact Owner Git authority 下形成 one ordinary Delivery Final commit，通过 repository 自身的 review/merge mechanics 被接受后，从 Git 重新读取 accepted main 并将其作为 next base，然后 STOP；不建立 Git provider、promotion lifecycle 或 automatic next-Delivery authority。

## Requirements

### Requirement: Repository Integration consumes exact Delivery Final continuity and exact Git prestate

Integration SHALL 从可信 Final terminal、当前 v2 candidate、completed coordination、必要证据与普通 Git observation 准备 package，绑定 Final ref、finalizedCandidateRef、preIntegrationHead、Delivery branch、targetMainRef、targetMainPreIntegrationCommit、exact acceptedBaseCommit/provenance 与明确的 checkpointOperation。可信 preparation SHALL 重算 Final closure，验证当前候选、coordination 与证据；caller boolean、独立 digest、Run prose、transport HEAD 或 provider 摘要 SHALL 不能代替这些事实。

exact accepted-base provenance SHALL 由既有接受事实与 Git 对象核验，而非把 ancestor 关系当作所有内容连续性的通用要求。targetMainPreIntegrationCommit SHALL 只表示操作前 target；acceptedMainCommit SHALL 不预声明。所有相关 commit SHALL 属于已支持 SHA-1 格式。

#### Scenario: Prepare from exact finalized and Git prestate

- **WHEN** Final、v2 candidate、completed coordination、必要证据、HEAD/branch、accepted base 来源、target prestate 和具体操作全部匹配
- **THEN** Integration SHALL 形成精确 package，冻结本次事实，不预言 acceptedMainCommit

#### Scenario: Reject stale finalized or Git prestate

- **WHEN** 原 package 的 HEAD/branch/target/base/操作发生变化，或来源与证据不符
- **THEN** host SHALL 拒绝，不用产品相同来静默重绑定或自动 rebase

#### Scenario: Accepted main is not predeclared

- **WHEN** 当前仍在 preparation/pre-acceptance 阶段
- **THEN** package SHALL 不包含或信任 expected acceptedMainCommit，targetMainPreIntegrationCommit SHALL 只表示操作前观察

### Requirement: Repository Integration requires one exact singleton Owner Git authority

Integration SHALL 保持 structural-valid authority：decision=authorize-repository-integration、exact Delivery、absent changeId、scope exactly ["delivery-repository-integration"]。该 authority SHALL 与 Owner 本次明确决定的 checkpointOperation、目标及 Git/Final prestate 一起绑定重验；相同 scope 外形 SHALL 不授权任意选择新建、复用、squash、rebase 或 merge。Review/Verification/Final/checkpoint status、较宽 scope SHALL 不能继承或组合成此权限。

#### Scenario: Accept exact repository-integration authority

- **WHEN** singleton authority 与独立 Owner 操作、Delivery、target 及 exact prestate 一致
- **THEN** host SHALL 将权限与该具体操作冻结到 package，不赋予后续自动 Git 权限

#### Scenario: Reject broader inherited or stale authority

- **WHEN** 权限缺失/不符、含 Change/额外 scope、操作未经明确决定或原 prestate 漂移
- **THEN** execution SHALL 拒绝，要求新的可信 preparation/authority 核对

### Requirement: Repository review and merge remain provider-external while terminal Git truth is independently observed

Repository-specific publication/review/merge SHALL 仍由已有外部有界 mechanics 承担；callback success、PR id、返回 SHA 或自签摘要 SHALL 不成为 acceptance truth。Terminal SHALL 重新从 canonical targetMainRef 读取 exact acceptedMainCommit，验证其来自 Owner 明确授权的具体 acceptance 关系与原 target prestate，再从该对象派生共享 v2 产品 projection，要求等于 finalizedCandidateRef。

系统 SHALL 同时验证 Final 绑定的必要证据仍可取回、完整且来源正确：仓库内 Run SHALL 从 accepted object 的受控地址读取，不仅检查本地旧 worktree；仓库外 evidence SHALL 从已验证的 owner 来源读取。完整 tree equality 与 finalCommit 必须包含于全部 accepted 历史的通用规则 SHALL 被上述内容/来源验收替代；具体 Git 操作有明确 topology 要求时仍 SHALL 单独核验。不同历史形状只有在 Owner 明确授权且 acceptance 来源可证明时才可接受。

#### Scenario: Accept repository-accepted main from Git observation

- **WHEN** Git 实读 target commit、具体 acceptance 关系、必要证据均有效，且 v2 projection 与 finalizedCandidateRef 相等
- **THEN** terminal SHALL 使用该真实 SHA，无需完整 tree 相等或额外通用 ancestry 限制

#### Scenario: Ignore callback-reported accepted-main SHA as truth

- **WHEN** callback 声称成功但 target 实读不符、acceptance 来源未知、操作关系不符或产品 projection 不同
- **THEN** 系统 SHALL 拒绝，不自动 rebase、冲突修正或复用旧验证

#### Scenario: Stop on target-main drift instead of automatic rebase

- **WHEN** target 在 preparation 后发生无法由 Owner 明确操作与原 prestate 解释的变化
- **THEN** 系统 SHALL STOP 并要求 Owner 控制的重新准备，不自动 rebase/冲突修正或假定旧验证仍覆盖

#### Scenario: 产品一致但必要执行证据丢失

- **WHEN** accepted object 的产品 projection 相同，但所需 Run 缺失/损坏、绑定错项目或外部必要来源不可取回
- **THEN** 整体 acceptance SHALL 拒绝，即使本地旧 worktree 中还有完整 Run

#### Scenario: 无关历史可追加

- **WHEN** accepted object 仅增加无关 Run 历史，必需证据及产品内容仍有效
- **THEN** 系统 SHALL 不因完整 tree 不同而拒绝

### Requirement: Accepted main becomes next Delivery base and terminal execution stops

成功 terminal SHALL 绑定 Final ref、finalizedCandidateRef、原 preIntegrationHead、checkpointOperation、Git 实读 finalCommit、targetMainRef、target prestate、acceptedMainCommit 与 nextDeliveryBase；requiredEvidence SHALL 通过已重验的 Final ref 精确绑定，不能 caller 替换。nextDeliveryBase SHALL 等于 acceptedMainCommit。Integration ref SHALL 保持 `repository-integration:sha256:<64 lowercase hex>`，摘要输入为 UTF-8 `flowkit-repository-integration`、一个 `0x00`、无 BOM/newline 的 JSON projection，字段顺序精确为 deliveryId、deliveryFinalizationRef、finalizedCandidateRef、preIntegrationHead、checkpointOperation、finalCommit、targetMainRef、targetMainPreIntegrationCommit、acceptedMainCommit。checkpointOperation SHALL 按 kind、适用时 checkpointCommit 的顺序重建；record 的对应操作 SHALL 与 package 相等。derive/admission SHALL 同步更新并以 golden vectors 验证，旧缺字段 record 不升级。

外部 review metadata SHALL 仅作审计，不独立构成权限。目标 next-base locator SHALL 不取代运行 Flowkit 的 Stable manager exact checkpoint 身份。Terminal SHALL STOP，不 tag/release、activate next Delivery、create D05 或自动选择下一操作。

#### Scenario: Return exact accepted-main next-base continuity

- **WHEN** 具体 Git 操作、内容与必要证据验收全部通过
- **THEN** terminal SHALL 记录真实 acceptedMainCommit、相等的 nextDeliveryBase 与绑定操作，然后 STOP

#### Scenario: Terminal success does not activate release or next Delivery

- **WHEN** Integration 返回 success
- **THEN** 系统 SHALL 不产生新 Owner authority、release 或下一 Delivery，不更换当前 Stable manager

### Requirement: Repository Integration preserves state-first continuity without transport lifecycle modes
Repository Integration preparation/execution SHALL 只要求exact finalized state、required Git history与required environment可验证。若这些exact state已经可用 SHALL 直接verify/reuse；若缺失 SHALL STOP preparation并允许在lifecycle外恢复最小缺失state，再通过同一operation重新prepare。Core SHALL NOT引入local/detached/shared/bundle/ZIP execution mode，也 SHALL NOT要求mandatory source snapshot、Git bundle或dependency archive。

#### Scenario: Reuse shared exact state
- **WHEN** exact finalized working tree、Git history与required environment已经存在且identity验证通过
- **THEN** Repository Integration SHALL 直接使用同一operation contract继续，而 SHALL NOT人工创建transport handoff

#### Scenario: Restore missing state without changing lifecycle semantics
- **WHEN** exact required repository/history/environment state缺失
- **THEN** preparation SHALL STOP直到最小exact state被外部恢复并重新验证，随后 SHALL 使用同一`delivery-repository-integration` operation，而 SHALL NOT切换到新的transport/execution lifecycle type

### Requirement: Integration 按明确操作创建或复用 checkpoint

checkpointOperation SHALL 仅为 `{kind:"create-new"}` 或 `{kind:"reuse-existing",checkpointCommit:<exact SHA-1>}`，由可信 host 从明确 Owner 输入绑定，而非 caller 自行选择。create-new SHALL 从 bound preIntegrationHead 和 finalized working tree 形成恰好一个普通 commit，并从 Git 重读验证唯一 parent、commit count=1、v2 内容和 clean poststate；零个、多于一个、错误 parent、产品改变 SHALL 拒绝。

reuse-existing SHALL 验证 checkpoint 的已授权来源、exact object、v2 finalized 内容、当前 clean poststate 及 package prestate；SHALL 不调用新建 commit callback、不要求 checkpoint != preIntegrationHead、不强制额外 commit。两种路径 SHALL 在执行 repository acceptance 前再核对 target prestate，保持各自具体操作权限。任何 mutation 后的失败 SHALL 不伪称没有实际效果，也不自动重试或回滚。

#### Scenario: 明确新建一个普通 commit

- **WHEN** create-new 的 package/权限有效且 Git 实际产生唯一正确 parent 的 commit
- **THEN** host SHALL 核验内容和 clean poststate 后才能进入 acceptance

#### Scenario: 新建路径拒绝错误提交形状

- **WHEN** create-new 产生零个、多个、错误 parent 或产品改变的 commit
- **THEN** 系统 SHALL 拒绝，不继续 terminal acceptance

#### Scenario: 已授权 checkpoint 直接复用

- **WHEN** reuse-existing 的 exact checkpoint 来源有效且内容/prestate/clean 检查通过
- **THEN** host SHALL 复用该 SHA，不再制造一个 commit

#### Scenario: commit 成功但 acceptance 失败

- **WHEN** actual commit 已形成，后续 acceptance 失败
- **THEN** 当前 invocation SHALL 失败并 STOP；新的合法 invocation 只有经重新授权核对及 exact checkpoint/prestate 验证后才可复用，不自动补交第二个 commit
