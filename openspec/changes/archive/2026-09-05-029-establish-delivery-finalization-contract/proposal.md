## Why

`delivery-final` 已属于 closed Delivery operation identity，但当前没有可形成的 package、bounded execution host 或 canonical Guidance；同时，现有 Architecture Finalization terminal 仍允许 callback alias 改写可信 lineage，并未 exact-admit thin compare。Change 4 需要先关闭这些直接前置输入缺口，再从 completed Change、valid Full Test 与 Architecture closure 的 accepted facts 形成一个无 Git 权限的 exact Delivery closure。

## What Changes

- 为既有 `DeliveryOperationPackage` 增加唯一的 `delivery-final` concrete facts/package variant，并只接受 `decision=finalize-delivery`、exact Delivery、`changeId` absent、scope exactly `["delivery-final"]` 的 Owner authority。
- 新增 bounded Delivery Final preparation/execution seam：从 canonical Delivery coordination、read-only OpenSpec active-set observation、trusted terminal Full Test 和 Architecture Finalization outcomes、六个 exact output bytes，以及 current repository candidate 形成/重验 package；不接受 caller boolean、任意 path、standalone digest 或 Run prose 替代正式事实。
- 让 Delivery Final 只 materialize exact canonical Delivery coordination closure，绑定 Full Test → Architecture-materialized → finalized candidate lineage，返回 compact content-bound terminal record，然后 STOP；不执行 Git 或后续 repository integration。
- 对 Architecture Finalization 增加三项 direct-consumer correction：隔离 callback 与 retained trusted package/Full Test lineage；将两个 thin compare 收紧为 exact bounded canonical shape；使用既有 candidate algorithm 记录 post-materialization candidate。
- 新增 canonical `skills/delivery/final/SKILL.md`，只描述 already-decided `delivery-final` 的通用 HOW，不取得 lifecycle、Reviewer、Verification、Owner 或 Git authority。
- 实际 D04 Formal Full Test、Architecture Finalization、Delivery Final、Change 5 与 repository integration 均不在本 Change Apply 中执行。

## Capabilities

### New Capabilities

- `delivery-finalization`: 定义 complete accepted prerequisite validation、exact Delivery Final authority、bounded coordination closure、candidate lineage、terminal STOP 与 no-Git boundary。

### Modified Capabilities

- `delivery-operation-execution-and-start-continuity`: 为现有 exact operation envelope 增加 `delivery-final` concrete package/authority contract，并保持 Start、Full Test 与 Architecture operation identity边界。
- `architecture-and-canonical-diagram-continuity`: 增加 callback lineage isolation、exact bounded thin-compare admission 与 post-materialization candidate continuity，使 Architecture terminal 可安全作为 Delivery Final 前置事实。

## Impact

- 主要影响现有 Delivery operation package validator/former、Architecture Finalization domain/host seam，并新增 operation-local Delivery Final domain/host seam、focused/acceptance tests 与 `skills/delivery/final/SKILL.md`。
- 复用 `OwnerAuthorityFact`、`DeliveryFullTestInvocationTerminal`、`DeliveryArchitectureFinalizationTerminal`、`deriveApplicableCheckCandidateRef`、managed OpenSpec active-set observation 与现有 canonical Delivery coordination owner；不新增 candidate algorithm、truth/evidence store、Registry、Router、Planner、generic manifest/schema/immutability/mutation framework或第二 Delivery lifecycle。
- Delivery Final 不创建 commit、branch、PR、merge、tag、accepted-main identity、ZIP/bundle/handoff 或 next-operation authority；这些仍属于 Change 5 与独立 Owner Git boundary。
