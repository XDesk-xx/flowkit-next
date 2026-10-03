## ADDED Requirements

### Requirement: Archive convergence checks use independent target dependencies

Archive的start与change archive预检 SHALL 使用同一显式执行合同：真实隔离OpenSpec convergence后执行全部声明适用检查，依赖在scratch内独立可写，manager不创建指向原target依赖的junction/共享可写hardlink，不自动install/update/delete原依赖。可证明target内部的链接 SHALL 只映射到scratch；逃逸/未知外部依赖、不完整snapshot或package/lock/metadata漂移 SHALL 在业务archive前拒绝。不支持的布局 SHALL 明确阻断，不缩窄检查或静默回退。

对pnpm11，源依赖状态 SHALL 通过禁止自动install的只读preflight；scratch运行 SHALL 仅局部关闭pre-run依赖同步，不跳过实际scripts或将旧PASS作为新检查。不要求Owner给两个进程分别补隐藏env。此约束不声明对任意项目恶意脚本的通用OS sandbox。

#### Scenario: Native pnpm junction regression executes project checks
- **WHEN** Windows pnpm11 target依赖状态有效且snapshot所有链接闭合到scratch
- **THEN** 声明检查 SHALL 实际执行，原candidate与依赖保持不变，不能在pnpmpre-run保护处误报项目测试失败

#### Scenario: A real assertion failure still blocks archive
- **WHEN** 隔离后的项目check真实退出非零
- **THEN** archive SHALL 被阻断，即使过去Review或其他preflight曾PASS

#### Scenario: External writable dependency alias is refused
- **WHEN** snapshot不能在scratch内闭合或只读源preflight检测依赖不一致
- **THEN** manager SHALL 拒绝并给具体环境原因，不安装或修改原依赖

### Requirement: Archive failure diagnostics retain bounded original process evidence

每次Archive预检及真实命令失败 SHALL 在清理scratch前create-once保存target-owned命令元数据、raw stdout/stderr、exitCode/signal/spawnError/timeout、截断标记与归属引用。start前失败 SHALL 用独立attempt身份且nullable runId，不伪造Run。每流最多16MiB，超限停止进程并标process-failed/truncated，保留实际已收bytes前缀，不声称完整日志或PASS。未配置、执行环境、命令不可用、测试非零和timeout SHALL 可区分；不记录秘密env，不格式化原流。材料保存失败 SHALL 报实际已保存/未确认部分并阻断，不仅返回笼统check ID。

#### Scenario: Dependency failure remains diagnosable after cleanup
- **WHEN** pnpm前置条件或check失败且scratch随后被清理
- **THEN** 响应 SHALL 指向可读的命令与原始流材料，包含真实退出/分类，不把它简化成测试断言失败

#### Scenario: Output overflow cannot become a successful check
- **WHEN** stdout/stderr超限或保存失败
- **THEN** 命令 SHALL 报process-failed/unconfirmed及保留位置，不能返回PASS或丢弃已保存bytes

### Requirement: Explicit same Run Archive continuation consumes verified actual effects

对合法descriptor-only Archive，manager SHALL 在artifacts保持有界immutable pre/postcondition与真实effect观察，绑定Run/package/Guidance、原candidate、受影响spec、archive目标和coordination。下一次明确change archive invocation SHALL 先观察真实状态，再只执行可证尚未完成的剩余步骤。完整prestate且无archive效果才可执行真实OpenSpec archive；已证明default/exact archive和spec后态时 SHALL 不重放archive，只做必要rename/coordination/读回。reported effect或phase文件存在 SHALL 不独立证明实际成功。

供后续checkpoint消费的既有Archive材料 SHALL 绑定exact Author/Review/Archive链、source/最终ordinal archive路径、迁移文件的完整suffix/hash集合、受影响spec的前后hash或null缺失态，以及coordination文件前后hash和仅当前Change active→completed的差异。生产端 SHALL 核对迁移内容不变、spec后态等于已检查的隔离收敛、coordination无额外字段变化；真实Archive terminal Result SHALL 绑定所需材料的exact路径、bytes、SHA-256。未接纳terminal前材料仅作观察/恢复，不能独立提供checkpoint转换依据；不新增Run文件或第二份OpenSpec truth。

