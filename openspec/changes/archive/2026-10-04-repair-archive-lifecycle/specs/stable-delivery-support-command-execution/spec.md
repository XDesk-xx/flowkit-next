## MODIFIED Requirements

### Requirement: Archive executes exact OpenSpec convergence inside the current archive Action
`change archive` SHALL 要求由当前合同的 action start 保存并读回的 exact Archive descriptor，校验当前唯一 Run、Role/package/Guidance、可信 approved Review 来源与候选、persisted projectOrdinal 和 target。首次或安全重试的 Review 来源 SHALL 沿唯一 parent 链解析，不要求直接前序必为 Review。命令 SHALL 在记录有界 prestate 后执行一次 exact managed OpenSpec `archive <change> --yes --json`，保存真实执行输出并观察效果。OpenSpec 的 task/delta/retirement/validation/collision/rollback 语义 SHALL 交由该真实调用，不先 dry-run，不运行项目 checks或复制仓库/依赖。

仅真实成功证据和后态一致时，命令 SHALL 以原 projectOrdinal做有界命名及 coordination更新；rename前目标冲突、后处理或确认失败 SHALL 保留已发生效果并返回partial。命令 SHALL NOT 接受 caller checksPassed/reviewApproved/程序/callback，不生成 Action Result、Reviewer verdict、Git checkpoint或下一步执行。Author SHALL 通过同 Run finish记录实际结果。

#### Scenario: Reviewed Change archives at its persisted ordinal
- **WHEN** exact Archive Run 已开始且真实 OpenSpec 成功、目标及后处理有效
- **THEN** 命令 SHALL 读回 canonical effects、ordinal archive与completed coordination，返回材料供同 Run finish

#### Scenario: Preflight or mid-archive failure
- **WHEN** Run开始后工具不可用、原生validation/collision失败或产生部分效果
- **THEN** 命令 SHALL 记录已确认的实际失败并区分安全前态与recovery-required，不声称未开始Run或业务PASS

#### Scenario: Same Run continuation does not replay accepted archive effects
- **WHEN** descriptor-only Run已有可信原生成功材料与一致后态，明确请求继续
- **THEN** 命令 SHALL 仅做已证实剩余后处理或只读返回completed，不重复执行OpenSpec

#### Scenario: Ignored data and package-manager shims are not Archive inputs
- **WHEN** target有未被候选引用的ignored data symlink或pnpm shim不含NODE_PATH
- **THEN** Archive admission/执行 SHALL 不因扫描、复制或解释这些文件而失败；项目checks不被隐式执行

### Requirement: Explicit same Run Archive continuation consumes verified actual effects
对合法descriptor-only Archive，manager SHALL 在既有artifacts保存versioned有界prestate和实际effect材料，绑定Run/package/Guidance、原candidate、相关spec、目标和coordination；不再以隔离预演产生预期后态。下一次明确调用 SHALL 首先校验原材料及当前事实。尚无command intent且完整前态一致时可启动唯一原生调用；已保存intent但结果未知时 SHALL 不盲目重放。已有可信原生成功与一致后态时，SHALL 只继续剩余rename/coordination/finish；业务已completed只读确认。

供checkpoint消费的材料 SHALL 绑定exact Author/approved Review/Archive链，source到ordinal路径、完整迁移suffix/raw-hash集合、原生实际spec前后hash或null、coordination原bytes及只允许本Change active→completed的变化，并绑定目标路径自身有效规则及stage-0 indexBasis下的受支持Git projection，不能直接继承source路径的索引前态。迁移raw不变，canonical after来自真实OpenSpec成功操作，不重新实现merge或把caller map当成事实。terminal Archive PASS SHALL 绑定材料exact路径/bytes/SHA；未terminal材料只用于观察/恢复，不授予checkpoint。

目标 projection SHALL 使用候选接纳的同一普通 add 支持边界：目标已有 blob bytes 等于迁移 raw 而 clean/EOL 内容不同时明确 unsupported，不因目录迁移或仅 stat 改变猜测 LF 输出，不借 touch/renormalize 规避。实际已发生的 Archive 效果仍按三类真实 outcome 保存，projection 拒绝不得伪造 completed PASS 或清除效果。

已完成安全失败 SHALL 先finish terminal FAIL，再通过新Run重试，不能在同Run反复调用OpenSpec。mixed/unknown、Guidance不兼容、partial machine、fork、旧未知descriptor或terminal partial SHALL 保留bytes并阻断；不得自动回滚、删Run、补Result或重开completed Change。terminal partial的人工/显式恢复不由普通retry自动解锁。

