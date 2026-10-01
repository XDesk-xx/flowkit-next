## MODIFIED Requirements

### Requirement: Foundation CLI has one real runnable package/bin surface

系统 SHALL 提供一个可由受支持 host Node runtime 执行的单一 `flowkit` CLI entrypoint，并 SHALL 通过 repository build contract 将 production TypeScript emit 为该 entrypoint 可加载的 JavaScript。CLI command catalog SHALL 封闭为 `status`、`next`、`doctor`、`action start`、`action finish`、`proof inspect`，以及 B 的 `project init`、`delivery start`、`change activate`、`change archive`、`memo list`、`memo get`、`memo create`、`memo promote`、`memo dismiss`、`delivery full-test`、`delivery full-test current`、`delivery final`、`git checkpoint`、`git push`、`git integrate`；未知 command SHALL fail closed。新增写入口 SHALL 仅在 exact Stable manager 被选定且满足各自操作/授权合同时执行，不使 candidate 自动管理本 Delivery。该 build/bin surface MUST NOT 将 Node `22.23.2` 提升为 managed-tool exact runtime authority。

#### Scenario: Build produces a runnable flowkit entrypoint
- **WHEN** repository 在满足 `package.json#engines.node` 的 host Node 上执行批准的 production build
- **THEN** build SHALL 产生 package-declared `flowkit` entrypoint，且该 entrypoint SHALL 能由 host Node 启动并解析受支持 command

#### Scenario: Compatible host Node differs from detached fixture patch
- **WHEN** CLI 在满足 repository Node compatibility declaration 但 patch version 不等于 `22.23.2` 的 host 上启动
- **THEN** CLI SHALL NOT 仅因 patch version 不同而拒绝启动

#### Scenario: Unknown command is requested
- **WHEN** caller 请求不在封闭 command catalog 中的 command
- **THEN** CLI SHALL fail closed with a machine-distinguishable command/input diagnostic，且 MUST NOT 将未知 command 转发给其他 subsystem

#### Scenario: B command is available only in selected Stable installation
- **WHEN** D07 candidate 已构建但本 Delivery 仍由 D06 exact Stable manager 管理
- **THEN** candidate 的新命令 SHALL 只能在独立测试目标验收，不自动接管当前 Delivery；正式调用仍使用选定 manager 的实际 command catalog

### Requirement: Foundation CLI remains a thin bootstrap-era surface without self-management

Production CLI SHALL 将只读 `status/next/doctor`、有界 `action start/finish` 与 `proof inspect`、以及 B 定义的 Project/Delivery/Change/Memo/Archive/Git 固定机械命令组合到同一发行入口。每个写命令 SHALL 只按自身既有 domain、OpenSpec 或 Git 宿主合同处理封闭输入与实际效果；CLI SHALL NOT 读取/执行 `.agents/skills/**`、调用模型、执行 Author/Reviewer 的实质工作或 transport、自动切换 Role/下一 Action、创建 Registry、提升 Owner authority，或把 Review/Verification/Git 结论互相替代。OpenSpec mutation 仅可由已决定的 exact `change activate/archive` 机械命令调用受管 runtime，不成为任意 OpenSpec executor。当前 Delivery 仍由上一 Delivery exact Stable manager 治理；当前 candidate CLI 不自我接管。Archify 无产品入口。

#### Scenario: Bootstrap Skills are absent from production call path
- **WHEN** 产品 CLI 执行
- **THEN** 它 SHALL 只使用所需 manager 资产与 target 正式事实，不读取/执行 bootstrap HOW

#### Scenario: Independent diagrams do not provide lifecycle authority
- **WHEN** target 存在独立或历史图
- **THEN** CLI SHALL 不从图推导流程、不触发绘图或 Delivery Start/Final

#### Scenario: Archify is managed but not lifecycle authority
- **WHEN** 用户独立管理 Archify 安装或图
- **THEN** CLI SHALL 不解析该安装，不把它视为 Flowkit managed tool 或 authority

#### Scenario: Querying the next review does not execute it
- **WHEN** next 报告 review-explore 等独立审查边
- **THEN** CLI SHALL 报告后退出，不创建 Reviewer Run 或执行 Reviewer

#### Scenario: Action command does not perform the Agent role
- **WHEN** start 或 finish 接到合法 Action 请求
- **THEN** CLI SHALL 仅建立受控开始或接纳实际角色提供的结果，不生成 Author 工作、Reviewer verdict 或 Verification PASS

#### Scenario: A support command does not continue the workflow
- **WHEN** 一个受支持的 B 命令完成或报告部分效果
- **THEN** CLI SHALL 返回该操作的事实后退出，不自动启动 Action、后续操作、Review、Git 或下一 Delivery
