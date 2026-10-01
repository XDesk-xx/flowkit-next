## Why

固定命令和自有 HOW 已交付，但当前 `action finish` 可在本 Run proof 目录遗漏文件时完成，普通 checkpoint 在 Windows 大批量精确路径下会因单次 `git add` 参数过长而失败。D 需要把这两个已复现缺口与新增自有可执行代码、临时材料和宿主窄权限的检查边界一并收敛，才能让标准路径可用且可审查。

## What Changes

- 在固定 `action finish` 的现有证据检查点强制本 Run proof 目录与 `proofRefs` 完整、唯一对应，写入 terminal 机器文件前拒绝遗漏、额外/失效引用和不安全条目。保留无材料时无目录加空引用，以及后续按需引用历史已声明 proof 的语义。
- 使普通 Git checkpoint 对大批量 exact 路径采用有界输入，维持既有 Owner、分支、index、工作树、managed evidence 和提交对象校验；部分暂存或响应丢失时准确报告已知效果，不自动清空、重试或提交。
- 对本 Delivery 新增或实质修改的自有可执行源码、测试和辅助脚本建立可实际执行的 TS/格式/运行检查边界，以当前工作树发现和七项 exact 路径加内容身份限定未触达 JS 例外；明确 `.tmp` 数据和正式 proof 的用途，拒绝把正常生命周期 glue 换名保存。
- 给选定 manager 且实际支持目标 argv 的固定命令提供可选窄宿主权限示例与正反匹配验证方法，绑定可见 target 与 CLI 数据校验；明确 Foundation `status/next/doctor` 没有该可见目标能力。不修改用户全局规则，也不赋予裸解释器、Git/网络或其他目标通用权限。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `stable-action-command-execution`：固定 finish 对本 Run proof 生产集合执行机器闭合集校验。
- `stable-delivery-support-command-execution`：普通 checkpoint 的有界精确路径暂存和当前固定入口的窄权限说明。
- `lightweight-engineering-gate`：新增自有可执行源码与证据用途的有限检查；保持 typecheck、build 与正式验证独立于 `quality:gate`。

## Impact

预计涉及 `src/cli/action-proof.ts`、`src/internal/git-checkpoint-execution.ts` 及其现有测试，必要的受控 Git 输入辅助、仓库质量配置/检查、发行 HOW 与接入文档。只修改当前候选；D07 的正式生命周期继续由外部 Stable manager 执行。F 的合法 `prepared` proof checkpoint 接纳、历史材料迁移、通用执行器/证据平台、全局权限安装、Formal Full Test 与 Git 发布不属于此 Change。
