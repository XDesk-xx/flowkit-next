## MODIFIED Requirements

### Requirement: Foundation CLI has one real runnable package/bin surface
系统 SHALL 提供一个可由受支持 host Node runtime 执行的单一 `flowkit` CLI entrypoint，并 SHALL 通过 repository build contract 将 production TypeScript emit 为该 entrypoint 可加载的 JavaScript。CLI command catalog SHALL 封闭为 `status`、`next`、`doctor`、`action start`、`action finish` 与 `proof inspect`；未知 command SHALL fail closed。新增写入口 SHALL 仅在 exact Stable manager 被选定并满足各自 Action 合同时执行，不使 candidate 自动管理本 Delivery。该 build/bin surface MUST NOT 将 Node `22.23.2` 提升为 managed-tool exact runtime authority。

#### Scenario: Build produces a runnable flowkit entrypoint
- **WHEN** repository 在满足 `package.json#engines.node` 的 host Node 上执行批准的 production build
- **THEN** build SHALL 产生 package-declared `flowkit` entrypoint，且该 entrypoint SHALL 能由 host Node 启动并解析受支持 command

#### Scenario: Compatible host Node differs from detached fixture patch
- **WHEN** CLI 在满足 repository Node compatibility declaration 但 patch version 不等于 `22.23.2` 的 host 上启动
- **THEN** CLI SHALL NOT 仅因 patch version 不同而拒绝启动

#### Scenario: Unknown command is requested
- **WHEN** caller 请求不在封闭 command catalog 中的 command
- **THEN** CLI SHALL fail closed with a machine-distinguishable command/input diagnostic，且 MUST NOT 将未知 command 转发给其他 subsystem

### Requirement: CLI machine outcomes distinguish valid formal results from command/integration failure

CLI SHALL 输出确定的结构化结果，不解析 free-text 重建 domain 语义。正常 status、Policy blocked、checkpoint unauthorized 与 bounded doctor diagnostic SHALL 保持正式 machine outcomes；Action/proof 命令 SHALL 区分未写、已开始、blocked、incomplete、failed、written-unconfirmed、confirmed 与同值重复只读确认。非法输入、歧义、missing/invalid/incomplete Run、managed-tool/integration failure 或未知命令 SHALL 可区分且非零退出；仅实际 confirmed 结果可被报告为 durable completion，不能只凭 exit 0 推断成功。CLI 不提供宿主通信帧或自动执行 Agent 工作。

#### Scenario: Policy blocked is a formal result

- **WHEN** next 成功构造事实且 Policy blocked
- **THEN** CLI SHALL 输出该决定，不误分类为调用失败

#### Scenario: Exact Run cannot be read

- **WHEN** 所选受控历史包含 incomplete/invalid occurrence
- **THEN** status/next SHALL 非零退出并指出该问题，不尝试另选旧 Run；finish SHALL 仅在新格式合法开始记录的有界路径核对后继续

#### Scenario: Action command is not a workflow executor

- **WHEN** caller 请求 `action` 而未给受支持的明确子命令，或请求 `prepare/submit` 等未支持命令
- **THEN** CLI SHALL 返回未知命令诊断，不读取宿主回交、不执行工作或写 Run

#### Scenario: Write result is unconfirmed

- **WHEN** Action 命令写后读回失败，或完成文件仅部分保存
- **THEN** CLI SHALL 返回 exact Run 路径与未确认/不完整状态，不报告 durable completion

### Requirement: Foundation CLI remains a thin bootstrap-era surface without self-management

Production CLI SHALL 将只读 `status/next/doctor` 与有界 `action start/finish`、`proof inspect` 组合到同一发行入口；写命令 SHALL 只执行本 Change 的机械记录/核对，不执行 Agent 的 Author/Reviewer 实质工作。CLI SHALL NOT 读取/执行 `.agents/skills/**`、调用模型、执行 Author/Reviewer transport、驱动 OpenSpec mutation、自动切换 Role/下一 Action、激活 Change、建立 Registry、执行 Full Test/Final/Git 或提升 Owner authority。OpenSpec 实际工作归已获准的 Agent。当前 Delivery 仍由上一 Delivery exact Stable manager 治理；当前 candidate CLI 不自我接管。Archify 无产品入口。

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
