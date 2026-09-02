## Why

Change 1 已建立 exact `StandardActionId` → canonical `skills/actions/<actionId>/SKILL.md` → content-bound `ActionGuidanceRef` 的执行契约，但当前 repository 仍没有任何 Author canonical product Guidance body。现有 Author HOW 分散在独立 `.agents/skills/**` bootstrap material 中，因此需要把已验证的执行经验收敛成稳定、Action-aligned、identity-complete 的产品侧 HOW，同时保持 D03/D04 的独立 self-development bootstrap 边界。

## What Changes

- 为 exactly seven Author Standard Actions 创建 canonical product Guidance：`explore`、`revise-explore`、`propose`、`revise-propose`、`apply`、`revise-apply`、`archive`。
- 每个 canonical `SKILL.md` 自身承载当前 contract 下完整的 Flowkit-specific normative HOW，使 Change 1 的 single-file content hash 继续完整代表该 Action 的 product Guidance identity。
- 把 proof/convergence、minimum mutation、Mechanical Preflight、Run concision、handoff/continuation、semantic invariant/literal、complexity/scope-drift 与 STOP discipline 组织进相应稳定 Action entry，而不创建额外 Standard Action 或 top-level Skill identity。
- `apply` / `revise-apply` 内部复用 D02 已有 mechanical quality/check facts；Mechanical Preflight 不成为独立 lifecycle stage、Reviewer 或 Verification authority。
- `projectOrdinal` 作为 project-wide monotonic Change sequence / archive-naming fact，只在 Change 第一次实际进入 Explore 时分配并持久化到 exact Delivery Change coordination entry；产品侧由 canonical `skills/actions/explore/SKILL.md` 承担该已授权 Explore Action 的分配/持久化 HOW，D03/D04 独立 self-development 则由现有 `.agents/skills/explore-proof-based/SKILL.md` 承担 bootstrap parity。planned-only Change 不预占编号，已 Explore 后 cancelled 的 Change 保留已分配编号。`semantic ChangeId` 仍是唯一 canonical Change identity。
- `archive` 只消费已经持久化的 `projectOrdinal`，并 materialize `YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>`；不得从 Delivery manifest 数组位置、Run sequence、`changeStartSequence`、completed/archive count 或其他物理 grouping label 重新计算或分配编号。
- 为 D03/D04 当前独立 `.agents/skills/**` self-development plane 补齐最小 ordinal parity：更新现有 `.agents/skills/explore-proof-based/SKILL.md` 使首次真实 Explore 负责分配/持久化 `projectOrdinal`，并保留一个最小 project-owned archive wrapper/composition 使 bootstrap archive 只消费该持久化事实；两者继续复用各自 subordinate OpenSpec mechanics，且不得消费 candidate `skills/actions/**`。
- 保留 `TEMPORARY-RUN-SURFACE-GUIDANCE.md`，直到 Author 与 Reviewer formal/bootstrap coverage 都完成并 proof 无剩余 self-development dependency；Change 2 不做历史 archive 批量重命名。

## Capabilities

### New Capabilities

- `author-action-guidance`: 定义七个 canonical Author Action Guidance 的 identity-complete HOW、revise/preflight/handoff/STOP discipline、project-wide persisted `projectOrdinal` archive naming consumption，以及 Stable Core development 期间最小独立 bootstrap archive parity 边界。

### Modified Capabilities

- 无。Change 1 的 `action-guidance-execution`、`ActionPackage`、Policy、Run/Result 与 lifecycle requirements 保持不变。

## Impact

- 新增：`skills/actions/{explore,revise-explore,propose,revise-propose,apply,revise-apply,archive}/SKILL.md`。
- 最小 bootstrap 影响：更新既有 project-owned `.agents/skills/explore-proof-based/SKILL.md` 承担首次 Explore 的 ordinal assignment/persistence HOW，并保留 `.agents` archive wrapper/composition 只消费 persisted ordinal；OpenSpec vendor skills 保持 subordinate mechanics，不承载 Flowkit `projectOrdinal` authority。
- 当前 exact Change coordination entry 持久化 `projectOrdinal: 21`；planned Reviewer Guidance Change 保持无 `projectOrdinal`。可能更新与 Guidance/ordinal coverage 直接相关的 repository tests/checks；不要求 production Core source mutation。
- 不新增 dependency、Registry、Router、Planner、Runtime、second Guidance identity、new lifecycle state 或 Standard Action。
- `TEMPORARY-RUN-SURFACE-GUIDANCE.md` 在 Change 2 保留；既有无 ordinal 的 D02/D03 historical archive path 保持不变。
