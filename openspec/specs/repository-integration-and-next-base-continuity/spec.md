# repository-integration-and-next-base-continuity Specification

## Purpose
为 already-finalized exact Delivery 提供 bounded repository integration 与 next-base continuity：在 exact Owner Git authority 下形成 one ordinary Delivery Final commit，通过 repository 自身的 review/merge mechanics 被接受后，从 Git 重新读取 accepted main 并将其作为 next base，然后 STOP；不建立 Git provider、promotion lifecycle 或 automatic next-Delivery authority。

## Requirements

### Requirement: Repository Integration consumes exact Delivery Final continuity and exact Git prestate
`delivery-repository-integration` SHALL 从 trusted terminal `DeliveryFinalizationRecord`、current repository candidate、canonical completed Delivery coordination与 ordinary Git observation准备 exact operation facts。Package facts SHALL 至少绑定matching `deliveryFinalizationRef`、`finalizedCandidateRef`、`preIntegrationHead`、exact Delivery branch、`targetMainRef`、`targetMainPreIntegrationCommit` 与 accepted base/history continuity。Trusted preparation SHALL re-derive Delivery Final closure并要求 current candidate等于`finalizedCandidateRef`；caller-provided boolean、standalone digest、Run prose、transport HEAD或arbitrary Git summary SHALL NOT替代这些owners。

`targetMainPreIntegrationCommit` SHALL 只表示Git mutation/repository review之前读取的exact target-main commit。`acceptedMainCommit` SHALL NOT作为expected/predeclared package input；它只能在repository acceptance之后由trusted Git observation产生。

#### Scenario: Prepare from exact finalized and Git prestate
- **WHEN** exact Delivery Final record、current finalized candidate、completed Delivery coordination、current branch/HEAD、accepted base与target main prestate全部一致
- **THEN** Repository Integration SHALL 允许形成exact `delivery-repository-integration` package facts，并 SHALL 精确保留`targetMainPreIntegrationCommit`作为prestate

#### Scenario: Reject stale finalized or Git prestate
- **WHEN** Delivery Final ref/candidate/coordination不一致，current HEAD/branch或target main prestate发生drift，或caller用Run/transport/provider summary替代trusted facts
- **THEN** preparation SHALL fail closed，并 SHALL NOT形成可执行package或自动rebase/correct

#### Scenario: Accepted main is not predeclared
- **WHEN** package仍处于pre-integration/pre-merge阶段
- **THEN** package SHALL NOT包含或信任一个expected `acceptedMainCommit`终态SHA，且 SHALL NOT将`targetMainPreIntegrationCommit`解释为terminal accepted main

### Requirement: Repository Integration requires one exact singleton Owner Git authority
Repository Integration SHALL 只接受structural-valid `OwnerAuthorityFact`精确满足`decision=authorize-repository-integration`、exact current Delivery、`changeId` absent与scope exactly `["delivery-repository-integration"]`。Reviewer PASS、Verification PASS、Delivery Final authority、checkpoint state、broader Git scope或其他operation authority SHALL NOT被继承、组合或解释为repository-integration authority。Authority admission SHALL 与exact package-bound finalized/pre-integration/target-main facts一起重验；这些facts drift后旧authority SHALL NOT silent rebind。

#### Scenario: Accept exact repository-integration authority
- **WHEN** Owner authority decision、Delivery、absent Change、singleton scope与exact package-bound Git/finalized facts全部匹配
- **THEN** system SHALL 将该authority绑定进`delivery-repository-integration` package

#### Scenario: Reject broader inherited or stale authority
- **WHEN** authority缺失、decision/Delivery不匹配、包含`changeId`、scope包含其他Git/final/release权限，或package-bound prestate在authority admission后发生变化
- **THEN** execution SHALL fail closed并要求fresh trusted preparation/authority evaluation，而 SHALL NOT继续mutation或自动修正

### Requirement: Repository Integration creates exactly one ordinary Delivery Final commit
Trusted repository-integration host SHALL 从bound `preIntegrationHead`与exact finalized working-tree state创建exactly one ordinary Delivery Final commit。成功commit后 SHALL 从Git重读`finalCommit`并证明`parent(finalCommit)=preIntegrationHead`、`rev-list(preIntegrationHead..finalCommit)`exactly one commit、post-commit current product candidate仍等于`finalizedCandidateRef`，以及required working tree/index处于accepted clean poststate。Caller/provider supplied commit SHA SHALL NOT被当作Git truth。

#### Scenario: Admit one exact final commit
- **WHEN** exact package/authority有效且ordinary commit从bound finalized working tree成功形成
- **THEN** host SHALL 从Git得到`finalCommit`，证明其唯一parent/topology与candidate continuity，并允许进入repository review/acceptance mechanics

