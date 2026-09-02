## Why

Flowkit 已经能够为 Reviewer Standard Actions 解析 canonical Action Guidance identity，但仓库尚缺少 `review-explore`、`review-propose`、`review-apply` 三个 product-side canonical Guidance entries。D03 需要在保持 Reviewer 独立、mutation-free 与 Stable Core 自托管边界不变的前提下，把现有 Reviewer HOW 收敛为正式产品能力并退出临时 Run-surface bridge。

## What Changes

- 新增 `review-explore`、`review-propose`、`review-apply` 三个 Action-aligned canonical product Reviewer Guidance entries。
- 冻结三个 Reviewer Actions 共享的独立审查纪律：exact artifact/approved-chain inspection、material fact reproduction、bounded findings、clear verdict、complexity/minimality explanation、new-content/scope-drift assessment、semantic-invariant/literal challenge、terminal STOP。
- 保留三个 Reviewer Action 的 action-specific focus，不新增 Reviewer Registry、Router、Planner、shared execution-critical Guidance dependency graph 或新的 lifecycle/authority surface。
- 将现有 `.agents/skills/review-*` 作为独立 Stable Core bootstrap plane 原位收敛到同等关键纪律，但禁止其读取、执行或委托给 candidate `skills/actions/review-*`。
- 在 formal/bootstrap Reviewer coverage 已建立并验证后，删除 live `TEMPORARY-RUN-SURFACE-GUIDANCE.md`、其 active `AGENTS.md` bridge reference 与对应 live focused-test expectation；历史 Run/OpenSpec provenance 保持不变。
- 不修改 Memo state；不改变 Core resolver、ActionPackage、Policy、Run persistence、dependency graph 或 per-Change architecture。

## Capabilities

### New Capabilities

- `reviewer-action-guidance`: 定义三个 Reviewer Standard Actions 的 canonical product HOW、Reviewer independence/mutation-free boundary、review-chain/minimality/scope-drift discipline、bootstrap independence 与 terminal STOP 行为。

### Modified Capabilities

None.

## Impact

- Product Guidance: `skills/actions/review-explore/**`, `skills/actions/review-propose/**`, `skills/actions/review-apply/**`.
- Stable Core bootstrap HOW: `.agents/skills/review-explore/**`, `.agents/skills/review-propose/**`, `.agents/skills/review-apply/**`.
- Temporary bridge cleanup: `TEMPORARY-RUN-SURFACE-GUIDANCE.md`, active `AGENTS.md` reference, and directly related focused tests.
- OpenSpec: adds new `reviewer-action-guidance` capability spec.
- No expected `src/**`, dependency, lockfile, lifecycle, Policy, ActionPackage, Run persistence, Memo-state, or architecture mutation.
