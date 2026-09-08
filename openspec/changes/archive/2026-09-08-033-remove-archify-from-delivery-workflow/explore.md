# Explore：移除 Delivery 架构依赖

## 当前边界与授权

- Delivery：`20260908-05-lightweight-workflow-management`；Change：`remove-archify-from-delivery-workflow`。
- Owner 已明确授权激活第一个 Change 并进行 proof-based Explore，proof 按 D05 文档保存。沿用独立 bootstrap；candidate 仅作为实验对象，不管理本次 Action。
- `projectOrdinal: 33` 来自 manifest 中已分配且唯一的 21–32 的最大值加一。其余五个 planned Change 不预留序号；不引入 C1/C2 别名。
- 先前“不处理 Archify”是 Delivery Start 的边界。本次探索首个退役 Change，不等于授权立即删除代码、工具或历史。
- 输入：[D05 计划](../../../flowkit-next-delivery-change-plan.md)、[D05 分析](../../../flowkit-next-d05-decoupling-analysis.md)及当前代码/活动 specs。代码定位 HEAD 为 `97bcd2f99dcf6946b646fb1759b2e64584007c30`，不是新设 SHA 准入门槛。
- `spec-driven` 没有原生 Explore artifact；此文件是 bootstrap 补充分析，不伪装成 Proposal，不改变 OpenSpec schema。

## 问题与已确认事实

目标是取消 Archify 与交付资格的关联，而不是保留架构步骤再写 optional、skip、not-applicable 或空成功结果。现有代码遵守 D04 旧合同；本次是 Owner 授权的产品合同变更，不把旧合同测试通过说成 D05 已实现。

| 直接边界 | 当前事实与定位 | 最小决策影响 |
| --- | --- | --- |
| Operation/HOW | `src/domain/delivery-operation-execution.ts` 的五值集合、固定 Guidance 映射及 Architecture variant | 删除专属活动 operation、映射、facts、导出；其余 operation 保持既有 envelope 和权限 |
| Start | `src/internal/delivery-start-content.ts` 固定 manifest 加 C/P/compare 四个输出及三个 Archify check | 同步删除固定图输出与检查，不只修改 Start HOW |
| 工具/doctor | resolver 按请求解析单个工具；`foundation-cli.ts` 的 doctor 主动检查两个工具 | 保留 exact OpenSpec 解析；移除 Archify 产品必需项，不必重做通用 resolver |
| Final | `delivery-final-execution.ts` 输入 exact shape 要求 architectureOutcome，并校验 closure 与 post-materialization candidate | 删除架构字段及 lineage 分支，继续验证真实 Full Test 与 Change 完成事实 |
| 共享证据 | `delivery-required-evidence.ts` 必填 architecture；`delivery-required-evidence-source.ts` 强制 readArchitecture | producer、shape/clone、来源 reader、重验必须一起收敛，不能给它塞空值 |
| 协调/Integration | `delivery-final-operation.ts`、`delivery-final-coordination.ts` 写入/核对架构字段；Integration 经共享证据 reader 消费架构来源 | 修改直接消费者，不留下旧必填字段或默认补图；保留窄写、范围、Git 授权及实际对象核对 |
| 资产/历史 | 产品拥有 `skills/delivery/architecture-finalization`、`skills/tools/archify`、`skills/vendors/archify`；历史资料另有归属 | 退役产品专属资产，不删除用户独立 Skill/runtime 或改写 D04 历史 |

完整静态命中与原始行号保存在 proof 的 `attempt-01/direct-consumers.stdout.txt`。它是调查索引，不是“所有命中都必须删除”的任务清单；例如 gate 中“不运行 Archify”的负向边界不构成必需依赖。

## 实际 proof 与结论

必要材料根目录：[`proof/20260908-001-explore`](../../../.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/remove-archify-from-delivery-workflow/proof/20260908-001-explore/README.md)。实际执行为 Windows x64、Node v22.23.2；详见 `attempt-01/summary.json` 和各 command/stdout/stderr。

| 风险/问题 | 实际实验与观察 | 已证明 / 未证明 |
| --- | --- | --- |
| 只删除绘图阶段是否够用？ | 模拟合法 OpenSpec runtime/list 输出，完全不创建 Archify runtime；doctor 的两个 OpenSpec diagnostic 为 pass，Archify 为 missing-runtime，整体 fail | 证明 doctor 有独立强制依赖；模拟夹具不代表真实 OpenSpec 端到端验收 |
| 没图时 Start 能否到内容验收？ | 隔离目录仅有 project identity 与 manifest，调用现有 content builder；返回 null，validation reader 未被调用 | 证明缺固定图触发早期拒绝；未证明其余 Start 前置全部成立，不声称完整 Start 反例对照 |
| 只删除 Final 的 architectureOutcome 是否够用？ | synthetic required evidence 在包含 architecture 时 shape 校验 true；只移除此字段后 false | 证明共享 shape 必须同步修改；synthetic refs/hash 不是 accepted Run 或真实测试证据 |
| 删除会不会误伤非架构边界？ | 运行 managed-tool、CLI、operation、Start、Final、required-evidence-source、Integration 七个现行定向测试文件 | 59/59 PASS，0 skipped；建立旧合同局部基线，不是拆除后 PASS，也不是 Formal Full Test |

