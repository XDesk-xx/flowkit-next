## Why

固定 manager 的纯结构校验会接受伪造或错 Action 的 Guidance SHA；普通 Agent 启动示例可把这种 ref 写进新 Run 的 `action.md`。`20260924-001-explore` 的有界反例已复现该缺口，并获 `20260924-002-review-explore` 批准。新 Action 必须在首次持久写入前绑定本次 manager 安装中的真实 Skill bytes。

## What Changes

- 为 Flowkit 提供一个有界、manager 自有的新 Action 开始入口：在同一次开始边界解析并复核 exact Action 的 canonical Guidance，完成 package/readiness 绑定，然后 create-once 写入 `action.md`。
- 伪造、错配、过期、缺失或无效 Guidance 在 Run 目录与 `action.md` 创建前失败；写入后发生的错误沿用现有 partial Run 保留规则。
- 明确 `GuidanceRef` 与 `ActionPackage` 的纯结构校验不能单独证明安装来源或许可持久启动；十份产品 Action HOW 改用该入口。
- 保持历史 Run 的原字节与原时点 Guidance 身份，不追溯用新安装的 Skill SHA 校验旧 Run。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `action-guidance-execution`：把当前安装的 canonical Guidance 内容身份绑定到新 Action 的受控开始操作，并让产品 HOW 消费该操作。
- `action-package-and-result-admission`：区分 package 的结构有效性与新 Run 启动所需的 Guidance provenance；保持既有 Result admission 边界。

## Impact

预计涉及 `src/domain/action-guidance-execution.ts`、ActionPackage/Run 开始接缝、`skills/actions/**/SKILL.md` 及对应单元与跨安装回归。沿用现有 manager 安装定位、Role、Policy、Run 三文件和 create-once 地址；不新增 CLI 写命令、授权节点、registry、签名服务或自动流程。第二个 Change 的 prepared Owner correction 和历史 Run 迁移不在本范围。
