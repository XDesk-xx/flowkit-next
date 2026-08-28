## Why

当前 Foundation 已分别具备 current Action lifecycle、exact Run/Result persistence 与 ActionPackage/Result admission，但还缺少把这些 seam 组合成“一次 Standard Action invocation 完成后只在 terminal boundary STOP”的最小 Core contract。Explore 也已证明 `resumed` 并非当前 happy path 或 re-execution 所必需，继续保留会与 exact Run occurrence 重复表达执行次数/重入语义。

## What Changes

- **BREAKING** 收缩 `action-lifecycle`：current Action lifecycle 从 `prepared | resumed | terminal` 收缩为 `prepared | terminal`，删除 `resume` event 与所有 `resumed` transition/scenario；保留 single-current-Action、内部 `prepare`、exact terminal 与 Policy 分离。
- **BREAKING** 收缩 `action-package-and-result-admission`：可执行 package/current lifecycle state 仅允许 `prepared`，删除依赖 `prepared ↔ resumed` freshness 的 admission 语义，同时保留 exact current Run occurrence freshness、role 与 Result authority-slot checks。
- 新增最小 single-Action invocation / terminal boundary：一次 invocation 内部完成 current Action establishment/reuse、ActionPackage formation、exact Result admission 与 exact terminalization；成功或失败均在该 invocation boundary 后 STOP，不自动执行下一 Standard Action。
- 明确 invocation entry：若当前 slot 为空或是不同 identity 的 terminal Action，内部可按既有 structural rule prepare 目标 Action；若 exact same current Action 已是 `prepared A`，则复用该 `prepared A`，以新的 exact Run occurrence 形成新的 ActionPackage，而不得重复 `prepare A`。
- admission 失败时不得 terminalize；exact current Action 保持 `prepared`。之后是否再次执行由后续 Policy/Owner boundary 决定，本 Change 不引入 retry framework、attempt counter、WAL、crash recovery 或 `resumed`。
- successful invocation 只报告 admitted Result 与其 opaque continuation/`nextBoundary` fact；不解释 legal next Action，也不自动继续执行。

## Capabilities

### New Capabilities

- `single-action-execution-terminal-boundary`: 定义一次 Standard Action invocation 的内部 prepare/reuse、package、execute、admit、terminal、report 与单次 STOP 组合边界。

### Modified Capabilities

- `action-lifecycle`: 删除 `resumed` lifecycle literal 与 `resume` event/transition，将 current Action lifecycle 收缩为 `prepared | terminal`。
- `action-package-and-result-admission`: 将 executable package/current lifecycle state 收缩为 `prepared`，并保持 exact Run occurrence freshness 与 Result admission authority separation。

## Impact

- 预计修改 `src/domain/action-lifecycle.ts`、`src/domain/action-package-result-admission.ts` 及其 focused tests，并新增一个很薄的 single-Action invocation composition seam 与测试。
- 不新增 PackageId/ResultId、新 execution identity、retry/recovery subsystem、scheduler、Policy engine、transport/provider registry、mutation/Git checkpoint、OpenSpec adapter 或 CLI。
- `RunOccurrence` 继续作为每次真实 execution occurrence 的唯一 correlation identity；`previousRunId` 继续仅表示 predecessor provenance。
- `prepare` 保持内部 structural transition，不成为 StandardActionId、独立 Run/Result、Owner/Reviewer boundary、用户可见阶段或普通 STOP boundary。
