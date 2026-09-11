# Review Propose：项目接入与 Agent 薄入口

结论：**approved**，无阻断 finding。目标 `20260911-065-propose`，本次 `20260911-066-review-propose`；Change `correct-project-onboarding-and-agent-entry`，projectOrdinal 39。

## 当前步骤

独立核对四份计划文件与 063 Explore、064 approved Review、Owner 相关决定和当前 canonical 合同的承接，并审查 Apply readiness。使用独立 `.agents/skills/review-propose/SKILL.md`；未读取或调用 candidate review-propose Skill 管理 D05。

开始、结束均校验 24 个必要输入引用；实际使用 exact OpenSpec 1.10.0 运行本 Change 的严格校验与 status，均退出 0。四份 planning artifacts 完备，三个 ADDED Requirements、十二个场景、十二个尚未勾选的实施任务相互覆盖。OpenSpec 的 planning complete 不等于实现完成；结构校验不是语义审查或 Verification acceptance 的替代品。

## 合同与可实施性

- 接入资产具体落为 `docs/onboarding.md`，随包 README 可达，发行 allowlist 只补该文档；项目 AGENTS 仅合并短区块。固定实际 tgz、运行依赖、exact runtime 与按用途准备材料均有任务和真实验收落点，未假设公开 latest、全局覆盖或开发 checkout。
- 薄入口先使用既有查询，再核对用户请求与真实 Role、读取安装内 canonical Skill。上次 Run 的角色不成为下一角色；idle/blocked/歧义/partial/bootstrap-history、只读请求和定位失败均不被解释成执行许可。没有把 Action 内部 normative HOW 移到可绕开 content identity 的公共文档。
- 旧规划退役限定原三路径。先建立当前说明，再核对 Git 恢复出处、删除和检查相关消费者，只窄补当前 D05 bootstrap 提示。保留旧 reference/Owner facts/Run/archive/D04 bytes，不要求历史全文零命中，不改变仍被当前 Start 使用的 planning artifact 合同。恢复 SHA 只作历史出处，不是新项目或 Delivery 的 SHA 准入。
- 三类验收分别证明真实包下的有界 Author 工作、同安装独立 CLI 读回、真正不继承聊天的新 Agent 会话读取。task 4.3 明确保留未执行状态，既不能用 CLI 重启抵扣，也不强制额外 Action、制造 finding 或完整 Delivery。缺会话时应交接未完成项，不能声称接入验收或 Change 已全部完成。

上述要求均有已批准 Explore/064 handoff 或既有 canonical 合同依据；当前没有需要继续 Explore 才能决定的合同问题。实际安装、说明回归和会话输出是 Apply 的验收工作，本轮不预先代做或宣称 PASS。

## 复杂度与范围

最小性成立：一个文档内嵌模板、README/发行配置的小范围调整、精确旧文档清理和必要回归，保持同一个 Owner 已授权 correct Change。三个新增要求没有改写既有 CLI/Policy/Run/Role 机制，不需新增 src、依赖、Registry、第二份状态或永久 helper。

未发现 scope drift。精确文档布局、合并幂等、失败场景及验收任务是已接受语义的实施细节；三份规划退役和真实新会话要求由 Owner sourceRef 连续交接，并非本轮新增要求。不重开前六个 archived Changes。

## 交接与边界

下一 continuation 为 `apply`，来自既有 Policy 的 review-propose + approved 映射；本 Reviewer 不自动执行或新增 Owner/Git authority。

本轮只写自己的 Run/proof；非本次 Reviewer 路径的 5412 项 Git tracked/nonignored 文件前后摘要与 HEAD 一致。该快照不覆盖 ignored scratch。未修改计划、源码、Skill、README、manifest 或历史，未删除文档，未运行实现/安装/新会话验收、Formal Full Test 或 Git mutation。

命令原始流见本 proof 的 `validate/`、`status/`；引用校验及结构观察见 `planning-audit.json`。三文件 Result 保存、读回后 STOP。
