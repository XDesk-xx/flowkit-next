## MODIFIED Requirements

### Requirement: Terminal remains absorbing after exact prepared completion
系统 SHALL 将同一 execution occurrence 的 `terminal` 视为 absorbing boundary；`terminal A` SHALL NOT 被再次 terminal，且普通 `prepare A` SHALL 被拒绝。仅本 capability 定义的 Archive-only retry transition SHALL 允许已获合法 retry boundary 的 same semantic Archive identity 形成新 occurrence 的 prepared candidate；它不得重新打开或修改旧 occurrence。重复 Result admission 与具体 retry 的 Policy eligibility 仍不由普通 lifecycle transition 决定。

#### Scenario: Reject duplicate terminal completion
- **WHEN** current slot 已为 `terminal A` 且再次请求 terminal A
- **THEN** transition SHALL fail closed，而不得把 duplicate completion 当作新的成功 transition

#### Scenario: Reject same-identity prepare after terminal completion
- **WHEN** current slot 已为 `terminal A` 且请求普通 prepare A
- **THEN** transition SHALL fail closed，包括 archive；只能通过专用合法 retry transition 建立新 Archive occurrence

## ADDED Requirements

### Requirement: Only a failed Archive can use the bounded same-identity retry transition
系统 SHALL 为已经由 Policy 核准的 retryable terminal Archive 提供独立结构转换，要求 current 为 `terminal archive`、target 为同 Delivery/Change 的 exact same archive semantic identity，且与 exact current failure 绑定的已校验 boundary 为 `ready-action(archive)`。转换 SHALL 仅产生新 occurrence 的 `prepared` candidate；新 Run 保存读回前不得声明 current 已替换。该转换 SHALL NOT 创造 retry eligibility、Run 序号、Owner authority、第三种 lifecycle state 或通用 same-action retry。

#### Scenario: Retry a safe failed Archive as a new execution
- **WHEN** exact current Archive 安全失败且专用 retry boundary 有效
- **THEN** 系统 SHALL 允许同 semantic identity 的新 prepared candidate，旧 terminal Run 不变

#### Scenario: Reject a non-Archive or unsupported retry
- **WHEN** current 为其他 Action、prepared、completed Archive PASS、recovery-required，或 exact retry boundary 缺失/不匹配
- **THEN** retry transition SHALL 拒绝，不放宽普通 prepare 或 terminal 规则
