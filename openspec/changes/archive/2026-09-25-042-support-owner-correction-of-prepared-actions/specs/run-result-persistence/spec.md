## ADDED Requirements

### Requirement: Owner-corrected prepared Run remains immutable in a unique successor chain
对当前 active Change 的合法 prepared Author supersession，系统 SHALL 保留前序 Run 的完整三文件、原始 proof bytes、`prepared` state 和 null outcome；新 revise SHALL 创建不同且 sequence-unique 的 occurrence，使用 `previousRunId` 指向该前序 Run，并在新 context 保存 exact OwnerAuthorityFact。canonical history SHALL 仅在完整前序、精确合法 correction edge 与唯一后继均成立时把新 Run 作为 current tip；不得将旧 prepared Run 自动 terminalize、清理或解释为 PASS。

#### Scenario: Read one Owner-linked successor
- **WHEN** `prepared apply(R1)` 有完整三文件和 null outcome，新的 `revise-propose(R2)` 使用 `previousRunId=R1` 与匹配的 `revise-action` Owner authority 完整落盘
- **THEN** history SHALL 保留 R1 原始 bytes，并把 R2 读为唯一 current tip；R1 不成为成功 Apply

#### Scenario: Reject unlinked or ambiguous child
- **WHEN** 新 revise occurrence 缺少前序指针、authority 不匹配，或同一前序出现两个竞争 successor
- **THEN** history SHALL fail closed，不得任选 current tip 或覆盖旧 Run

#### Scenario: Preserve partial start without inventing a tip
- **WHEN** 新 occurrence 只保存 `action.md` 或 context/result 部分写入
- **THEN** 读取 SHALL 报告 exact incomplete occurrence 并 STOP，不得把它当作完整 successor、回退猜测旧 current 或补造成功
