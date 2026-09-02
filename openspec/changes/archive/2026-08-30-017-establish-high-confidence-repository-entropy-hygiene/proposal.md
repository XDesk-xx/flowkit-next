## Why

当前仓库已经具备 Lightweight Engineering Gate 与 Structural Dependency Health，但仍缺少一个高置信度、低摩擦的 production entropy 边界来识别“存在于 `src`、却无法从真实 production roots 到达”的死源代码。Explore 已证明这一缺口可以复用现有 `dependency-cruiser 18.2.0` 的图输出，以很小的 repository-local reachability check 解决，而不需要引入 Knip 或新的质量平台。

## What Changes

- 新增一个独立的 `quality:entropy` repository command，只检查 production source 是否可从两个明确 production roots 到达：
  - `src/cli/entrypoint.ts`
  - `src/domain/index.ts`
- 复用现有 `dependency-cruiser 18.2.0` 仅生成 TypeScript-aware `src` dependency graph；不使用 `orphan=true` 作为 dead-source 判定。
- 对 graph 中 resolved local `src` modules 做 bounded reachability traversal；任何不属于两个 roots reachable closure 的 `src` module 都机械失败。
- 增加 focused proof/tests，覆盖 healthy zero baseline、isolated unreachable source、internally connected unreachable subgraph、以及“只被 tests 引用仍不算 production live”的 counterexample。
- 保持 checker read-only、deterministic、small，并保持 `quality:entropy` 与 `quality:gate`、`quality:dependency-health`、Formal Full Test 独立。
- 明确不采用 Knip 6.32.2；本 Change 不增加 Knip dependency、不修改 lockfile 来引入 Knip，也不自研 unused-package scanner。
- unused dependencies / unused exports / unused types 保持 deferred/excluded；不引入 baseline、waiver、cache、changed-file planner、registry/platform 或自动清理。

## Capabilities

### New Capabilities
- `repository-entropy-hygiene`: 定义一个独立、只读、确定性的 production-root reachability 工程边界，阻断无法从明确 production roots 到达的 `src` source modules，并冻结与 Structural Dependency Health、Knip/unused analysis 及其他质量机制的边界。

### Modified Capabilities

无。

## Impact

- 预计新增一个很薄的 repository-local reachability checker、focused tests/fixtures 与一个稳定 `quality:entropy` package script。
- 复用已存在的 `dependency-cruiser 18.2.0`；不新增 repository dependency，因此本 Change 不需要因为工具采用而修改 `pnpm-lock.yaml` 或刷新 detached `node_modules` snapshot。
- 不修改 `quality:gate`、现有 Structural Dependency Health selected bad-edge rules、Foundation lifecycle/authority、Run/Result、Policy 或 Formal Full Test contract。
