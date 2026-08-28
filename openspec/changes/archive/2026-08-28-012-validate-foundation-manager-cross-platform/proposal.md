## Why

Foundation Manager 的产品能力已经完成，但 Delivery 仍缺少一个可重复、可审查的 whole-manager 验收入口，以及基于当前真实可执行 gate 冻结的 Delivery Full Test execution contract。最后一个 required Change 应证明现有 candidate 在 detached 主环境中能够整体工作，并以 bounded Windows compatibility simulation 覆盖当前真实 portability surface，而不是继续扩展产品能力或要求 native Windows handoff。

## What Changes

- 增加一个确定性的 whole-manager acceptance harness，使用已构建的 `dist/**`、显式 `FLOWKIT_HOME`、真实 managed OpenSpec `1.10.0` / Archify `2.15.0`，并在 disposable repository 中生成 candidate-owned canonical Run/OpenSpec fixtures。
- 在同一 focused acceptance surface 中加入 `windows-compatibility-simulation`，覆盖当前 Node/path/request/managed-entrypoint 的 Windows 兼容性边界；明确禁止把结果描述为 `Windows Native PASS`。
- 只在必要时增加最小 package/test-script wiring，使 acceptance harness 可被重复执行；不新增 generic test orchestrator、Verification registry/database、background runner 或新的 Full Test state machine。
- 在 Delivery verification contract 中冻结当前可真实执行的 Full Test 环境与 gate 顺序：typecheck、format check、production build、full domain regression、OpenSpec `--all --strict`、detached whole-manager acceptance + Windows compatibility simulation。
- 不新增 lint gate：当前 repository 没有 `eslint.config.*` 和 `package.json#scripts.lint`，本 Change 不创建 lint policy/configuration。
- 正式 Delivery Full Test 继续保持 deferred；只有 final Change archive、exact checkpoint candidate 和显式 Owner Full Test authorization 后才执行并形成 formal Verification verdict。
- 正常实现预期不修改 `src/**`。若 acceptance 发现真实 product contract defect，停止本 Change 的实现扩张并返回 Proposal/Owner 重新授权，而不是在 acceptance scope 内静默修复。

## Capabilities

### New Capabilities

无。本 Change 是 acceptance/tooling + Delivery verification-contract materialization，`.openspec.yaml` 使用 `skip_specs: true`，不为验收工具虚构永久产品 capability。

### Modified Capabilities

无。现有 canonical product requirements 不发生变化；如果后续 proof 发现需要改变产品语义，必须先取消 `skip_specs` 假设并修订 Proposal。

## Impact

- 预计新增/修改：`tests/acceptance/**`、必要的 `package.json` test wiring、format scope，以及 `openspec/delivery-groups/20260824-01-foundation-lifecycle-kernel.yaml` 中的 Full Test execution contract。
- 预计不修改：`src/**`、canonical `openspec/specs/**`、Git execution boundary、OpenSpec/Archify product integration、Owner/Reviewer/Verification authority contracts。
- Acceptance 运行需要预先恢复 compatible Node/dependencies 和显式 `FLOWKIT_HOME`；不得 install/update/download，也不得依赖 PATH/global OpenSpec/Archify。
