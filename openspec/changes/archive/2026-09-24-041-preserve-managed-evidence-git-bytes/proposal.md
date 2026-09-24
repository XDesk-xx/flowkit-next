## Why

Flowkit Run/proof 按原始字节记录身份，而目标项目的 Git text normalization 可能在暂存时改变这些字节，令已接纳证据与提交对象不一致。已批准 Explore（`20260924-010-revise-explore`，由 `20260924-011-review-explore` 批准）确认该风险，并限定只保护今后新产生的证据。

## What Changes

- 新 canonical Action 开始前，Flowkit 核对实际已知的 Run 文件路径及目标规则；后续 proof 在具体路径确定后、接纳前核对有效 Git 属性。任一路径不保字节时给出明确诊断；Run 前置失败时不创建 action.md。
- 新 Run/proof 采用 `-text` 或等效保字节配置；结构化材料继续接受空白诊断，四类原始 stdout/stderr 继续关闭文本转换与空白诊断。目标项目持有配置，manager 不自动注入。
- 授权的 create-new checkpoint 在提交前核对本次范围内新 Run/proof 的 index blob 与原始字节一致；有 Result proofRef 的材料还须匹配已记录 SHA，发现漂移即停止并保留真实 index 状态。
- 历史 Run/proof/提交保持原样；不增设证据平台、自动 Git 权限或历史迁移。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `action-guidance-execution`：新 managed Run 的目标 Git 保字节前置检查，以及结构化证据与原始流不同的空白规则。
- `repository-integration-and-next-base-continuity`：create-new checkpoint 的新 Run/proof index 字节核对。

## Impact

涉及 canonical Action start、目标仓库 `.gitattributes` 指引与本仓库规则、scoped Git checkpoint 宿主及相应测试。沿用既有三文件 Run、Action/Role/Owner 边界和 Git 授权流程；不增加依赖。
