## Why

D04 Change 4 已建立 exact `DeliveryFinalizationRecord` 与 `finalizedCandidateRef`，但 closed `delivery-repository-integration` operation 仍然 fail closed，且 canonical `skills/delivery/repository-integration/SKILL.md` 尚不存在。Change 5 需要把已经完成的 Delivery Final continuity 连接到 ordinary Git history：在 exact Owner Git authority 下形成 one ordinary Delivery Final commit，经 repository 自己的 review/merge mechanics 被接受后，从 Git 重新读取 accepted main，并将其作为 next Delivery base；同时不让 Flowkit 变成 Git provider、PR workflow engine 或 promotion lifecycle。

## What Changes

- 为既有 `DeliveryOperationPackage` 增加唯一的 `delivery-repository-integration` concrete facts/package variant，绑定 trusted `DeliveryFinalizationRecord`、exact `finalizedCandidateRef`、exact pre-integration HEAD、exact `targetMainPreIntegrationCommit`、repository branch/ref facts与 content-bound canonical Guidance。
- 精确区分两个 Git identity：`targetMainPreIntegrationCommit` 只作为 package/preparation 输入；`acceptedMainCommit` 只能在 repository acceptance 之后通过 trusted Git observation 得到，不能预先声明或仅信任 callback 返回值。
- 复用既有 `OwnerAuthorityFact`，只接受 `decision=authorize-repository-integration`、exact Delivery、`changeId` absent、scope exactly `["delivery-repository-integration"]` 的 singleton authority；target-main/pre-integration facts 发生 drift 后必须重新 preparation/authority evaluation。
- 新增 bounded repository-integration preparation/execution/terminal seam：验证 exact finalized state/history → 创建 exactly one ordinary Delivery Final commit → 交给 host/provider 执行 ordinary branch publication/PR/review/merge mechanics → 从 Git 重新观察 accepted main → 验证 final commit containment + exact accepted-main content continuity（`tree(acceptedMainCommit) == tree(finalCommit)`） → `acceptedMainCommit = nextDeliveryBase` → STOP。
- target main 在 commit/review/merge admission 前发生非预期变化时 fail closed；terminal accepted-main admission 还必须证明 `tree(acceptedMainCommit) == tree(finalCommit)`，从而保证 accepted main 不含超出已验证 finalized candidate 的额外 product/canonical bytes；不自动 rebase、merge conflict、correction、复用旧 verification 或静默接受并发 bytes。
- 新增 canonical `skills/delivery/repository-integration/SKILL.md`，只描述 already-decided operation 的通用 HOW；不拥有 Git authority、provider truth、next-operation selection、release 或 next-Delivery activation。
- Apply 只建立 capability 与 isolated Git fixture proof；不执行真实 D04 final commit、push、PR、merge、release 或 next Delivery。

## Capabilities

### New Capabilities

- `repository-integration-and-next-base-continuity`: 定义 exact finalized-state availability、singleton Owner Git authority、one-final-commit topology、provider-external repository acceptance、trusted accepted-main observation、next-base continuity 与 terminal STOP。

### Modified Capabilities

- `delivery-operation-execution-and-start-continuity`: 为现有 exact Delivery operation envelope 增加 `delivery-repository-integration` concrete package/authority contract，并保持 Start、Full Test、Architecture Finalization 与 Delivery Final 的既有 authority/lifecycle 边界。

## Impact

- 主要影响现有 Delivery operation package validator/former，并新增 operation-local repository-integration preparation/execution/terminal Git-continuity seam、focused Git topology tests 与 `skills/delivery/repository-integration/SKILL.md`。
- 复用 `DeliveryFinalizationRecord`、existing repository candidate identity、`OwnerAuthorityFact`、ordinary Git commit/ref/history truth、existing bounded Git callback style与 state-first reuse-or-restore continuity；不新增 GitCandidate/PromotionCandidate、Git provider abstraction、PR database、merge scheduler、promotion lifecycle、repository Registry 或第二 Delivery lifecycle。
- Change 5 不执行 release/tag publication，不自动启动 next Delivery，不建立 D05，也不把 GitHub/GitLab/provider-specific mechanics纳入 Core。
