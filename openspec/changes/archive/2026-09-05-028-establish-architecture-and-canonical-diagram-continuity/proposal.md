## Why

Change 1/2 已建立 exact Delivery-operation package 与 Formal Full Test candidate/evidence identity，但 `delivery-architecture-finalization` 仍没有 concrete package/host/HOW contract。D04 需要把 valid Full Test PASS 后的 Actual Architecture 与 canonical Workflow/Lifecycle/Data Flow 收敛冻结为一个 bounded derived-description operation，同时结构性阻止 source/OpenSpec/product-truth mutation 被 finalization 隐藏。

## What Changes

- 为既有 `DeliveryOperationPackage` 增加唯一的 `delivery-architecture-finalization` concrete facts variant，绑定 exact passed `verifiedCandidateRef`、`fullTestExecutionRef`、Current/Planned exact content identity 与固定 canonical system-view prestate。
- 新增 bounded Architecture Finalization host：derived-finalization logic 只返回 exact output content/result；trusted host 独占并只 materialize 六个固定 derived-description output slots，不接受 caller-selected paths。
- 固定输出面仅包含 Delivery-scoped Actual、Current→Actual、Planned→Actual，以及 repository-scoped `workflow.json`、`lifecycle.json`、`data-flow.json`。任何 source/OpenSpec/product-truth correction 需求 SHALL STOP before closure admission，并回到正常 correction flow / new candidate / Formal Full Test restart。
- 冻结 canonical system-view continuity：Workflow/Lifecycle 在 repository-scoped baseline 缺失时可首次 materialize；已存在 baseline 在 represented accepted semantics 未变化时必须 exact-byte preserve；Data Flow 现有 baseline遵循同一规则。
- 新增 canonical `skills/delivery/architecture-finalization/SKILL.md`，只描述 generic derived-finalization HOW；Architecture/Archify 继续是 derived description，不成为 truth/evidence authority。
- D04 本身不会在本 Change Apply 时执行真实 final Architecture Finalization；D04 Actual 与最终 system views 仍等待最终 D04 Formal Full Test PASS 后再通过该 operation materialize。

## Capabilities

### New Capabilities
- `architecture-and-canonical-diagram-continuity`: 定义 valid Full Test PASS 后的 Actual/thin-compare/canonical system-view derived closure、固定六槽写入边界、baseline continuity 与 fail-closed correction boundary。

### Modified Capabilities
- `delivery-operation-execution-and-start-continuity`: 为既有 exact Delivery-operation package 增加 `delivery-architecture-finalization` concrete facts/host variant，不改变 Delivery Start / Full Test 已接受行为，也不增加新的 Delivery lifecycle authority。

## Impact

- 主要影响 `src/domain/delivery-operation-execution.ts`，并新增 bounded architecture-finalization host/domain seam、对应 tests 与 `skills/delivery/architecture-finalization/SKILL.md`。
- 复用现有 Full Test `verifiedCandidateRef` / `fullTestExecutionRef`、Delivery Guidance identity 与 managed Archify validation；不新增 Verification/Evidence store、ArchitectureCandidateId、Diagram Registry/Planner/Runtime、mutation taxonomy/path framework 或新的 Owner authority type。
- Change 4/5、Delivery Final、Git integration 与真实 D04 final architecture materialization 不在本 Change 实现范围。
