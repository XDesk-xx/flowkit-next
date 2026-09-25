# single-action-execution-terminal-boundary Specification

## Purpose
为 Flowkit Core 定义一次 Standard Action invocation 的最小组合边界，使内部 current-Action establishment/reuse、exact ActionPackage execution、Result admission 与 terminalization 在一次调用中闭合，并在结果报告后只 STOP 一次而不自动推进下一 Action。

## Requirements

### Requirement: Invocation entry establishes or reuses exactly one prepared current Action
系统 SHALL 接受一个已由外部 boundary 选择的 canonical Standard Action identity 作为一次 invocation target。若 exact same target 已经是 externally committed `prepared A`，系统 SHALL 复用该 exact prepared CurrentAction。若 current slot 为空，或 current slot 为不同 identity 的 terminal Action 且既有 structural prepare rule 允许 replacement，系统 SHALL 在 invocation 内部只暂存 structurally valid `A/prepared` candidate；在 package-bound preparation/readiness 成功前 SHALL NOT 将该 staged candidate 暴露为新的 externally committed current Action。若 exact current 为 `prepared` Author A，且同一 exact Owner correction boundary 已允许不同的 revise target B，系统 SHALL 可通过有界 supersession transition 暂存 `B/prepared` candidate；只有新 occurrence 的开始及必要完整记录经保存和读回后，B 才能成为对外 current。其他 current-slot/target 组合 SHALL fail closed。本 capability SHALL NOT 决定 target 的 Policy eligibility。

#### Scenario: Internally prepare an empty current slot
- **WHEN** current slot 为空且 invocation target 为 canonical Standard Action A
- **THEN** invocation entry SHALL 可在本次 invocation 内暂存 structurally valid `A/prepared` candidate，但 SHALL NOT 在 package-bound preparation 成功前把它提交为 externally current Action

#### Scenario: Reuse the same prepared Action for a later invocation
- **WHEN** exact current Action 已为 `A/prepared`，且外部 boundary 再次选择执行同一个 canonical Action A
- **THEN** invocation entry SHALL 复用 existing `A/prepared`，不得调用会被拒绝的 duplicate `prepare A`

#### Scenario: Reject a different target over a prepared Action
- **WHEN** current slot 为 `A/prepared` 但 invocation target 为不同的 B，且不存在对此 exact A/B 有效的 Owner correction boundary
- **THEN** invocation entry SHALL fail closed，而不得替换 current Action

#### Scenario: Stage authorized prepared supersession
- **WHEN** current 为 `prepared` Author A、Policy 已对同一 A/B 和 exact Owner authority 返回 `READY_ACTION(B)`，且 structural supersession 允许 B
- **THEN** invocation entry SHALL 仅暂存 `B/prepared`，并 SHALL 以新 occurrence、前序指针、authority 和 canonical GuidanceRef 形成新 ActionPackage；不得先改写 A

### Requirement: Each invocation binds execution to one new exact Run occurrence and ActionPackage
每次实际 Standard Action invocation SHALL 使用 exact invocation target、当前/暂存的 exact prepared Action identity、一个 exact current Run occurrence/context 与 exact canonical GuidanceRef 形成一个 ActionPackage；同一个 externally committed `prepared A` 的后续再次 invocation SHALL 使用新的 exact Run occurrence 来区分 execution occurrence，而 SHALL NOT 通过 `resumed`、retry counter、attempt id、PackageId、PreparationPackage 或 ResultId 建立第二套 execution identity。形成的 package SHALL 满足既有 ActionPackage closed validation contract，并 SHALL 是该 invocation 中 package-bound preparation与后续 execution 的同一 exact package identity。

#### Scenario: Form the first exact execution package
- **WHEN** invocation target A 可被 structurally staged 为 `A/prepared`，且当前 Run context 与 canonical GuidanceRef 均有效
- **THEN** 系统 SHALL 从该 exact staged prepared identity、exact Run occurrence与 exact GuidanceRef 形成一个 ActionPackage，并在 preparation成功前不得把 staged prepared identity 暴露为新的 externally current Action

#### Scenario: Re-execute the same prepared Action with a new Run occurrence
- **WHEN** 前一次 invocation 未能 admission Result而 externally current Action 保持 `A/prepared`，且后续 invocation 获得新的 exact Run occurrence/context
- **THEN** 系统 SHALL 从同一 `A/prepared` 与新的 Run context 形成新 ActionPackage，旧 occurrence/package SHALL NOT 被当作当前 execution occurrence

### Requirement: Successful admission terminalizes only the exact current Action
系统 SHALL 仅在 candidate Result 通过既有 exact Result admission 后，才在同一次 invocation 内 terminalize package/current Action 所指向的 exact same canonical ActionIdentity。terminal transition 失败 SHALL 使 invocation fail closed，且 SHALL NOT 报告该 Action 已完成。

