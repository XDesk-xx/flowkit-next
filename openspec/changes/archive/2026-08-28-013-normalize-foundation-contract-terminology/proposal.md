## Why

当前 canonical Foundation contracts 仍残留两处 `V1` 内部版本化措辞，会错误暗示 Flowkit 维护独立的 V1/V2/V3 产品或 API 合约体系。Git 与 OpenSpec Change history 已承担演进历史，因此应在正式 Delivery Full Test 前移除这两个限定词，同时保持现有行为与 requirement predicates 完全不变。

## What Changes

- 将 `openspec-thin-integration` 中 requirement heading `V1 exposes only two closed read-only observations` 重命名为非版本化名称，requirement body 与 scenarios 不变。
- 将 `policy-and-next-boundary` 的 Owner-correction requirement 中 `Policy V1 SHALL` 规范化为 `Policy SHALL`，其余 decision、identity、scope、blocked outcome 与 scenarios 完全保留。
- 仅规范 canonical contract wording；不重写 archived Change artifacts、既有 `.flowkit/runs`、`.agents/**` metadata 或合法的外部/runtime/schema/package 版本事实。
- 不改变 production code、tests、CLI、Policy semantics、OpenSpec integration semantics、Full Test semantics 或 Delivery lifecycle。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `openspec-thin-integration`: requirement name-only normalization，移除 `V1` qualifier，不改变 closed read-only observation contract。
- `policy-and-next-boundary`: Owner-correction requirement wording normalization，移除 `Policy V1` qualifier，不改变任何 normative predicate 或 scenario。

## Impact

- Canonical OpenSpec contracts: exactly two existing capabilities receive terminology-only deltas.
- Production source, tests, package/build configuration, `.agents/**`, `.flowkit/memos.json`, repository guidance and historical records remain unchanged.
- No new product/API version hierarchy is introduced; legitimate facts such as OpenSpec `1.10.0`, Archify `2.15.0`, Node `22.23.2`, schema/serialization/package versions remain untouched.
