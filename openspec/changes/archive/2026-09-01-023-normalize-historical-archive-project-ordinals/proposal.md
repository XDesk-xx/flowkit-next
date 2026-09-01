## Why

当前仓库仍有 7 个已经具有可证明 durable `projectOrdinal` lineage 的历史 OpenSpec archive 使用仅日期命名，导致 archive path 与已经冻结的 ordinal-bearing archive convention 不一致。同时，现有 Author Guidance focused test 把某一时刻的 Delivery `active/planned/next` 状态写成永久 ordinal invariant，已在合法 lifecycle transition 后稳定失败。

本 Change 在进入 Reviewer Guidance convergence 前先收敛这两处同一 ordinal/chronology 边界上的历史不一致，恢复 clean baseline；不改变 Flowkit Core、ordinal allocation semantics、Action Guidance 产品行为或 lifecycle contract。

## What Changes

- 将且仅将 7 个已由既有 durable history 证明为 `014..020` 的 date-only archive path 重命名为 `YYYY-MM-DD-<projectOrdinal:03d>-<semantic-change-id>`。
- 更新这 7 个旧 archive path 在对应 archive Run `action.md` / `context.json` / `result.json` 中的 21 个 durable path references。
- 收敛 `tests/unit/domain/author-action-guidance.test.ts` 中 2 个旧 archive path 断言，并移除对当前 named Change 的 `active/planned` 状态及 hard-coded `next === 23` 的永久依赖。
- 用 synthetic/stable fixtures 验证 durable ordinal invariants，并在需要时验证 immutable historical normalization facts。
- 保持已分配的 `021`、`022`、当前 `023` 完全不变；不得重新编号任何已编号 archive，也不得为仍 planned 的 `converge-reviewer-action-guidance` 预留 ordinal。
- 不修改 Core、Policy、ActionPackage、product Guidance、architecture、dependency graph 或 canonical product specs。

## Capabilities

### New Capabilities

无。本 Change 不引入新的产品能力。

### Modified Capabilities

无。本 Change 不改变任何 OpenSpec requirement；`.openspec.yaml` 使用 `skip_specs: true`。

## Impact

受影响面限定为：

- `openspec/changes/archive/**` 中 7 个已证明 historical ordinal 的 archive path；
- `.flowkit/runs/**` 中对应 archive Run 的 21 个 durable path references；
- `tests/unit/domain/author-action-guidance.test.ts` 中现有 historical path / lifecycle-transient ordinal assertions；
- 本 Change 自身的 OpenSpec planning artifacts 与 Flowkit Run/coordination facts。

不应影响：

- `src/**`；
- `skills/actions/**`；
- `.agents/skills/**`；
- `package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml`；
- `architecture/**`；
- canonical product specs；
- Run schema、Policy、ActionPackage 或 lifecycle contracts。
