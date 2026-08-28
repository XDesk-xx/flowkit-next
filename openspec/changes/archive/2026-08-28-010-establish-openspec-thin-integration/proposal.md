## Why

Flowkit 已经能够从 `toolchain.lock + FLOWKIT_HOME` 精确解析受管 OpenSpec 1.10.0 runtime，但 runtime 本身还没有一个产品级、机器可读的薄观察边界来获取 OpenSpec 的正式 Change 事实。当前 Foundation CLI 依赖这层能力，因此现在需要建立最小 read-only integration seam，同时继续保持 OpenSpec 是唯一 formal Change authority。

## What Changes

- 新增一个只读 OpenSpec observation capability，只消费现有 `resolveManagedTool("openspec")` 返回的受管 entrypoint。
- 支持两个封闭观察：列出当前 repo-local OpenSpec active Change 集合；观察一个 exact Change 的 schema/planning/artifact readiness 状态。
- 通过当前 host Node (`process.execPath`) + resolved managed entrypoint + argument-array child process 调用 OpenSpec JSON CLI；禁止 shell/PATH/global fallback。
- 对成功观察执行 exact repository-root binding：requested root 与 OpenSpec 返回的 `root.path` canonical host path 必须完全一致，否则 fail closed。
- 只投影 Flowkit 当前需要的 machine fields；不把 raw stdout/stderr、`nextSteps`、`actionContext` 或任意 CLI payload 提升为稳定 Flowkit contract。
- 区分“非零退出但返回合法 OpenSpec machine JSON”的 formal outcome 与 spawn/process/malformed-output integration failure，但不解析英文错误文本来复制 OpenSpec lifecycle semantics。
- 观察结果保持 transient，不写入 `.flowkit` mirror/cache，也不改变 Policy、Reviewer、Verification、Owner 或 Git authority。
- 当前 `.agents/skills/openspec-*` 继续作为开发阶段 bootstrap Skill；production runtime 不读取、不执行、不迁移这些 Skill，也不引入 self-hosting。
- 不实现 `instructions`、`context`、`validate`、`show`、`new change`、`archive` 或其他 OpenSpec command wrapper；未来只有真实 Flowkit consumer 才能扩展命令面。

## Capabilities

### New Capabilities
- `openspec-thin-integration`: 通过 exact managed OpenSpec runtime 提供两个封闭、只读、fail-closed 的 repo-local OpenSpec machine observation，并保持 OpenSpec formal truth 与 Flowkit lifecycle/authority 分离。

### Modified Capabilities

None.

## Impact

- 新增一个小型 OpenSpec observation integration module 及 focused unit/integration tests，并从现有公开 domain surface 暴露最小 typed observations。
- 消费既有 `managed-toolchain-resolution` capability，但不修改其 contract；Node 继续仅受 `package.json#engines.node` 约束。
- 不修改 Policy、Memo、Action lifecycle、Run/Result、ActionPackage、Owner/Reviewer/Verification authority、`.agents` Skill、Foundation CLI 或 Archify integration。
- 不增加新的 npm dependency、installer/downloader、generic process/tool registry、OpenSpec state mirror 或 workflow orchestrator。
