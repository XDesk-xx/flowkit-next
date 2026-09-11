## ADDED Requirements

### Requirement: Installed manager assets are independent of target project facts

系统 SHALL 从运行安装入口确定 manager 安装根，安装身份来自自身 package name/version，而不是 target package 或 target 上一 Delivery commit。CLI 请求中的 `repositoryRoot` SHALL 继续仅表示 target，request SHALL NOT 提供系统资产根/任意 Skill 路径的覆盖能力。系统 SHALL 用 manager 资产和 target 项目事实组合既有 `status`、`next`、`doctor`，不新增命令、自动 current 发现、宿主执行或 Git authority。

target SHALL 无需复制 Flowkit 源码、系统 Skills、toolchain lock 或专用 glue scripts；已有请求必需的正式项目/Run/coordination 输入仍须满足。已支持项目写入 SHALL 留在 target，manager 安装 SHALL 不接收项目历史。缺系统资产 SHALL 只阻止依赖该资产的能力，不能通过 target 同名资产补齐。

#### Scenario: Installed CLI reads an independent target
- **WHEN** manager 与 target 分目录安装，target 没有 Flowkit scripts/Skills/lock，但满足既有 status 所需正式输入，所需 exact OpenSpec 可用
- **THEN** 实际安装的 CLI SHALL 读取 target 的 selected Run、coordination 和 OpenSpec 状态，不依赖开发仓库相对路径

#### Scenario: Target cannot override system installation
- **WHEN** target 存在同名 package、Skills 或 lock，或 request 尝试额外指定 manager 资产根
- **THEN** 同名文件 SHALL 不改变安装身份/资产来源；不受支持 request 字段 SHALL 按现有输入诊断拒绝

#### Scenario: Relocated installation leaves target data in place
- **WHEN** 相同 package 内容的完整安装移位后继续访问同一个 target
- **THEN** 系统 SHALL 从新安装定位自身资产，仍读取原 target 的事实，不迁移、清理其 `.flowkit`，不改变 target 测试配置

### Requirement: Runnable distribution contains only required manager assets

系统 SHALL 提供可独立安装运行的发行包，包含 production JavaScript、运行依赖声明、系统 Action/Delivery Guidance 及其必要静态引用资产、OpenSpec tool lock 和必要 package/bin 元数据。发行包 SHALL 不包含开发 `.agents`、目标项目 OpenSpec/coordination/Runs/artifacts、`.tmp`、历史架构、测试工作区或外部 executable runtime；所需 runtime 仍位于 `FLOWKIT_HOME/tools`。

发行 SHALL 不要求 target 安装 manager 开发依赖或运行 Flowkit build scripts。运行安装 identity SHALL 不产生当前开发 Delivery 自管理权限；旧 Delivery/Run/accepted history SHALL 不因安装模型改变而迁移或重写。

#### Scenario: Install and run without a development checkout
- **WHEN** 从实际发行包建立 manager 运行安装并提供其运行依赖，启动 package-declared bin 访问独立 target
- **THEN** CLI 与系统资产 SHALL 可用，不依赖源码 checkout、tsx、开发 package scripts 或目标项目复制的管理资产

#### Scenario: Distribution excludes project execution history
- **WHEN** 生成实际发行包
- **THEN** 包内 SHALL 无项目执行历史、bootstrap Skills 或 OpenSpec executable runtime，且所有系统 Guidance 的必要静态引用 SHALL 在 manager 安装内可解析
