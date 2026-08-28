## Why

Flowkit-next 需要一个极小的 project-level durable seam，用来保存 Owner 明确认可、但当前故意不进入正在执行的 Delivery / Change formal scope 的 concern。该 concern 既可能是 future idea，也可能是真实发现但暂时不适合处理的问题、风险、技术债或 follow-up；如果没有这一层，要么会诱发当前 Change scope 膨胀，要么会在后续 Delivery 中遗失。

## What Changes

- 新增 Cross-Delivery Memo capability：以 project-level Memo 记录被 Owner 明确授权保存、但尚未进入正式 Delivery / OpenSpec Change 的 concern。
- 使用单一 durable JSON 文档 `.flowkit/memos.json`；缺失文件表示空集合，文档与 record 使用 closed、deterministic、fail-closed contract。
- Memo 只保留 `open | promoted | dismissed` 三态；`defer` 不产生 mutation，Memo 保持 `open`。
- Memo 的 source provenance 可为空，也可逐层记录 Delivery、Change、Run 来源；provenance 仅说明来源，不构成 authority、scope 或 specification truth。Run provenance 使用既有 canonical Run occurrence/runId 规则。
- 提供最小消费 seam：create、get、list open、promote、dismiss。读取不要求 Owner authority；create / promote / dismiss 必须消费调用方已经建立的 canonical `OwnerAuthorityFact`，Memo capability 不创建、推断、修复或持久化 authority fact。
- Promotion 只记录已经由调用方建立的 concrete target Delivery / Change；target 必须与用于 promotion 的 eligible Owner authority 精确绑定。Memo capability 不扫描 OpenSpec 来建立 target，也不自动创建 Delivery / Change。
- Memo 永远不是 Standard Action、CurrentAction、Run / Result、Policy input、next-boundary authority、Delivery blocker 或 OpenSpec specification truth。
- `.flowkit/memos.json` 只属于本 capability 的窄持久化路径；本 Change 不建立通用 repository mutation declaration、Git checkpoint/commit authority、锁/WAL、数据库、scheduler、backlog 或 issue-tracker 能力。

## Capabilities

### New Capabilities

- `cross-delivery-memo`: 定义 project-level durable Memo record、Owner-gated mutation、open Memo 读取/暴露、promotion/dismissal 以及与当前 lifecycle / Policy / OpenSpec truth 的隔离边界。

### Modified Capabilities

无。现有 `lifecycle-authority-and-identity`、`run-result-persistence`、`policy-and-next-boundary` 等 capability 的 requirements 不改变；Memo 只复用其已有 canonical identity / authority / runId validation seam。

## Impact

- 新增一个独立 Memo domain/persistence capability 及对应单元测试。
- 新增 capability-owned repository sidecar：`.flowkit/memos.json`。
- 复用现有 `SemanticId`、`OwnerAuthorityFact` 与 canonical Run occurrence/runId validation；不改变这些既有 contract。
- 不修改 Standard Action catalog、CurrentAction lifecycle、Run/Result execution lineage、Policy legal-boundary calculation、OpenSpec Change lifecycle 或 Git checkpoint authority。
