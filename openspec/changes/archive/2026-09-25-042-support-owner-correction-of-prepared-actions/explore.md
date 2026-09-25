# Prepared Author Action 的 Owner 前向修正：proof Explore

## 真实问题与边界

Delivery `20260924-06-action-boundary-corrections` 的本 Change 已由 Owner 激活，首次 Explore 的持久 `projectOrdinal` 为 42。目标是在 **Author Action 已真实开始且仍为 `prepared`** 时，允许 Owner 用现有 `revise-action` 授权选择该阶段或更早的合法 revise Action。旧 Run、Result、proof 与已完成实现事实必须保留；未完成 Action 不得被写成 PASS，也不得由 Owner 决定自动执行下一 Action。

LearningPlatform D07 的 `student-learning-workflow-and-draft-recovery` Run `20260924-089-apply` 是当前真实输入。只读复制其五个 Run 的三文件到 `.tmp` 后，原文件与副本 SHA 均相同；没有修改 LP。`089` 为 `prepared apply`，四个 outcome/next 字段均为 null，`implementationPerformed=true`，人工 UI checkpoint 尚未执行。合同范围只读验证这个形态及等价的 prepared Author Action；不迁移或修复 LP 089。

## 决定性证据

| 问题 | 已观察事实 | 合同影响 |
| --- | --- | --- |
| 真实 prepared Run 是否可被既有持久化读取？ | stable manager 从 `089` 三文件只读副本恢复了合法 `prepared` Run；没有要求伪造 terminal outcome。见 `prepared-correction-baseline.json`。 | 保留旧 Run 的原始三文件与 null outcome；不要覆盖成 FAIL/PASS。 |
| 已有 Owner correction 能否从该状态到 `revise-propose`？ | 无 correction 时 Policy 返回 `ready-action: apply`；用**合成、形状合法**的 exact `revise-action` authority 请求 `revise-propose` 时返回 `blocked: unsupported-owner-correction`；`prepared apply -> prepare revise-propose` 的生命周期转换返回 null。 | 缺口同时位于 Policy eligibility 与 prepared slot transition；合成 authority 只是反例输入，不是 LP Owner 授权。 |
| 原有 Run 链能否表达旧 Run 后接新 revise Run？ | 五个 LP Run 的只读副本解析为唯一链，current 为 `089/prepared`。在内存中附加带 `previousRunId=089`、exact Owner authority 的 `090/revise-propose`，当前链只因 Policy edge 不合法而拒绝；该合成 child 从未落盘。见 `prepared-chain-boundary.json`。 | 既有 `previousRunId`、新 Run 的 `ownerAuthority` 与唯一 tip 已具备所需历史和来源字段。新 `cancelled` lifecycle literal **并非已证明必需**；可优先评估有界 Owner supersession transition，保持旧 prepared bytes 不变。 |

## Proposal 必须固定的不变量

1. 只对当前 active Change 的 prepared **Author** Action 接受显式 Owner correction；仅允许既有 stage matrix 中合法的 `revise-explore`、`revise-propose` 或 `revise-apply`，精确核对 `decision=revise-action`、Delivery、Change、单一 scope 与 requested Action。缺失、错配、前跳、Reviewer prepared、archive/completed 均 fail closed。没有 correction 时继续原 prepared Action。
2. 旧 Run 完整三文件和 proof 保持原 bytes 与 null outcome；已做的实现和自动检查事实仍可读，但不成为 Apply PASS。新 revise 使用新 occurrence、新 `action.md/context.json/result.json`、`previousRunId` 和 Owner authority；当前 tip 才可前进。不可用聊天、临时副本或旧 proof 代替正式来源。
3. Policy 只给合法边界；结构转换/start 必须消费同一 exact Owner authority 与目标，不能在没有可追溯新 Run 时静默放弃旧 prepared。开始前验证失败不改旧 Run；新开始部分失败则保留 partial 并报告，不覆盖、不自动接管或补造成功。新 revise terminal 后仍需正常独立 Review，再进入后续 Apply。
4. 保持原有 `prepared/terminal` 与单 current Action 的封闭合同，除非 Proposal 能证明 child linkage 加有界 Owner transition 无法满足上述不变量。参考设计 Markdown 的 `cancelled` 建议不是 OpenSpec authority，也不是 Explore 实验已证明的必要状态。

## 不纳入本 Change

不修改 LearningPlatform 089、其 proof 或 manager；不自动重放 LP D07，不增加通用取消/恢复平台、Owner 授权类型、Standard Action、Reviewer 自审、Git 权限或自动下一 Action。LP 业务 Proposal 中的 UI 验收归属调整属于 LP 自身，不由 Flowkit 本 Change 编写。

## 结论

**PASS，可送独立 `review-explore`。** 真实 prepared Run 与当前拒绝路径已被只读副本和合成边界输入证明。最小 Proposal 方向是在现有 Policy、Action lifecycle/start 与 Run 链上定义 exact Owner 授权的 prepared-to-revise 前向替代，并证明失败顺序、旧 Run 不变、current tip 与后续 Review 连续性。此 Explore 未实现产品能力；合成 child 和旧自动检查均不是新实现验收。
