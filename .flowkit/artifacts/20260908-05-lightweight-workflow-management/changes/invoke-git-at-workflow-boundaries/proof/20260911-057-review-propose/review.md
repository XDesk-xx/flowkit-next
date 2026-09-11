# 057 review-propose — invoke-git-at-workflow-boundaries

结论：approved。被审对象为 20260911-056-propose；沿用 054 Explore → 055 approved。无 finding、无阻断未知项，scope drift：NONE。批准的是计划可进入 Apply，不是实现验收、Verification PASS 或 Git 权限。

## 独立核对

- 056 terminal Propose 指向 055 approved，后者审查 054；manifest 中 ordinal 38 仍 active，前置 simplify-delivery-coordination 已 completed。D05 的 Full Test/Final 仍 pending。
- 核对 056 及其 20 个相关引用的原始 bytes/摘要，包括五份计划、accepted Explore/review、运行上下文与当前结构验证材料；不把目录最大编号或自检 PASS 当审查结论。
- 已完整对照 proposal/design/tasks、两份 delta、对应现行主规范、055 交接提醒及 Owner 所选计划的 Git 节点部分。检查 operation、source equality、record/ref、Git helper、checkpoint evaluator 和 Policy 的直接实现落点，确认这是待实施的合同修改，不是绕过现行 guard。
- 本轮独立运行 exact OpenSpec 1.10.0 version、strict validate、status，三个命令均 exit 0。两份 delta 含 4 MODIFIED、3 ADDED，四个修改块保留原有 scenario 名称；17 项任务全部未勾选。场景名称检查仅属结构覆盖，语义判断来自上述人工对照。
- 本次没有重跑 Explore Git 实验、产品测试或 Full Test；所保留实验只作已接受设计依据。当前 status 的 planning done 不等于实现完成。

## 合同完整性与边界

1. 普通 Start 后 Git、Change checkpoint/push 与 Integration 分开。固定 manager 自有薄宿主入口，复用现有 helper；Change checkpoint 仍消费 evaluator，只有 Integration 要求已确认 Final。CLI、Policy、Action/Run 和 D05 bootstrap authority 不扩张。
2. create-new 的路径、消息、显式 null/指定 shape 与 Owner 来源、package、clone/equality、record/ref/validator 一起绑定；reuse-existing 仍绑定 exact 对象。取消默认 clean/parent/count 不授权额外 Git 操作。兼容策略明确拒绝旧缺字段新输入，不改写历史。
3. index 范围明确为相对 HEAD 的待提交差异，unborn 用空树；暂存前/commit 前全量对照本次授权，范围外 staged 不自动清除。NUL/literal 路径、rename/delete、可观察漂移、提交后逐对象范围和无关 dirty 保留均有任务覆盖。
4. push 的 publication 与 Integration 的 acceptance 分开；本次真实远端查询、对象/接受来源及 Final confirmation 保持核验。callback、PR id、本地 ref 不能冒充远端接受。
5. 返回已知 checkpoint、失败阶段、未知与剩余步骤；已暂存/已提交不得误报无副作用。人工 pending 不报 terminal，不自动重试/回滚或回写 SHA 形成提交循环。
6. Apply 需当前 build 的宿主实例、packed manager/target 分根、实际本地 bare push、原生 Windows 与 Linux 适用回归。证据区分真实宿主输入与合成 authority/provider；不要求公网 PR 平台，也不能复用 Explore PASS 作为实现验收。

## 必要评估

当前步骤：review-propose，判断 056 是否把已接受问题收敛为可测试且可实施的最小合同。

复杂度/最小性：三个薄宿主函数对应 checkpoint、publication、Integration 的不同权限/完成边界，复用现有 source/Git/operation，不建立 Provider Registry、Git SDK、持久结果库或自动恢复。精确路径/形状、失败返回及 packed 验收是本次安全执行所需，不属于外围平台扩张。

new-content / scope drift：NONE。新的参数与 reference 直接落实 055 五项提醒；不增加新的 lifecycle、Owner schema、Full Test 体系或 Archify 前置。没有需要返回 Explore 的未知，也不要求另建 corrective Change。

Apply 重点是落实既有任务中的全部直接消费者一致性、写前权限/范围与写后对象读回；不能只删除旧 guard 或用恒 true reader 代替真实授权交接。

## 交接与 STOP

下一边界为 apply，实际调用仍需既有 authority/host boundary。本轮不执行 Apply、Git mutation、Archive、D05 Full Test 或 Final。

Owner 决定来源沿用 054 context.json#ownerDecisionsRelevant；必要材料保留 target artifacts，.tmp 可丢弃，历史/原始 bytes 不重写。按独立 review-propose Skill，仅写本轮 Reviewer Run/proof，不消费 candidate Reviewer HOW。
