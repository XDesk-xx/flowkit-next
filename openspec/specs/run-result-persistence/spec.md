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

系统 SHALL 为一个 durable Run 使用 `action.md`、`context.json` 与 `result.json` 三文件 surface。`action.md` SHALL 作为稳定的人/AI 可读 Action descriptor；新固定命令的开始描述 MAY 在其中包含可严格识别的有界机器格式，仅供同一已开始 occurrence 的 finish 在受控来源、链及当前安装复核后接续。完整 Run 的 machine continuation facts SHALL 仍由 `context.json` 与 `result.json` 的 validated data contract 承载；新格式 marker、handle 或单独的 `action.md` SHALL NOT 构成完整 Run、current tip 或权限。不得新增第四个 durable Run 文件或追溯重写旧记录。

#### Scenario: Persist a complete Run record

- **WHEN** 一个 Action execution 已形成可持久化的 validated context 与 result
- **THEN** 对应 Run directory SHALL 包含 `action.md`、`context.json` 与 `result.json`，且读取方 SHALL 能从该目录恢复同一 Run occurrence 的 machine facts

#### Scenario: Missing machine record is not treated as a complete Run

- **WHEN** Run directory 缺失 `context.json` 或 `result.json`
- **THEN** status/next 与一般 history reader SHALL fail closed，而不得仅凭 `action.md` 推断 machine execution result；有界 finish 只可按新格式与可信事实核对后接续该 exact occurrence

#### Scenario: Historical descriptor remains intact

- **WHEN** 旧 Run 的 `action.md` 不带新命令格式
- **THEN** 完整三文件 SHALL 按原合同读取，未知旧 partial SHALL 不因新格式识别而被接管或重写

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

### Requirement: Archive outcomes are closed facts distinct from lifecycle and transport completeness
新 Archive Result SHALL 在既有 `facts.archiveOutcome` 中使用且仅使用：`{kind: completed}`、`{kind: failed, effect: no-mutation|rolled-back, retryable: true}`、`{kind: partial, effect: recovery-required, retryable: false}`。completed SHALL 与 Author PASS 和 null/checkpoint boundary 一致；failed/partial SHALL 与 Author FAIL、`nextBoundary=null` 一致。Reviewer/Verification 槽仍为 null。unknown literal、额外字段、矛盾 effect/retryable/outcome SHALL 拒绝。业务 partial 可以是完整 terminal 事实，机器文件 partial 则仍为 incomplete，二者不得混同。

旧无 archiveOutcome 的完整记录 SHALL 保持原始读取规则；不得把旧 FAIL、missing outcome 或普通 Author FAIL自动升级为 retryable。旧已接纳 Archive PASS 的成功消费 SHALL 继续按原合同校验，不要求回填新字段。

#### Scenario: Preserve a safe failed Archive
- **WHEN** 真实失败材料证明安全 active 后态且完整三文件保存成功
- **THEN** Run SHALL 以 terminal FAIL、failed outcome、null reported boundary 读回，不能因不是 PASS 而丢失

#### Scenario: Preserve partial without claiming completed Change
- **WHEN** 原生或后处理效果为 recovery-required，但 descriptor、父链和真实失败材料可验证
- **THEN** 系统 SHALL 保存并读回 terminal FAIL/partial，不制造 completed Change；机器保存失败时另报 incomplete

#### Scenario: Reject fabricated retryability
- **WHEN** outcome 使用未知值、partial 配 retryable=true、failed 配 PASS，或缺少支持其真实 effect 的绑定材料
- **THEN** 新结果 SHALL 在接纳前拒绝，不仅凭 JSON 形状授予重试

### Requirement: Archive retry history remains one immutable outcome-aware chain
当前 Change 的 Archive retry SHALL 使用新受控 sequence/occurrence，`previousRunId` SHALL 指向 exact failed Archive tip，而不是绕过它指向旧 Review。链解释 SHALL 根据已接纳 outcome 验证节点与 parent edge，不能仅因 actionId=archive 就假设 completed。approved Review 来源 SHALL 只通过连续安全失败 Archive 的唯一 parent 链追溯到相匹配的 review-apply/Author；partial、PASS、未知结果、fork、错 target 或不连续 sequence SHALL 阻断该追溯。

#### Scenario: Read failed then successful retries
- **WHEN** R16 terminal Archive FAIL 后合法生成 R17 Archive PASS
- **THEN** 历史 SHALL 保留两个 immutable Run，R17.parent=R16，独立读回 tip 为 R17，不能修改 R16 或复用 R15 Review 为直接 parent

#### Scenario: Safe failure returns to an authorized revision
- **WHEN** 明确 Owner correction 从安全失败 Archive 创建合法 revise successor
- **THEN** 链 SHALL 保留失败为 direct parent，再沿普通 revise/review 后继验证，不把该边误认为从 completed Change 重开

