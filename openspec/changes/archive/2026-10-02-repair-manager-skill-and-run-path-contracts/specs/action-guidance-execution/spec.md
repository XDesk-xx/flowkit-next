## MODIFIED Requirements

### Requirement: Necessary Action proof is retained with bounded ownership and integrity checks

Agent SHALL 将本次必要 proof 输入、方法/命令、实际输出及限制保存到 target `.flowkit/artifacts/<delivery-id>/changes/<run-group>/proof/<run-id>/`，其中新 Run 的 `<run-group>` SHALL 是唯一 canonical Run 分组 `NNN-<change-id>`；历史已采用语义 `<change-id>` 分组的材料 SHALL 继续按原路径读取，不改写。Run 仅携带有界引用和交接，保持既有三文件/closed 字段。生产者及实际相关消费者 SHALL 核对当前必要引用的 project/Delivery/语义 Change/Run 归属、target 内真实路径、regular/readable、完整性和结论一致性，拒绝路径/链接逃逸或只指向 `.tmp` 的必要副本。hash 正确不等于执行真实或审查批准。Agent SHALL 从真实 Run 地址取得分组，不从 `projectOrdinal`、聊天或目录猜序号；对同一 Run 两种 Proof 分组同时存在时 SHALL 停止并报告冲突。

#### Scenario: Disposable workspace disappears after handoff

- **WHEN** 可丢弃工作目录被移除
- **THEN** 已交接必要 proof SHALL 仍在 target 可读，不依赖该工作目录或 manager 安装根

#### Scenario: Missing corrupt or wrong-owner proof is consumed

- **WHEN** 当前判断确实依赖的引用缺失、损坏、不可读、归属错误或逃逸 target
- **THEN** SHALL 阻止该项接纳/消费并指明引用，不把无关历史材料变成所有查询的前置

#### Scenario: A new execution retains independent material

- **WHEN** 同一 Action 被明确再次执行
- **THEN** 新 occurrence SHALL 保存新必要材料，历史 bytes 保持不变，无必要新材料时不创建空 proof 目录

#### Scenario: Routine flow queries do not consume raw proof

- **WHEN** status/next 只需 Run、coordination 和 OpenSpec facts 判断流程
- **THEN** SHALL 不递归扫描 proof 或因无关原始日志增长使查询阻断；保留记录不等于当前实现 PASS

#### Scenario: New Run uses its canonical group

- **WHEN** 新 Action 的 canonical Run 地址为 `.flowkit/runs/<delivery-id>/001-<change-id>/<run-id>/`
- **THEN** 产品 HOW SHALL 指向 `.flowkit/artifacts/<delivery-id>/changes/001-<change-id>/proof/<run-id>/`，且 `proofRefs.changeId` SHALL 保持语义 `<change-id>`

#### Scenario: Existing semantic path is retained

- **WHEN** 已接受的历史 Run 引用 `.flowkit/artifacts/<delivery-id>/changes/<change-id>/proof/<run-id>/` 且不存在同 Run 的编号目录
- **THEN** 该引用 SHALL 继续按原 bytes 和归属规则消费，不要求迁移到编号目录

### Requirement: Producer guidance declares every file in its own formal proof directory

Agent 在本 Run 正式 proof 目录 `.flowkit/artifacts/<delivery>/changes/<run-group>/proof/<run-id>/` 产生材料时，SHALL 在结束该 Run 前将该目录内每个文件以 exact 归属、路径、bytes、SHA-256 和用途纳入该 Run Result 的 `proofRefs`；新 Run 的 `<run-group>` SHALL 使用 canonical 编号 Run 分组，历史语义目录保持有效。若同一 Run 的编号与语义 Proof 目录并存，SHALL 停止，不得选择其中之一宣称闭合。无必要新文件时 SHALL 不建立空 proof 目录并使用空 `proofRefs`。生产者 SHALL 核对每个声明与实际原始字节，并在不能完整声明、文件不可读或身份冲突时停止完成声明，不以 `.tmp` 副本、备份分支、后补摘要或仅列出一个被选择的文件代替完整集合。后续 Action 的 handoff SHALL 仅携带当前判断需要的已声明引用；该按需交接 SHALL NOT 缩减生产 Run 的 `proofRefs`。本要求约束自有 HOW 的材料生产与交接；代码强制检查由 fixed finish 执行，不因此扫描所有历史 proof。

#### Scenario: A Run creates three proof files but lists only one

- **WHEN** 生产者准备结束本 Run，正式 proof 目录存在三个文件，而候选 `proofRefs` 只包含其中一个
- **THEN** 自有 HOW SHALL 要求先核对并完整声明该 Run 的三个真实文件，不能将不完整 Result 称作可 checkpoint 的证据

#### Scenario: Later review needs one prior proof

- **WHEN** 独立 Reviewer 的当前判断只需先前 Run 中三个已声明文件的一个
- **THEN** handoff SHALL 可只引用该相关文件，且先前 Result 的完整 `proofRefs` SHALL 保持原样

#### Scenario: No new material is needed

- **WHEN** 一个 Action 未产生需要保留的新 proof 文件
- **THEN** HOW SHALL 使用空 `proofRefs` 且不创建空 proof 目录，不为满足形式要求制造材料

#### Scenario: Prepared Run uses its bound Guidance

- **WHEN** 某 Run 只有已写的 `action.md`，其 ActionPackage 绑定旧安装的 exact Guidance SHA
- **THEN** HOW SHALL 保留该 descriptor 与必要材料，以相同 Guidance bytes 的兼容 manager 完成 exact Run 或报告 `package-drift`；SHALL NOT 改写 descriptor、伪造两文件或仅为继续而关闭绑定校验
