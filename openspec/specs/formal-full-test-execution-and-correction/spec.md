# formal-full-test-execution-and-correction Specification

## Purpose
为已决定的 `delivery-full-test` operation 提供 exact candidate、exact project-local checks、显式 Owner authority 与 fail-closed correction/admission 语义，使不同项目可共享同一 Formal Full Test contract 而无需共享同一命令集合。

## Requirements

### Requirement: Formal Full Test executes only the exact project-local check contract bound to the package
系统 SHALL 只执行 `delivery-full-test` package 中显式绑定的 exact ordered project-local Formal Full Test check set。每个 check SHALL 使用 project-supplied declaration 与 content-bound `checkRef` 精确标识其 program、ordered args、config refs、tool refs 与 material environment refs；系统 SHALL 保留 package 声明顺序，并 SHALL NOT 从 package scripts、repository prose、changed files 或其他 heuristic source 推断、增加、删除或重排 checks。

#### Scenario: Execute the exact ordered project-local check set
- **WHEN** valid `delivery-full-test` package 绑定 checks `[A, B, C]` 且每个 declaration/checkRef 精确匹配
- **THEN** 系统 SHALL 只按 `A → B → C` 的 exact order 执行该 check set

#### Scenario: Reject inferred or malformed Full Test plan
- **WHEN** check set 包含 duplicate check identity、declaration/checkRef mismatch、空 plan，或执行方试图从 repository heuristics 增补 check
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 把该输入当作 exact Formal Full Test contract

### Requirement: Formal Full Test requires exact operation-specific Owner authority
`delivery-full-test` SHALL 只在 structural-valid `OwnerAuthorityFact` 精确满足 `decision=authorize-formal-full-test`、exact current Delivery identity、`changeId` absent、scope exactly `["delivery-full-test"]` 时可执行。该 authority SHALL 只授权当前 Formal Full Test operation，且 SHALL NOT 隐式授权 repository/canonical correction、Change mutation、Git mutation、Architecture Finalization、Delivery Final 或 next Delivery operation。

#### Scenario: Exact Full Test authority is accepted
- **WHEN** authority 精确匹配当前 Delivery、decision 与 singleton Full Test scope，且无 `changeId`
- **THEN** 系统 SHALL 允许 prepare/execute 已决定的 `delivery-full-test` operation

#### Scenario: Broader or mismatched authority fails closed
- **WHEN** authority 的 Delivery 不匹配、存在 `changeId`、decision 不匹配，或 scope 缺失/包含额外 token
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 从其他 Review/Verification/terminal facts 推断 Full Test authority

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

### Requirement: Platform fixture mechanics may differ while semantic proof obligations remain invariant
Formal Full Test SHALL 允许不同操作系统/平台使用不同 fixture mechanics 来证明同一 semantic obligation，但 SHALL NOT 因平台差异跳过、弱化或替换该 obligation。若 platform-specific fixture 调整不改变 repository/canonical candidate，可按 same-candidate correction 处理；若必须修改 repository/canonical test bytes，则 SHALL 按 new-candidate correction 处理。

#### Scenario: Different platform fixture proves the same semantic obligation
- **WHEN** 两个平台无法使用相同 filesystem/permission mechanic 复现同一 failure condition，但都存在可验证的等价 fixture
- **THEN** 系统 MAY 使用平台适配 fixture mechanics，但 SHALL 要求两者证明相同 semantic obligation

#### Scenario: Platform workaround cannot silently weaken proof
- **WHEN** 某平台无法直接复现原 fixture 且 proposed workaround 会跳过对应 semantic obligation
- **THEN** Formal Full Test SHALL fail closed/STOP，而不得把缺失证明记为 PASS
