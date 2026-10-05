# Review Propose：repair-bounded-lifecycle-entry-limits

- 日期：2026-10-05。
- Verdict：**changes-requested**。
- 当前步骤：直接 OpenSpec Proposal 独立审查；沿用 Owner 的直接工作边界，不创建 Flowkit Run，不推进 Apply。
- 输入：main / 96179b50b70a7582e264a7af111436d3ca52f788；Proposal、Design、Tasks、7 个 delta specs，以及 Explore 与其证据。精确 SHA-256 见 [review-propose-20261005.json](evidence/review-propose-20261005.json)。

## RP-01 · P2：将 ordinal 成功条件限定到成功 Explore，保留失败记录入口

位置：specs/stable-action-command-execution/spec.md:67–70；对应 author-action-guidance/spec.md 的无条件 finish 约束、design.md D03 与 tasks.md 3.5。

新增 Scenario 要求真实 Explore finish 在 ordinal 缺失、重复或与 Result 不同时一律拒绝，没有区分 PASS 与 FAIL。首次 Explore start 按同一规划明确不写 ordinal；如果之后 HOW 的 ordinal 写入失败（例如 manifest 可读但不可写），descriptor 与原 active coordination 仍可验证，却没有持久编号。真实 Author FAIL/null 因新增条件不能结束，Run 只能停留在 descriptor，E02 所需的完整 terminal FAIL 也无法形成。即使编号已经存在，现有合法 FAIL Result 也不必携带 projectOrdinal，新条款还会无意扩大失败结果的字段要求。

现行 stable-action-command-execution 的 Finish admits a real role result and preserves partial outcomes 明确保留普通 Author FAIL/null 的 terminal 记录。当前 src/cli/action-finish.ts 仅对 terminal explore PASS 核对 ordinal；已有 CLI 回归 terminal Author FAIL with null boundary is readable and does not advance Policy 的 FAIL facts 不含 projectOrdinal，本次实跑 1/1 通过。这是规划新增条件与保留合同之间的冲突，不是把尚未实现的功能当作实现缺陷。

最小修订：明确 ordinal 持久值/Result 一致性是成功 Explore 的 admission 条件；对身份、descriptor、父链及其余必需材料仍有效的真实 FAIL/null，保留失败记录入口，不为记录失败补写或伪造 ordinal。同时说明无编号失败之后仍受 fresh/history 与 readiness 约束，不把保存 FAIL 自动解释为可重新分配编号。补充“合法 start 后 ordinal 持久化失败 → 可保存/读回 terminal FAIL → 不自动编号或继续”的合同和验收任务，并保留 PASS 缺编号拒绝的反例。

## 范围与复杂度

E01–E04 均可追溯到 Explore 的四项问题。七个 capability 沿用现有 request、Policy、lifecycle、persistence 和固定入口；未发现新增 registry、第二持久事实或无关功能。输入分级、有界诊断和同名失败 revise 的窄结构边与已证明问题相称。除 RP-01 的失败路径遗漏外，没有新增阻断项。

## 核验与限制

- exact OpenSpec 1.10.0 strict validation：1 passed / 0 failed。
- Explore 探针重放：17 项观察完全一致，7 个源码 SHA-256 与保存基线相同。
- 7 个 MODIFIED requirement 名称与主规格匹配，既有 scenario 标题均保留。
- 上述单项失败记录 CLI 回归：1 passed / 0 failed。
- 外部 manager doctor=pass；status/next 明确返回该独立 Change 无 coordination 的 context-inconsistent。这与直接 OpenSpec 工作方式一致，不据此构造 Runtime authority。
- 本次在 Windows / Node v22.23.2 完成；没有 Linux 执行、候选实现验收或 Formal Full Test。

本次只新增 Reviewer 报告及输入/核验摘要，未修改 Author 规划、生产代码、测试或历史记录。停在 changes-requested，等待 Proposal 修订后再次审查。
