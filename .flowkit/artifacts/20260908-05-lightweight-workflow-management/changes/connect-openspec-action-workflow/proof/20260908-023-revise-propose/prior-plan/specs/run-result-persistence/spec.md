## MODIFIED Requirements

### Requirement: Durable Run occurrence creation is non-overwritable and sequence-unique

系统 SHALL 将 generated occurrence 视为 create-once 历史；已占用目录/sequence SHALL 不可由另一 invocation 重用。同一次存活 invocation SHALL 可先独占创建受控目录与 action.md，后续只创建尚不存在的 context.json/result.json 完成该 occurrence，不覆盖任何已有文件。该内部预占 SHALL 不成为新 Action、第四文件或 lifecycle state。完整记录 SHALL 不可修改。single-writer 边界保持，不要求锁服务、WAL 或多 writer 支持。

#### Scenario: Reject writing an existing Run occurrence without changing prior bytes
- **WHEN** 目标 occurrence 已有完整三文件
- **THEN** 所有再次写入 SHALL 被拒绝，原始 bytes 不变

#### Scenario: Reject duplicate controlled sequence within one Change history
- **WHEN** 同一 Change 的 sequence 已被完整或部分 occurrence 占用
- **THEN** 新 invocation SHALL 拒绝复用，不创建重复 occurrence

#### Scenario: Original live invocation finishes its own reservation
- **WHEN** 原存活 invocation 已独占预留 occurrence 且有合法完整结果
- **THEN** 它 SHALL 只写缺少的 context/result 并验证三文件，不开放按任意已有路径补写的公共入口

## ADDED Requirements

### Requirement: Partial execution persistence remains visible without pretending to be a completed Run

宿主工作开始前 SHALL 已有本次受控 occurrence 的持久占用；写入失败 SHALL 阻止工作派发。已派发后发生的部分写入、EOF 或中断 SHALL 不删除 occurrence，也不回退旧结果。完整三文件仍按既有 schema 校验；缺少 context/result 的目录 SHALL 只构成 incomplete 诊断，不凭 action.md 生成 prepared/terminal、结果或 Owner authority。另一次 invocation SHALL 不自动接管或修复 partial occurrence。

#### Scenario: Process exits after host work but before result persistence
- **WHEN** 新会话发现所选 Change 的 partial occurrence
- **THEN** 它 SHALL 报告 exact incomplete 位置，阻止依赖当前状态的执行，不将该 Change 当空闲或选旧 PASS

#### Scenario: Failed save is not cleaned into absence
- **WHEN** context 或 result 写入失败
- **THEN** 系统 SHALL 保留已写部分，返回保存失败，不删除目录伪装未执行

#### Scenario: Durable terminal survives lost acknowledgement
- **WHEN** 三文件已完整写入并可校验但终端响应未送达
- **THEN** 新会话 SHALL 从真实链读出该结果，不能仅因响应丢失重演 Action

### Requirement: Completed invocation records preserve failure separately from Action conclusions

存活 invocation 已派发但不能接纳宿主结果时，若存储可用，系统 SHALL 保存 prepared context 与实际 invocation failure facts；authorConclusion、reviewerVerdict、verificationVerdict、nextBoundary SHALL 为 null，不伪造成功。该记录 SHALL 使用既有三文件与字段，保持独立 occurrence、previousRunId 和 authority。之后仅在明确再次调用同一合法 Action 时使用新 occurrence，不自动重试。

#### Scenario: Invalid response is a recorded invocation failure
- **WHEN** 宿主回交身份/Role/结果不匹配而失败记录可保存
- **THEN** 系统 SHALL 保留 prepared 与真实拒绝原因，返回失败，不将非法 candidateResult 当 admitted Result

#### Scenario: A deliberate retry preserves the prior failed occurrence
- **WHEN** 后续宿主明确再次调用同一 prepared Action 且既有 Policy 允许
- **THEN** SHALL 创建新 occurrence 并链接前一次失败，不覆盖前一次记录