#### Scenario: Process acknowledgement is lost after archive bytes appear
- **WHEN** source已移动且原生成功执行材料和实际后态匹配
- **THEN** 明确同Run继续 SHALL 只做剩余rename/coordination；只有目录而无可信执行材料时SHALL保持unknown

#### Scenario: Coordination response was lost
- **WHEN** exact archive/spec及completed coordination与本Run真实材料一致
- **THEN** 同Run重投 SHALL 只读确认，不重写协调或创建替代Run

#### Scenario: Accepted archive binds the transformation used by checkpoint
- **WHEN** 真实迁移、spec与coordination核对成功且同Run terminal PASS已接纳
- **THEN** Result SHALL 绑定实际转换及after Git projection，旧Author/Review原bytes不变；completed响应本身不替代证据

#### Scenario: Partial convergence cannot be guessed as safe retry
- **WHEN** 实际source/spec/archive呈混合状态，或machine文件已经partial写入
- **THEN** 系统 SHALL 保留bytes并报告unknown/blocked与所缺事实，不自动补成功或重放

#### Scenario: Archive projection uses destination index state
- **WHEN** source原index含CRLF，归档destination原index为absent，即使两条路径的text=auto属性相同
- **THEN** after projection SHALL 根据destination的普通入库语义绑定预期blob，不将source的自动CRLF保留分支复制过去；材料仍证明迁移raw未变

## REMOVED Requirements

### Requirement: Archive failure diagnostics retain bounded original process evidence
**Reason**: 旧合同包含无Run的依赖预检及scratch清理诊断；移除预演后，这些阶段不再存在。原始输出保护继续保留，但必须绑定真实started Archive Run。
**Migration**: 使用下述Run-bound诊断合同保存真实原生操作的命令、raw流和效果；旧诊断材料只读保留，不迁移、删改或冒充新Run证据。

### Requirement: Archive convergence checks use independent target dependencies
**Reason**: Archive不再复制开发环境或执行隔离归档及项目checks；该前置条件制造了原生OpenSpec没有的symlink/shim失败。
**Migration**: 新Archive请求移除applicableChecks；项目验证保留在Apply/Review/既有Full Test，原生Archive只在started Run内实际执行。旧材料保留只读，不迁移旧Run或依赖。

## ADDED Requirements

### Requirement: Archive operations retain Run-bound original process diagnostics
每次已开始的 Archive实际操作 SHALL 保存与exact Run绑定的target-owned命令元数据、raw stdout/stderr、实际exitCode/signal/spawnError/timeout、截断标记及效果引用。每流仍最多16MiB，超限停止进程并保存已收前缀；截断/保存失败不得冒称完整日志或PASS。保存失败 SHALL 报实际保留位置和unconfirmed状态，不自动清理或补造输出；不收集秘密env、不格式化raw流。Run前的admission拒绝 SHALL 不伪造操作Run，原生执行失败 SHALL 不被隐藏成无Run的预演诊断。

#### Scenario: A failed native Archive remains diagnosable
- **WHEN** 已开始的原生archive退出失败或无法启动
- **THEN** 响应 SHALL 指向同Run命令、原始流及可证明效果，不能仅返回笼统check ID或丢弃失败材料

#### Scenario: Output overflow cannot become a successful check
- **WHEN** stdout/stderr超限或保存失败
- **THEN** 命令 SHALL 报process-failed/unconfirmed及保留位置，不能返回PASS；重试安全性必须另由已停止进程与真实前态证明

### Requirement: Archive classification is proven by durable effects rather than exit text
安全failed outcome SHALL 要求进程已确认停止、active Change及相关canonical spec/coordination与可信prestate一致、候选未漂移且无本次未解决归档效果。预存collision target SHALL 按before/after核对，不视为本次成功或自动删除。no-mutation SHALL 表示无已确认持久业务差异，不断言没有瞬时写入；rolled-back SHALL 另有正面恢复证据。不能证明成功或安全前态 SHALL 为partial/recovery-required，不仅以exit code、JSON成功标记或错误文案作结论。

#### Scenario: Validation failure leaves a retryable active Change
- **WHEN** 真实archive validation失败且上述安全前态完整可证
- **THEN** 操作 SHALL 返回failed/no-mutation或有证据的rolled-back，同Run可保存terminal FAIL

#### Scenario: Pre-existing destination collision is preserved
- **WHEN** 归档目标调用前已存在，原生因collision失败且所有受控输入/目标未改变
- **THEN** 操作 SHALL 返回安全failed，不删除该目标或把它当作此次归档成功

#### Scenario: Failed cleanup is recovery-required
- **WHEN** destination有完整副本但source cleanup未完成、rollback失败或进程/效果无法确认
- **THEN** 操作 SHALL 返回partial并保留已知效果，禁止自动第二次archive
