## ADDED Requirements

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