三个反例都执行真实函数，不修改生产源码。测试中的模拟工具、合成 authority/Run/outcome 仅为隔离夹具，不充当 D05 的 Owner/Review/Verification 事实。脚本保存了来源文件摘要并在执行后核对输入未变化。

## 最小 Proposal 方向

以下是供审查的收敛方向，不是已批准设计、任务或 delta specs。

1. 从固定 operation 集合删除 Architecture operation，移除对应 HOW 路由、专属模块和 `src/domain/index.ts` 导出。六个专属模块包括 domain 的 execution/identity/operation 和 internal 的 archify/artifacts/closure；仅因通用名称而被共同使用的 helper 不连带删除。
2. Start 只取消 C/P/compare 输出与 Archify checks；保留现行非架构前置、内容验收和真实失败报告。本 Change 不解除 acceptedBaseCommit/clean 要求。
3. 在同一变更闭包内去掉 Final preparation/facts/record、required evidence/source、coordination、Integration 的架构字段和来源消费。删除中间架构 materialization 后，剩余 candidate 核对直接接续实际 Full Test candidate，不能继续引用不存在的 architectureMaterializedCandidateRef。只收敛架构链，不提前重构整仓 candidate 或所有证据链。
4. Archify 从 managed IDs、toolchain lock、doctor、产品专属 Skill/vendor 和发行引用退出。保留 OpenSpec 1.10.0 exact identity、FLOWKIT_HOME/tools、无 PATH fallback；不卸载外部用户安装，不扩展可选工具 Registry。
5. 同步活动合同、HOW 和 repository guidance。明确旧历史仅按原类型读取，不能转换成新 Final 的 accepted prerequisite；不为了读取历史保留两套活动执行流程或兼容成功 stub。

必要活动 spec 影响至少包括 `delivery-operation-execution-and-start-continuity`、`architecture-and-canonical-diagram-continuity`、`delivery-finalization`、`managed-toolchain-resolution`、`foundation-cli-surface`。Propose 核对 Integration/Full Test 文本的直接引用并只修改受影响条款；不要把所有包含 Archify 字样的无关规格批量重写。

对应 HOW 关注 `skills/delivery/**`、产品工具/vendor 资产、AGENTS/README 的活动约定；bootstrap `.agents/skills/**` 只在确有直接错误指导时作最小同步，并保持与产品 HOW 独立。本次没有读取或执行产品 `skills/actions/explore/SKILL.md`。

## 后续实现验收需要新增的证明

- 不提供 Archify runtime、任何图文件或 Architecture outcome，在满足其余当前前置时完成 Start → Full Test → Final；Integration 接受无架构字段的新 Final。这里只描述要验证的路径，不授权自动串行运行交付。
- doctor 无 Archify 时正常；缺失/错误 OpenSpec 仍有精确失败诊断。
- 真实 Full Test 失败/不完整、required Changes 未完成、来源损坏/不一致仍阻止 Final；无 Git 授权仍不能取得提交/集成权限。
- 没有活动架构 operation、必填图字段、readArchitecture 或专属 runtime 安装/检查入口；不以 skip、空结果、删除非架构测试满足验收。
- 用隔离的旧形状材料验证历史按原类型可读、bytes 不变；不把旧 bootstrap Run 当新 canonical product outcome，不要求重演历史 Archify runtime。
- 改造相关 fixture，并保留非架构失败回归；执行受影响检查与 650 行源码 gate。删代码后不超限且职责清楚的文件不先拆分；确需拆分时不压行、不放宽 gate。

上述拆除后端到端与 Linux detached 验收尚未执行，属于 Apply/Verification；不能复用本次 59/59 当当前实现通过。

## 保存、交接与非目标

必要 proof 从生成时写入项目内 `.flowkit/artifacts/`，包含脚本、夹具输入、原始观察、命令退出码和环境限制；默认长期保留，不覆盖旧 attempt，不移到仓库外，不只保存 `.tmp` 链接。本次是 Owner 授权的 bootstrap 保存，不声称 D05 产品持久化/接纳能力已实现。默认长期保留不自动产生 Git 跟踪或 commit 权限。

三种材料必须区分：本次实验支持当前不确定性判断；Owner 决策与后续 accepted review 构成决策依据（目前尚无 review approval）；当前实现验收必须由后续真实候选测试产生。局部 hash 只检查 bytes 一致，不单独证明真实执行或审查通过。

不处理：manager/target 分根、宿主接入、Full Test 独立范围配置与 current-attempt 保存实现、取消 Start Git 前置、整体 Final 简化、实际 Git 调用。这些仍由其余五个 Change 负责。本次不绘图，不改变历史、Memo、安装环境、生产代码、活动 specs、Skill 或 Git 状态。

## Explore 结论与 STOP

Author Explore：PASS，含义仅为本 Change 的最小问题与直接消费者边界已收敛，未发现必须扩大范围的阻断未知。剩余实现细节与后续验收不冒充已完成。

真实 bootstrap Run：`20260908-001-explore`。下一边界是独立 `review-explore`，Reviewer 应核对上述相关证据、存储授权及退役闭包；当前尚无 Reviewer verdict。不得直接进入 Propose/Apply；本轮 STOP。
