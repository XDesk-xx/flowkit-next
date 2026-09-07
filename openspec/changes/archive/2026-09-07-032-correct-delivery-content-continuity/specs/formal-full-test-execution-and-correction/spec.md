## MODIFIED Requirements

### Requirement: Full Test evidence is admitted only for the exact current candidate and exact material check identities

Formal Full Test SHALL 使用 applicable-check 的共享 v2 candidate/check 合同，在执行前绑定当前材料，并在 admission 重验。prior PASS SHALL 仅在真实来源有效、v2 candidate 与对应 v2 checkRef 均精确相同时复用；显式 ordered checks 和 argv SHALL 保持原顺序。实际消费 Memo/Git 历史的 check SHALL 绑定其材料，不因产品投影隔离这些内容而遗漏执行输入。旧算法 evidence SHALL 不迁移为新算法 PASS。

#### Scenario: Same candidate and same check identity can retain unaffected PASS

- **WHEN** current 与 prior v2 candidate/check 均精确相同且 prior successful evidence 来源有效
- **THEN** 该 check SHALL 可以显式复用，且不得重排 Full Test check 序列

#### Scenario: Candidate drift rejects prior evidence

- **WHEN** 有效 repository/canonical 材料变化导致 candidateRef 不同
- **THEN** prior Full Test evidence SHALL 不可 admitted 为新候选证明

#### Scenario: Material check identity drift forces affected rerun

- **WHEN** candidate 相同，但 program/argv/config/tool/material environment 或实际消费的 Memo/Git 材料改变
- **THEN** 受影响 check 的旧 PASS SHALL 不可复用

#### Scenario: 同序旧算法 PASS 不复用

- **WHEN** 输入排列相同却只有旧 domain PASS
- **THEN** v2 Full Test SHALL 要求新的有效执行证明，不把旧 PASS 重算或重签

### Requirement: Pure external correction may remain on the same candidate but repository correction ends the current Full Test attempt

只修正 environment/fixture/command-setup 且产品候选不变时，系统 SHALL 允许在同一候选上重跑受影响 checks，但材料 check identity 变化的旧 PASS SHALL 失效。需要修改有效产品/canonical 材料时，当前 Full Test SHALL STOP；后续 mutation SHALL 通过独立正常 Owner correction/revise 权限形成新候选，再建立新 Full Test boundary/package。Memo/Run 的产品隔离 SHALL NOT 授权修改这些 durable owners，也 SHALL NOT 豁免其实际消费证据或 Git 约束。

#### Scenario: External fixture correction keeps the same candidate

- **WHEN** correction 不改 repository/canonical 产品材料且重新推导候选不变
- **THEN** 系统 SHALL 保持候选，只重跑身份变化或尚未通过的受影响 checks

#### Scenario: Repository correction creates a new Full Test attempt

- **WHEN** correction 修改 source/tests/specs 等有效产品材料
- **THEN** 当前 attempt SHALL STOP，修正后 SHALL 以新的 exact package 重新建立 Full Test，不继承旧候选完成证明

#### Scenario: Memo-only 不产生隐含修改权

- **WHEN** Full Test 中发现需要改变 Memo 内容但产品 candidate 可保持不变
- **THEN** 系统 SHALL 仍要求 Memo 自身权限，并重新绑定消费它的检查材料，不从 Full Test 权限推导该修改许可
