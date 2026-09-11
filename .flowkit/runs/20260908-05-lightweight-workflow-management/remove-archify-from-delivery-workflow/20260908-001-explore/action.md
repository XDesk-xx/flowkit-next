# Explore：移除 Delivery 架构依赖

- Role：Author；Action：explore；独立 bootstrap，非 candidate runtime 自管理。
- Delivery：`20260908-05-lightweight-workflow-management`。
- Change：`remove-archify-from-delivery-workflow`；projectOrdinal：33。
- Owner 原文：“owner 授权激活 第一个change，进行 proof based ，这里按照文档要求来处理 proof 的保存”。
- 输入：D05 两份规划文档、manifest、当前源码/活动 specs、既有相关测试。
- HOW：`.agents/skills/explore-proof-based`、`.agents/skills/openspec-explore`；不执行产品 Action Skill。
- 任务：定位 Archify 从 Start、Final、Integration、工具及活动合同退出的最小闭合边界，执行有界反例实验。
- 必要脚本、输入、输出、条件保存在 `.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/remove-archify-from-delivery-workflow/proof/20260908-001-explore/`，默认长期保留；`.tmp` 不是唯一来源。
- `spec-driven` 没有原生 Explore artifact；本次仅写补充 `explore.md`，不冒充 Proposal，不改变上游 schema。
- 先前“不处理 Archify”约束属于 Delivery Start；本次仅依最新授权探索第一个 Change，不提前执行其退役实现。
- 结果完成后交接独立 review-explore 并 STOP。不自审，不进入 Propose/Apply/Archive，不执行仓库 Git mutation。
