# 018 review-propose 独立核查

对象：`017-propose`。当前输入链为 `015-explore → 016-review-explore approved → 017-propose`。复核只使用独立 `.agents/skills/review-propose/SKILL.md`，没有消费 candidate 对应 Reviewer HOW。

`audit.mjs attempt-01` 真实核对 38 个 exact refs；7 份计划、4 个 capability 的 8 条 modified / 9 条 added requirements、53 个 scenarios 和 27 个未完成 tasks。已核对 accepted Explore/当前 manifest 及其激活/依赖，既有 Explore bytes 保持不变。

使用 manager lock 所指 exact OpenSpec 1.10.0，独立执行 version、status、strict validation、Git diff-check 与只读 source/index 核对；命令、退出结果及 stdout/stderr 均保留在 attempt-01。未调用 candidate 生命周期管理真实仓库。

5 个纯内存例子核实既有 Policy/Run schema 的兼容性：prepared failure 可明确调用同 Action 的新 occurrence；Author PASS 到 Review；Author FAIL 保持 blocked；Reviewer changes-requested 到 revise；跳过 Review 的 next 被拒绝。没有创建产品 Run、伪造执行事实或运行新增实现验收。

语义审查确认：预占与最终写入使用同次内部 handle，partial 不清理、不接管，readback 后才报告完成；normal/failure Result 不扩展 closed 顶层；proofRefs/handoff 仅在相关消费时校验；通用 raw-stream 规则不免检结构化文本；历史 bootstrap 与独立 HOW 保持；真实两 Change/独立 Review/revise/跨会话及失败矩阵留给 Apply 的实际验收。协议/材料/失败顺序均在已批准 Explore 内，不构造恢复平台或额外 Owner 审批。

脚本 PASS 和引用完整性不是语义 verdict 的来源。当前审查不重演全部原始 Explore 实验，不宣布新增产品、宿主接入或 Formal Delivery Full Test PASS；没有修改 Author、计划、Skills、attributes、源码/测试、历史 Run 或真实 Git 状态。
