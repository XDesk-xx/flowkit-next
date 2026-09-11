## MODIFIED Requirements

### Requirement: OpenSpec observation uses only the exact managed OpenSpec runtime

系统 SHALL 从当前 manager 安装持有的 managed-tool contract 解析 exact `openspec` runtime，并使用经验证的 entrypoint 执行既有两种只读观察。child cwd SHALL 为本次请求的 target root，不是 manager 安装根。系统 SHALL NOT 从 target lock、PATH、global installation、shell lookup 或其他 runtime location 选择 OpenSpec，不新增任意命令执行接口。

#### Scenario: Managed OpenSpec is available
- **WHEN** 受支持观察所需的 manager lock 与 exact runtime 有效，target 没有 Flowkit lock/Skills/scripts
- **THEN** 系统 SHALL 在 target cwd 调用 validated entrypoint，并返回该 target 的正式观察结果

#### Scenario: Conflicting PATH OpenSpec exists
- **WHEN** PATH 或 target 同名 lock 声明不同 OpenSpec identity，而 manager 所需 runtime 有效
- **THEN** observation SHALL 忽略这些替代来源，仅调用 manager 约定的 managed runtime

#### Scenario: Managed OpenSpec cannot be resolved
- **WHEN** manager lock、FLOWKIT_HOME、runtime identity 或 entrypoint 无效
- **THEN** observation SHALL 保留既有 managed-tool failure，不 fallback，不复制资产到 target

### Requirement: Successful observations bind exactly to the requested repository root

系统 SHALL 将请求的 target root 与成功观察的 `root.path` 按当前 host canonical path semantics 精确比较，二者不一致时 SHALL fail closed。系统 SHALL NOT 接受 nearest-root 向 parent 项目解析的结果，也 SHALL NOT 将 manager 安装根当作请求项目。manager 和 target 可以同位置开发，也可以分离安装；逻辑归属不依赖二者是否同目录。

#### Scenario: OpenSpec reports the exact requested root
- **WHEN** reported `root.path` canonicalizes 后等于 requested target root
- **THEN** 系统 SHALL 继续既有 machine shape/identity 校验，并仅在有效时返回观察

#### Scenario: Nested or wrong cwd binds to a parent OpenSpec project
- **WHEN** OpenSpec 返回成功 JSON，但 root 是 parent 或 manager，而不是 requested target
- **THEN** observation SHALL 以既有 root-mismatch integration diagnostic 拒绝
