## Why

Delivery 07 的固定命令与配套 Skills 已分别实现，但源码中的 PASS 不能证明最终 tgz 的文件、依赖和安装入口一致。Owner 以 `owner-input:2026-10-01:revise-e-acceptance-scope` 将 E 的当前验收收窄为发行包与既有固定命令检查；真实项目使用在后续采用中观察，不作为本 Change 或 Delivery 完成的前置。原选定计划和已审 Explore 保留其历史事实，不把其中未执行的真实用例改写为已通过。

## What Changes

- 从当前受审候选执行适用检查、构建实际 tgz，核对包名版本、文件成员、生产依赖、工具 lock、Skills 和安装后入口；安装到不覆盖 D07 外部 Stable manager 的新目录。
- 在隔离 fixture 中从实际安装调用 `status/next/doctor` 以及已发行的固定 Action/支持命令，并结合现有回归和 Linux x64 glibc detached 验收核对可发行性、拒绝边界及既有行为。不得用源码 checkout、开发依赖或临时生命周期脚本补齐发行包缺口。
- 对 `20261001-062-apply` 已记录的两项检查失败做有界诊断和必要的最小修复或环境归类，重新运行受影响检查；失败未解决时不记 PASS。
- 汇总实际源码/构建来源、tgz SHA-256、选定工具与 Skills、安装位置、检查结果和限制，形成包外发行候选记录。记录只说明本轮已证实的发行事实，不声称经过真实独立项目、独立 Reviewer 修改往返或新 Agent 会话验收；Owner 后续选择 manager、正式 Full Test、Final 和 Git 均另守各自边界。

## Capabilities

### New Capabilities

无。E 验证并交接已实现的发行能力，不增加产品命令、生命周期状态或运行时能力。

### Modified Capabilities

无。现有规范已经约束固定命令、证据、正式验证与 Git；本 Change 不修改其要求。因此 `.openspec.yaml` 继续使用 `skip_specs: true`。

## Impact

主要产物是实际 tgz、隔离安装的验收材料和简洁的包外发行候选记录。必要的窄范围检查脚本/fixture 修复可以纳入 E；不预先授权产品功能重构、外部 Stable 安装替换、正式 Delivery Final、Git checkpoint/push/merge 或新项目 manager 选择。真实使用风险应在报告中明列，不借 Delivery 完成抹去。
