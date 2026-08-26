## Why

Flowkit 已经具备 canonical Action identity/lifecycle 与 durable Run/Result persistence，但还缺少一个明确的 Core execution boundary，来保证交给 external executor 的机器输入与返回 Result 都绑定到**同一个 exact current Action / exact current Run occurrence**。如果没有这一层，旧 package、错 Run、错角色或越权 outcome slot 仍可能被错误接纳。

本 Change 在现有单 Action、顺序 Author ↔ Reviewer 模型上补齐这条最小边界，同时保持 persistence、Policy、resume/terminal orchestration、transport 与 toolchain 的职责分离。

## What Changes

- 新增最小 `ActionPackage` contract 与纯 package-formation seam：Core 从已经验证的 exact `CurrentAction` + current `RunContextRecord`（或等价 canonical facts）形成 closed ActionPackage，复用现有 `RunOccurrence`、`ActionIdentity`、execution role、`prepared | resumed` lifecycle state、`OwnerAuthorityFact | null` 与 `previousRunId | null`；不引入新的 PackageId / ResultId。
- 规定 package 只能描述 exact current、非 terminal 的 Action/Run execution boundary；`previousRunId` 继续表示 predecessor provenance，不被重命名为“完整 input”。
- 新增 fail-closed Result admission contract：candidate Result 必须与 package、exact current Action、exact current Run occurrence 在 run/action/state/role 上精确一致。
- 强制 Author / Reviewer outcome slot 分离，并拒绝 Standard Action Result 制造正式 Verification verdict。
- 保持 `nextBoundary` 为 opaque reported data；本 Change 不解释 Policy legality，也不负责 execute → terminal → STOP orchestration。
- 明确不引入 provider/Agent registry、scheduler、parallel execution、nonce/replay registry、locking/WAL、transport protocol、CLI 或 managed toolchain 机制。

## Capabilities

### New Capabilities
- `action-package-and-result-admission`: 定义 exact ActionPackage machine contract，以及 candidate Result 对 exact current Action / Run occurrence 的最小 fail-closed admission boundary。

### Modified Capabilities

无。

## Impact

- 主要影响 `src/domain` 的新 domain seam 与对应 unit tests。
- 复用现有 `identity-authority`、`action-lifecycle`、`run-result-persistence` types/validators；不改变它们现有 canonical requirements。
- 不新增 runtime dependency，不修改 provider transport、Policy、OpenSpec integration、CLI、Git checkpoint 或 resume/terminal orchestration。
