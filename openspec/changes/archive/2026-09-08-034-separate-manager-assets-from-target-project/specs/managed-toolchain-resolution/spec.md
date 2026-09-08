## MODIFIED Requirements

### Requirement: Managed tool identity is closed and repository-defined

系统 SHALL 仅支持 managed tool id `openspec`，其 expected package、exact version、相对 FLOWKIT_HOME 的 runtime location 与 entrypoint SHALL 由 manager 安装携带的 `config/tools/toolchain.lock.json` 定义。该版本约定的开发来源仍由 manager repository 管理，运行时 SHALL NOT 从 target 同名 lock、target package 或 target 上一 Delivery commit 推导。系统 SHALL NOT 支持 `archify` 或增加工具 Registry。

#### Scenario: Supported managed tool is requested
- **WHEN** caller 请求 `openspec`
- **THEN** 系统 SHALL 只使用当前 manager 安装携带的 managed-tool contract 解析 expected identity

#### Scenario: Unsupported managed tool is requested
- **WHEN** caller 请求 `archify` 或其他非 openspec id
- **THEN** 系统 SHALL 返回既有 unsupported-managed-tool diagnostic，不尝试 runtime 发现、安装或调用

#### Scenario: Target does not carry a toolchain lock
- **WHEN** target 没有 Flowkit lock，而 manager lock 和所需 runtime 有效
- **THEN** 系统 SHALL 成功解析 OpenSpec，不要求向 target 复制 lock

#### Scenario: Target contains a conflicting toolchain lock
- **WHEN** target 同名 lock 声明不同版本或内容无效
- **THEN** 系统 SHALL 忽略该文件对系统工具 identity 的影响，仍从 manager 安装解析，不回退 target

### Requirement: Managed tools are resolved on demand

系统 SHALL 仅在操作确实依赖 OpenSpec 时解析所需 runtime；不使用工具的操作 SHALL NOT 因 runtime 缺失而新增阻断。其他独立用户工具的存在、缺失或损坏 SHALL 不影响 OpenSpec 解析，不遍历或校验其安装。`doctor` 明确诊断 OpenSpec，仍属于依赖工具的操作。

#### Scenario: OpenSpec is requested while Archify is absent
- **WHEN** OpenSpec 在 FLOWKIT_HOME 下有效，Archify 缺失
- **THEN** OpenSpec 解析 SHALL 成功，不要求 Archify 配置或 runtime

#### Scenario: Independent Archify installation is invalid
- **WHEN** OpenSpec 有效，用户独立 Archify 安装损坏或版本不同
- **THEN** 系统 SHALL 不读取该安装，OpenSpec 解析不受影响

#### Scenario: Archify is requested while OpenSpec is absent
- **WHEN** caller 请求 `archify` 且 OpenSpec 缺失
- **THEN** 系统 SHALL 先以 unsupported-managed-tool 拒绝，不解析任何 runtime，不因 Archify 安装存在而成功

#### Scenario: A non-tool operation does not require the runtime
- **WHEN** 当前操作只解析已确定 Action 的系统 Guidance，不调用 OpenSpec
- **THEN** 系统 SHALL 不为此操作验证 OpenSpec runtime；Guidance 自身的有效性要求保持
