## Why

D06 Formal Full Test 发现 `src/cli/prepared-owner-correction-start.ts` 是唯一未被现有两个 production roots 覆盖的 `src` 模块。它已由三个 revise Skill 从发布的 manager 安装直接调用，因此现有 repository entropy 合同遗漏了真实生产入口。

## What Changes

- 在现有 Repository Entropy Hygiene 合同中，将 `src/cli/prepared-owner-correction-start.ts` 明确列为第三个精确 production root。
- 同步静态 roots 与聚焦回归：该入口及其依赖应可达，缺失任何精确 root 时检查失败，其余从三个 roots 均不可达的生产源码仍须失败。
- 核对发布的 `dist/cli/prepared-owner-correction-start.js` 与三个 revise Skill 的直调路径一致。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `repository-entropy-hygiene`：将精确 production roots 从两个扩为三个，并使可达性场景按三个 roots 判定。

## Impact

涉及 `openspec/specs/repository-entropy-hygiene/spec.md`、`scripts/check-production-reachability.mjs`、对应聚焦测试，以及发行入口与 Skill 路径的验收。保留 D06 已失败的 Full Test attempt；本 Change 不修改 prepared correction 行为、Action lifecycle 或通用入口发现机制。
