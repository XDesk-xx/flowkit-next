## Purpose

为运行这个隔离示例程序的人提供精确、稳定、可验证的固定功能说明。此输出仅描述示例本身的约定能力，不探测或代表外部系统、Flowkit 生命周期或测试健康状态。

## ADDED Requirements

### Requirement: Fixed feature description

无参数运行程序时，程序 SHALL 在 stdout 输出精确的一行 `status: available` 加一个 LF，stderr 为空，并以退出码 0 正常完成。该内容仅为固定说明，SHALL NOT 查询或改变外部系统状态。

#### Scenario: No-argument execution

- **WHEN** 用户通过 Node 无参数运行程序
- **THEN** stdout SHALL 为 `status: available\n`，stderr SHALL 为空，exitCode SHALL 为 0