#### Scenario: Admit then terminalize the exact prepared Action
- **WHEN** candidate Result 对 exact current `A/prepared` 与 exact current Run occurrence admission 成功
- **THEN** 系统 SHALL terminalize exact A、保留 admitted Result，并将 invocation 视为 terminal completion

#### Scenario: Do not terminalize an unadmitted Result
- **WHEN** candidate Result admission 失败
- **THEN** 系统 SHALL NOT terminalize current Action，也 SHALL NOT 制造成功 completion fact

### Requirement: Admission failure preserves the prepared Action and stops the invocation
candidate Result admission 失败时，系统 SHALL 保持 exact current Action 为 `prepared`，报告 bounded failure/blocked fact，并结束当前 invocation。系统 SHALL NOT 自动 retry、resume、创建 recovery state、执行下一 Action 或修改当前 Action identity。

#### Scenario: Failed admission leaves the exact Action prepared
- **WHEN** exact `A/prepared` 的 candidate Result 因 Run、Action、state、role 或 outcome-slot mismatch 而 admission 失败
- **THEN** invocation SHALL 以 failure 结束且 current Action 仍为 exact `A/prepared`

#### Scenario: Failed admission does not start another attempt automatically
- **WHEN** 当前 invocation 因 admission failure 结束
- **THEN** 系统 SHALL STOP，且 SHALL NOT 自动创建新 Run occurrence 或再次执行 A

### Requirement: Invocation reports result facts and stops exactly once without interpreting Policy
一次 invocation 成功时，系统 SHALL 报告 admitted Result 与 terminal current-Action fact；失败时 SHALL 报告 bounded failure fact。若 admitted Result 包含 `nextBoundary`/continuation value，系统 SHALL 将其保持为 opaque reported data。无论成功或失败，本 capability SHALL 在当前 invocation boundary 后 STOP，且 SHALL NOT 判断 legal next Action、自动 prepare/execute 下一 Action、创建 Owner authority 或 formal Verification verdict。

#### Scenario: Successful invocation reports opaque continuation and stops
- **WHEN** exact Result admission 与 terminalization 均成功，且 admitted Result 携带 `nextBoundary`
- **THEN** 系统 SHALL 报告该 admitted Result/terminal fact并原样保留 `nextBoundary`，随后 STOP，而不得解释或执行该 boundary

#### Scenario: Failure reports and stops without next execution
- **WHEN** invocation entry、package formation、Result admission或terminal transition任一 fail closed
- **THEN** 系统 SHALL 报告 bounded failure并 STOP，且 SHALL NOT 自动执行其他 Standard Action

### Requirement: Package-bound preparation can block before a newly prepared Action is committed
当 invocation 需要从空/terminal current slot 建立新的 prepared Action 时，系统 SHALL 在同一个 exact ActionPackage identity 下执行一个只读 preparation/readiness step。若该 step BLOCK/FAIL 于 Action execution 之前，系统 SHALL NOT 调用 Action execution callback，SHALL NOT 暴露/提交 staged prepared candidate，并 SHALL 返回 pre-invocation current Action unchanged。若 preparation PASS，系统才可使用/提交 exact prepared candidate并继续既有 execution/admission/terminal flow。该行为 SHALL NOT 新增 Action、lifecycle state、PreparationPackage、Preparation Run 或 rollback lifecycle。

#### Scenario: Blocked preparation preserves the terminal review boundary
- **WHEN** current Action 为 terminal `review-apply`，Policy 已选择 exact `archive` target，且 package-bound archive readiness BLOCKS before archive execution
- **THEN** invocation SHALL 返回原 terminal `review-apply` current Action unchanged，SHALL NOT 调用 archive execution callback，并 SHALL NOT 暴露新的 `archive/prepared` current Action

#### Scenario: Successful preparation continues the existing Action execution
- **WHEN** package-bound preparation for exact Action A PASS
- **THEN** invocation SHALL continue with the same exact ActionPackage into existing Action execution/result-admission/terminalization behavior without creating a second preparation identity

### Requirement: Agent execution uses existing Action contracts without mandatory CLI hosting

已明确 Action/Role 的 Agent SHALL 能依既有 canonical Guidance、ActionPackage、Result admission 与 prepared/terminal 合同执行一次实际工作并记录结果，而不要求 CLI 进程托管该工作或提供通信协议。既有内核 invocation 的 package-bound preparation、execute/admission/terminal 行为 SHALL 为调用该 API 的程序保持原语义；Agent 路径 SHALL 遵循相同身份和结果约束，但不必把实际工作塞进内核 callback。Guidance/package resolution 与 preparation SHALL 在业务修改之前完成；同一次执行 SHALL 保持 exact package/Role。SHALL NOT 新增生命周期状态、模型平台、自动角色切换或下一 Action。

