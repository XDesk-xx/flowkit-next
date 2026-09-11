# run-result-persistence Specification

## Purpose
为 Flowkit Foundation 提供最小、Change-scoped 且可重读的 Run / Result durable persistence contract，使顺序执行的 Author 与 Reviewer 能通过 `.flowkit/runs` 交接真实执行事实，而不依赖聊天历史，也不把 persistence 扩展成 Result admission、Policy 或多-Agent orchestration。

## Requirements

### Requirement: Run occurrence is distinct from semantic Action identity

系统 SHALL 为每次实际 Standard Action execution 建立独立的 Change-scoped Run occurrence；同一 `ActionIdentity` 在同一 Change 中重复执行时 SHALL 能产生不同 occurrence，且 occurrence information SHALL NOT 被写回或替代既有 semantic `ActionIdentity`。

#### Scenario: Distinguish repeated review executions

- **WHEN** 同一 Delivery / Change 中先后执行两次 canonical `review-explore`
- **THEN** 两次 execution SHALL 拥有不同 Run occurrences，同时两者 SHALL 仍引用同一个 semantic `ActionIdentity`

#### Scenario: Preserve Action identity semantics

- **WHEN** 一个 Run occurrence 被创建
- **THEN** 系统 SHALL 保持其 DeliveryId、ChangeId 与 StandardActionId 的既有 canonical semantics，而不得通过 Run sequence/date 改写 Action identity

### Requirement: Flowkit generates the canonical Change-scoped Run address

系统 SHALL 只从 Flowkit-controlled canonical inputs 生成 Run directory address，并 SHALL 将 Run 按 Delivery / Change 聚合到 `.flowkit/runs/<delivery-id>/<change-sequence>-<change-id>/<run-occurrence>/`。Run occurrence directory SHALL 为 exact Change root 的单层 repository-relative child；外部 caller SHALL NOT 能以任意 filesystem path string 指定 Run directory authority。

当前 capability 的 canonical generated occurrence SHALL 使用 `YYYYMMDD-NNN-<known-action-name>` 形态，其中日期、正整数 Action sequence 与 Standard Action name 均在生成前验证为受控值。

#### Scenario: Generate a direct-child Run address

- **WHEN** 系统收到 canonical DeliveryId、ChangeId、Change start sequence、canonical date、positive Action sequence 与 known StandardActionId
- **THEN** 系统 SHALL 生成唯一 repository-relative Change-scoped Run directory，且该目录 SHALL 是 exact Change root 的直接子目录

#### Scenario: Reject invalid generator inputs before filesystem use

- **WHEN** date、sequence、DeliveryId、ChangeId 或 ActionId 任一不满足本 capability 所要求的 canonical controlled input
- **THEN** 系统 SHALL fail closed，且不得产生 filesystem address 或尝试将该输入 normalize 为可用 path

### Requirement: One durable Run uses the stable three-file record surface

系统 SHALL 为一个 durable Run 使用 `action.md`、`context.json` 与 `result.json` 三文件 surface。`action.md` SHALL 作为稳定的人/AI 可读 Action descriptor；machine continuation facts SHALL 由 `context.json` 与 `result.json` 的 validated data contract 承载。

#### Scenario: Persist a complete Run record

- **WHEN** 一个 Action execution 已形成可持久化的 validated context 与 result
- **THEN** 对应 Run directory SHALL 包含 `action.md`、`context.json` 与 `result.json`，且读取方 SHALL 能从该目录恢复同一 Run occurrence 的 machine facts

#### Scenario: Missing machine record is not treated as a complete Run

- **WHEN** Run directory 缺失 `context.json` 或 `result.json`
- **THEN** 系统 SHALL fail closed，而不得仅凭 `action.md` 推断 machine execution result

### Requirement: Run context round-trip preserves handoff identity and authority facts

系统 SHALL 以 JSON-compatible exact validated context record 保存 Run occurrence、Delivery / Change / Action identity、execution role、适用时的 Action lifecycle state、显式 OwnerAuthorityFact 或其 absence、以及 sequential handoff 所需的 previous/input Run reference。write → read round-trip SHALL 保留这些 durable facts，不得生成、删除、排序、trim、case-fold 或推断 authority/identity 值。

#### Scenario: Preserve explicit Owner authority through round-trip

