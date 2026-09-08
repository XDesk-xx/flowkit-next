## ADDED Requirements

### Requirement: Necessary Action proof is retained with bounded ownership and integrity checks

Action 宿主 SHALL 将本次必要 proof 输入、方法/命令、实际输出及限制可靠保存到 target `.flowkit/artifacts/<delivery-id>/changes/<change-id>/proof/<run-id>/`，默认长期保留且不覆盖旧执行。Run SHALL 只携带有界引用与交接事实，保持三文件及既有 closed 字段。相关消费者 SHALL 核对当前必要引用的 project/Delivery/Change/Run 归属、target 内真实路径、regular/readable file、完整性及结果一致性，不接受越界/链接逃逸或仅指向 `.tmp` 的材料。hash 正确 SHALL NOT 自动证明来源真实或获得 Reviewer approval。

#### Scenario: Disposable workspace disappears after handoff
- **WHEN** 隔离 fixture 的 `.tmp` 被移除
- **THEN** 已交接必要 proof SHALL 仍在 target 可读，不依赖工作目录或安装根

#### Scenario: Missing corrupt or wrong-owner proof is consumed
- **WHEN** 当前必要引用缺失、不可读、hash/归属不匹配或逃逸 target
- **THEN** SHALL 阻止依赖它的接纳/消费并指出具体引用，不扫描全部历史或重跑所有测试替代

#### Scenario: A new execution retains independent material
- **WHEN** 同一 Action 经明确授权再次执行
- **THEN** 新 occurrence SHALL 保存新材料，历史 bytes 不改变

### Requirement: Raw execution streams are independent of source text and Git visibility policies

原始 stdout/stderr SHALL 保持实际 bytes，稳定命名为 `stdout.txt`、`stderr.txt` 或 `<label>.stdout.txt`、`<label>.stderr.txt`。本仓库 Git attributes SHALL 以 `.flowkit/artifacts/**` 下这些通用 raw-stream 模式关闭 text normalization 和 whitespace 检查，不含具体 Delivery/Change id，替代现有逐 Change 例外。源码、Run JSON、脚本与人工摘要 SHALL 保留原文本要求；不得对整个 `.flowkit` 免检、规范化日志再改 hash，或把此规则绑定 `.gitignore`、tracked 状态与 Full Test 范围。其他项目 SHALL 自主控制 Git 配置，manager SHALL NOT 在普通 Action 中自动修改其 attributes。

#### Scenario: New Change logs need no new Git attributes
- **WHEN** 新 Delivery/Change 产生声明命名的含 CRLF/trailing whitespace 原始流并纳入授权提交
- **THEN** Git index SHALL 保留原始 bytes，原始流空白不阻断检查，不需追加该 Change 路径

#### Scenario: Structured text still fails its text checks
- **WHEN** 源码、Run JSON 或人工摘要存在不合规空白
- **THEN** 原文本检查 SHALL 仍报告错误，不因与 proof 同目录而豁免

#### Scenario: Raw stream policy does not select test inputs
- **WHEN** Git ignore/跟踪状态或 raw-stream attributes 改变
- **THEN** 这些规则 SHALL 不生成或修改 Full Test 配置，不扩展本 Change 为测试执行入口

### Requirement: Host handoff carries relevant decisions without becoming a second authority store

宿主交接 SHALL 简要携带影响当前判断的 Owner 决定、接受后的设计依据和必要证据引用，区分 Explore 实验、已接受决策依据与当前实现验收。不得复制全部聊天/历史 proof，也不得把历史 PASS 当当前实现 PASS。对路径变化/授权背景缺失 SHALL 先核对；只有具体合同影响才构成阻断，未收到说明不等于未授权。产品与 bootstrap HOW SHALL 各自包含适用说明并保持独立，产品不得读取 `.agents`；历史 bootstrap/Owner 材料例外不得追溯转换或重写。

#### Scenario: Approved material handling is carried into review
- **WHEN** 当前判断受 Owner 保留/移动/清理范围影响
- **THEN** 交接 SHALL 给出简要决定与来源，Reviewer 核对具体影响，不凭材料路径变化推断越权

#### Scenario: Decision basis does not demand all historical proof forever
- **WHEN** Proposal 消费已批准 Explore 的决策依据
- **THEN** SHALL 使用当前结论与相关批准引用，不默认把全部原始实验设为每个后续操作的永久前置；既有保存决定仍保持
