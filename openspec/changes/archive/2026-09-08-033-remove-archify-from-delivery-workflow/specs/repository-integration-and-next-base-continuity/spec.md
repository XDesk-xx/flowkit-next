## ADDED Requirements

### Requirement: Integration consumes architecture-free Final without restoring retired prerequisites

Integration SHALL 使用本次去架构后的 Final projection、coordination 和 requiredEvidence，在 preparation、本次 execution 重验与 accepted-object acceptance 中一致消费；SHALL NOT 要求 Architecture outcome、closure ref、图文件或架构来源 reader。现有 singleton Git authority、明确 checkpointOperation、Final 来源、candidate、Git prestate、accepted-object 必要 Run 及 Full Test 来源核验 SHALL 保持。不新增 Git 执行权限或自动操作。

#### Scenario: Accept a new Final with no architecture inputs
- **WHEN** 新 Final 与必要 Change/Full Test 来源有效，其余已授权 Git 操作及对象前置全部成立，且无图或架构字段
- **THEN** Integration SHALL 可完成既有 acceptance 并读回 accepted-main，不访问或要求架构来源

#### Scenario: Reject obsolete Final as new execution input
- **WHEN** caller 提供旧架构字段或旧 Final projection 作为当前执行输入
- **THEN** Integration SHALL 拒绝，不丢字段重签，不用旧架构成功结果补齐新前置；历史记录不改写

#### Scenario: Removal of architecture does not waive Git or evidence checks
- **WHEN** Git authority/prestate 不符，或 accepted object 缺少必要 Run，或 Full Test 来源无效
- **THEN** Integration SHALL 仍拒绝并 STOP，不因无需架构而放行或自动重试
