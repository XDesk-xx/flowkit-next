## ADDED Requirements

### Requirement: Command-selected request budgets preserve bounded input and safe diagnostics

固定 CLI SHALL 根据已解析命令选择 JSON 请求 byte 预算：仅 git checkpoint、git push、git integrate 为 1,048,576 bytes，其他请求及内部 correction/manifest JSON parser 为 65,536 bytes。请求内容 SHALL NOT 选择额度。CLI help SHALL 在原 input 描述中如实区分默认 65,536 与这三个 Git 命令的 1,048,576 bytes 额度；不提供 caller 可配置预算。文件和 stdin SHALL 按实际读取 bytes 有界收集并在首次观察到超限时拒绝；文件 stat SHALL NOT 代替读取计数，失败/结束 SHALL 关闭 handle。重复 key、depth 32、封闭 schema、Owner 授权、exact paths 和既有 Git 核对 SHALL 保持。

容量拒绝 SHALL 保留非零进程结果，request byte overflow 的 error.kind SHALL 为 invalid-request-json、message SHALL 为 request exceeds JSON limit。已有输入错误 SHALL 透传，实际 I/O 故障 SHALL 为 invalid-arguments。容量错误 SHALL 携带封闭 error.budget：subject 仅 request/result-facts，dimension 仅 bytes/depth/nodes，limit/observed 为非负安全整数，measurement 仅 exact/lower-bound；request overflow 使用 request/bytes 与所选 limit。提前停止只能声明 observed 下界；完整测量才声明 exact。输出 SHALL NOT 包含 payload、Owner source 内容、异常 cause 或 stack；非容量错误 SHALL NOT 带 budget。

#### Scenario: Accept Git requests larger than the ordinary limit

- **WHEN** otherwise-valid Git checkpoint、push 或 integrate 请求超过 65,536 但不超过 1,048,576 UTF-8 bytes
- **THEN** 文件/stdin 读取 SHALL 接受并进入原封闭 schema 和权限核对；额度不产生执行权限

#### Scenario: Reject the first byte beyond the Git limit

- **WHEN** Git 请求为 1,048,577 bytes，包括多字节文本形成的 bytes
- **THEN** CLI SHALL 在写入前拒绝，报告 limit=1,048,576、observed 下界和 invalid-request-json，不将字符数当 bytes

#### Scenario: Retain the default request limit

- **WHEN** 普通 Action、查询或内部 correction/manifest 请求超过 65,536 bytes
- **THEN** parser SHALL 拒绝，不因 body 声称 Git operation 而扩大预算

#### Scenario: Report the same overflow for files and stdin

- **WHEN** 同一超限 payload 分别通过文件与 stdin 输入
- **THEN** 两种输入 SHALL 报告相同 kind、subject、dimension、limit；observed SHALL 如实表示各自已读取下界

#### Scenario: Keep schema checks after bounded reading

- **WHEN** 额度内请求含重复 key、depth 超过 32 或未知 schema 字段
- **THEN** CLI SHALL 继续按原规则拒绝，不将这些错误报告为 bytes overflow

#### Scenario: Distinguish read failure from budget failure

- **WHEN** 文件/stream 实际读取失败，或输入 reader 已产生容量错误
- **THEN** CLI SHALL 分别输出 invalid-arguments 或原输入容量错误，不互相包装

#### Scenario: Describe the selected budgets in CLI help

- **WHEN** 用户读取既有 CLI help
- **THEN** help SHALL 同时说明默认 65,536 和 git checkpoint/push/integrate 的 1,048,576 bytes，不再宣称全部请求统一 65,536
