## 1. Exact Repository Integration package

- [x] 1.1 在existing `DeliveryOperationPackage`中增加closed `delivery-repository-integration` facts/package variant，绑定trusted `DeliveryFinalizationRecord`、`finalizedCandidateRef`、`preIntegrationHead`、Delivery branch、`targetMainRef`、`targetMainPreIntegrationCommit`与accepted-base/history facts；用unit tests验证valid formation、extra/malformed/stale/caller-substituted facts及predeclared `acceptedMainCommit`全部fail closed。
- [x] 1.2 复用existing `OwnerAuthorityFact`实现exact `authorize-repository-integration` recognizer，要求exact Delivery、`changeId` absent与scope exactly `["delivery-repository-integration"]`；用tests覆盖wrong/broader/inherited/stale authority且不新增Git authority type。
- [x] 1.3 新增generic `skills/delivery/repository-integration/SKILL.md`，只描述already-decided operation的state verification、one-final-commit、ordinary review/merge、accepted-main re-observation、next-base与STOP；用resolver/content tests证明无provider API、auto-rebase/release/next-Delivery authority。

## 2. Trusted preparation and state-first continuity

- [x] 2.1 实现operation-local trusted preparation：re-derive exact Delivery Final record/ref，验证current candidate=`finalizedCandidateRef`、completed coordination、Delivery branch/current HEAD、accepted base/history与`targetMainPreIntegrationCommit`；用fixture tests覆盖missing state、wrong branch/HEAD、target-main drift、transport/provider summaries且不建立generic repository registry。
- [x] 2.2 证明state-first continuity：state/history available时direct verify/reuse；missing exact state时preparation STOP，外部restore后使用同一operation重试；用tests锁定无local/detached/bundle/ZIP lifecycle mode与无mandatory transport。

## 3. One final commit and bounded repository mechanics

- [x] 3.1 实现bounded final-commit phase：从bound `preIntegrationHead`与exact finalized working tree创建one ordinary Delivery Final commit，从Git重读`finalCommit`并验证parent、`rev-list` count=1、post-commit candidate=`finalizedCandidateRef`与clean poststate；用isolated Git tests覆盖zero/multiple/wrong-parent/candidate-changing commit以及caller-supplied SHA不可信。
- [x] 3.2 将branch publication/PR/review/merge保持为bounded provider mechanics而非Core provider model；callback只返回bounded mechanics/audit result，terminal从Git重新读取canonical `targetMainRef`并验证`finalCommit` containment以及`tree(acceptedMainCommit) == tree(finalCommit)` exact content continuity；用tests证明callback-reported accepted-main SHA不同于Git observation、或accepted-main tree包含额外/不同product-canonical bytes时均fail closed。
- [x] 3.3 对preparation之后的target-main/pre-integration drift fail closed并要求fresh preparation/authority evaluation；用counterexample证明不自动rebase、merge conflict、correction、reuse prior verification或静默接受并发bytes；另用terminal counterexample锁定`finalCommit`虽为ancestor但accepted-main tree不同仍必须STOP。

## 4. Terminal accepted-main / next-base continuity

- [x] 4.1 实现compact terminal record与content-bound `repositoryIntegrationRef`（使用operation-local fixed domain tag/ordered projection，不建立generic canonical-hash registry），绑定Delivery Final、finalized candidate、preIntegrationHead、finalCommit、target-main prestate、Git-observed accepted main，并强制`nextDeliveryBase = acceptedMainCommit`；用golden/mutation tests验证re-derivation与malformed/mismatch fail closed。
- [x] 4.2 Terminal success后无条件STOP；用tests验证不会tag/release、activate下一Delivery、创建D05、选择next operation或取得额外Owner authority。

## 5. Regression and convergence proof

- [x] 5.1 运行Delivery Start、Full Test、Architecture Finalization、Delivery Final与Repository Integration focused/domain/acceptance regressions，确认前四个operation行为/authority边界不变，且Apply只使用isolated Git fixture，不执行真实D04 final commit/push/PR/merge/release/next Delivery。
- [x] 5.2 运行typecheck、format/lint、build、dependency/entropy checks、`openspec validate establish-repository-integration-and-next-base-continuity --strict`、canonical OpenSpec strict validation与`git diff --check`；确认tasks只实现approved Change 5 contract，无Git provider/PR database/promotion lifecycle/new candidate identity/D05/self-hosting takeover。
