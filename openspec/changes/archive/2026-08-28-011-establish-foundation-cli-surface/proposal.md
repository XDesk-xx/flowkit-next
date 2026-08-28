## Why

Flowkit Foundation 已经具备 lifecycle、Run/Result persistence、Policy、managed-tool resolution 与只读 OpenSpec observation 等核心能力，但当前仓库没有真实可执行的 `flowkit` CLI surface，后续 Windows/Linux whole-manager acceptance 因此缺少稳定入口。现在需要一个最小、fail-closed 的 CLI 组合层，把既有 Core 能力暴露成机器可读命令，同时严格避免在 CLI 中复制 lifecycle authority、自动发现 current state 或提前进入 self-hosting。

## What Changes

- 增加最小可构建、可执行的 `flowkit` package/bin surface，使 production TypeScript 能被 emit 为 Node 可运行 JavaScript，并暴露单一 `flowkit` entrypoint。
- 增加封闭的 `status`、`next`、`doctor` 三个 CLI command：
  - `status` 只报告 caller 明确提供的 Delivery/Change facts、exact selected durable Run 与既有 OpenSpec observations；Run history 仅用于展示，不创建 current-Run authority。
  - `next` 只从 caller 显式提供的 current-Run choice 与 structural facts 组合 canonical Policy facts：`currentRunId` 为 exact occurrence 时只读取该 Run，显式为 `null` 时直接表示当前没有 Run，并将 `CurrentAction`/terminal facts 作为 `null` 交给既有 `evaluatePolicyAndNextBoundary(...)`；CLI 不复制 transition table。
  - `doctor` 只执行当前 Foundation CLI 所需的 fail-closed runtime diagnostics，包括 exact managed OpenSpec/Archify resolution 与 OpenSpec repository-root observation；Archify 只解析 identity，不生成 architecture projection。
- 增加一个小型 checkpoint authorization evaluator：仅在 Policy 已返回 `ready-checkpoint-evaluation` 时，验证 separately supplied exact Owner `authorize-checkpoint` authority 是否匹配 exact Delivery、Change 与 `scope=[checkpoint]`，只返回授权事实，不执行任何 Git mutation。
- CLI 需要 current Run 时，caller/host MUST 提供 exact Run occurrence；当 `next` 明确表达当前没有 Run 时，caller/host MUST 显式提供 `currentRunId:null`。CLI 对 exact occurrence 通过现有 controlled durable Run persistence API 精确读取，对 explicit null 直接构造空 CurrentAction/terminal facts；两种情况都禁止从 max sequence、mtime、目录顺序、Git history 或其他 history ordering 推导 currentness。
- 保持当前 bootstrap 开发边界：不读取/执行 `.agents/skills/**`，不自动执行 Author/Reviewer、OpenSpec workflow、Archify materialization、Git checkpoint 或 Delivery self-management。

## Capabilities

### New Capabilities
- `foundation-cli-surface`: 定义最小可运行的 `flowkit` CLI/build/bin surface、`status`/`next`/`doctor` command contract、explicit current-Run choice（exact occurrence 或批准的 explicit-null branch），以及 authorization-only checkpoint gate。

### Modified Capabilities

无。既有 lifecycle、Run persistence、Policy、managed-tool resolution 与 OpenSpec observation requirements 保持不变；CLI 只消费这些 canonical seams。

## Impact

- 主要影响新的 CLI/host composition source、CLI-focused tests、package build/bin configuration 与必要的 TypeScript production emit configuration。
- 消费现有 `run-result-persistence`、`policy-and-next-boundary`、`managed-tool-resolution`、`openspec-thin-integration` 与 Owner authority contracts，但不修改其 canonical requirements。
- 不增加 runtime framework、scheduler/daemon、Delivery discovery/current registry、Skill execution、Archify rendering、OpenSpec mutation wrapper、Git mutation 或 self-hosting。
- 不建立 Foundation CLI 的内部产品/API版本层级；后续能力演进继续通过独立 OpenSpec Change 修改 canonical contract，而不是维护并行版本体系。
- 当前 Change 只使 CLI 可构建/可运行并提供当前批准的 Foundation CLI surface；Windows/Linux whole-manager acceptance、Full Test、Delivery Final、Archify actual/compare materialization 与 Owner promotion 仍属于后续边界。
