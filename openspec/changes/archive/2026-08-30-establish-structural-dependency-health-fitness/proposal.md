## Why

当前仓库已经有 Lightweight Engineering Gate，但它只防 changed-code 的表层机械退化，尚不能机械识别依赖图中的高价值结构性坏边。D02 需要补上一个独立、廉价、whole-graph 的 Structural Dependency Health capability，捕获已 proof 的五类问题，同时保持与 Repository Entropy Hygiene、Formal Verification 和架构分层规则的边界。

## What Changes

- 新增一个稳定的 repository-local Structural Dependency Health 命令，使用显式 selected dependency rules 检查：
  - unresolved imports；
  - runtime circular dependencies，且任何被 type-only edge 打断的环不算 runtime cycle；
  - production source → test/spec source；
  - production runtime → package.json `devDependencies`；
  - external package use that is absent from package declaration truth。
- 采用 repository-local `dependency-cruiser` 作为实现工具，并通过正常 `package.json` / `pnpm-lock.yaml` mutation 固化依赖身份；prepared detached environment 中已存在该工具不等于 repository adoption。
- 新增独立 stable command；不把 Structural Dependency Health 合并进 `quality:gate`。
- whole-graph execution 保持为当前 contract；只要它继续 cheap/interactive，就不引入 changed-file planning、known-violation baseline/cache 或 waiver machinery。
- 明确边界：unused dependency / orphan / unused export 属于后续 Entropy Hygiene，不由本 Change hard-fail；tests → production 继续允许；production type-only use of a devDependency 继续允许。
- 不采用 dependency-cruiser broader recommended bundle；只配置已由 Explore/Reviewer proof 的 selected rules。

## Capabilities

### New Capabilities
- `structural-dependency-health`: 定义 repository-local whole-graph structural dependency health command、五类 selected bad-edge semantics、runtime/type-only boundary、package declaration boundary 与失败/非目标边界。

### Modified Capabilities

无。

## Impact

- 预计新增 dependency-cruiser repository config 与一个稳定 `package.json` script。
- `package.json` / `pnpm-lock.yaml` 将新增 repository-local `dependency-cruiser` devDependency；这会改变 dependency graph，并使旧的 exact detached `node_modules` snapshot 失效，后续环境归档属于独立 execution-environment preparation，不属于本 Change lifecycle artifact。
- 不修改 `quality:gate`、Foundation lifecycle/authority、Run/Result、Policy、Formal Full Test、Architecture layering 或后续 Entropy Hygiene contract。
