# architecture-and-canonical-diagram-continuity Specification

## Purpose

界定架构交付能力退役后的历史保留与独立绘图边界：历史 Run、archive、Delivery manifest 与图按原始类型和 bytes 保留；独立绘图不构成 Delivery 完成前置，也不取得 OpenSpec、Git、Verification 或 Owner authority。

## Requirements

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
