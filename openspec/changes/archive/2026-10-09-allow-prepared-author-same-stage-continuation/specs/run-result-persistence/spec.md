## MODIFIED Requirements

### Requirement: Owner-corrected prepared Run remains immutable in a unique successor chain

对当前 active Change 的合法 prepared Author supersession，系统 SHALL 保留前序 Run 的完整三文件、原始 proof bytes、prepared state 和 null outcome；新 revise SHALL 创建不同且 sequence-unique 的 occurrence，使用 previousRunId 指向该前序 Run，并在新 context 保存 exact OwnerAuthorityFact。此规则 SHALL 包括同 identity 的三个 prepared revise 后继；canonical history SHALL 在读取这类 edge 时显式验证 child 绑定的 revise-action、same Delivery/Change、scope=[requestedAction] 与完整 parent pair 的 correction eligibility，即使默认 prepared reuse boundary 已返回同名 READY，也 SHALL NOT 跳过该验证。缺失或错配的 child authority SHALL 拒绝，不继承 parent authority 作为自动权限，不以历史曾被接受而绕过核对。

canonical history SHALL 仅在完整前序、精确合法 correction edge、连续唯一序号与唯一后继均成立时把新 Run 作为 current tip；不得将旧 prepared Run 自动 terminalize、清理或解释为 PASS。连续多个合法 prepared 同名 revise successor SHALL 按同一规则逐边读取；普通 prepared Author 的既有同名历史读取规则 SHALL 保持兼容，此兼容 SHALL NOT 扩大固定 start 的许可。只读历史不生成 Owner authority、迁移或改写任何旧 bytes。

#### Scenario: Read one Owner-linked successor
- **WHEN** prepared apply(R1) 有完整三文件和 null outcome，新的 revise-propose(R2) 使用 previousRunId=R1 与匹配的 revise-action Owner authority 完整落盘
- **THEN** history SHALL 保留 R1 原始 bytes，并把 R2 读为唯一 current tip；R1 不成为成功 Apply

#### Scenario: Read multiple same-revise prepared successors
- **WHEN** 三个 revise 阶段之一的完整 prepared R1 后依次存在同名 R2、R3，每条 edge 均有 exact child Owner authority、直接 parent 与连续唯一 sequence
- **THEN** history SHALL 逐边验证 correction 后将 R3 读为唯一 current，R1/R2 的三文件和 Proof SHALL 保持不变

#### Scenario: Reject missing authority despite a matching normal boundary
- **WHEN** prepared revise 的同名 child 缺少 Owner fact，或 fact 的 decision、Delivery、Change、单一 scope 不匹配，即使父记录 normal Policy 返回相同 actionId
- **THEN** history SHALL fail closed，不把默认 reuse READY 或父记录的 authority 当作新 occurrence 权限

#### Scenario: Reject unlinked or ambiguous child
- **WHEN** 新 revise occurrence 缺少前序指针、authority 不匹配，序号不连续/重复，或同一前序出现两个竞争 successor
- **THEN** history SHALL fail closed，不得任选 current tip 或覆盖旧 Run

#### Scenario: Preserve partial start without inventing a tip
- **WHEN** 新 occurrence 只保存 action.md 或 context/result 部分写入
- **THEN** 读取 SHALL 报告 exact incomplete occurrence 并 STOP，不得把它当作完整 successor、回退猜测旧 current 或补造成功

#### Scenario: Preserve existing ordinary prepared history reading
- **WHEN** 既有普通 Author prepared explore/propose/apply 的同名历史读取符合原规则，而非本次新增的 prepared 同名 revise correction edge
- **THEN** history SHALL 保持原读取兼容；该记录 SHALL 不使固定入口允许无授权的重复 start
