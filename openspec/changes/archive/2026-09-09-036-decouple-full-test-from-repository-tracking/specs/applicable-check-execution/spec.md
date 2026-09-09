## ADDED Requirements

### Requirement: Shared Action candidate and reuse do not define Delivery Full Test scope

本 capability 的 Git-visible candidate、Action fact admission 与显式 prior reuse SHALL 继续适用于既有 Action 调用方。Delivery Full Test SHALL 使用 formal-full-test-execution-and-correction 的独立项目范围/当前 attempt/真实执行规则；可复用基础纯检查/进程工具，但 SHALL NOT 为复用而重引 Git 枚举、旧 prior PASS 或假 ActionPackage。

#### Scenario: Full Test and Action callers remain separate
- **WHEN** 同仓库同时执行普通 Action check 与 Delivery Full Test
- **THEN** Action SHALL 保持现有 v2/合法 reuse；Full Test SHALL 不继承其输入枚举和跨尝试 reuse

#### Scenario: Shared utility changes do not expand Action persistence
- **WHEN** Full Test 增加原始流保存
- **THEN** 其他 Action 调用方 SHALL 不被强迫创建 Full Test attempt 或改变 Run schema
