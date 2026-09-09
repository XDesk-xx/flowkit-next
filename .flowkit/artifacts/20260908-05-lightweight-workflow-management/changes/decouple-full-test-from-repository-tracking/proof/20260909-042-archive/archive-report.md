# 042 Archive 完成交接

接受 041-review-apply approved，执行 Owner 本次 archive。目标为 openspec/changes/archive/2026-09-09-036-decouple-full-test-from-repository-tracking，沿用既有 projectOrdinal36，不从 Run 序号分配。

五份 delta specs 按既有规范合并：11 项修改、4 项新增；Purpose、未涉及的要求和保留场景不变，无规范删除或重命名。已逐份核对正式文件等于隔离收敛文件。Change 原文件含 .openspec.yaml 按 bytes 保持移动。

Archive Skill 要求先验证隔离收敛：离线 Linux 临时副本完成五份规范同步、Change 归档移动及当前 completed 模拟后，执行 9 项项目代码检查与规范 strict，共10项通过；domain296/296、acceptance6/6。正式同步后 specs strict、归档后 all strict 均通过。不是 D05 Formal Full Test，不使用旧 PASS 代替当前归档准备验证。

实际 manifest 只将本 Change state 从 active 改为 completed；其他 bytes 保持。D05 现为4个 completed、2个 planned，Delivery 仍 active，Full Test/Final 仍 pending。不自动激活后续 Change。

本轮三文件 Run、preflight、隔离执行命令/原始流、规范收敛材料及累计文件/精确移动映射已保存。历史 Runs/proof 未覆盖；前序引用因当前 Change 移动而变化的路径由 movedFiles 显式交接。

未修改生产实现或 Skill，未执行 Git、正式 Full Test、Delivery Final。下一步 Git checkpoint 仍需 Owner 明确授权。STOP。
