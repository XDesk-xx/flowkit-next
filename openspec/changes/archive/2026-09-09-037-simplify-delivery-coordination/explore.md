# 简化 Delivery 起止与完成确认：Proof Explore

## 当前边界

Owner 授权激活本 Change 并 proof Explore。D05 independent-bootstrap，projectOrdinal 37；真实 Run 为 `20260909-043-explore`，物理组 `005-simplify-delivery-coordination`。

依据：根目录 D05 两份规划；manifest 中本 Change 的 goal/outputs；依赖 connect-openspec-action-workflow 与 decouple-full-test-from-repository-tracking 均 completed。前次 archive 为 042，当前 Git HEAD 为 ba53f8ac9f48c71e334ec4d0ac3811a323fbd525，仅用于定位源码，不构成产品 Start 准入 SHA。

真实使用者是 Owner 和已有 Agent/宿主：Start 建立目标项目的交付上下文，Final 消费已完成 Changes 与当前有效 Full Test，Git 在独立授权节点工作。严格部分仍是 OpenSpec Action/Reviewer/Run，不把外围协调做成第二套审核系统。

必要 proof 按最新版 Owner 决定保存在 target `.flowkit/artifacts/`，默认长期保留；`.tmp` 仅可丢弃。依据为 `flowkit-next-delivery-change-plan.md` 的“决策与文档边界”“长期执行记录与产物”，不是早期项目外或周期清理方案。材料保留不代表旧 PASS 永远有效。

## Proof 与当前事实

证据根：`.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/simplify-delivery-coordination/proof/20260909-043-explore/`。

- `probe.mjs`：受控 callback 对照、真实文件窄写/冲突实验、源码顺序核对。
- `observations.json`：本次 7 项观察及相关源码 bytes/SHA。
- `retry.command.json`、`retry.stdout.txt`、`retry.stderr.txt`：Windows Node v22.23.2 真实执行，exitCode 0。
- 首次 `command.json` 保留 sandbox spawn EPERM；该次没有运行产品逻辑，不算产品失败或 PASS。
- `coordination-fixture/` 是本次内部 writer 的实验结果。其 passed/完成字段是明确的合成输入/输出，不是实际 Full Test 或 Delivery Final。

| 风险与问题 | 方法和已观察事实 | 决策影响 |
| --- | --- | --- |
| Start 能否不绑定 SHA/全仓 clean？ | 直接调用现有 prepare，其他输入固定；clean 对照可形成 package，dirty、null HEAD、不同 HEAD 均返回 null。源码在 surface callback 前检查这些条件。 | 不能只改 HOW 或把 acceptedBaseCommit 改成 optional；需同步 facts、observer、content completion 和直接消费者。 |
| 无 Git 的内容完成是否仍有隐藏依赖？ | delivery-start-content.ts 仍调用 deriveApplicableCheckCandidateRef；StartValidationMaterial 与 git-start-prestate 仍带 acceptedBaseCommit。 | 同时删除 Start receipt/validation 的 Git 固定点依赖，不伪造 SHA 或 git-check PASS。 |
| Final 是否已彻底脱离整仓投影？ | delivery-final-execution.ts 在 writeDeliveryFinalCoordinationClosure 后仍调用 deriveApplicableCheckCandidateRef；该 Git helper 从 index/untracked 枚举，排除 Runs 不等于 Full Test 配置选取。 | 删除 Final 的 finalizedCandidateRef v2 与整仓摘要连锁；不能用扩大排除列表修补。 |
| Final 是否重复接纳历史？ | required-evidence-source 的 parseRun 调用 formActionPackage/admitActionResult，chainIsComplete 沿 previousRunId 遍历至 null，输出逐 Run 三文件 refs；Final 再将 requiredEvidence 放入 package/ref。 | 保留 Action 本身严格链；Final 改为相关完成事实消费，不重建所有 Action package/admission。 |
| 轻量化会不会丢失写入保护？ | 内部 writer 对并发追加拒绝且保留并发 bytes；精确 prestate 下成功更新状态，保留状态旁注释和非目标尾部。 | 复用已有 source-range 窄写、目标路径限制、写前重验和读回，不整体 YAML 重序列化。 |
| 只删 Final 字段会不会留下断消费者？ | Integration prepare/execute 读取 finalizedCandidateRef、requiredEvidence，并做 source/object 再校验。 | 当前 Change 必须同步必要输入/校验/投影；Git transport/PR/merge 调用改进仍留下一 Change。 |

此处“重验历史”指源码可证的 Run schema/admission 与 previous 链消费，不声称现实现遍历了所有原始 proof 文件。不能把未观察到的行为写成缺陷。

## 最小收敛方向

### Start

沿用既有 delivery-start operation 与 Owner scope，读取 project identity、选定 Delivery 目标、Owner planning 范围和既有 Memo 展示。不要求 acceptedBaseCommit、首个 commit 或全仓 clean；无关未提交文件不构成冲突。

