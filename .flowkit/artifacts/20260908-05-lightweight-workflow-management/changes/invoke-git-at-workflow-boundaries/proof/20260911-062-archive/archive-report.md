# Archive 038

本次依据 061-review-apply 的独立 approved 结论与 Owner「根据最新run，archive」执行。D05 继续 independent-bootstrap，未消费 candidate 产品 archive HOW。

- 同步 delivery-operation-execution-and-start-continuity 与 repository-integration-and-next-base-continuity：4 个 MODIFIED、3 个 ADDED Requirement。保留既有 Purpose、未受影响 Requirement 与所有存续 Scenario。
- 当前 Change 原文件移动到 openspec/changes/archive/2026-09-11-038-invoke-git-at-workflow-boundaries；移动文件逐一核对原始长度与 SHA-256。
- manifest 仅将本 Change state 从 active 改为 completed；projectOrdinal 38 不变，其他 bytes 保持。
- 归档前在离线 Linux x64 临时副本执行规范合并、归档移动、完成状态模拟与 10 项适用检查。正式目录在这些检查成功后才同步及移动；正式同步后及归档后 OpenSpec strict 均通过。真实原始输出、命令和状态见 dry-run、sync-validation、post-archive-validation。
- 这是 archive readiness 验证，不是 Formal D05 Full Test；manifest 的 fullTestStatus/finalizationStatus 仍 pending。
- 未修改 source/tests/Skills、旧 Runs 或历史材料；未执行当前仓库 Git mutation。
- 必要材料保存在 target artifacts，本次临时副本仅在容器 /work，可丢弃。相关 Owner 决定按 061 的 sourceRef 交接，不复制全部 proof 为后续前置。
- 完成后 STOP。checkpoint commit/push 需独立 Owner 授权；不自动执行 Full Test、Delivery Final 或其他 Action。

执行说明：首次生成辅助脚本补丁的只读 node -e 调用出现 PowerShell 引号解析错误，未产生业务修改或测试结果；随后用已读脚本内容经 apply_patch 创建。该准备失误不作为产品失败或 PASS。
