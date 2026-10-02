## ADDED Requirements

### Requirement: Managed checkpoint resolves proof paths against the exact semantic Run owner

对本次新增的 managed Proof，create-new checkpoint 写前检查 SHALL 从唯一 canonical Run 分组、exact `runId` 和 Result 的语义 `changeId` 解析归属；SHALL 接受与该 Run 对应的编号 Proof 目录及已被历史 Run 使用的语义 Proof 目录，且保留既有候选 Git 树、index 原始 bytes、唯一 `proofRef`、bytes/SHA 与 prepared/terminal 链检查。同一 Run 的两种 Proof 目录并存、路径中的编号与 Run 分组不符或 Result 的语义身份不符时 SHALL 拒绝，不从目录名推断新的语义 ChangeId。该检查只针对本次新增 managed evidence，不扩展为历史全仓扫描，不产生 Git 授权。

#### Scenario: Numbered proof has a matching Result reference

- **WHEN** 新增 Proof 位于 `changes/001-<change-id>/proof/<run-id>/`，唯一 Run 分组为 `001-<change-id>`，Result 以语义 `<change-id>` 声明该 exact 路径和匹配 bytes/SHA
- **THEN** checkpoint SHALL 在其余授权、候选链、index 与字节检查通过时允许继续，不因编号目录段误判无所属 Run

#### Scenario: Historical semantic proof is committed

- **WHEN** 新增的旧 Run Proof 位于 `changes/<change-id>/proof/<run-id>/`，唯一 Run 与 Result 归属相同，且同 Run 没有编号 Proof 目录
- **THEN** checkpoint SHALL 保持既有准入检查，不要求改写历史路径或 Result

#### Scenario: Ambiguous or falsely named proof cannot be committed

- **WHEN** 同一 Run 两种 Proof 目录均存在，或路径的编号段不等于真实 Run 分组，或 Result 语义 `changeId` 不匹配
- **THEN** checkpoint SHALL 在 commit 前拒绝并保留 index，不自行移动 Proof、改写 Run 或扩大授权范围
