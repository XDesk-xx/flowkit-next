## Context

Change 1–4 已经建立：closed Delivery operation identity/package pattern、Formal Full Test、Architecture Finalization 与 Delivery Final。Change 4 terminal `DeliveryFinalizationRecord` content-binds verified candidate、Full Test execution、Architecture closure、completed Delivery coordination与 `finalizedCandidateRef`，并明确 `gitCheckpoint = pending-owner-authorized-local-delivery-commit`。因此 Change 5 不需要再定义 finalized-state truth；它只需要消费并重验该 exact terminal lineage，然后将其连接到 ordinary Git repository acceptance。

D04 final reference要求：Delivery Final之后，在 explicit Owner Git authority 下形成 one ordinary Delivery Final commit，经 PR/review/merge 后读取 accepted main，使 accepted main 成为 next exact base。Git remains repository/history truth；Flowkit不能成为 provider workflow或 promotion authority。

Reviewer 042 额外冻结一条 Proposal 精度要求：pre-integration target main 与 post-merge accepted main 必须是不同事实。`acceptedMainCommit` 只能来自 terminal trusted Git observation，不能在 package 中作为“expected accepted SHA”预声明。

## Goals / Non-Goals

**Goals:**

- 用现有 `DeliveryOperationPackage` 增加唯一 `delivery-repository-integration` concrete facts variant。
- 从 exact `DeliveryFinalizationRecord`、current repository/Git facts与singleton Owner Git authority形成 package。
- 证明 exactly one final commit、ordinary repository review/merge、accepted-main re-observation与 next-base continuity。
- 保持 state-first continuity：state/history存在则verify/reuse；缺失则在 lifecycle 外恢复最小 exact state，再准备同一 operation。
- fail closed on stale target-main/pre-integration state，而不是自动 rebase/correction。
- 新增 generic canonical repository-integration Guidance。

**Non-Goals:**

- GitHub/GitLab/provider abstraction、PR database、review state machine、merge scheduler。
- PromotionCandidate、GitCandidate、repository state registry、continuation database。
- 自动 rebase、merge conflict resolution、automatic correction Change、verification reuse policy。
- 自动 push/merge、release/tag publication、next Delivery activation、D05。
- transport mode/local-detached lifecycle type、mandatory ZIP/bundle/environment archive。

## Decisions

### 1. Reuse `DeliveryFinalizationRecord`; do not create an integration candidate identity

Trusted preparation consumes/revalidates the exact Change 4 terminal record:

```text
deliveryFinalizationRef
verifiedCandidateRef
fullTestExecutionRef
architectureFinalizationRef
architectureMaterializedCandidateRef
coordinationRef
finalizedCandidateRef
```

`finalizedCandidateRef` remains the product/canonical candidate identity. Git commit/ref/history remain repository truth. Change 5 MUST NOT introduce `GitCandidate`, `PromotionCandidate` or a second repository-state identity.

Preparation re-derives the Delivery Final record/ref and requires current repository candidate equality with `finalizedCandidateRef` before Git mutation.

### 2. The package binds pre-integration Git facts only

`DeliveryRepositoryIntegrationOperationFacts` should minimally bind:

```text
deliveryFinalizationRef
finalizedCandidateRef
preIntegrationHead
deliveryBranch
targetMainRef
targetMainPreIntegrationCommit
acceptedBaseCommit
```

All Git commits are exact lowercase SHA strings admitted from trusted Git observation; ref/branch values are exact repository facts, not caller summaries.

Important identity split:

```text
targetMainPreIntegrationCommit
→ package/preparation input
→ exact target-main state observed before mutation/review

acceptedMainCommit
→ terminal output only
→ re-read from Git after repository acceptance
```

`acceptedMainCommit` MUST NOT be present as an expected/predeclared package fact. A callback/provider-reported accepted-main SHA is advisory at most; terminal admission independently resolves `targetMainRef` from Git.

### 3. One exact singleton Owner authority; no inherited Git authority

Reuse structural `OwnerAuthorityFact` with exact recognizer:

```text
decision = authorize-repository-integration
deliveryId = exact Delivery
changeId = absent
scope = [delivery-repository-integration]
```

The recognizer requires the singleton scope exactly, not `includes()` semantics. Reviewer approval, Full Test PASS, Delivery Final authority, checkpoint state or broader generic Git scope MUST NOT imply repository-integration authority.

The authority is admitted together with the exact package-bound finalized/pre-integration/target-main facts. If those facts drift, package execution MUST STOP and trusted preparation/authority evaluation MUST occur again; the old authorization MUST NOT silently rebind to a different target-main prestate.

### 4. Preparation is state-first and fail-closed

Trusted preparation validates at least:

```text
exact Delivery Final terminal record/ref
exact current repository candidate == finalizedCandidateRef
exact Delivery coordination completed/finalization completed
current branch == recorded Delivery branch
current HEAD == preIntegrationHead
acceptedBaseCommit exists and is ancestor-compatible
canonical targetMainRef resolves to targetMainPreIntegrationCommit
working tree/index represent the exact finalized state expected for the one final commit
```

If exact repository/history state is absent, preparation returns STOP/missing-state rather than choosing a transport mode. Restore is an external continuity mechanic; after restoration the same preparation is retried.

