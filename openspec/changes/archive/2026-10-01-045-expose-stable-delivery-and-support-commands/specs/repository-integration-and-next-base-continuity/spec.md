## MODIFIED Requirements

### Requirement: Git workflow nodes use an explicit supported host without owning Action lifecycle

系统 SHALL 在发行 `flowkit` 中提供固定 `git checkpoint`、`git push`、`git integrate` 命令，复用既有受控 Git host 能力。Agent/宿主 SHALL 在调用前依据真实 Owner 指令确定 exact target、操作、branch、remote/ref、提交路径或复用对象及 `sourceRef`；CLI 不读取聊天，也不以请求 JSON 的存在、Review/PASS/Final、dirty 集合或自签 hash 推断授权。固定命令 SHALL 按操作校验 Agent 提交的 Owner authority 与 Git request 完全一致，在 Git 写前重验当前 Policy/Final、index、对象和目标等既有前置，并保留现有精确范围与部分效果规则。CLI 对 Owner 来源的结构/一致性校验 SHALL NOT 被描述为独立认证聊天；执行者对真实 Owner 输入的 attestation 仍是宿主责任。普通 Start 后 commit、Change checkpoint 和 push SHALL 不要求 Final、Integration package 或 PR/merge；仅 Delivery Integration 消费已确认 Final。

Change checkpoint SHALL 使用现有 `authorize-checkpoint`、exact Change、`scope=["checkpoint"]` 与 Policy evaluator；普通 Start checkpoint SHALL 使用同 decision/scope、exact Delivery、无 changeId 且绑定本次完整 Git operation；push SHALL 使用 `authorize-push`、`scope=["push"]` 与 exact Delivery/可选 Change、commit 和 remote/ref；Integration SHALL 使用现有 `authorize-repository-integration` singleton 与 exact checkpointOperation。一个命令的 fact SHALL NOT 自动授权另一命令，同一 Owner 消息即使明确授权多个 Git 步骤也必须分别绑定并执行。CLI SHALL 对 operation 中的完整路径、commit message/shape 或复用 SHA 做 exact 对照，而不只检查 fact 的外形。

`status`/`next` 与 checkpoint authorization evaluator SHALL 保持只读，Policy 只计算边界；只有独立调用的 exact `git` 写命令可执行相应 Git 操作。该命令 SHALL NOT 创建新 Standard Action、Git Run、Owner decision 或自动执行循环。PR/merge SHALL 使用既有工具或人工交接，不要求全 provider 原生实现。

#### Scenario: Ordinary checkpoint and push do not require Final
- **WHEN** 普通 Git 节点的现有合法边界、Agent 已观察的明确 Owner 权限、target 与操作范围成立
- **THEN** 固定命令 SHALL 可只完成请求的 commit 或 push，不读取 Final/Full Test/Archify，不自动接着 PR/merge

#### Scenario: No authority means no Git write
- **WHEN** Agent 未提交本次真实 Owner 决定，或 authority/操作/target/sourceRef/当前前置不符
- **THEN** 固定命令 SHALL 在 Git 写入前停止；CLI 不从结构外形、Review/PASS 或聊天关键字补造权限

#### Scenario: Manager and target are separate
- **WHEN** Agent 使用安装根自有固定命令访问无 Flowkit scripts/Skills 的 target
- **THEN** 实际 Git cwd/读写 SHALL 属于 target，资产来自 manager，不复制或回退到 target 同名模块

#### Scenario: Chat source is outside CLI visibility
- **WHEN** Agent 基于真实 Owner 指令提交匹配的 `sourceRef` 与 operation，但 CLI 本身没有聊天读取能力
- **THEN** CLI SHALL 按本次宿主 attestation 与现有 Git 前置处理，不建立 Codex 桌面监听器，也不声称独立证明消息真实性

## ADDED Requirements

### Requirement: Fixed Git commands preserve exact object and remote readback

`git checkpoint` SHALL 复用完整 index、授权 exact paths、managed evidence 原始 bytes、commit shape/message 与实际 Git 对象核验；`git push` SHALL 仅推送已确认的 exact local commit 到指定 remote/ref 并读回远端 exact ref；`git integrate` SHALL 先消费有效 Final confirmation 与既有 Integration singleton/checkout/object 前置，按已授权 create-new/reuse-existing 操作执行并确认真实接受。三个命令 SHALL 分别调用和 STOP，不从本地 commit 推断 push/merge，也不在部分成功后自动重试、reset、清空 index、回滚或补写 SHA。

#### Scenario: Scoped checkpoint contains unrelated staged file
- **WHEN** Owner 只授权 exact paths A，完整 index 还包含范围外 B
- **THEN** `git checkpoint` SHALL 在 commit 前报告 B 和任何已发生的暂存效果，不扩大提交或清空 index

#### Scenario: Local commit is confirmed but remote push fails
- **WHEN** checkpoint commit 已由 Git 读回，而 `git push` 未获远端 exact ref 接受
- **THEN** 两个命令的结果 SHALL 分别保留本地 commit 与未确认远端状态，不声称已发布或自动重试

#### Scenario: Integration lacks confirmed Final
- **WHEN** manifest completed 但有效 Final confirmationRef 缺失或不匹配
- **THEN** `git integrate` SHALL 在 Git 写入前拒绝，不从 completed 字段或 caller 摘要补造 Final
