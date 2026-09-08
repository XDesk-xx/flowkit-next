# 真实隔离 Archive

本次 20260908-007-archive 消费独立 006-review-apply approved。prepare/execute package 的 archive Guidance hash 为 541f5823df2cdc61511e36a7f6907f76ceaf9d692abfaf48924cf1d9774bbe09。

prepare 阶段只读 target，复制 openspec 与两份程序到仓库 .tmp/archive-dry-XPFxH6。在副本实际执行 exact OpenSpec 1.10.0 archive --yes、validate --specs --strict 与 node --test feature.test.mjs；三者均 exit 0，唯一新增 Requirement 和 Scenario 汇合，程序测试 1/1 PASS。材料由当前宿主工具实际返回；未把直接工具输出重建成伪造原始流。

execute 后对 target 实际运行同一 archive 与 specs strict，均 exit 0。消耗既有 projectOrdinal 1，将工具的日期归档名调整为 openspec/changes/archive/2026-09-08-001-describe-running-feature，未重算 ordinal。唯一 Change coordination state 改为 completed，第二 Change 仍 planned；未激活下一 Change。

归档移除了 active change 目录，所有规划随目录保留，canonical spec 新增 fixed description requirement。未修改 feature.mjs 或 feature.test.mjs；没有 Git 操作。这是批准 tasks 6.1 的隔离验收，不是 D05 Archive。
