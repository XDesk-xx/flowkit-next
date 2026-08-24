## Why

Flowkit-next 目前只有 Delivery 规划与外部 bootstrap governance，还没有一套可由后续 Foundation Change 共同依赖的 canonical authority / identity contract。现在需要先冻结最小且 fail-closed 的 Owner、execution role、Delivery、Change 与 Action identity 语义，避免旧 Flowkit 的 `key + id` 双重 Change identity、group lifecycle 或由 Review/Verification 隐式推导 Owner authority 被重新带入新实现。

## What Changes

- 建立 Delivery、Change、Action 的 semantic identity vocabulary；Change 只以 semantic `id` 为 canonical identity，`group` 仅为组织元数据。
- 建立 Owner 与 Author / Reviewer execution role 的 authority separation；Verification 保持独立 evidence authority。
- 建立显式、可引用的 Owner decision / authorization fact vocabulary；冻结 semantic identifier grammar 与 Owner authority fact 的 JSON wire shape；Review、Verification、Action terminal 均不得隐式产生 Owner authority。
- 建立 Delivery / Change 最小结构状态 vocabulary 与基础 fail-closed validation，对未知 literal、错误 identity 或非法 authority 组合拒绝处理。
- 为上述 domain contract 增加 targeted unit tests，作为后续 Action lifecycle、Run persistence、Policy 与 integration Change 的共享基础。
- 不在本 Change 定义 Action lifecycle state machine、Run/Result persistence、Policy next-boundary、mutation/Git checkpoint、OpenSpec adapter 或 CLI。

## Capabilities

### New Capabilities
- `lifecycle-authority-and-identity`: 定义 Flowkit Foundation 的 canonical Delivery/Change/Action identity、Owner/Author/Reviewer/Verification authority separation、显式 Owner authority fact 与 fail-closed 基础 domain rules。

### Modified Capabilities

无。

## Impact

- 新增 Foundation domain types / validators 及对应 targeted unit tests；具体文件布局由 design.md 冻结。
- 为后续 `establish-action-lifecycle-domain-contract`、`establish-policy-and-next-boundary-contract`、`establish-managed-toolchain-resolution` 等 Change 提供共享 identity / authority vocabulary。
- 不修改 OpenSpec lifecycle authority、Git authority 或 Archify truth boundary；Delivery 01 仍由外部 authority 管理。
- 不引入 runtime binary、node_modules、registry、自动 next 或 candidate self-management。
