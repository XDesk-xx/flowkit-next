## MODIFIED Requirements

### Requirement: Terminal revise start preserves exact Owner and predecessor facts

fixed start SHALL 接纳既有active terminal阶段Owner revise、known rejected对应revise、六个普通Author exact terminal FAIL/null的合法Owner revise和安全failed Archive后的窄revise-propose/revise-apply，同时保留prepared Author correction。Owner fact SHALL 为既有revise-action、same target、single requested scope并绑定新package/descriptor/context；新Run指向原tip，不改旧结果。Archive correction核对安全active与原失败链，不要求待修候选仍等于旧Review；直接Archive retry仍要求同候选。

unknown outcome、不满足专门correction合同的普通Author FAIL、invalid chain、prepared Reviewer、partial/completed Archive或reported conflict SHALL 不被Owner fact兜底。普通Action不新增Owner审批。

固定 start/inspect/finish/current-run-chain SHALL 对普通 Author FAIL/null 使用 policy-and-next-boundary 的同一 correction 合同；不同 identity 使用原 prepare，三个同名 revise 使用专门新 occurrence 结构边。start SHALL 从真实 current pair 和 Owner 请求形成 descriptor/preparedContext，绑定直接失败 parent 和原 scope；inspect/finish/chain SHALL 从 descriptor、exact parent 和原绑定 Owner fact 重建，不接受 caller 手填内部 boundary/parent/witness，不在 finish 新造 authority。bare READY SHALL NOT 代替失败来源。固定入口 SHALL 不代执行 Author 业务或自动下一 Action。Owner correction 的 Policy/结构可进入 SHALL 不豁免原机器 readiness；缺 ordinal、coordination、runtime 或必要 proof 时 SHALL 按原适用规则拒绝新开始，不因 FAIL 重新分配编号。

#### Scenario: Explicit revise follows known rejection

- **WHEN** review-apply rejected/null有效且Owner授权same Change的revise-apply
- **THEN** start SHALL 经Policy/结构核对建立唯一Author successor，不改原verdict

#### Scenario: Unknown verdict cannot be rescued by Owner fact

- **WHEN** Review outcome或原记录/绑定无法验证
- **THEN** start SHALL 拒绝，不按known rejection续行

#### Scenario: Candidate correction after failed Archive remains reachable

- **WHEN** 安全failed Archive后需要改delta/源码且Owner授权对应revise
- **THEN** start SHALL 允许合法修订接原failed parent，后续重新形成候选和独立Review；不得先要求旧candidate unchanged而锁死修订

#### Scenario: Read back one failed Author correction through every seam

- **WHEN** 六个普通 Action 任一合法 FAIL/null 经 exact Owner revise start，真实工作后 inspect/finish 和独立查询
- **THEN** 各入口 SHALL 得到同一 occurrence/parent/authority 和可进入边界；新 PASS 后 SHALL 指向对应 Review

#### Scenario: Reject bad authority before creating the successor

- **WHEN** Owner scope/target/decision 错误或缺失，或 current pair stale
- **THEN** start SHALL 拒绝且不创建新 descriptor，旧 Run SHALL 不变

#### Scenario: Reject changed evidence during inspect or finish

- **WHEN** 原 descriptor/parent/linkage/Owner 绑定不再有效
- **THEN** inspect/finish/chain SHALL fail closed，不用新的 caller authority 掩盖历史变化

#### Scenario: Keep other terminal and partial outcomes bounded

- **WHEN** 同名 terminal PASS、UNKNOWN、Reviewer 或 Archive partial/machine partial 请求套用普通失败 correction
- **THEN** 固定入口 SHALL 保持原拒绝/恢复边界，不重开或补写旧 Run

#### Scenario: Keep machine readiness after a failed correction is authorized

- **WHEN** exact 普通 Author FAIL/null 的 Owner correction 已通过 Policy/结构核对，但 revise-explore 所需持久 ordinal 缺失
- **THEN** start SHALL 在 descriptor 创建前按 project-ordinal-invalid 拒绝，旧失败 bytes 不变；有已消费历史 SHALL 不通过 fresh 首值 1 绕过

## ADDED Requirements

### Requirement: First Explore readiness admits only verified fresh ordinal initialization

