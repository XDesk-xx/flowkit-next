## Why

Delivery 01 的 bootstrap CLI 合同允许 caller 提供 `changeState` 作为结构事实，但 Stable Core 已将 `active` 冻结为“Owner 已授权 exact Change 进入 lifecycle”的 durable coordination 语义。当前 `status` / `next` 在进入 Policy 前没有把 caller state 绑定到 exact Delivery + Change 的 durable coordination truth 与 activation provenance，因此 caller 可以自报 `active` 并影响 lifecycle legality；该 gap 已在 D02 proof 中被真实复现并被 Reviewer 确认。

## What Changes

- **BREAKING**：移除 `status` / `next` request 中 authority-bearing 的 caller `changeState`；当前 contract 直接由 Flowkit 从 repository durable coordination truth 解析 canonical `ChangeState`，不再保留双真相。
- 在 CLI/application composition 层增加一个只读、fail-closed 的 trusted coordination resolver：绑定 exact repository root + Delivery ID + Change ID，读取现有 Delivery manifest，解析 exact Change state、direct hard dependencies，并在 durable state 为 `active` 时校验 matching Owner `activate-change` provenance。
- `activate-change` provenance eligibility 精确要求：structural-valid `OwnerAuthorityFact`、exact Delivery/Change、`decision=activate-change`、`scope=["explore"]`；wrong-scope / wrong-identity / missing provenance 均 fail closed。
- `status` 与 `next` 共享同一个 trusted coordination resolver；`status` 报告 resolved state，`next` 将 resolved state 作为 canonical Policy fact。
- Policy 保持 pure / deterministic / repository-IO free；它不读取 manifest、不解析 Owner activation provenance、不解析 dependencies，并继续拥有既有 `revise-action` Owner correction eligibility 与 legal next-boundary calculation。
- 明确 canonical authority ownership：structural `OwnerAuthorityFact` validator 只验证 wire/identity/shape；boundary-owning contract 识别其自己所需的 decision/scope semantics，避免把所有 lifecycle eligibility 粗暴归给 Policy。
- 复用现有 Delivery manifest / Owner decision evidence，不新增 coordination registry、第二状态 store、reconciliation engine 或 automatic activation。
- 为生产读取 Delivery YAML manifest 增加一个最小、正常声明的 runtime YAML parser dependency，并同步 `package.json` / `pnpm-lock.yaml`；不依赖 managed OpenSpec 内部依赖或 undeclared transitive package。

## Capabilities

### New Capabilities

<!-- No new top-level canonical capability is introduced; the trusted resolver completes existing Foundation contracts. -->

### Modified Capabilities

- `lifecycle-authority-and-identity`: refine Owner authority ownership so structural validation remains wire-only while exact lifecycle boundaries may recognize the decision/scope semantics they own; specifically allow trusted Change coordination resolution to recognize exact `activate-change` provenance before Policy solely to derive canonical `ChangeState`.
- `foundation-cli-surface`: make `status` and `next` resolve trusted Delivery-Change coordination state from the exact durable Delivery manifest before reporting state or constructing Policy input; remove caller authority over `changeState` and fail closed on invalid/missing/mismatched coordination facts, and for durable `active` only, on invalid/missing activation provenance or unsatisfied direct dependency completion.
- `policy-and-next-boundary`: explicitly consume already-resolved canonical `ChangeState` only, remain repository-IO/provenance-resolution free, and preserve existing Policy-owned legal next-boundary and `revise-action` correction eligibility.

## Impact

- Expected source surfaces: `src/cli/request.ts`, `src/cli/foundation-cli.ts`, one small trusted coordination resolver/parser seam, and focused exports/types as needed.
- Expected tests: request/CLI acceptance and focused resolver tests for planned self-upgrade rejection, exact activation provenance, wrong Delivery/Change/scope, dependency completion, completed/cancelled non-upgrade, `status`/`next` consistency, and Policy purity.
- Runtime dependency graph changes because production must parse the repository-owned Delivery YAML manifest using a directly declared parser dependency; `package.json` and `pnpm-lock.yaml` must become the accepted package truth before archive.
- No new lifecycle states, registry, reconciliation/background process, generic Owner-authority subsystem, Git authority, promotion mechanism, or internal V1/V2 contract family.
