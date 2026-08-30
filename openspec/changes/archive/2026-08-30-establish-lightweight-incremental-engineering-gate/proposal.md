## Why

当前仓库已经具备 Prettier、ESLint 依赖和稳定 Git 工作流，但尚没有一个统一、廉价、可交互执行的机械工程质量 Gate。D02 需要在不把历史无关债务、Full Test 或后续 Dependency/Entropy/Applicable Checks 职责混入当前 Change 的前提下，建立一个几秒级、零 selected-debt baseline 的机械退化边界。

## What Changes

- 新增一个稳定的 repository-local Lightweight Engineering Gate 入口，统一执行：
  - `git diff --check HEAD`；
  - bounded Prettier check；
  - 经 proof 收敛的 ESLint flat-config rule/override surface；
  - 对 `src/**/*.ts` 的 `max-lines=650` hard boundary；
  - 对 tracked generated/runtime artifacts 的窄 matcher 检查。
- 新增最小 ESLint flat config，复用 `@eslint/js`、`typescript-eslint` 与现有 Prettier；生产代码保留 `no-explicit-any` / `ban-ts-comment`，测试只关闭已 proof 的 `no-explicit-any` 并允许 `^_` intentional discard；仅对已 proof 的 control-character regex 文件关闭 `no-control-regex`。
- 一次性删除 Explore 已证明安全的 6 个 unused import/type/declaration，以建立 selected lint 的 zero baseline；不扩大为历史债务清理工程。
- 扩大 bounded Prettier surface 以覆盖 Gate 自有 config/script，同时继续排除 `.flowkit`、OpenSpec、architecture 和 runtime/generated artifacts。
- Gate 失败仅表示 selected mechanical engineering rule 失败；不产生 Formal Verification verdict、Owner authority、Reviewer verdict 或新 lifecycle/control-plane fact。
- 明确不纳入 typecheck、build、tests、OpenSpec validate、Archify、dependency-cruiser、Knip、Formal Full Test、changed-file planning、baseline/waiver registry 或质量平台。

## Capabilities

### New Capabilities
- `lightweight-engineering-gate`: 定义一个 cheap/high-signal/interactive repository-local mechanical Gate 的稳定入口、selected checks、source-size hard boundary、forbidden tracked-artifact semantics 与失败边界。

### Modified Capabilities

无。

## Impact

- 预计新增 `eslint.config.mjs` 和一个极小的 repository-local forbidden-artifact check/orchestrator，并更新 `package.json` scripts。
- 预计仅对 4 个已 proof 文件执行 6 个 unused artifact 的机械清理。
- 不新增 npm dependency；复用当前已声明的 ESLint / typescript-eslint / Prettier / Git。
- 不修改 Foundation Policy、authority、Run/Result persistence、OpenSpec integration 或 Verification authority contract。