canonical product-managed first Explore readiness SHALL 使用 author-action-guidance 的完整 fresh predicate，在无 assigned baseline 且所有来源可判定时允许候选 ordinal=1；已有 baseline SHALL 按原复用/max+1。start SHALL 不写 ordinal；合法 descriptor-only 当前 first Explore continuation SHALL 不被误判为已消费历史，重复 start/create-once SHALL 仍保持原规则。实际 Explore HOW SHALL 重读后写 exact coordination entry；新 terminal Explore PASS 的 finish SHALL 核对真实持久 ordinal 与 Result 一致，不消费临时候选值作为 durable truth。发现历史而无编号 SHALL 拒绝，不用 Init/Activate 预分配或新 seed 绕过。

#### Scenario: Start and finish a verified fresh first Explore

- **WHEN** project/coordination/OpenSpec/history/artifact/archive 全部满足 fresh predicate
- **THEN** start SHALL 建立真实 descriptor 并保持 manifest 未编号；HOW 写 1 后 finish SHALL 接纳一致 Result

#### Scenario: Permit only the current descriptor continuation

- **WHEN** 当前 first Explore 已建立唯一合法 descriptor、无 machine files，当前 proof 归属有效
- **THEN** readiness SHALL 允许继续，但 SHALL 不把重复 start 当新 occurrence 或把 proof 当编号 authority

#### Scenario: Reject history without an assigned baseline

- **WHEN** 无编号但有 bootstrap/partial/旧 Run/orphan proof/历史 archive 或未知来源
- **THEN** readiness SHALL 拒绝，不产生 ordinal 或修复历史

#### Scenario: Reject missing or conflicting persisted ordinal at finish

- **WHEN** 新 terminal Explore PASS 的 coordination ordinal 缺失、重复或与 Result 不同
- **THEN** finish SHALL 拒绝，不自动写编号或按 Run sequence 补值

#### Scenario: Preserve a genuine failure before ordinal materialization

- **WHEN** 已合法建立 first Explore descriptor，但 HOW 在持久编号前真实失败，提交合法 terminal Author FAIL/null
- **THEN** finish SHALL 保留原失败接纳规则，真实三文件可保存且 query 停在普通 Author failure；不得填造 ordinal/PASS 或阻止记录失败

### Requirement: Finish budget diagnostics precede machine result writes

固定 finish caller facts 和 manager 生成 candidateGit 后的最终 merged facts SHALL 共用 run-result-persistence 的 bytes/depth/nodes 预算测量。caller 超限 SHALL 保留 invalid-request；生成后超限 SHALL 保留 result-admission-rejected 与既有 effect/runId。两者 SHALL 带 foundation-cli-surface 定义的封闭安全 error.budget，subject=result-facts，limit 为对应固定预算，observed/measurement 如实反映完整值或下界。已发现的 schema/非 JSON-compatible 错误 SHALL 不被预算错误遮蔽；预算提前停止 SHALL 不要求遍历未访问部分或声明整个 payload 合法；CLI envelope bytes 超限 SHALL 优先用 request 诊断。

最终 merged facts SHALL 在 context/result 首写前完成预算核对；拒绝 SHALL 保留 action.md 与真实 proof，不写任一 machine file、不伪造 machine partial。真实修正后可按既有合法 descriptor 继续 finish，不清理或覆写终态。所有 refs/hashes/candidate identity SHALL 仍完整验证。

#### Scenario: Diagnose oversized caller facts

- **WHEN** 请求 envelope 合法但 caller facts 超 depth/nodes 预算
- **THEN** finish SHALL 输出 invalid-request 和 result-facts budget，未创建 context/result

#### Scenario: Diagnose generated metadata overflow before writes

- **WHEN** caller facts 合法且未提供 candidateGit，manager 生成并合并候选后超 bytes/nodes/depth
- **THEN** finish SHALL 输出 result-admission-rejected、原 effect/runId 和 budget，保留 descriptor/proof 且两个 machine files 均不存在

#### Scenario: Continue a genuine corrected finish

- **WHEN** 先前仅因 merged budget 被拒绝，真实材料已修正且原 descriptor/其他合法性仍有效
- **THEN** 同 Run finish SHALL 可正常核对/保存/读回，不把先前拒绝声明为终态 PASS

#### Scenario: Diagnose the envelope before nested facts

- **WHEN** 整个 finish 请求先超过默认 65,536 bytes
- **THEN** CLI SHALL 先输出 request bytes 诊断，不宣称 facts validator 已执行
