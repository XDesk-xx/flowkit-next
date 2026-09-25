# Action Guidance provenance hardening：proof Explore

## 当前范围

Delivery `20260924-06-action-boundary-corrections` 的第一个 Change 已按 Owner 来源 `owner-input:2026-09-24:activate-harden-action-guidance-provenance:proof-explore` 激活。本次 Action 是 Author `explore`，Run 为 `20260924-001-explore`，`projectOrdinal` 为 40。输入问题报告为仓库根目录的 `flowkit-action-guidance-provenance-hardening.md`；该报告是问题线索，以下结论以当前 manager 和源码的直接证据为准。

目标仅是防止**新启动的 Action**把伪造、过期或错配的 Skill 内容 SHA 写进 canonical `action.md`。既有 Run、Owner correction、`prepared` 取消语义及 LearningPlatform 的具体历史修复不属于本 Change。

## 已确认事实与决定影响

| 事实与证据 | 决定影响 |
| --- | --- |
| 固定 manager `0.1.0` 的 `resolveActionGuidanceRef()` 从本安装的 canonical `SKILL.md` 读取 bytes 并计算 SHA；`review-apply` 的实际值为 `5610e1604e57ee51a214c32bfccc7f45653157b0261c9aa3559a959c97fd42c5`。见 `src/domain/action-guidance-execution.ts` 和本次 proof。 | 复用现有 resolver；不建立 Guidance registry、签名服务或 target 侧 Skill 副本。 |
| `isActionGuidanceRefForAction()` 只检查闭合形状、canonical path 和 64 位 hex；`formActionPackage()` 接受这个普通对象，`isActionPackage()` 也作同类结构校验。见 `src/domain/action-guidance-execution.ts`、`src/domain/action-package-result-admission.ts`。 | 结构合法不能代表来自本次安装的真实 bytes；新启动入口必须核对 provenance。 |
| 本次只读内存反例在固定 manager 上得到 `realAccepted=true`、`forgedAccepted=true`、`wrongActionContentAccepted=true`、`forgedPackagePassesShapeValidator=true`。见 `.flowkit/artifacts/20260924-06-action-boundary-corrections/changes/harden-action-guidance-provenance/proof/20260924-001-explore/stdout.txt`（516 bytes，SHA-256 `445bdeda7663477e6c701a58b8f74c32feff82710e6dbc834f3ff3d4b66fbae2`）。 | 原始问题可由当前正常导出的 package API 复现；不是仅凭事故报告推断。该反例未写 target Run，因此不声称它本身制造了 partial Run。 |
| `invokeSingleAction()` 已在内核路径内部调用真实 resolver；十份发行 `skills/actions/**/SKILL.md` 的 Agent 分段记录示例则把 GuidanceRef 作为普通输入交给 `formActionPackage()`，然后自行写 `action.md`。相关测试也以任意 64 位 hex 作为有效 package fixture。 | 修复重点是 Agent 实际启动入口和 package/start 接缝；现有安全的内核调用路径应保持语义。适用测试和十份 HOW 需一并收敛。 |
| 当前 `writeDurableRun()` 与 HOW 的分段 start 均可能先 create-once 写 `action.md`，再完成三文件；错误在写入后才发现会留下不能覆盖的 partial。 | 伪造或过期 Guidance 必须在本次 `action.md` 创建前失败；不得靠删除、覆盖或跳过 Run sequence 恢复。 |

## 必须保持的不变量

1. 对新 Action，`GuidanceRef.path` 由已确定的 `actionId` 唯一给出，`contentSha256` 等于本次 trusted manager installation 中该 canonical regular Skill 文件的真实 bytes SHA。caller 不提供可被信任的 SHA。
2. 真实 resolver 结果、package 形成、package-bound readiness 与 create-once `action.md` 起始记录构成同一次明确 start 边界。provenance 不成立时，先拒绝，且不创建 Run 文件。
3. 普通 Agent 入口不能只凭结构合法的 ref 或 package 进入写入；仅增加一个返回可改写普通对象的 factory、但仍由 Agent 手工写 `action.md`，不足以强制上述边界。Proposal 应把最终写入前的绑定放在 manager 自有的有界 start 能力，并让 HOW 调用它。
4. `isActionGuidanceRefForAction()` / `isActionPackage()` 可继续承担纯结构校验，但名称、调用处和合同必须明确它们**不证明安装来源**。不得把形状检查当作启动许可。
5. 既有 terminal/prepared/partial Run 保持原字节和原时点 Guidance 身份；读取历史时不拿新安装的 Skill SHA 追溯否决。安装 A 的旧 ref 不能用于安装 B 的**新**启动。
6. 保留现有 Role、Owner、Policy、Result admission、一次 Action 后 STOP；本 Change 不增加新授权节点或自动继续。

## 最小 Proposal 方向

在已有 `action-guidance-execution`、`action-package-result-admission`、Run 起始记录能力之间增加一个 manager 自有的明确入口：输入 trusted installation、已决定的 exact Action、当前 Run context 与受控地址；内部解析 canonical Skill、形成 package、核对 readiness，并在写 `action.md` 前重新确认同一 Guidance 内容身份。只有通过后才 create-once 写入并返回该次 held package。十份实际 Action HOW 消费此入口，不再传手填 SHA。保留纯结构 validator 供数据形状、测试及下游适用检查使用，但不宣称其具备 provenance admission 权限。

Proposal 必须明确失败前后顺序：解析/比对失败没有目录或 `action.md`；create-once 写入之后的文件错误按现有 partial 规则保留并报告，不自动清理或重新占用 occurrence。真实安装 A/B、同一路径 Skill bytes 变化、错 Action SHA 和合法路径均需有界回归。

## 边界与局限

- 本次反例仅证明当前 package API 接受错误 provenance；LearningPlatform `062`/`068` 的现场经过来自问题报告，本次没有改写或重演其历史 Run。
- 没有实现代码、改动测试、改动 Skill 或进行发布验收；Explore proof 不是 Apply PASS。
- 不为对抗任意恶意脚本直接写文件而增加通用沙箱、签名、注册表或数据库。本合同约束 Flowkit 提供的正常 canonical start 路径，且保留持久记录校验。
- 第二个 Change 的 `prepared` Owner correction 与本 Change 共享部分 Run/start 文件，但取消模型独立设计、审查和验收，不借本次 Explore 决定。

## 结论

**PASS（Proposal-ready Explore）**：真实可复现的缺口在“普通 ref/package 形状校验被当作新 Run 启动许可”。最小修复应把当前已有 resolver 的结果绑定到 manager 自有的 create-once start 边界，在写 `action.md` 前拒绝伪造和过期内容身份；历史 Run 与其他生命周期语义保持各自原有归属。下一独立边界为 `review-explore`。
