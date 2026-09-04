# delivery-operation-execution-and-start-continuity Specification

## Purpose

为 Flowkit Delivery-level execution 建立 closed exact-operation、content-bound canonical Guidance 与 minimal execution package contract，并以 Delivery Start 首次证明 accepted-base continuity、显式 authority 与固定点提交边界。

## Requirements

### Requirement: Delivery operation identity is closed and maps deterministically to canonical Guidance
系统 SHALL 只接受以下五个 canonical `DeliveryOperationId` literal：`delivery-start`、`delivery-full-test`、`delivery-architecture-finalization`、`delivery-final`、`delivery-repository-integration`。每个 exact operation SHALL 通过固定 1:1 映射唯一对应 canonical repository-relative Delivery Guidance path；未知 literal、alias、模糊匹配、动态 registration、ranking 或 Agent-selected operation SHALL fail closed。`DeliveryOperationId` SHALL 只表达 already-decided execution identity，且 SHALL NOT 决定下一 Delivery operation、Change activation、Reviewer/Verification truth 或 Git authority。

#### Scenario: Resolve the canonical Guidance path for Delivery Start
- **WHEN** already-decided exact operation 为 `delivery-start`
- **THEN** 系统 SHALL 唯一解析 `skills/delivery/start/SKILL.md` 作为该 operation 的 canonical Guidance entry

#### Scenario: Reject unknown Delivery operation
- **WHEN** 输入 operation literal 不在 closed five-value catalog 中
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 通过 registry、alias、discovery 或 fuzzy matching 把它转换成可执行 Delivery operation

#### Scenario: Operation identity cannot advance the Delivery lifecycle
- **WHEN** 一个 valid `DeliveryOperationId` 已被识别
- **THEN** 该 identity SHALL NOT 自行推导下一 operation、Owner authorization、Change state 或 repository mutation permission

### Requirement: Delivery Guidance identity is exact, content-bound, and product-canonical
系统 SHALL 只从 trusted canonical repository root 与 exact `DeliveryOperationId` 解析 Delivery Guidance，并将可执行 `DeliveryGuidanceRef` 绑定到 exact canonical repository-relative path 与 exact file-content SHA-256 identity。canonical entry SHALL 是 readable regular file；missing、unreadable、non-regular、symlink、wrong-operation mapping 或 content mismatch SHALL fail closed。caller / Agent SHALL NOT 任意指定 Guidance path 或 content identity，且 product Delivery execution SHALL NOT fallback 到 `.agents/skills/**`、conversation memory、Run prose 或 repository-wide Skill discovery。

#### Scenario: Guidance byte drift changes exact identity
- **WHEN** canonical Delivery Guidance path 不变但 file bytes 发生变化
- **THEN** 后续解析得到的 exact `DeliveryGuidanceRef.contentSha256` SHALL 与变化前不同

#### Scenario: Wrong or redirected Guidance fails closed
- **WHEN** `delivery-start` 被绑定到其他 Delivery Guidance、`.agents/skills/**` entry、symlink 或 non-regular entry
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 形成 executable Delivery Guidance identity

#### Scenario: Missing product Guidance does not use bootstrap fallback
- **WHEN** canonical `skills/delivery/start/SKILL.md` 缺失，但 repository-local `.agents/skills/**` 中存在相关 bootstrap HOW
- **THEN** product `delivery-start` preparation SHALL fail closed，而不得使用 bootstrap Skill 替代 canonical product Guidance

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
`delivery-start` SHALL 使用一个 closed operation-facts contract，至少绑定 exact `acceptedBaseCommit` 与 exact Owner-approved planning-reference identity/content SHA-256。trusted Delivery Start host SHALL 独立验证当前 canonical Git repository 处于该 exact accepted base、working tree 满足 clean-start precondition，并 SHALL 从 Git/OpenSpec/Memo/Previous-Actual 等各自 canonical owner 读取实时 Start input facts；这些 canonical facts SHALL NOT 因方便 package formation 而被当作 arbitrary caller-supplied truth。`delivery-start` SHALL 要求显式、与当前 Delivery 精确匹配且包含 bounded `delivery-start` scope 的 Owner authority；若还要执行 single fixed-point commit，则 SHALL 另外要求该 exact authority scope 明确包含 `single-delivery-start-fixed-point-commit`。

