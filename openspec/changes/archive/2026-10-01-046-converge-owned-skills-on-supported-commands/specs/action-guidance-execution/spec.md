## ADDED Requirements

### Requirement: Current owned Action guidance follows the issued fixed commands

发行包的十个当前自有 `skills/actions/<actionId>/SKILL.md` SHALL 各自保留该 Action 的实质方法、角色边界和 STOP，同时把正常的 canonical Run 开始、proof 检查与结果结束说明映射到同一选定 manager 安装的 `action start`、`proof inspect`、`action finish` 封闭数据命令。有效 HOW/示例 SHALL 与实际命令、请求字段、可见目标、返回效果和读回条件一致；SHALL NOT 把直接导入内部 `dist` 模块、临时 Node/Python 生命周期程序、callback 或手写三文件作为正常路径。Skill SHALL NOT 依据帮助输出、`effect=confirmed`、Review approved 或历史 PASS 创造新的 Owner、Reviewer、Verification 或 Git 权限。当前 Delivery SHALL 继续由已选外部 Stable manager 管理，候选 Skill 不接管其正式 Run。

#### Scenario: Independent role follows an issued Action entry
- **WHEN** Policy 已确定一个合法 Standard Action，实际角色读取所选 manager 中相应自有 Skill
- **THEN** Skill SHALL 引导该角色以固定数据命令开始和结束一个真实 Run，核对三文件与合法下一边界后 STOP，并保留该角色的实质判断标准

#### Scenario: Candidate Action Skill changes during its Delivery
- **WHEN** 当前 Delivery 的候选 Action Skill 或 build 已更新
- **THEN** 当前正式操作 SHALL 继续采用已选 Stable manager 的 Guidance，候选字节 SHALL 仅作为该 Delivery 的开发与验收对象

### Requirement: Producer guidance declares every file in its own formal proof directory

Agent 在本 Run 正式 proof 目录 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/` 产生材料时，SHALL 在结束该 Run 前将该目录内每个文件以 exact 归属、路径、bytes、SHA-256 和用途纳入该 Run Result 的 `proofRefs`；无必要新文件时 SHALL 不建立空目录并使用空 `proofRefs`。生产者 SHALL 核对每个声明与实际原始字节，并在不能完整声明、文件不可读或身份冲突时停止完成声明，不以 `.tmp` 副本、备份分支、后补摘要或仅列出一个被选择的文件代替完整集合。后续 Action 的 handoff SHALL 仅携带当前判断需要的已声明引用；该按需交接 SHALL NOT 缩减生产 Run 的 `proofRefs`。本要求约束自有 HOW 的材料生产与交接；目录闭合集的代码强制检查由独立后续 Change 负责，不因此扫描所有历史 proof。

#### Scenario: A Run creates three proof files but lists only one
- **WHEN** 生产者准备结束本 Run，正式 proof 目录存在三个文件，而候选 `proofRefs` 只包含其中一个
- **THEN** 自有 HOW SHALL 要求先核对并完整声明该 Run 的三个真实文件，不能将不完整 Result 称作可 checkpoint 的证据

#### Scenario: Later review needs one prior proof
- **WHEN** 独立 Reviewer 的当前判断只需先前 Run 中三个已声明文件的一个
- **THEN** handoff SHALL 可只引用该相关文件，且先前 Result 的完整 `proofRefs` SHALL 保持原样

#### Scenario: No new material is needed
- **WHEN** 一个 Action 未产生需要保留的新 proof 文件
- **THEN** HOW SHALL 使用空 `proofRefs` 且不创建空 proof 目录，不为满足形式要求制造材料
