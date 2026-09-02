## MODIFIED Requirements

### Requirement: OpenSpec formal non-zero outcomes remain distinct from integration failures
系统 SHALL 只依据当前 host 实际暴露的 child-process invocation / close facts 区分 process failure 与已形成的 numeric process outcome。Spawn/error、`code = null` 或 `signal != null` SHALL 视为 host-observable process failure；一旦 host 报告 numeric exit code 且没有 signal，系统 SHALL 先验证 required stdout 是否为合法 machine JSON。Numeric close + malformed required JSON SHALL 保持 `malformed-machine-output`；numeric non-zero + valid OpenSpec formal machine JSON SHALL 保持 machine-distinguishable `openspec-formal-outcome`。系统 MUST NOT 根据 hidden OS termination cause、platform name、特定 numeric exit code、empty stdout 或 stderr text 猜测 process failure，也 MUST NOT 解析 free-text message 来重新实现 OpenSpec lifecycle semantics。

#### Scenario: Missing Change produces valid OpenSpec machine JSON with non-zero exit
- **WHEN** exact Change status command 以 numeric non-zero exit 结束，且 stdout 是合法 OpenSpec machine JSON
- **THEN** 系统 SHALL 返回/抛出 closed formal-outcome category，并 MUST NOT 将其标记为 process-failed 或通过英文 message 推断新的 Flowkit lifecycle state

#### Scenario: OpenSpec process cannot start or complete
- **WHEN** managed entrypoint invocation 发生 spawn/error，或 child close outcome 没有 numeric exit code，或 host 报告 non-null signal
- **THEN** 系统 SHALL fail closed with a process-failure integration diagnostic

#### Scenario: Required JSON is malformed
- **WHEN** host 报告 numeric exit code 且没有 signal，但 observation command stdout 不是 required valid JSON
- **THEN** 系统 SHALL fail closed with a malformed-machine-output integration diagnostic，而 MUST NOT 根据 platform、exit code、empty stdout、stderr 或不可观察的 OS termination cause 将其重新分类为 process-failure
