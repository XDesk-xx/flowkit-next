## ADDED Requirements

### Requirement: Current owned support HOW matches fixed command requests and outcomes

发行的 Delivery Start、Full Test、Final、repository integration Skills 及仍有效的自有 references SHALL 将正常机械操作映射到本安装已支持的 `project init`、`delivery start`、`change activate`、`change archive`、Memo、`delivery full-test`/`current`、`delivery final`、`git checkpoint`/`push`/`integrate` 固定数据命令及适用 OpenSpec 工具命令。HOW SHALL 对实际需要的节点给出与发行 parser 一致的 `--input`、可见 target、精确数据字段、效果/错误状态与真实读回步骤；Owner 来源、角色、适用检查、外部接受事实仍由相应权威提供。正常操作 SHALL NOT 要求 Agent 动态导入内部模块、提供可执行 callback、编写临时生命周期程序或把固定命令包装成新的任意执行器。当前有效的 onboarding、README、CLI help/示例和 AGENTS 入口 SHALL 与同一合同相符；历史描述可保留为历史，不得被指示为当前正常路径。

#### Scenario: Owner authorizes a Delivery operation
- **WHEN** Agent 已从真实 Owner 输入形成该节点的精确授权，且当前状态允许该操作
- **THEN** 当前自有 HOW SHALL 指向对应固定命令和匹配的封闭请求，要求核对已确认效果并 STOP，不自行调用后继节点

#### Scenario: Git node has a partially confirmed effect
- **WHEN** 固定 Git 命令返回部分成功、未确认或需外部接受
- **THEN** repository integration HOW SHALL 交接已确认对象及剩余步骤，不把 callback、旧宿主输出或 checkpoint 当成 push/merge 接受事实，也不盲重试

#### Scenario: A current reference still teaches internal execution
- **WHEN** 当前 Skill 的有效 reference 仍要求直接导入发行 `dist` 或传入 `readOwner` callback 完成正常操作
- **THEN** 发行自有 HOW SHALL 修正或退役该 reference，使其不再成为默认操作路径；不得仅在另一 reference 隐藏相同执行样板

#### Scenario: Bootstrap guidance remains in use for this Delivery
- **WHEN** 本仓库的独立 `.agents/skills/**` 仍服务于当前外部 Stable manager 管理的 bootstrap 执行
- **THEN** 候选发行 HOW SHALL 不读取、替换或委托该来源，当前正式操作 SHALL 不因候选说明更新而切换 manager