If target main or pre-integration HEAD changes after preparation and before mutation/admission, STOP. No automatic rebase, merge, conflict resolution, correction or verification reuse is part of this operation.

### 5. Bounded execution creates exactly one ordinary Delivery Final commit

The trusted host retains the exact package and passes only a defensive operation projection plus exact Guidance to bounded Git mechanics. The commit phase SHALL prove:

```text
preIntegrationHead = P
exact finalized working tree
↓ ordinary commit
finalCommit = F
parent(F) = P
rev-list count(P..F) = 1
post-commit product candidate = finalizedCandidateRef
working tree/index satisfy exact post-commit cleanliness
```

Commit message/content policy may be operation-local deterministic HOW, but commit SHA itself is read from Git and remains Git truth. The host MUST NOT manufacture or trust a caller-supplied SHA.

The operation does not itself infer permission to push/PR/merge from commit success. Those mechanics are only executed under the already-admitted exact repository-integration authority and repository host/provider boundary.

### 6. PR/review/merge remains provider-external; Flowkit validates resulting Git truth

After the exact final commit, the repository host/provider may perform ordinary mechanics such as branch publication, PR/review and merge. Stable Core does not model provider state.

Callback/result may return opaque audit references such as review/PR identifiers, but they are not truth. Terminal admission uses ordinary Git facts:

```text
finalCommit still exists
canonical targetMainRef is re-read from Git
acceptedMainCommit = resolve(targetMainRef)
finalCommit is ancestor of acceptedMainCommit
tree(acceptedMainCommit) == tree(finalCommit)
accepted-main history is compatible with bound target-main prestate/repository policy
```

For the minimal D04 contract, terminal content admission is exact and mechanical: after `finalCommit` has already been proven candidate-equivalent to `finalizedCandidateRef`, Git tree equality `tree(acceptedMainCommit) == tree(finalCommit)` proves that accepted main contains no extra product/canonical bytes beyond the already-finalized candidate. This uses ordinary Git truth only; it does not introduce a new accepted-main candidate subsystem. If target-main history changed outside the approved integration path or the accepted-main tree differs from the final-commit tree, STOP and require explicit re-preparation/correction.

### 7. Accepted main is the terminal next-base fact, not a next-operation command

Successful terminal record is compact and content-bound, for example:

```text
repositoryIntegrationRef
deliveryFinalizationRef
finalizedCandidateRef
preIntegrationHead
finalCommit
targetMainRef
targetMainPreIntegrationCommit
acceptedMainCommit
nextDeliveryBase
```

`nextDeliveryBase` MUST equal `acceptedMainCommit` exactly. The record may retain opaque repository review metadata for audit, but such metadata does not authorize or select the next Delivery.

Terminal returns the accepted-main/next-base continuity fact and then STOP. It MUST NOT activate a next Delivery, tag/release, create D05, or choose another operation.

A fixed domain-separated ref can be introduced for the compact terminal record using the same explicit ordered-projection pattern already proven by Architecture Finalization and Delivery Final; no generic canonical JSON/hash registry is required.

### 8. Canonical Guidance is generic HOW, not Git/provider authority

Add:

```text
skills/delivery/repository-integration/SKILL.md
```

Guidance describes:

```text
validate exact package + authority
verify finalized/pre-integration Git facts
create exactly one final commit
use ordinary repository review/merge mechanics
re-read accepted main from Git
validate finalCommit containment/content continuity
return acceptedMainCommit == nextDeliveryBase
STOP
```

It MUST NOT hard-code GitHub/GitLab API semantics, choose repository integration as the next operation, create authority, auto-rebase, publish releases or activate the next Delivery.

## Risks / Trade-offs

- **[Risk] Provider callback becomes repository truth** → treat provider/PR callback results as mechanics/audit only; re-read commit/ref/history from Git for terminal admission.
- **[Risk] `targetMainPreIntegrationCommit` is confused with `acceptedMainCommit`** → package contains only the pre-integration target fact; accepted-main is terminal observation only.
- **[Risk] Owner authority silently survives target-main drift** → bind authority admission to exact package facts and STOP on drift; require fresh preparation/evaluation.
- **[Risk] One-commit rule accidentally creates multiple commits** → prove parent and `rev-list` count against bound `preIntegrationHead`, plus current HEAD identity and clean poststate.
- **[Risk] Concurrent main changes or extra accepted-main bytes are silently merged into verified Delivery** → require `tree(acceptedMainCommit) == tree(finalCommit)` at terminal admission; any mismatch fail closed with no auto-rebase/correction.
- **[Risk] Stable Core turns into PR/provider automation** → keep provider mechanics behind bounded host callback and validate only resulting Git truth.
- **[Risk] next-base fact becomes automatic next-Delivery authority** → terminal only records `nextDeliveryBase = acceptedMainCommit` and unconditionally STOPs.

## Migration Plan

This is an additive final Delivery-operation capability with no persistent-data migration. Apply extends `DeliveryOperationPackage`, adds operation-local repository-integration host/identity tests and canonical Guidance. Existing Start、Full Test、Architecture Finalization、Delivery Final regressions must remain unchanged. Apply uses isolated Git fixture repositories only; it does not perform the real D04 final commit/push/PR/merge/release/next Delivery. If the Change is rejected, remove the new package variant/host/Guidance and focused tests; no historical Delivery rewrite is needed.