#### Scenario: Reject multiple wrong-parent or candidate-changing commits
- **WHEN** bounded mechanics产生零个或多个commit、final commit parent不等于`preIntegrationHead`、commit后candidate不等于`finalizedCandidateRef`，或poststate不满足clean要求
- **THEN** Repository Integration SHALL fail closed，且 SHALL NOT继续到terminal accepted-main admission

### Requirement: Repository review and merge remain provider-external while terminal Git truth is independently observed
Repository-specific branch publication、PR/review与merge mechanics MAY 由bounded host/provider执行，但provider callback、PR id、review status或returned accepted-main SHA SHALL NOT成为truth authority。Repository Integration terminal admission SHALL 重新从Git解析canonical `targetMainRef`得到`acceptedMainCommit`，并 SHALL 证明`finalCommit`存在且包含于accepted-main history，同时 SHALL 机械验证 `tree(acceptedMainCommit) == tree(finalCommit)`。由于`finalCommit`已在commit阶段证明其product/canonical candidate等于`finalizedCandidateRef`，该tree equality SHALL 作为accepted-main exact content continuity：accepted main不得包含超出已验证finalized candidate的额外或不同product/canonical bytes。若target main发生无法由exact approved integration关系解释的drift，或accepted-main tree与final-commit tree不等，operation SHALL STOP而 SHALL NOT自动rebase、merge conflict、correction或复用旧verification。

#### Scenario: Accept repository-accepted main from Git observation
- **WHEN** repository review/merge mechanics完成，trusted Git observation解析`targetMainRef`得到exact commit，`finalCommit`包含于该accepted-main history，且`tree(acceptedMainCommit) == tree(finalCommit)`
- **THEN** terminal SHALL 记录该Git-observed SHA为`acceptedMainCommit`

#### Scenario: Ignore callback-reported accepted-main SHA as truth
- **WHEN** provider callback返回一个accepted-main SHA但canonical `targetMainRef`从Git解析为不同commit，或`finalCommit` containment失败，或`tree(acceptedMainCommit) != tree(finalCommit)`
- **THEN** Repository Integration SHALL reject terminal admission，而 SHALL NOT信任callback返回值、也 SHALL NOT接受额外/不同accepted-main bytes

#### Scenario: Stop on target-main drift instead of automatic rebase
- **WHEN** target main在preparation之后发生非预期变化且exact finalized-state/approved integration relationship无法证明
- **THEN** operation SHALL STOP并要求Owner-controlled re-preparation/correction，且 SHALL NOT自动rebase、resolve conflict或假设prior verification仍覆盖新bytes

### Requirement: Accepted main becomes next Delivery base and terminal execution stops
成功的 Repository Integration terminal SHALL content-bind `deliveryFinalizationRef`、`finalizedCandidateRef`、`preIntegrationHead`、`finalCommit`、`targetMainRef`、`targetMainPreIntegrationCommit`与Git-observed `acceptedMainCommit`，并 SHALL 记录`nextDeliveryBase = acceptedMainCommit`。Terminal MAY记录opaque repository-review metadata作为audit，但该metadata SHALL NOT成为truth/authority。Terminal SHALL 在返回accepted-main/next-base continuity后STOP；它 SHALL NOT tag/release、activate next Delivery、create D05、select next operation或取得新的Owner authority。

#### Scenario: Return exact accepted-main next-base continuity
- **WHEN** repository acceptance与terminal Git checks全部通过
- **THEN** terminal SHALL 记录`acceptedMainCommit`，要求`nextDeliveryBase`与其exact相等，并随后STOP

#### Scenario: Terminal success does not activate release or next Delivery
- **WHEN** Repository Integration返回terminal success
- **THEN** system SHALL NOT自动创建tag/release、activate下一Delivery、创建D05或选择任何后续operation

### Requirement: Repository Integration preserves state-first continuity without transport lifecycle modes
Repository Integration preparation/execution SHALL 只要求exact finalized state、required Git history与required environment可验证。若这些exact state已经可用 SHALL 直接verify/reuse；若缺失 SHALL STOP preparation并允许在lifecycle外恢复最小缺失state，再通过同一operation重新prepare。Core SHALL NOT引入local/detached/shared/bundle/ZIP execution mode，也 SHALL NOT要求mandatory source snapshot、Git bundle或dependency archive。

#### Scenario: Reuse shared exact state
- **WHEN** exact finalized working tree、Git history与required environment已经存在且identity验证通过
- **THEN** Repository Integration SHALL 直接使用同一operation contract继续，而 SHALL NOT人工创建transport handoff

#### Scenario: Restore missing state without changing lifecycle semantics
- **WHEN** exact required repository/history/environment state缺失
- **THEN** preparation SHALL STOP直到最小exact state被外部恢复并重新验证，随后 SHALL 使用同一`delivery-repository-integration` operation，而 SHALL NOT切换到新的transport/execution lifecycle type
