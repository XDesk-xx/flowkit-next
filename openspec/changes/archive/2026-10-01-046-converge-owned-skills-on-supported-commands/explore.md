# Explore: converge owned Skills on supported commands

## 真实目标与当前边界

D07 Change C 将当前有效的自有 Skills、HOW、接入说明与已经发行的固定命令收敛，使独立角色能从同一安装、同一正式边界完成工作。Owner 已授权激活 C 并进行本次 proof Explore；这不授权 Proposal、产品修改、Reviewer 判定或 Git checkpoint。本次开始于 B 的 Delivery 工作分支 checkpoint `73d300d57946c0d95a349e7f2f086979e185b157`，C 的项目序号为 46，正式 Explore Run 为 `20261001-027-explore`。

B 遗留的 54 个未声明 proof 文件已单独保存在本地 `codex/d07-b-proof-backup` 的 `8e0c9758e47885f71aa30a2851f52cb7adb2179e`；它们不是 C 的 proof，也不因备份提交获得正式 Run 声明。本 Change 不重写 B 的 Run、Result 或历史证据。

## 有界取证

本次 source 与命令观察保存在本 Run 的 `source-boundary.json`，实际帮助输出按原字节保存在同目录的 `help.stdout.txt`、`help.stderr.txt`。摘要记录被检查文件的字节身份、定位与候选 CLI 的实际 `--help` 退出状态；它只证明该时点的事实，不证明所有命令的运行语义或后续 Apply PASS。

| 观察 | 决定影响 | 不能推出 |
|---|---|---|
| 候选 CLI 帮助已列出 `action start/finish`、`proof inspect`、Delivery、Change、Memo、Full Test、Final 与 Git 固定命令；当前十个 `skills/actions/**/SKILL.md` 已用 `action start/finish` 描述机械记录。 | C 应逐项审计和修正仍有冲突的有效资产，不能把 A/B 已完成的入口重新当成缺失能力。 | 帮助文字不能代替请求形状、错误语义和端到端验收。 |
| `skills/delivery/start/SKILL.md` 仍指向宿主 `writeManifest`；`full-test/SKILL.md` 仍要求直接调用 `invokeDeliveryFullTestOperation`；repository integration Skill 与 `host-call.md` 仍提供动态导入及回调样板。 | 默认 HOW 要对应已发行固定数据命令，保留各节点的 Owner、失败、部分成功与 STOP 规则。 | 不能仅删除旧文字；需核对每个新命令的真实参数与效果。 |
| `README.md` 与 `docs/onboarding.md` 已列出固定入口，`AGENTS.md` 同时保留较早的只读 CLI / 直接 Git 宿主叙述。 | 只改仍与当前发行事实冲突的当前说明，并保留历史背景与外部 Stable manager 边界。 | 不应批量改写长期 guidance 或历史 Run。 |
| `src/cli/action-proof.ts::checkDeclaredProofs` 逐个核验传入的 `proofRefs`，但不枚举本 Run proof 目录；Stable Git checkpoint 对新增 proof 路径反向要求在所属 Result 中唯一声明。 | C 的 Skill/接入合同应明确：本 Run 正式 proof 目录中的每个文件都须在该 Run 的 `proofRefs` 中以 bytes/SHA 声明；下游交接只选当前判断需要的引用，是另一回事。D 应对该闭合集实施有界机器检查。 | 54 个 B 文件不是 B 功能未实现的证据；C 也不在本阶段修改 TypeScript 校验器。 |

## 拟定的最小合同边界

1. 对十个标准 Action Skill、四类 Delivery Skill 及有效 references、自有 OpenSpec Tool Skill、README/onboarding、CLI help/示例、AGENTS 当前入口、直接冲突的现行 spec 逐项核对。保留已经正确的内容，只消除实际矛盾。
2. 正常生命周期机械操作使用同一发行安装的固定数据命令及其真实请求和输出；Agent 负责理解 Owner 指令、角色判断、实质 Explore/Proposal/Apply/Review，不把 CLI 说成聊天监听器或自动 Reviewer。
3. 指引须明确 `proofRefs` 与本 Run 正式 proof 目录的完整归属，产生材料时即记录并核对原始 bytes/SHA；可丢弃请求和诊断放 `.tmp`。跨 Action 交接仍只携带下一步确需的引用。对缺失声明应在 finish/后续 Git 节点前停下，不把备份分支或后补日志当成正式声明。
4. 保留独立 Reviewer、真实 verdict、验证证据、Owner 授权、部分成功处理和每次操作后的 STOP。移除把动态 import、回调或临时 Node/Python 生命周期脚本作为正常操作步骤的自有指导，不把它搬进 reference。
5. `skills/vendors/openspec/**`、历史 `.flowkit/runs/**` / artifacts、归档 Change 和本 Delivery 仍使用的 bootstrap 指引保持原样；若 `.agents/skills/**` 有当前有效使用方，先识别再决定是否更新，不让候选 HOW 接管正在运行的外部 Stable manager。

## C 与 D 的分工及验证出口

C 的 Proposal 应给出逐资产差异清单、精确命令请求/响应示例、真实角色边界、proof 生产与交接规则，以及只针对当前有效资产的语义 stale scan。Apply 应在同一候选发行包上核对帮助与命令行为，并证明独立角色能依说明找到正确安装与下一合法边界。

D 负责 TypeScript/临时脚本用途约束、正式 proof 目录与 `proofRefs` 的机械闭合集核验，以及窄权限执行说明。C 不新建 Registry、证据平台或自动工作流，也不改动 B 已实现的产品命令或为 54 个历史文件补造 Result。

本次取证是 Explore 证据，不含 Reviewer verdict、产品实现 PASS、Formal Full Test 或 Git checkpoint。下一边界是独立 `review-explore`。