#### Scenario: Accept exact Delivery Start facts and authority
- **WHEN** accepted-base commit、planning-reference identity/hash、current Delivery identity 与 exact Owner `create-delivery` authority 全部匹配，且 authority scope 包含 `delivery-start`
- **THEN** 系统 SHALL 允许形成 executable `delivery-start` package

#### Scenario: Reject stale base or wrong planning reference
- **WHEN** current repository 不在 package 声明的 exact accepted base，或 planning-reference identity/content hash 与 Owner-approved input 不一致
- **THEN** `delivery-start` preparation SHALL fail closed，并 SHALL NOT materialize Start mutation

#### Scenario: Reject missing bounded Start authority
- **WHEN** Delivery Start 所需 Owner authority 缺失、目标 Delivery 不匹配或 scope 不包含 `delivery-start`
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 形成 executable `delivery-start` package

### Requirement: Delivery Start uses one state-first continuity path and closes at an exact fixed point
系统 SHALL 对 Delivery Start 使用同一 continuity rule：exact required repository/history/environment state 已存在时 SHALL verify and reuse；缺失时 SHALL 只恢复缺失 exact state、验证 identity/bytes 后继续同一 operation preparation path。系统 SHALL NOT 以 local/detached/ZIP/bundle 等 transport mechanic 建立不同 Delivery lifecycle mode。执行 `delivery-start` 时，Agent SHALL 消费 package-bound exact canonical Start Guidance，materialize Delivery manifest / Current Architecture / Planned Architecture / Current→Planned compare，完成要求的 OpenSpec/Archify/Git/receipt validation，并在 bounded single-commit authority 存在时形成至多一个 ordinary Delivery Start fixed-point commit；若该 commit authority 不存在，则 SHALL 在 Git mutation 前 STOP。返回的 fixed-point facts SHALL 记录 exact start commit identity，且 operation SHALL 在 canonical Delivery Start boundary STOP。

#### Scenario: Reuse already-available exact state
- **WHEN** exact accepted repository/history/environment state 已经可用且验证通过
- **THEN** Delivery Start SHALL 直接复用该状态，而不得要求人工 ZIP/bundle/runtime transport 作为 lifecycle 前置条件

#### Scenario: Restore only missing state before the same operation path
- **WHEN** 下一执行环境缺失所需 Git history 或 runtime state
- **THEN** 系统 SHALL 只恢复缺失 exact state并验证后继续同一个 `delivery-start` package preparation/execution contract，而不得切换为另一个 Delivery lifecycle mode

#### Scenario: Stop before commit when Git mutation authority is absent
- **WHEN** Start surface 已 materialize/validate，但 Owner authority 未包含 `single-delivery-start-fixed-point-commit`
- **THEN** Delivery Start SHALL 在 commit 前 STOP，并 SHALL NOT 从 PASS validation 推断 Git mutation authority

#### Scenario: Create one exact Start fixed point when explicitly authorized
- **WHEN** Start surface validation全部 PASS 且 exact Owner authority同时包含 `delivery-start` 与 `single-delivery-start-fixed-point-commit`
- **THEN** 系统 SHALL 形成至多一个 ordinary Delivery Start commit、读取其 exact SHA 作为后续 Change execution base，然后 STOP

### Requirement: Candidate Delivery execution remains independent from D04 bootstrap acceptance
D04 当前 Delivery 的 self-development SHALL 继续使用 repository-local `.agents/skills/**` bootstrap/fallback HOW；candidate `skills/delivery/**` 与 `DeliveryOperationPackage` SHALL NOT 作为证明同一 D04 candidate 正确性的 lifecycle/acceptance authority。该隔离 SHALL NOT 要求 Stable Core 完成后删除、同步或自动收敛 `.agents/skills/**`。

#### Scenario: D04 does not self-prove with candidate Delivery Start Guidance
- **WHEN** Change 1 实现 `skills/delivery/start/SKILL.md` 与 candidate Delivery package mechanism
- **THEN** 当前 D04 的 acceptance SHALL 仍由独立 bootstrap/Reviewer/Verification/Owner boundaries 证明，而不得把 candidate Start Guidance 当作其自身接受权威