#### Scenario: Do not skip a partial or ambiguous parent
- **WHEN** 旧 Review 与新请求之间包含 partial/unknown、completed PASS 或 fork
- **THEN** 链 SHALL 拒绝普通 Archive retry，不回退选择早期 PASS

### Requirement: Candidate Git projection preserves raw identity without rewriting history
新成功 Author 候选 SHALL 保留既有 raw identity 字段含义，并以有界、versioned `facts.candidateGit` 保存与同一候选逐路径绑定的 raw SHA-256、预期 Git blob OID、Git object format、受支持转换类型、必要有效 EOL 设置和相关 stage-0 `indexBasis`。索引依据 SHALL 区分 absent 与普通 entry；entry 保存原 mode、blob OID 及可靠的 EOL 分类，以解释普通 staging 对既有 CRLF/LF/mixed 内容的处理。该机械事实 SHALL 由新结果接纳时只读校验产生；不得修改 Author 结论、伪造 Review 或 Verification PASS。相同路径集合、原始 hash、结构版本、各 OID 长度、索引依据与既有大小上限 SHALL 校验；未知、非普通或未合并索引状态、partial/冲突 map不得被当作成功投影消费。

绑定的预期 blob SHALL 对应同一 raw、有效 Git 规则及相关索引前态下的普通入库语义。自动文本模式下已存在的非 binary CRLF/mixed 索引允许保存 identity，而不强制记录 LF。后续只读消费者 SHALL 区分输入依据与已核实的预期输出：索引仍为绑定输入，或已为同一预期 blob 且满足既有 mode/path 合同，均可继续核对；其他相关变化不得悄悄改写原 indexBasis 或预期 blob。该依据仅覆盖候选路径，不持久复制整个 index。

普通 add 可因 stat cache 跳过 clean，故原 index blob bytes 与 raw 相同、但 clean/EOL 内容不同时 SHALL 在成功候选持久化前明确 unsupported，不保存猜测的 LF 或以旧 CRLF 冒充稳定 identity。仅 stat/时间戳改变 SHALL 不改变该拒绝；不新增持久 stat 依据或补造历史投影。输入与已核实输出的消费均遵守相同支持边界，不能靠保存后 mismatch 再重绑预期。

旧记录缺该字段时 SHALL 不被自动回填；只可使用旧合同能证明的 raw==blob 路径，不能凭当前工作树追认旧 raw!=blob 记录。原 Run/proof/correction 的 SHA-256 继续指向原 bytes，不能将其默默换成 normalized hash。

#### Scenario: Retain both identities for CRLF source
- **WHEN** 新候选 raw为CRLF且仅由确认的 Git EOL 规则投影为LF
- **THEN** 保存的 raw hash SHALL 对应实际原文件，blob OID SHALL 对应预期入库内容，两者允许不同但必须绑定同一候选

#### Scenario: Existing CRLF index produces an identity binding
- **WHEN** 同一路径已在 stage-0 以非 binary CRLF 保存，有效规则为 text=auto 或继承 autocrlf 的自动模式，当前 raw 修改后仍为 CRLF
- **THEN** candidateGit SHALL 绑定该索引前态并记录当前 raw 对应的 identity blob，不把无索引预测出的 LF 当作普通 staging 结果

#### Scenario: Staging preserves the immutable projection input
- **WHEN** 合法暂存已将该路径从绑定的输入条目更新为预期 blob，而 raw、规则和其余身份仍有效
- **THEN** 消费者 SHALL 接受已验证输出且保留原 indexBasis 不变，不为正常暂存改写历史；非预期条目仍拒绝

#### Scenario: Legacy metadata cannot fabricate a past projection
- **WHEN** 旧 Result 只有 raw hashes，当前工作区可生成一个不同的 normalized blob
- **THEN** 系统 SHALL 不为旧结果添加 candidateGit 或改 hash；需要新身份时重新形成真实候选并独立审核

#### Scenario: Immutable evidence remains byte exact
- **WHEN** 原始日志、Run、proof 或 byte-sensitive/binary 路径参与候选
- **THEN** 其存储 SHALL 保持原 bytes，不能因为 candidateGit 支持 EOL 就修改既有证据摘要

#### Scenario: Unstable clean prediction is not a successful durable fact
- **WHEN** raw 与旧 CRLF index blob 完全相同而显式 text 的 clean 为 LF，无论 stat 命中或仅时间戳改变
- **THEN** 新结果 SHALL 在成功候选保存前拒绝 unsupported，不把任意一次 add 结果当成两种状态的通用绑定，也不增加 stat 数据库
