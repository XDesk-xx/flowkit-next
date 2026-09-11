## MODIFIED Requirements

### Requirement: Delivery Guidance identity is exact, content-bound, and product-canonical

系统 SHALL 只从 trusted manager 安装根与 exact `DeliveryOperationId` 解析 Delivery Guidance，绑定 exact canonical manager-relative path 与 exact file-content SHA-256。canonical entry SHALL 为 readable regular file；missing、unreadable、non-regular、symlink、wrong-operation mapping 或 content mismatch SHALL fail closed。caller / Agent SHALL NOT 任意指定 Guidance path/content identity，product execution SHALL NOT fallback 到 target 同名资产、`.agents/skills/**`、conversation memory、Run prose 或 repository-wide discovery。

四个既有 operation 的 package preparation 与 execution read SHALL 使用同一 manager 来源，保持既有 content mismatch 检查。项目输入、输出、Git/测试 cwd、coordination、Run 和必要 artifacts SHALL 仍指向 target；系统 SHALL NOT 用 manager 根替换项目事实根。其余 operation facts、权限和生命周期要求保持不变。

#### Scenario: Guidance byte drift changes exact identity
- **WHEN** canonical Delivery Guidance path 不变但 bytes 改变
- **THEN** 后续解析的 `contentSha256` SHALL 不同，旧内容绑定不因此获得新的有效性

#### Scenario: Wrong or redirected Guidance fails closed
- **WHEN** `delivery-start` 被绑定到其他 Guidance、`.agents/skills/**`、symlink 或 non-regular entry
- **THEN** 系统 SHALL 不形成 executable Delivery Guidance identity

#### Scenario: Missing product Guidance does not use bootstrap fallback
- **WHEN** manager 的 Start Guidance 缺失，但 target 同名文件或 bootstrap HOW 存在
- **THEN** preparation SHALL fail closed，不读取这些替代文件

#### Scenario: Split roots remain consistent through preparation and execution
- **WHEN** 任一既有 Delivery operation 在 manager 与 target 分离时完成 preparation 并读取冻结的 Guidance
- **THEN** 两次访问 SHALL 都使用 manager entry，项目事实及实际项目写入 SHALL 留在 target，同名 target 文件不接管 HOW

#### Scenario: Relocation does not redefine project facts
- **WHEN** 同 bytes 的 manager 安装移位后访问同一个 target
- **THEN** Guidance path/content identity SHALL 不变，系统 SHALL 不搬迁或清理 target 历史，也不以 manager 路径改变项目测试配置
