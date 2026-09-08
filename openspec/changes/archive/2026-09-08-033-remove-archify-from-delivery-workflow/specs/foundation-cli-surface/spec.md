## MODIFIED Requirements

### Requirement: doctor performs only bounded Foundation runtime diagnostics

`flowkit doctor` SHALL 仅通过既有 resolver 验证 exact OpenSpec runtime identity，并通过 OpenSpec observation 验证 requested repository 的 exact-root；diagnostics SHALL 仅为 `openspec-runtime` 和 `openspec-root`，整体 pass 当且仅当两者通过。SHALL NOT 解析、调用或输出 Archify diagnostic，也不返回其 skip/not-applicable。Node SHALL 继续使用 host compatibility declaration，不转为 exact managed patch lock。

#### Scenario: Managed runtimes and OpenSpec root are valid
- **WHEN** exact OpenSpec 可解析且 observation exact-bind requested root，没有 Archify runtime 或任何图
- **THEN** doctor SHALL 返回 machine-readable pass，只有两个 OpenSpec diagnostics

#### Scenario: Required OpenSpec cannot be resolved
- **WHEN** 所需 OpenSpec runtime 缺失或 identity 不符
- **THEN** doctor SHALL 报告既有 closed diagnostic 与整体 fail，不回退 PATH/global

#### Scenario: Managed Archify cannot be resolved
- **WHEN** 原 Archify runtime 不可解析，但所需 OpenSpec runtime/root 均有效
- **THEN** doctor SHALL 只报告两个 OpenSpec diagnostics 并整体 pass，不尝试解析 Archify；这是该旧场景的新预期

#### Scenario: OpenSpec binds to a parent repository root
- **WHEN** observation 成功但 reported root 不等于 requested root
- **THEN** doctor SHALL 按既有 root-mismatch semantics fail closed

### Requirement: Foundation CLI remains a thin bootstrap-era surface without self-management

Production CLI SHALL 仅组合既有 canonical domain/integration seams，不读取/执行 `.agents/skills/**`、自动发现 active Delivery/current Run、建立 registry、执行 Author/Reviewer/provider transport、驱动 OpenSpec mutation、运行 Delivery Full Test/Final、执行 Git mutation 或 Owner promotion。CLI SHALL 不提供 Archify 解析或绘图入口。

#### Scenario: Bootstrap Skills are absent from production call path
- **WHEN** status、next 或 doctor 在 production 执行
- **THEN** command SHALL 只依赖正式 Core/integration input，不读取/执行 bootstrap Skill

#### Scenario: Independent diagrams do not provide lifecycle authority
- **WHEN** repository 包含独立或历史架构描述
- **THEN** CLI SHALL 不读取这些图来推导 lifecycle truth，也不触发绘图或 Delivery Start/Final

#### Scenario: Archify is managed but not lifecycle authority
- **WHEN** 用户独立管理着历史 Archify 安装或图文件
- **THEN** CLI SHALL 不将其视为 Flowkit managed tool，不解析该安装或从图推导 lifecycle authority；保留场景身份不保留旧产品集成
