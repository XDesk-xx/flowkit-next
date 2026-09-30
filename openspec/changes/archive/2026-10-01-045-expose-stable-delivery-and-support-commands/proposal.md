## Why

Change A 已将 Standard Action 的开始、结束与 proof 检查放入发行 CLI，但 Project/Delivery/Change/Memo/Archive/Full Test/Final/Git 的正常机械步骤仍依赖 Agent 临时编写调用内部模块的程序。D07 B 需要把这些步骤收回受测的固定入口，才能让 Agent 根据真实 Owner 指令选择操作、由 Flowkit 执行限定命令。

## What Changes

- 在同一 `flowkit` 发行入口增加封闭的 Project 初始化、Delivery Start/Full Test/Final、Change 激活/归档、Memo 操作以及独立 Git checkpoint/push/integration 命令。每次调用只执行指定操作并返回可区分的真实效果与读回状态；不执行下一步。
- 以数据请求绑定 target、操作、角色/Owner 决定和必要材料；Agent 对真实 Owner 输入与 `sourceRef` 的解释负责，CLI 校验精确身份、当前状态和操作前置，不宣称自己读取或认证聊天。请求不接受脚本路径、任意 shell、动态模块或 Agent callback。
- 固定入口复用既有 domain、OpenSpec 和 Git 宿主规则，保留各操作独立的写入点、部分成功交接、正式 Full Test/Final 与 Git 权限。Change 激活不创建 Standard Action Run；Archive 在已有合法 Action 内完成机械归档，仍由真实 Author Result 与独立 Reviewer 判定。
- 同步 CLI help、直接调用示例及与新入口冲突的现行规格。全目录 Skills/HOW 收敛归 Change C；证据/窄执行纪律归 D；prepared proof checkpoint 兼容归 F；独立发行验收归 E。

## Capabilities

### New Capabilities

- `stable-delivery-support-command-execution`: 定义八类辅助操作的固定命令、封闭输入、复用既有权威和真实效果/失败读回边界。

### Modified Capabilities

- `foundation-cli-surface`: 扩展封闭 command catalog 与机器结果合同，允许 B 的有界机械写入口，同时保持查询/Policy 与当前 Delivery 外部 Stable manager 边界。
- `repository-integration-and-next-base-continuity`: 将普通 Git 节点与 Integration 的既有受控宿主能力接入固定命令，明确 Agent 对真实 Owner 来源的责任，并保留精确 scope/index/object/remote 与部分成功规则。

## Impact

影响 `src/cli/**` 的解析/分发/帮助、相关 `src/domain/**` 与 `src/internal/**` 的固定接线、直接使用示例和上述 OpenSpec 规格。OpenSpec 仍管理 Change/spec/archive；Git 仍管理 repository 对象；Owner、Reviewer、Verification 的判断及授权不由命令生成。当前 D07 继续由 D06 exact Stable manager 管理，B 候选不自我接管。
