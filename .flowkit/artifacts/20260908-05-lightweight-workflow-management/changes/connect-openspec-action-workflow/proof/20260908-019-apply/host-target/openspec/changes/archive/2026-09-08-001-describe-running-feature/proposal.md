## Why

隔离验收 target 尚无可执行功能。增加最小固定功能说明程序，为真实 OpenSpec Author/Reviewer 链提供可实现、可验证的工作内容。

## What Changes

- 增加无参数 Node 程序，stdout 精确输出 `status: available` 加一个 LF，正常退出。
- 增加 Node 原生测试；明确输出是固定功能说明，不表示任何外部系统的健康状态。

## Capabilities

### New Capabilities

- `feature-description`: 无参数程序的固定功能说明与正常退出。

### Modified Capabilities

无。

## Impact

仅新建 feature.mjs 与相应 Node 测试。无第三方依赖、网络、配置、Git 或外部写入；CLI 参数不在当前输入域。沿用已批准 Explore 的最小边界。
