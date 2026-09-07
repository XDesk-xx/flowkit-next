## Purpose

为已决定的 `delivery-full-test` operation 提供 exact candidate、exact project-local checks、显式 Owner authority 与 fail-closed correction/admission 语义，使不同项目可共享同一 Formal Full Test contract 而无需共享同一命令集合。

## ADDED Requirements

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
Formal Full Test SHALL 在执行前绑定 trusted current repository `candidateRef` 与 exact check identities，并在 result/terminal admission 时重新确认 current candidate 与 evidence candidate 一致。prior PASS 只可在 candidate identity 与对应 material `checkRef` 均保持 exact equality 时复用；candidate drift 或 material check identity drift SHALL 使 stale evidence 不可用于当前 admission。

#### Scenario: Same candidate and same check identity can retain unaffected PASS
- **WHEN** current candidate 与 prior evidence candidate 完全一致，且某个 check 的 exact `checkRef` 未变
- **THEN** 该 check 的 prior successful evidence MAY 继续满足相同 exact check identity 的 admission

#### Scenario: Candidate drift rejects prior evidence
- **WHEN** repository/canonical Git-visible bytes 变化导致 current `candidateRef` 与 prior evidence 不同
- **THEN** prior Full Test evidence SHALL NOT 被 admitted 为新 candidate 的证明

#### Scenario: Material check identity drift forces affected rerun
- **WHEN** repository candidate 未变，但 program/argv/config/tool/material environment identity 改变导致某个 `checkRef` 变化
- **THEN** 该 check 的 stale PASS SHALL NOT 被复用，且受影响 verification SHALL 重新执行

### Requirement: Pure external correction may remain on the same candidate but repository correction ends the current Full Test attempt
如果 failure 只需要修改 environment / fixture / command-setup mechanics 且 trusted repository/canonical candidate identity 保持 exact，系统 SHALL 允许在同一 candidate 上修正外部 mechanics 并重跑受影响 checks。若 correction 需要任何 Git-visible repository/canonical mutation，当前 Formal Full Test attempt SHALL STOP；correction SHALL 通过独立的正常 Owner-controlled correction/revise authority 执行，形成新 candidate 后 SHALL 重新建立 Full Test boundary/package 并重启 Formal Full Test。

#### Scenario: External fixture correction keeps the same candidate
- **WHEN** check failure 可通过 repository/canonical bytes 之外的 fixture/environment correction 解决，且重新推导的 candidateRef 未变
- **THEN** 系统 SHALL 允许保留同一 candidate，并只重跑 identity 已变化或未通过的受影响 checks

#### Scenario: Repository correction creates a new Full Test attempt
- **WHEN** 修复 failure 需要修改 repository/canonical Git-visible bytes
- **THEN** 当前 Full Test SHALL STOP，且 mutation 后的新 candidate SHALL NOT 继承旧 candidate 的完成证明；系统 SHALL 要求新的 exact Full Test boundary/package 后重新执行

### Requirement: Platform fixture mechanics may differ while semantic proof obligations remain invariant
Formal Full Test SHALL 允许不同操作系统/平台使用不同 fixture mechanics 来证明同一 semantic obligation，但 SHALL NOT 因平台差异跳过、弱化或替换该 obligation。若 platform-specific fixture 调整不改变 repository/canonical candidate，可按 same-candidate correction 处理；若必须修改 repository/canonical test bytes，则 SHALL 按 new-candidate correction 处理。

#### Scenario: Different platform fixture proves the same semantic obligation
- **WHEN** 两个平台无法使用相同 filesystem/permission mechanic 复现同一 failure condition，但都存在可验证的等价 fixture
- **THEN** 系统 MAY 使用平台适配 fixture mechanics，但 SHALL 要求两者证明相同 semantic obligation

#### Scenario: Platform workaround cannot silently weaken proof
- **WHEN** 某平台无法直接复现原 fixture 且 proposed workaround 会跳过对应 semantic obligation
- **THEN** Formal Full Test SHALL fail closed/STOP，而不得把缺失证明记为 PASS
