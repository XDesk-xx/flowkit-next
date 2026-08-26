## Why

前五个 Foundation Change 已经分别固定 identity/authority、current Action lifecycle、Run/Result persistence、ActionPackage/admission 与一次 Standard Action invocation/STOP，但仍刻意没有回答一个治理问题：**基于这些 canonical facts，当前唯一合法的 lifecycle boundary 是什么？** 如果继续由外部 orchestrator 以约定俗成方式判断，正常 ordering、reported handoff、Owner exceptional correction 与 post-archive checkpoint boundary 会继续存在漂移风险。

本 Change 因此只建立一个 deterministic、fail-closed、serialization-safe 的 Policy decision seam：从既有 canonical facts 计算 legal boundary 或 machine-distinguishable blocked diagnosis；Policy 本身不执行 Action、不创建 authority、不调度、不修改 repository。

## What Changes

- 新增纯 `Policy` legality contract，输出仅限 `READY_ACTION(actionId)`、`READY_CHECKPOINT_EVALUATION` 或 `BLOCKED(reason)`。
- 固定当前 Change 的 normal Standard Action boundary matrix：initial/in-flight、Author terminal outcome、Reviewer verdict 与 exact completed Archive materialization。
- 固定 post-archive precedence：只有 `completed Change + exact terminal archive + matching PASS Result` 才进入 checkpoint-evaluation；`active + terminal archive + PASS` fail closed。
- 固定 terminal Run freshness / Result identity 与 reported `nextBoundary` consistency：Policy 在读取 outcome 前复用既有 `RunContextRecord` / `hasMatchingRunLinkage`，要求 terminal Result 的 `runId` 属于 exact current terminal Run occurrence；reported value 只能被校验，不能覆盖 deterministic normal boundary。
- 支持一个 bounded exceptional Owner correction overlay：只允许回到已到达阶段或更早阶段的 `revise-*`，要求 matching explicit OwnerAuthorityFact，并禁止 forward skip、archive correction 或 completed Change reopening。
- 在所有 `READY_ACTION(target)` 输出前复用现有 Action lifecycle / prepared-reuse seam 做 structural-enterability gate，避免 Policy 广告 Core 当前无法进入的 Action；不复制第二套 lifecycle state machine。
- 固定 machine-distinguishable blocked diagnosis；未知/缺失/mismatch 一律 fail closed。
- 明确 `READY` 只表达 legality，不表达 host 已获执行授权、必须立即 invocation、自动 next、Git permission 或 checkpoint authorization。

## Capabilities

### New Capabilities

- `policy-and-next-boundary`: 定义基于 canonical Change/CurrentAction/exact terminal RunContext+RunResult/Owner correction facts 的 deterministic legal-boundary Policy、normal boundary matrix、post-archive precedence、exact current Run linkage、reported-boundary consistency、bounded Owner correction、structural-enterability 与 blocked diagnosis。

### Modified Capabilities

无。现有 `lifecycle-authority-and-identity`、`action-lifecycle`、`run-result-persistence`、`action-package-and-result-admission` 与 `single-action-execution-terminal-boundary` contract 均保持不变；本 Change 只组合并解释它们已经明确留下给 Policy 的 legality seam。

## Impact

- 预计新增一个小型 domain Policy 模块与 focused unit tests，并从现有 domain index 导出。
- 复用既有 canonical `ChangeState` / `CurrentAction` / `RunContextRecord` / `RunResultRecord` / `hasMatchingRunLinkage` / `OwnerAuthorityFact` / Standard Action identity 与 lifecycle transition validator；不新增 PackageId/ResultId、dependency、database、registry 或 persistence format。
- 不修改 OpenSpec formal Change authority，不读取 OpenSpec filesystem/CLI；OpenSpec readiness integration 留给后续 thin-integration Change。
- 不实现 scheduler、queue、automatic Action execution、host/provider authorization framework、retry/resume/reset、Git mutation/checkpoint authorization、Cross-Delivery Memo、CLI、Delivery Full Test 或 multi-Agent orchestration。
