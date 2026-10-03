## ADDED Requirements

### Requirement: New Change Run allocation advances within verified Delivery occupancy

single-writer下，新Change的首次canonical Run SHALL 使用同Delivery经验证已占用最大sequence+1，无占用历史时为1；group前缀、changeStartSequence和首次occurrence SHALL 一致。后续同Change SHALL 用其前序+1并拒绝其他Change对该值的占用，不跨Change改previousRunId或静默跳号。合法partial descriptor的sequence SHALL 视为占用，未解决partial SHALL 阻断无关新开始。非法/未知归属、Change内重复/断链或无法证明占用上界的bootstrap SHALL fail closed。finish SHALL 复核已保存的exact occurrence及占用，不重算另一初始身份。

旧跨Change重号/缺口 SHALL 只读保留并可诊断，不要求全Delivery历史连续，不重命名Run/Proof或改hash；一般当前Change查询不因无关旧跨Change重号失效。旧runId SHALL 连同Delivery/Change定位。projectOrdinal SHALL 不作为分配输入；不创建持久counter/Registry或多writer协议。

#### Scenario: Allocate after MenDi shaped historical overlap
- **WHEN** 三个合法旧Change区间为1–11、12–22、1–11且没有unresolved partial
- **THEN** 新Change SHALL 从23开始，旧组查询仍按原上下文读取且原bytes不变

#### Scenario: Occupied or malformed history blocks allocation
- **WHEN** 所需历史有非法链/未知占用，或后续序号被另一Change占用
- **THEN** 系统 SHALL 报告具体冲突并拒绝新occurrence，不猜1或改父链

### Requirement: Known rejected Reviewer Runs remain durable terminal stopped facts

validated Reviewer rejected与nextBoundary=null SHALL 可按既有三文件保存和完整链读回；其known blocked Policy结果 SHALL 不使记录变为incomplete/invalid。其他角色伪verdict、未知token、错linkage及非null冲突boundary SHALL 仍拒绝。新增经Owner允许的revise SHALL 使用新occurrence并保持旧rejected原bytes。

#### Scenario: Rejection survives an independent process readback
- **WHEN** Reviewer rejected已保存并confirmed
- **THEN** 新status/next SHALL 读到同一terminal及deterministic blocked boundary，不要求重写为changes-requested

### Requirement: One immutable metadata supplement yields a verified effective facts view

Run目录 SHALL 继续仅含原三文件。correction SHALL 为target artifacts下每Run至多一个create-once文件，绑定原三文件hash、role、Owner事实、封闭缺失字段和必要证据；不得覆盖原Result或存自签成功。raw reader SHALL 保持原record；相关identity消费者 SHALL 共同验证原件、correction、证据及直接已消费后继后取得effective facts和correctionRef，context/outcomes始终来自原件。linked/missing/drifted/conflicting correction SHALL 阻断相关新消费，不静默忽略。

#### Scenario: Pure identity completion preserves exact original result
- **WHEN** 缺字段补齐与唯一已消费Reviewer候选/binding均一致且来源可证
- **THEN** effective identity SHALL 可被Review/Archive/checkpoint共同消费，旧Result及原verdict保持不变

#### Scenario: Downstream conflict invalidates reuse
- **WHEN** corrected identity与直接Reviewer的candidate/binding冲突或来源不足
- **THEN** 系统 SHALL 拒绝继承其准入、要求新的真实revise/review，不将Owner批准correction当成Review PASS

#### Scenario: Tampered original invalidates correction
- **WHEN** 任一原三文件不再匹配correction绑定hash
- **THEN** 该effective view SHALL fail closed，不能以追加文件覆盖或隐藏原件变化
