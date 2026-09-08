## Context

见 proposal.md。输出中的 available 容易被误解为健康探测，故在编码前明确技术边界；这是本次需要简短 design 的歧义决策。

## Goals / Non-Goals

使用 Node 原生能力验证字节级输出与进程结果；不探测系统、不引入外部依赖、配置或状态持久化。

## Decisions

feature.mjs 直接写固定文本与 LF；不使用平台换行函数，避免 Windows 自动 CRLF 改变合同。采用 Node 原生 test + spawnSync(process.execPath)，不增加测试框架。测试读取真实子进程 stdout/stderr/exitCode，而不是复述常量。

## Risks / Trade-offs

固定文案可能误导使用者 → 在代码注释与合同中保留“非健康探测”边界，不建立状态查询或配置 API。