必要校验只针对实际写入目标和当前操作：同名 Delivery/路径覆盖、错误归属、歧义活动目标、执行期间目标内容漂移应明确拒绝。计划引用的身份/局部内容核对可保留，但不作为产品仓库版本身份。

内容完成时读回 manifest；不调用 Start 内嵌 commit callback，不生成 git-start-prestate 假 PASS。可选 Git 节点由后续独立授权操作承担。删除旧 callback 时同步直接测试/导出/消费者，不建设 Git adapter 平台。

### Final

复用 canonical manifest 所选 required IDs、只读 OpenSpec 当前状态、已有 Run 事实读取能力和 readCurrentDeliveryFullTest，不增加完成事实 Registry 或第二份结果库。

最小消费依据为：required Changes 全部 completed；各 Change 的实际 accepted archive 与关联 approved review-apply 完成事实匹配项目/Delivery/Change，相关记录可读且完整；当前活动 OpenSpec 不与完成声明冲突；当前 attempt 的真实完整 PASS 对当前测试输入仍有效。

不能只相信 caller 填的 completed/approved 布尔值或 hash。完成记录从现有事实源定位；相关 archive/review 的身份、Role、verdict、链接及必要完整性仍核对。Action 原有完整链校验由其 owner 保持；Final 不重新执行祖先每个 Action admission、不把全部链快照嵌入外围 package。具体已接纳记录读取接口与有限引用字段在 Propose 固定，不另存一份“已审核完成数据库”。

若当前完成事实缺失、矛盾或有多个可能终点，报告具体事实缺口，不按最大目录号猜测、不构造旧结果。D05 bootstrap 历史不能冒充 canonical 产品 Run；不借本 Change 转换历史或让 candidate 接管 D05。

Final 窄写既有状态与必要当前测试结果关联，删除 Git finalizedCandidateRef/完整 requiredEvidence 快照，不复制 Full Test outcome。保留当前 attempt 关联及输入/材料有效性检查；追加无关历史、非产品文档、.tmp 或协调状态本身不触发代码重测。

### 失败与持久化

写入前核对授权、完成事实、当前测试与目标 prestate；拒绝时不写完成。复用现有临时文件写入、目标 bytes 重验、rename 和读回作为有界提交点。

源码当前存在“manifest 已完成，再因 Git 投影失败而返回 record:null”的顺序风险。本轮仅以源码证实顺序，未故障注入重现。去除写后 Git 投影可消除该特定风险；真正 rename 后读回/输入变化等失败仍需明确区分“未写入”和“已写入但未确认”，不得声称无副作用或自动回滚。Propose 必须固定可读回的最小结果与这种失败语义，不建立通用恢复状态机。

跨会话读取依赖既有 manifest 与所指当前材料，不依赖聊天里的 package；不回写 SHA 形成提交循环。Final 后不自动清理 proof/Full Test、不执行 Git、不自动激活下一 Delivery。

## 活动合同与直接消费者范围

Propose 预计涉及 delivery-operation-execution-and-start-continuity、delivery-finalization，以及 repository integration 中被删除字段直接影响的条款。正式 delta 以实际消费者为准，保持其他已批准要求；不在 Explore 修改主规范。

预计代码位置：delivery-start-execution、delivery-start-content、delivery-final-operation/execution、delivery-final-coordination、required-evidence 及 Integration 直接输入/输出验证。既有 Git candidate helper 若仍用于工程检查，不应整模块删除。

HOW 同步预计是 Start/Final/Git 相关产品交接，以及确实受影响的 bootstrap/repository 说明；保持两面独立。此轮不读取或执行 candidate Action Explore Skill 管理 D05，不修改任何 Skill。

650 行源码 gate 保持；只在修改后超限或职责确需分离时拆分，不压行、不放宽、不机会性重构。

## 验收方向、限制与结论

后续 Apply 验证应覆盖：真实 unborn Git 项目和无关 dirty 文件可 Start；目标冲突拒绝；required 完成事实缺失/错归属/不批准拒绝；当前 Full Test 失败/partial/输入变更/材料损坏仍拒绝；非产品追加不要求重测；窄写保留非目标 bytes；Final 后跨会话读取及写后失败如实报告；Integration 不再要求已删除字段。

本次 Start 使用受控 observation callback，不是 unborn Git 原生端到端验收。writer 使用合成 package，只证明内部写入 seam。Final 全入口、Linux 实际执行及新接口均未验收；它们属于 Apply，不把这些限制包装成 PASS。

本轮不改生产、测试、规范或 Skills；不运行实际 D05 Full Test；不执行 Propose、Git、自动 Review；不重做已收敛的 Action/Full Test/Archify Change，不新增 Registry、永久新快照、清理器或自动工作流。

结论：Explore 范围已收敛，现有耦合及可复用写入边界有证据支持，可交独立 review-explore。实验 PASS 只表示观察与断言成立；不等于新实现 PASS 或 Reviewer approved。下一步须独立 review-explore，随后 STOP。
