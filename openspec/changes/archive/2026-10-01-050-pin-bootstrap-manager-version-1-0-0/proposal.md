## Why

D07 已验证的 Change E 候选包版本仍为 `0.1.0`。Owner 选定将本 Delivery 的最终候选定版为 `1.0.0`，须在 Formal Full Test 前让实际包版本、接入示例和输入身份一致，并对新包重新取得验收证据。

## What Changes

- 将 `package.json#version` 定为 `1.0.0`，同步 `docs/onboarding.md` 的本地 tgz 安装示例；保留现有 `private`、入口、依赖和工具身份。
- 将打包的 `docs/onboarding.md` 明确加入现有 Formal Full Test 的 `inputs`，使该文件的字节变化改变本 Delivery 的输入身份，不新增检查类型。
- 在 Apply 中对实际修改后的源码运行适用检查、打包和隔离生产安装，核对包成员、安装元数据与入口，并记录最终 tgz 的原始字节和 SHA-256；与 E 留存的 `0.1.0` 包核对差异。
- 保留 E 的历史包及 proof 原字节。Formal Full Test、Delivery Final、Git checkpoint、实际分发和后续 Stable manager 选择遵循各自后续边界。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

无。本 Change 修改发行元数据、接入文档和既有验证输入清单，不改变产品命令或现有规范要求。因此 `.openspec.yaml` 使用 `skip_specs: true`。

## Impact

计划中的产品文件仅为 `package.json`、`docs/onboarding.md` 和 `config/verification/full-test.json`。Apply 可产生归属本次 Run 的实际包与检查材料；Explore 的隔离探针 SHA 不能作为最终候选身份。本 Change 不引入发布 CLI、registry 发布或当前 D07 的 manager 切换。
