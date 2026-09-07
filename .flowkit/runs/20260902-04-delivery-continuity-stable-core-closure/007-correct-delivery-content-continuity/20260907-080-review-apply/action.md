# Review Apply 080 — 079 修订独立复审

Owner 请求：`根据最新run，review-apply`。输入 `20260907-079-revise-apply`；对照 `078-review-apply` 与 `074-review-propose` 已批准合同。Change `correct-delivery-content-continuity`，`projectOrdinal: 32`。

结论：`approved`。原 7 项 finding 全部闭合，新增/剩余阻断均为 0。仅写本次 Reviewer 三文件，随后 STOP。

## 收敛结论

- `D04-RA007-002`：闭合。Start 核验 source outcome 的真实 bytes、passed 结论及完整六项要求检查的工具、exitCode、exact 输入/输出。独立正例 terminal；真实子进程 exit 1、伪 passed 标签、缺项、重复项及错误工具/输入/输出均失败。
- `D04-RA007-003`：闭合。每个必要 Run 复用受控地址、ActionPackage 和 Result admission，精确绑定来源材料；合法跨 Change previous 链可消费。独立把 Author archive 的 verificationVerdict 改为 passed 并重新绑定 hash，derive/preparation 均拒绝，实际 invocation failed；完整跨 Change 链通过，缺链/错地址拒绝。
- `D04-RA007-006`：闭合。来源重验使用固定语义 clone。递归对象字段重排保持 Final ref，通过 source 与 exact Git object evidence 重验；Integration preparation 贯通测试通过。值改变或 ordered array 改序仍拒绝。
- `001 / 004 / 005 / 007`：保持闭合。相关生产/Guidance bytes 未变，完整 domain 回归通过；独立复验授权隔离（commitCalls=0）和 count=1 但两 parent 的旧反例（拒绝）。

## 验证与范围

079 的 10/10 revision hashes、三文件和上游 Review 绑定匹配；与 078 基线相比无未申报差异。Proposal/design/tasks/七份 delta 及未受影响产物保持。1477 个受保护文件的测试前后快照相同，exact candidate 见 context。

独立 native Windows domain 266/266、acceptance 5/5、entropy 7/7，均零失败/skip；typecheck、build、quality gate、dependency health（96 modules / 477 dependencies）、reachability（45/45）及 exact OpenSpec 1.10.0 当前 Change strict 通过。另执行 15 项针对性诊断/对照，全部符合预期。strict 只证明结构，诊断 fixture 不冒充真实 D04 Formal Full Test。

Linux 未独立复跑：079 报告保持为 Author evidence，原容器 127ee201acf8 当前不存在，不能据此读取原输出。此事实不推导为未经授权删除，也不新增临时证据永久保留义务。受控 Start 检查与 Final/admission/Git fixture 验证窄 source 合同；不声称未来跨会话 host 或真实 D04 外部证据保存/取回已完成。

复杂度：只增补两个现有生产接缝，5 个既有测试/fixture 与 3 个窄测试/fixture，最大 646 行；复用现有 admission/clone，无新依赖、Registry、证据平台或无关重构。`scope drift: NONE`；无需修订 Proposal。

Owner 已授权原始 Explore proof 移至 .tmp 且无需长期保留，保持既有结论，不要求恢复。真实 D04 Full Test 前的外部证据保存/取回 proof 仍是原计划中的独立前置边界，本次 review approval 不替代它。

## 交接 / STOP

按独立 `.agents/skills/review-apply/SKILL.md` 完成真实审查，不用 candidate Review Apply Guidance 自证；外部 flowkit 不可用，记录属于独立 D04 bootstrap，不冒充 canonical Runtime admission。

正常交接为 `archive`，仅表示 Reviewer 无阻断；本次不 archive/spec sync，不执行 Delivery Full Test 或 Git 操作，不新增 Owner/Verification authority，不自动继续。STOP。
