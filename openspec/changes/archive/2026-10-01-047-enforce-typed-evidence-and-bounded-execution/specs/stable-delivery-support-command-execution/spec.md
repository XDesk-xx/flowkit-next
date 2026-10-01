## ADDED Requirements

### Requirement: Ordinary checkpoint stages a bounded exact path set

已获 exact Owner 授权的普通 `git checkpoint`/宿主 create-new 操作 SHALL 能在受支持目标平台处理超出单次进程参数长度的合法精确路径集合。暂存输入 SHALL 仅由已验证的 operation `paths` 构成，并保持 literal、排序/唯一及既有安全路径语义；实现 SHALL 不把目录/glob、shell 源码、范围外 staged 或 caller 任意程序当作等效输入。写前与提交前 SHALL 保留既有分支/HEAD、Owner 当前来源、工作树与 index 身份、managed evidence 原始字节及实际提交对象/范围核验。失败后 SHALL 读回并报告已确认的 index/commit 效果和未知部分，保留用户 index，不自动清空、重试、提交、push 或改写历史。

#### Scenario: Many exact paths exceed argv limit
- **WHEN** 授权的同一 checkpoint 含足以触发宿主单次 argv 长度限制的合法路径集合
- **THEN** 宿主 SHALL 仍以有界输入暂存精确集合，并仅在全部既有权限、证据及对象读回成立时报告 completed

#### Scenario: Unrelated staged path or changed source
- **WHEN** index 含范围外 staged，或本次 Owner、分支、HEAD、路径字节或 index 在写前/写间漂移
- **THEN** 宿主 SHALL 按既有边界拒绝或报告不完整，不夹带范围外文件，也不从已暂存状态推断新 Owner authority

#### Scenario: Stage or commit response is uncertain
- **WHEN** 大批量路径暂存部分发生或命令响应丢失，实际 index/commit 状态尚未全部确认
- **THEN** 宿主 SHALL 交接已确认对象及剩余核对步骤，保留现有 index，不自动重放写操作或把 stage 当成 checkpoint

### Requirement: Optional host permissions remain narrow and visible

发行接入说明 SHALL 只提供需由 Owner 审核选择的宿主权限示例，按只读查询、受控记录写入、项目检查及 Git/网络分别界定选定 manager 安装、固定命令与实际支持的可见目标。只有入口接受目标 argv 且核对 JSON 一致性时，示例才可声称宿主命令前缀按 target 收窄；当前 Foundation `status/next/doctor` 仅接受 `--input`，其请求文件路径或 stdin SHALL NOT 被描述为可见 target 绑定。示例及其验证 SHALL 不将裸 `node`/`python`、全部 Flowkit 命令、不同安装或不同 target 一并放行；支持可见目标的固定入口仍 SHALL 核对 JSON，宿主前缀匹配 SHALL NOT 被宣称为语义授权。无可执行交互式宿主规则验证时，发行/验收 SHALL 标明该项未验证，不能声称零提示或自动安装权限。

#### Scenario: Exact installed read-only command
- **WHEN** 可测试宿主对选定安装且实际支持目标 argv 的固定只读命令与可见 target 应用示例规则
- **THEN** 仅该匹配请求 MAY 按用户已批准的宿主策略执行，CLI 仍独立验证请求数据

#### Scenario: Interpreter or target changes
- **WHEN** 命令使用裸解释器、其他安装/子命令、另一个可见 target 或 JSON 中冲突目标
- **THEN** 示例规则或固定入口 SHALL 拒绝相应越界；Git/网络操作 SHALL 不继承只读/记录命令的权限