### Requirement: Delivery Full Test package facts bind one exact candidate, one exact ordered check set, and exact Full Test authority
`delivery-full-test` SHALL 使用一个 closed operation-facts contract，绑定 trusted current repository `candidateRef` 与非空 exact ordered project-local Formal Full Test checks；每个 check SHALL 使用 existing applicable-check declaration semantics 并携带由其 exact material identity 派生的 `checkRef`。Package formation SHALL 保留声明顺序、拒绝 duplicate check id/ref、拒绝 declaration/checkRef mismatch，并 SHALL 要求 structural-valid `OwnerAuthorityFact` 精确满足 `decision=authorize-formal-full-test`、exact current Delivery、`changeId` absent 与 scope exactly `["delivery-full-test"]`。这些 facts/authority SHALL 只支持已决定的 `delivery-full-test` execution，不得决定 correction、Git、finalization 或 next-operation lifecycle。

#### Scenario: Form a valid Delivery Full Test package
- **WHEN** exact Delivery、`delivery-full-test` Guidance、trusted current candidate、non-empty ordered resolved checks 与 exact Full Test Owner authority 全部匹配
- **THEN** 系统 SHALL 形成 executable `DeliveryOperationPackage` 的 `delivery-full-test` concrete variant，同时保持原有 `delivery-start` package 行为不变

#### Scenario: Reject stale candidate, malformed checks, or wrong Full Test authority
- **WHEN** candidate 不是 trusted current candidate、ordered checks 存在 duplicate/mismatched declaration/checkRef，或 authority decision/Delivery/changeId/scope 不精确匹配
- **THEN** `delivery-full-test` package formation SHALL fail closed

#### Scenario: Full Test package cannot fabricate an Action execution envelope
- **WHEN** `delivery-full-test` 需要执行 project-local checks
- **THEN** 系统 SHALL 复用 existing check declaration/ref/process mechanics，但 SHALL NOT 构造假的 Standard Action / ActionPackage 作为 Delivery Full Test 的 execution authority

### Requirement: Delivery Architecture Finalization package binds exact passed verification and derived-input prestate without Owner mutation authority
`delivery-architecture-finalization` SHALL 使用现有 `DeliveryOperationPackage` envelope 的一个 closed concrete facts variant，绑定 exact passed `verifiedCandidateRef`、exact `fullTestExecutionRef`、Current/Planned Architecture exact content identity 与 Workflow/Lifecycle/Data Flow fixed system-view prestate。Trusted preparation host SHALL 从 current repository 与 trusted terminal passed Full Test outcome验证/形成这些 facts，而 SHALL NOT 接受 caller 提交 reusable candidate/architecture identity覆盖 canonical facts。该 operation 的 `ownerAuthority` SHALL 为 explicit `null`；non-null Full Test/Delivery Final/Git/other Owner authority SHALL fail closed。Package SHALL 只绑定已经由 trusted Delivery boundary/caller决定的 `delivery-architecture-finalization` WHAT 与 exact HOW/context，不得决定 next operation。

#### Scenario: Form a valid Architecture Finalization package
- **WHEN** exact Delivery、matching canonical Architecture Finalization Guidance、trusted passed Full Test candidate/execution identity、exact Current/Planned content identity与fixed system-view prestate全部一致，且 `ownerAuthority=null`
- **THEN** 系统 SHALL 形成 executable `delivery-architecture-finalization` concrete `DeliveryOperationPackage`

#### Scenario: Reject stale proof, mismatched architecture inputs, or smuggled Owner authority
- **WHEN** current candidate 不等于 passed Full Test candidate、Full Test execution identity不一致、Current/Planned/system-view prestate stale/mismatched，或 package 携带 non-null Owner authority
- **THEN** package formation SHALL fail closed，并 SHALL NOT 从 Full Test authority、Delivery Final authority或 Git authority推导 Architecture Finalization permission

#### Scenario: Existing Delivery Start and Full Test package behavior remains unchanged
- **WHEN** 新增 `delivery-architecture-finalization` concrete variant
- **THEN** accepted `delivery-start` 与 `delivery-full-test` package validation/execution semantics SHALL 保持不变，且 `delivery-final` / `delivery-repository-integration` 仍 SHALL fail closed直到其各自 Change 实现
