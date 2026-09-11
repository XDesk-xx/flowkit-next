# Propose：connect-openspec-action-workflow

Author 按 Owner 本轮“根据最新run，propose”，消费 `016-review-explore` 对 `015-explore` 的 approved 结论及三条 carry-forward，收敛中文 proposal、design、tasks 与 4 份现有 capability delta。

计划覆盖有界 current 解析、既有交互宿主单次协议、执行/材料/Run 落盘失败顺序，以及本 Change 内的一次性 raw-stream attributes 解耦。保留独立 bootstrap、相关 Owner 材料决定和 650 行源码 gate。

本轮只规划及实际结构/交接核对，不改生产/Skill/attributes，不执行 Apply、Full Test 或 Git mutation。下一边界 `review-propose`，STOP。
