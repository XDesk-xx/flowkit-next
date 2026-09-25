## ADDED Requirements

### Requirement: New managed Action evidence requires target Git byte preservation

在新的 canonical Action Run 创建前，manager SHALL 针对实际 target 核对本次已知的 action.md、context.json、result.json exact 路径的有效 Git 属性及目标保字节规则；不得用代表路径的属性推断尚未确定的 proof 路径。后续新 proof 的 exact 路径一旦确定，SHALL 在接纳其 Result 前核对该路径的有效 Git 属性及既有来源、归属与完整性；不保字节或无法确认时 SHALL 拒绝接纳。目标项目 SHALL 持有其 Git 配置；manager SHALL 只读核验和诊断，不自动修改该配置。

#### Scenario: Target preserves known Run paths and later exact proof paths

- **WHEN** target 对本次已知的 Run 路径及随后确定的每个必要 proof exact 路径均有有效保字节属性
- **THEN** 新 canonical Action SHALL 可按原有 authority 与持久化规则开始，必要 proof SHALL 可按现有规则接纳

#### Scenario: Known Run path would normalize before start

- **WHEN** target 的有效 Git 属性会转换任一本次已知 Run 路径的字节，或无法确认保字节
- **THEN** manager SHALL 在新 action.md 创建前拒绝开始并指出 target、exact 路径与缺失的规则，不改写 target Git 配置

#### Scenario: Specific proof path overrides general rule

- **WHEN** 一条具体文件名规则覆盖通用保字节规则，导致后续新 proof exact 路径会被 Git 转换
- **THEN** manager SHALL 在该 proof 进入 terminal Result 前拒绝接纳并指出 exact 路径；此前 Run 开始成功不构成该 proof 的保字节证明

#### Scenario: Historical evidence and routine queries

- **WHEN** 读取已有 Run 或只执行 status/next
- **THEN** SHALL 不追溯扫描或改写历史 proof，也不以新证据前置检查阻断只读查询

## MODIFIED Requirements

### Requirement: Raw execution streams are independent of source text and Git visibility policies

原始 stdout/stderr SHALL 保持实际 bytes，使用 stdout.txt、stderr.txt、<label>.stdout.txt、<label>.stderr.txt。本仓库 Git attributes SHALL 对 .flowkit/runs/** 与 .flowkit/artifacts/** 的新 managed 证据关闭 text normalization，并对 .flowkit/artifacts/** 下四条通用 raw-stream 模式额外关闭 whitespace 检查，替代具体 Delivery/Change 路径例外。结构化 Run/proof、源码、脚本及人工摘要 SHALL 继续接受适用的空白诊断；不得对整个 .flowkit 关闭 whitespace 检查、格式化原始日志后重写 hash，或将结构化文件改名伪装日志。规则 SHALL 不联动 .gitignore、tracked 状态或 Full Test 范围；其他项目自行管理 Git 配置，不由普通 Action 自动注入。

#### Scenario: New Change logs need no new Git attributes

- **WHEN** 新 Delivery/Change 产生声明命名的含 CRLF/trailing whitespace 原始流并进入授权提交
- **THEN** Git index SHALL 保留原 bytes，原始流空白不阻断检查，不需追加该 Change 路径

#### Scenario: Structured evidence retains byte identity and whitespace diagnosis

- **WHEN** 新结构化 Run/proof 含 CRLF 或不合规空白并进入暂存检查
- **THEN** Git SHALL 保留原始 bytes；适用的空白检查 SHALL 仍报告不合规空白，不因其位于 .flowkit 下而豁免

#### Scenario: Structured text still fails its text checks

- **WHEN** 源码、Run JSON 或人工摘要含不合规空白
- **THEN** 文本检查 SHALL 仍报告，不因与 proof 同目录而豁免

#### Scenario: Raw stream policy does not select test inputs

- **WHEN** ignore/跟踪或 raw-stream attributes 改变
- **THEN** SHALL 不因此生成或修改 Full Test 配置