#### Scenario: Agent works after a query has exited

- **WHEN** 查询已返回合法边，实际 Agent 已获准执行并完成既有 package-bound preparation
- **THEN** Agent SHALL 使用同一 exact 执行上下文工作和校验结果，不等待 CLI 的 execute 帧

#### Scenario: Existing kernel callers keep bounded invocation semantics

- **WHEN** 程序继续调用既有单次 invocation API
- **THEN** 原 preparation blocked 保持 current、exact admission/terminal、failure 和 STOP 合同 SHALL 保持，不强制改用新协议

#### Scenario: Agent cannot bypass result identity or role

- **WHEN** 待保存结果与本次 package 的 Run/Action/Role 或 outcome slots 不匹配
- **THEN** Agent SHALL 不报告完成，不用直接写 terminal JSON 绕过既有 admission；保留实际失败或未完成事实

### Requirement: One actual Agent execution is recorded before durable completion is reported

Agent SHALL 在准备通过后记录本次真实开始，再进行实际工作；只有必要材料保存、结果通过既有 exact admission、terminal transition 合法且三文件读回一致，才报告 durable completion。不能形成完成事实时 SHALL 保留实际失败/partial，明确区分 terminal 业务 FAIL 与 prepared 未终结，SHALL NOT 回用旧 PASS、自动重试、回滚或接管历史未完成执行。continuation SHALL 服从既有 Policy，单次内核仍仅报告 opaque continuation，不复制转换表。

#### Scenario: Preparation blocks before work starts

- **WHEN** Action readiness 不满足
- **THEN** Agent SHALL 保留之前 current，不开展业务修改、不建立独立 preparation Run 或新的审批节点

#### Scenario: Necessary save or readback fails

- **WHEN** 工作已发生但必要材料、context/result 保存或读回失败
- **THEN** Agent SHALL 报告具体缺口并保留已产生事实，不声称 durable completion，不清理为未执行

#### Scenario: Independent review remains an actual role boundary

- **WHEN** 当前合法边要求 Reviewer
- **THEN** Reviewer SHALL 独立审查并保存自己的真实 verdict；Author 不自审，流程查询或合成 approved 不替代审查

### Requirement: Acceptance measures bounded behavior rather than a mandatory rehearsal count

本 Change 验收 SHALL 覆盖一个有界实际工作与规范记录示例、独立查询进程的正确续接、未完成和错误事实诊断、无自动执行；Review/revise 等程序分支可用明确标为合成的 fixtures 验证，但 SHALL NOT 冒充正式独立 Review。SHALL NOT 将两个真人 Change、强制 finding、必须第二套安装或长期存活终端作为本能力的必需验收条件。既有分根发行和相关平台回归 SHALL 按改动适用性保持。

#### Scenario: Actual recording and a fresh query are sufficient for the handoff example

- **WHEN** 一个实际 Agent 工作按 HOW 产生真实记录，独立查询进程正确读回，而其他分支有适用回归
- **THEN** SHALL 不仅因没有第二个真人 Change 或人为 finding 将该交接示例判为未完成

#### Scenario: Synthetic review data stays a test fixture

- **WHEN** 测试用预制 approved/changes-requested 检查 Policy 和读回
- **THEN** 证据 SHALL 明确标为合成，不创建真实 Reviewer authority 或声称实际审查 PASS

### Requirement: Prepared supersession start and failure are ordered and non-destructive
系统 SHALL 在新 revise 业务工作前验证 exact current Run、Owner boundary、target、Run address、GuidanceRef 和 ActionPackage，create-once 保存真实新 `action.md` 并读回。开始保存前失败 SHALL 保持旧 prepared current 与所有旧 bytes；开始后的中断或 machine 文件部分保存 SHALL 保留 partial、报告 exact failure 并 STOP，不得自动清理、重试、补结果或执行下一 Action。只有新 Run 完整、admission 与 chain readback 均成功，系统 SHALL 报告新 current/terminal continuation fact。

#### Scenario: Pre-start rejection leaves old current intact
- **WHEN** Owner authority、Policy、target、package 或新地址核对在写入 `action.md` 前失败
- **THEN** 旧 prepared Run SHALL 仍是 current，且其三文件/proof 原 bytes SHALL 不变

#### Scenario: Partial successor stops without rollback guess
- **WHEN** 新 revise 的开始 descriptor 已保存，但读回或后续 context/result 保存失败
- **THEN** 系统 SHALL 保留 partial 并报告，STOP；不得把旧 Run 改成 terminal、把 partial 当完整 current 或自动重演

#### Scenario: Revised Author action returns to independent Review
- **WHEN** 新 revise Author Action 真实完成并以合法 PASS Result terminalize
- **THEN** 系统 SHALL 只报告该 revise 的正常 `review-*` boundary 并 STOP；Reviewer verdict 必须来自后续独立 Action