mixed/unknown/drift、Guidance不兼容、partial machine文件、竞争successor或旧未知descriptor SHALL 阻断。不得自动重试、回滚、cleanup旧Run、创建替代Run、补造Result或引入resumed状态。已completed协调及exact archive匹配时 SHALL 只读返回业务完成，仍由同Run finish接纳实际结果。

#### Scenario: Process acknowledgement is lost after archive bytes appear
- **WHEN** source已移走且default archive/spec真实bytes匹配持久预期后态
- **THEN** 明确同Run继续 SHALL 只做剩余ordinal rename/coordination，不重执行OpenSpec archive

#### Scenario: Coordination response was lost
- **WHEN** exact archive/spec和completed coordination实际匹配
- **THEN** 同Run重投 SHALL 只读确认业务效果，不能重写coordination或创建新Run

#### Scenario: Accepted archive binds the transformation used by checkpoint
- **WHEN** 真实迁移、spec收敛与coordination更新均验证成功，随后同Run finish接纳terminal结果
- **THEN** 该结果 SHALL 绑定已有材料中的exact转换前后身份，供checkpoint核对合法后态；旧Author/Review Run保持原bytes，单独completed响应不替代此绑定

#### Scenario: Partial convergence cannot be guessed as safe retry
- **WHEN** 实际spec/source/archive呈混合状态，或machine文件已经partial写入
- **THEN** 系统 SHALL 保留全部bytes并报告unknown/blocked及所缺事实，不自动补成功或重放

## MODIFIED Requirements

### Requirement: Archive executes exact OpenSpec convergence inside the current archive Action

`change archive` SHALL 要求同一 Change 当前合法且已由 A 的 `action start` 建立 exact archive Action，实读 approved review-apply、tasks、persisted projectOrdinal、OpenSpec 状态、适用检查与目标归档路径；它 SHALL 使用 exact managed OpenSpec runtime 完成现有收敛/归档机械步骤并读回实际 archive 与 manifest completion。命令 SHALL NOT 接受 caller `checksPassed`/`reviewApproved` 布尔值，也 SHALL NOT 自己生成 Action Result、Reviewer verdict 或 Git checkpoint；Author 随后使用 A 的 `action finish` 记录真实结果。部分 OpenSpec/manifest 效果 SHALL 保留并报告，不自动回滚或重试。

明确的同Run后续invocation SHALL 仅在exact descriptor、前序、package/Guidance及保存的pre/postcondition和真实OpenSpec/coordination事实证明时接续剩余步骤。合法partial可以被只读inspect呈现，但不能冒充完整Run；已验证归档后态时不重复执行OpenSpec archive，已验证completed时只读确认。mixed/unknown/drift或partial machine保存 SHALL 阻断并保留bytes，不自动重试、补Result或重开completed Change。

#### Scenario: Reviewed Change archives at its persisted ordinal
- **WHEN** exact archive Action 已开始且真实前置、工具和目标路径有效
- **THEN** 命令 SHALL 完成既有 OpenSpec 归档与 completion 读回，返回归档路径和实际效果供 Author 结束该 Action

#### Scenario: Preflight or mid-archive failure
- **WHEN** Reviewer 证据缺失、检查未通过、工具不可用、目标冲突或归档中途失败
- **THEN** 命令 SHALL 在可确定的写前阶段阻断，或在已有副作用后准确报告 partial/incomplete，不声称 archive/Action 完成

#### Scenario: Same Run continuation does not replay accepted archive effects
- **WHEN** 明确同Run调用时真实ordinal archive/spec和completed coordination均匹配且没有冲突successor
- **THEN** 命令 SHALL 只读确认业务完成并交给原Run finish，不重放归档或新建Run
