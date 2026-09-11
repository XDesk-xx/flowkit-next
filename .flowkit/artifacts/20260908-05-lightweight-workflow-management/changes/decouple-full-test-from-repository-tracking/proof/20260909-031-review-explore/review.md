# 031 Review Explore

结论：`approved`。对象为 `030-explore`，Change 为 `decouple-full-test-from-repository-tracking`。这是问题证据、范围和 Proposal readiness 的独立审查，不是实现批准、产品修复完成或 Formal Full Test。

## 结论依据

- 74 个当前必要引用通过路径、文件类型、可读性、bytes/hash 核对；Author 的两项实验和一次读回原始流与命令元数据一致。
- Reviewer 七组隔离观察确认：Git ignore/跟踪状态影响现有输入；真实 artifacts 改变旧 candidate，而 Runs 被排除；暂存的 proof 输入/方法文件空白仍会失败，既有原始 stdout 例外有效；process API 不保存输出；相同输入的两次真实调用共享 executionRef；非 Git 根被拒绝；显式 regular 文件范围可与 Git/过程材料分离。
- 旧 PASS 校验函数只验证给定对象，并不证明它是当前尝试。Author 已标明环境实验限制；Reviewer 用相同输入重复执行及另一显式失败检查作对照，没有宣称真实 Final 被绕过。移除跨尝试自动复用是已授权的新方向，不把旧合同允许的显式复用本身定性为越权。
- manifest 对 HEAD 的差异仅为已授权 activation、projectOrdinal 和其 Owner 记录；production/tests/Skills 未变，未创建 Proposal。当前 004 分组调整的 Owner 决定已传递，不据路径变化推断违规，也不回写前三组历史。

## 三项评估

当前步骤：审查问题是否真实、证据是否足以收敛计划，以及哪些直接消费者必须一起调整。无阻断 finding。

复杂度与最小性：采用单个项目配置、普通文件范围、既有进程/文件能力、create-once Full Test attempt 与现有 Delivery 当前关联；不新增 Run 类型、Registry、EvidenceStore、调度器或恢复平台。配置语法/链接支持等精确选择属于后续 Proposal，不以 prototype 冒充实现。

新增内容与范围：`scope drift: NONE`。gate 范围和 checkpoint 阻断修正有明确 Owner 来源；Full Test 的 Final/coordination/evidence 直接消费者必须同步。其他 Action 的共享 candidate、完整 Start/Final 简化和正式 Git 执行仍留在各自边界。

## Proposal 交接提醒

1. 固定单一配置的 exact 字段、受支持文件/链接范围、cwd/argv 和实际命令范围一致性；普通配置不是第三方命令的沙箱，不应遗漏真正测试输入。
2. 固定 attempt 开始、当前引用发布、执行、结果保存和消费的顺序及失败语义；跨会话不能按最大目录或任意旧 PASS 判断完成。新增失败/中断/必要保存失败不得回落旧 PASS。
3. 同步当前结果与输入有效性的直接消费者，同时保留适用代码质量检查、过程事实完整性、独立 Reviewer 和 Owner/Git 权限。
4. Windows/Linux、写入失败、损坏/错归属、配置/产品变化等实现验收留到 Apply；本轮不要求提前实现这些机制。

## 简短方案解释

测试范围由项目配置决定，不由 Git 是否跟踪或忽略决定；每次 Full Test 单独保存结果和必要日志，只消费当前有效尝试；代码质量检查与 Git/历史证据检查分开。证据长期留在 `.flowkit/artifacts`，相关消费仍校验，`.tmp` 可丢弃。解耦职责，不取消真实性或授权约束。

## 限制与 STOP

本轮为 Windows 独立隔离实验和源码审查；未进行 Linux 新实现验收、实际 D05 Full Test/Final、Propose/Apply/Archive 或实际仓库 Git mutation。fixture 内 Git 操作仅服务受控反例。

首次 sandbox spawn EPERM 原始记录保留；获准后同一检查在独立 attempt-02 完成，四项命令 exit 0。exact OpenSpec 1.10.0 确认目标仍处 Explore 后的未建 Proposal 状态；没有用缺 Proposal 误判结构失败，也未执行候选 review-explore HOW。

后续交接为 `propose`，本次不调用。Reviewer 只保存自身三文件 Run 与 proof，STOP。
