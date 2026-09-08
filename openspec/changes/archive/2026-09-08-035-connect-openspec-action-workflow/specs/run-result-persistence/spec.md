## MODIFIED Requirements

### Requirement: Durable Run occurrence creation is non-overwritable and sequence-unique

generated occurrence SHALL 为 create-once、Change-scoped 历史。新执行 SHALL 拒绝已有完整或部分 occurrence 及被占用 sequence，不在覆盖旧 bytes 后才失败。同一次实际执行可先写受控目录/action.md，再只创建尚未存在的 context.json/result.json 完成该记录；此许可 SHALL 不依赖 CLI 存活进程，也不允许仅凭旧目录存在自动接管。完整三文件不可修改。该顺序 single-writer 合同 SHALL 不要求锁、WAL、多 writer、事务、第四文件或新 lifecycle state。

#### Scenario: Reject writing an existing Run occurrence without changing prior bytes

- **WHEN** 新执行试图重用已有 generated occurrence，特别是已经完整的三文件
- **THEN** 写入 SHALL 在覆盖前拒绝，已有 bytes 保持不变

#### Scenario: Reject duplicate controlled sequence within one Change history

- **WHEN** 新执行使用已由完整或部分 occurrence 占用的 sequence
- **THEN** SHALL 拒绝创建重复 occurrence，不以不同 ActionId 绕过唯一性

#### Scenario: The actual producer completes its own started record

- **WHEN** 原 Agent 仍持有本次匹配的真实执行上下文，开始 descriptor 已保存，context/result 尚不存在且最终记录已通过现有校验
- **THEN** 它 SHALL 可只写缺少文件并读回，不要求旧 CLI 进程保持存活，不覆盖已有文件

## ADDED Requirements

### Requirement: Started and partially saved executions remain visible

业务工作开始前 SHALL 保存本次受控 occurrence 的真实 action.md 开始 descriptor；保存失败 SHALL 阻止该次业务工作。工作开始后的中断或 context/result 写失败 SHALL 保留已写部分，不清理目录伪装 absence。既有完整记录 writer 新建过程中的部分文件写失败也 SHALL 保留部分并报错，不扩大其 API 为任意旧目录 completion。缺 machine 文件只构成 incomplete，不凭 descriptor 推断 prepared/terminal 或成功。

#### Scenario: A started execution has no final result

- **WHEN** 所选 Change 的 occurrence 只有开始 descriptor 或不完整 machine 文件
- **THEN** 读取 SHALL 指出 exact incomplete 位置，不作为空闲、旧 PASS 或可自动恢复的执行

#### Scenario: Complete-record writing fails partway

- **WHEN** 创建本次新记录时 context 或 result 写入失败
- **THEN** writer SHALL 返回失败并保留已写文件，旧 complete-record validation/地址/sequence 检查仍有效

#### Scenario: Another session encounters a partial occurrence

- **WHEN** 后续 Agent 发现遗留 partial 且无法确认原实际工作
- **THEN** SHALL 保留并报告待核对事实，不自动补结果、接管或重演该 Action

### Requirement: Final records distinguish real failure from absent completion

完整记录 SHALL 使用既有 context/result closed 字段，分离真实 terminal 业务结论与 prepared 未终结事实。prepared 记录 SHALL 不伪造 Author/Reviewer/Verification/next 槽值；可用既有 facts 保存真实失败原因，不强制任何 transport 保留字段。只有必要三文件及当前依赖材料保存/读回成功，生产者才 SHALL 报告 durable completion；后续读取 SHALL 不受当时响应是否送达影响。

#### Scenario: A nonterminal failure has no terminal outcome

- **WHEN** 实际执行未能通过 admission，但可如实保存合法 prepared 记录
- **THEN** Author/Reviewer/Verification/next 槽 SHALL 为 null，原因保留在 facts，不要求 invocationFailure 协议形态；无法形成完整记录则保留 partial

#### Scenario: Durable terminal survives lost acknowledgement

- **WHEN** 完整合法 terminal 已保存但完成消息丢失
- **THEN** 新查询 SHALL 读出该结果，不因此自动重演工作

#### Scenario: A later permitted execution preserves the failed occurrence

- **WHEN** 既有 Policy 和明确执行边允许再次执行前次失败的 Action
- **THEN** 新执行 SHALL 使用新 occurrence 并关联前序，不覆盖此前失败或伪造其成功
