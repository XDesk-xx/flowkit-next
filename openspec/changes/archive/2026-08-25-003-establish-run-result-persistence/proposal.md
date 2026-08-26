## Why

Flowkit-next 已有 canonical authority / identity 与 current Action lifecycle contract，但 Author 与 Reviewer 的执行事实目前仍主要依赖外部 orchestration 生成的 handoff 记录；candidate runtime 还不能把一次 Action execution 作为可区分、可重读且 fail-closed 的 durable Run / Result 事实保存下来。现在需要补齐这一最小 persistence seam，使同一个 Change 内的 Author ↔ Reviewer Action 顺序能够脱离聊天历史稳定交接，同时保持 Owner、Reviewer、Verification 与后续 Policy / Result admission 的权威边界不被混入 persistence。

## What Changes

- 新增 Change-scoped Run occurrence contract，使同一 semantic Action 在同一 Change 中重复执行时仍拥有不同的 durable occurrence identity，而不修改既有 `ActionIdentity`。
- 新增 Flowkit-controlled canonical Run address generation，按 Delivery / Change 聚合 Run，并只从受控 date / sequence / known Standard Action inputs 生成 repository-relative direct-child Run directory；不接受任意外部 filesystem path 作为 Run authority。
- 新增 stable Run record persistence，围绕现有 `action.md`、`context.json`、`result.json` surface 写入与读取 Author / Reviewer handoff 所需 durable facts；每个 generated Run occurrence 为 create-once/non-overwritable，已存在 occurrence 或同一 Change history 中重复 controlled sequence 均 fail closed。
- 新增 Run / Result serialization round-trip 与 integrity validation：合法记录 write → read 后关键 facts 不漂移；malformed、mismatched、unknown-extra-field 或错误 linkage 输入 fail closed，不自动修复。
- 保持 Author conclusion、Reviewer verdict、Verification verdict 与 Owner authority fact 的语义分离；中间 Change 的 `verificationVerdict = null` 为合法 durable fact。
- `nextBoundary` 在本 Change 中仅作为 durable handoff data 保存；其 legality 仍由后续 Policy Change 判断。
- 明确后置 Result admission、ActionPackage、自动 next-Action orchestration、multi-Agent concurrency、locking、crash recovery/WAL、distributed registry、通用 filesystem path API 与更高强度 platform hardening。

## Capabilities

### New Capabilities

- `run-result-persistence`: 定义 Change-scoped Run occurrence、Flowkit-controlled Run topology、stable Run/Result record、serialization/read-write round-trip 与 fail-closed integrity validation，以支持最小 Author ↔ Reviewer durable handoff。

### Modified Capabilities

- None.

## Impact

- 新增 Foundation domain/persistence 模块与对应 unit tests；预计复用既有 identity、Standard Action、OwnerAuthorityFact 与 Action lifecycle validators。
- `.flowkit/runs/<delivery-id>/<change-sequence>-<change-id>/<YYYYMMDD>-<sequence>-<known-action>/` 成为 candidate runtime 对齐的 durable repository surface；不会创建第二棵 Run tree。
- 不新增外部运行时依赖、数据库、锁服务、scheduler 或 background daemon。
- 不改变 OpenSpec formal lifecycle authority，也不把 persistence 结果升级为 Reviewer / Verification / Owner / Git authority。
