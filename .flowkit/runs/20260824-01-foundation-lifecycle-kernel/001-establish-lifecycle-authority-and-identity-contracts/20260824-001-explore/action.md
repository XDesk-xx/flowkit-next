# Explore Action

- delivery: `20260824-01-foundation-lifecycle-kernel`
- change: `establish-lifecycle-authority-and-identity-contracts`
- run: `20260824-001-explore`
- role: `author`
- action: `explore`
- entry HEAD: `23ca52715df7c52738edeb59206f496c7bf2d2a9`
- owner authorization: `owner:1593d4fbe636d0afc08711794647464fff0df0496b316795f823299fcb18fe6e`

## Goal

基于真实仓库、Delivery manifest、OpenSpec 1.10.0 Skill 与旧 Flowkit 实现证据，探索并冻结后续 Proposal 必须回答的 authority / identity 问题；不得实现 production code。

## Skill boundary

使用：

- `skills/vendors/openspec/openspec-new-change/SKILL.md`：建立 OpenSpec Change scaffold。
- `skills/vendors/openspec/openspec-explore/SKILL.md`：执行 Explore。

当前仓库 **不存在 project-owned proof Explore Skill**。`skills/actions/README.md` 仅预留未来 `explore/apply/review` Action Skills；因此本 Run 以 bootstrap 外部治理方式人工执行 proof contract：每个关键结论必须绑定到 repository path + SHA / Git identity / exact old-flowkit commit+blob evidence。不得把该人工 proof contract 冒充为已产品化 Skill。

## Mutation boundary

本 Run 仅允许：

1. 将 Delivery manifest 中 exact Change 从 `planned` 激活为 `active` 并记录 Owner `activate-change` decision。
2. 建立 OpenSpec 1.10.0 Change scaffold（仅 `.openspec.yaml`，不生成 proposal/design/spec/tasks）。
3. 写入 Flowkit-specific `openspec/changes/establish-lifecycle-authority-and-identity-contracts/explore.md`。
4. 写入本 Explore Run 的 `action.md / context.json / result.json`。

禁止修改 production source、tests、AGENTS.md、OpenSpec proposal/design/spec/tasks，禁止 commit/push。