- **WHEN** validated Run context 包含一个 structural-valid `OwnerAuthorityFact`
- **THEN** write → read SHALL 返回字段等价的 Owner authority fact，且 persistence SHALL NOT 判断该 authority 对某 boundary 的 Policy eligibility

#### Scenario: Preserve absent authority as absent

- **WHEN** validated Run context 未提供 Owner authority fact
- **THEN** write → read SHALL 保持 authority absent，且系统 SHALL NOT 根据 Reviewer verdict、terminal state 或其他事实生成 Owner authority

#### Scenario: Preserve Author and Reviewer handoff identity

- **WHEN** Author Run 或 Reviewer Run 被持久化并重新读取
- **THEN** Run occurrence、DeliveryId、ChangeId、ActionId、role 与 previous/input Run reference SHALL 与写入前一致

### Requirement: Result round-trip preserves outcome facts without collapsing authority semantics

系统 SHALL 使 Run result 与 exact Run occurrence / Delivery / Change / Action linkage 绑定，并 SHALL 分离保存 Author conclusion、Reviewer verdict 与 Verification verdict。`verificationVerdict = null` SHALL 是普通中间 Change Run 的合法 durable value。reported next boundary SHALL 在本 capability 中仅作为 data 保存，不得被 persistence 解释为 legal boundary。

#### Scenario: Preserve Reviewer approval without inventing Verification PASS

- **WHEN** Reviewer Result 包含 reviewer verdict `approved` 且 `verificationVerdict = null`
- **THEN** write → read SHALL 保持这两个值不变，且系统 SHALL NOT 从 `approved` 推导 Verification PASS

#### Scenario: Preserve an Author conclusion independently

- **WHEN** Author Result 包含 Author conclusion 且 Reviewer/Verification verdict 不适用
- **THEN** write → read SHALL 保持 Author conclusion，并 SHALL 保持不适用 verdict 为 null/absent contract value，而不得复制 Author conclusion 到 Reviewer 或 Verification 字段

#### Scenario: Preserve reported next boundary as opaque handoff data

- **WHEN** Result 包含一个由当前 Action 报告的 next-boundary value
- **THEN** persistence SHALL 原样保存和读取该 value，且 SHALL NOT 判断该 boundary 是否由 Policy 允许

### Requirement: Run and Result integrity validation fails closed

系统 SHALL 在 durable bytes 被采用为 Run facts之前解析并执行 exact structural validation。invalid JSON、缺失 required field、未知字段（在 exact schema 处）、非法 identity/role/action/lifecycle/authority 值或 Run ↔ Result linkage mismatch SHALL 被拒绝；系统 SHALL NOT 通过 guess、default、trim、case-fold、alias、字段补齐或 silent repair 将 malformed durable state 变为有效事实。

#### Scenario: Reject malformed durable JSON

- **WHEN** `context.json` 或 `result.json` 为 truncated/invalid JSON
- **THEN** 系统 SHALL reject 该 Run record，且不得返回部分恢复的 durable fact

#### Scenario: Reject Run and Result occurrence mismatch

- **WHEN** `context.json` 与 `result.json` 声称属于不同 Run occurrence，或其 Delivery / Change / Action linkage 不一致
- **THEN** 系统 SHALL fail closed，且不得把二者 admission 为一个完整 Run

#### Scenario: Reject invalid embedded authority

- **WHEN** context 中携带 malformed `OwnerAuthorityFact`
- **THEN** 系统 SHALL reject context，且不得 normalize 或 fabricate authority

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

### Requirement: Sequential Change-scoped history is readable without becoming a global registry

系统 SHALL 能够读取指定 Delivery / Change root 下的 durable Run occurrences，并按受控 Action sequence 确定稳定顺序，以支持 Author → Reviewer → Author 的顺序 handoff。该能力 SHALL NOT 构成跨 Delivery global Run registry、scheduler、locking 或自动 next-Action orchestration。

#### Scenario: Read a sequential Change history

- **WHEN** 指定 Change root 下存在多个 valid generated Run occurrences
- **THEN** 系统 SHALL 能够返回这些 valid Runs 的稳定 sequence order，使下一 Actor 能选择已明确引用/最新的 durable handoff fact

#### Scenario: Persistence does not auto-execute the next Action

- **WHEN** 最新 Result 报告一个 next boundary
- **THEN** history read SHALL 只返回该 durable fact，且系统 SHALL STOP 而不得自动 prepare、assign 或 execute 下一 Action

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
