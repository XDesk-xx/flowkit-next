## ADDED Requirements

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
