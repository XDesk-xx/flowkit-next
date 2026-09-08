## REMOVED Requirements

### Requirement: Architecture Finalization consumes one exact passed Full Test candidate and exact architecture inputs
**Reason**: Archify 退出活动交付合同，不再存在测试后的必经架构阶段。
**Migration**: 新执行直接按各自权限进入无架构前置的 Final；历史 Full Test/Architecture 记录原样保留，不转换。

### Requirement: Trusted Architecture Finalization host owns exactly six fixed derived output slots
**Reason**: 不再由 Flowkit 的 Delivery 操作创建或验收六槽图。
**Migration**: 删除专属活动写入能力；已有图原样保留，独立绘图不作为交付节点。

### Requirement: Architecture Finalization materializes one complete Actual and two thin exact compares
**Reason**: Actual/compare 不再属于 Delivery 完成资格。
**Migration**: 新执行不补图、不要求缺图说明；不迁移或重新校验旧图以满足新合同。

### Requirement: Canonical Workflow Lifecycle and Data Flow use one repository-scoped baseline continuity rule
**Reason**: Flowkit 不再强制建立或刷新系统图 baseline。
**Migration**: 保留现有历史描述，后续独立文档任务遵守自身授权，不要求 Delivery 图表连续性。

### Requirement: Product-truth correction exits Architecture Finalization and restarts verification on a new candidate
**Reason**: 专属 Architecture Finalization/correction 入口退役，不保留该操作生命周期。
**Migration**: 真正产品修改仍遵循既有 OpenSpec correction/revise 和 Verification 边界；不通过独立绘图取得修改权限。

### Requirement: Architecture Finalization isolates trusted lineage from derived logic
**Reason**: 不再执行专属 derived callback 或形成架构 lineage。
**Migration**: 删除仅服务该操作的 callback/防护代码与测试；其他操作的输入隔离不得删除。

### Requirement: Architecture Finalization closure binds the post-materialization repository candidate
**Reason**: 新 Final 直接接续 Full Test，无架构中间 candidate/closure。
**Migration**: 同步 Final/Integration 消费者；旧 ref/record 只作为原类型历史，不重算成新接受事实。

### Requirement: Architecture 使用共享 v2 材料并保持阶段来源
**Reason**: 活动链中取消 verified → architecture-materialized 阶段。
**Migration**: 保留非架构 v2 candidate 和来源校验；不借此提前实现通用测试范围或证据链简化。

## ADDED Requirements

### Requirement: Architecture retirement preserves historical material without executing a legacy workflow

系统 SHALL 保留已存在的历史 Run、OpenSpec archive、Delivery manifest 与图文件的原始 bytes/类型，不因退役重写、删除、重新验证或自动转换。历史材料的普通读取 SHALL 不需要 Archify runtime，也不赋予其当前执行资格；当前 operation/Final validators SHALL 拒绝退役输入。产品 SHALL 不保留双轨活动架构流程、转换平台或成功占位。

#### Scenario: Read original historical material without Archify
- **WHEN** 读取旧类型的历史 JSON/YAML/Run 材料且没有 Archify runtime
- **THEN** 历史 bytes SHALL 可按原类型读取并保持不变，不为读取执行绘图、补图或接纳新 Final

#### Scenario: Historical success cannot revive an operation
- **WHEN** 旧记录含成功的 `delivery-architecture-finalization`
- **THEN** 系统 SHALL 保留该历史文字，但当前执行不得据此恢复该 operation 或转换其成功结果

### Requirement: Independent diagrams are not Delivery completion requirements

Flowkit SHALL 不要求 Delivery 创建 architecture 目录、六槽图、系统图、compare、跨 Delivery 图连续性或“不需要更新”的证明；也不提供专属绘图 operation/adapter。独立绘图 SHALL 不获得 OpenSpec/Git/Verification/Owner authority，不改变原有文件修改权限；实际产品修改仍需正常 Change/验证。绘图任务不限定在 Full Test 之后。

#### Scenario: Complete workflow with no diagrams
- **WHEN** Delivery 没有图或不运行绘图工具，且其他现行交付前置满足
- **THEN** 系统 SHALL 不因缺图而阻断 Start、Full Test、Final 或 Integration，不要求 skip 声明

#### Scenario: Independent installation and existing files remain owned by the user
- **WHEN** 产品退役 Archify 交付能力
- **THEN** 系统 SHALL 不卸载或修改用户独立 runtime/Skill，也不自动处理其他项目或历史图
