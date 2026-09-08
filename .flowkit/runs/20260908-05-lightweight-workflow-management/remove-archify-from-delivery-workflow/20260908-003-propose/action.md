# Propose：移除 Delivery 架构依赖

- Owner 本轮原文：`propose`；明确目标沿用当前 active Change `remove-archify-from-delivery-workflow`。
- Author 使用独立 bootstrap，执行一次 Propose；不使用 candidate 管理自身。
- 前置链：`001-explore` → `002-review-explore` approved；已核对 reviewedArtifact/result 的精确摘要与当前文件匹配，无 findings。
- HOW：`proposal-convergence` 收敛边界，再由 `openspec-propose` 按 exact OpenSpec 1.10.0 instructions 形成 proposal/specs/design/tasks。
- 本次保留 manifest、Explore、既有 Run/proof、生产实现、活动 specs、Skills 与历史 bytes；只新增本次计划及执行记录。
- Owner 的 proof 保存决定继续有效：必要执行/验证输出在项目内 `.flowkit/artifacts/` 默认长期保存，不覆盖旧产物，不使用 `.tmp` 唯一来源。
- 完成真实结构/条款对应核对后交接独立 `review-propose` 并 STOP；不执行 Apply、Full Test、绘图、卸载或 Git mutation。
