# Native OpenSpec Archive — repair-archive-lifecycle

日期：2026-10-04。执行角色：Author；按 Owner 本轮“Flowkit 不能用则用 OpenSpec archive”的明确授权执行同步与归档。

外部已安装 manager 的 status/next 返回 `context-inconsistent: OpenSpec Change has no coordination: repair-archive-lifecycle`。本 Change 自始为直接 OpenSpec Change，没有 canonical Delivery coordination / Run 链；未补造 Run 或切换到 candidate 自我管理。doctor 的同一查询 shape 返回 invalid-request，仅为查询诊断，不作为 Archive 准入事实。

已读取 `review-apply-02.md` 的 approved verdict，归档前核对其 346 项当前输入与累计 63 项候选/删除均未漂移。26 项 tasks 全部完成，规划状态完整，Change strict validation 通过。specs instructions 的规则字段未配置，archive context 与仓库分权边界一致。

真实命令：`node C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js archive repair-archive-lifecycle --yes --json`。未使用 skip-specs/no-validate，未手动移动目录或仿造归档结果。

实际 exit=0，响应 archivedAs=`2026-10-04-repair-archive-lifecycle`、specsUpdated=true；10 个 capability 共 added=8 / modified=20 / removed=3 / renamed=0。目标为 `D:/Projects/flowkit-next/openspec/changes/archive/2026-10-04-repair-archive-lifecycle`。

归档后 `after.json` 核对原 Change 完整文件集合与 raw SHA 均原样迁移、active source 不存在；逐条核对 delta 的新增/修改/移除结果，并保留未涉及 requirements、Purpose/header 及其他 main specs。实现候选原字节、HEAD 与空 index 保持不变。`openspec validate --specs --strict --json`、`git diff --check` exit=0；`openspec list --json` 不再列出本 Change。

材料：before.json / after.json 为本次机械输入与后态读回；openspec-archive/ 保存实际响应与原始流，各命令目录保留实际 command.json/stdout.txt/stderr.txt。首次本地 preflight 的 verdict 正则只识别英文冒号，错误拒绝报告中的中文冒号；修正后核对通过，旧脚本 archive-readback-first.mjs 和失败输出 preflight/ 保留，不计为产品失败。没有在产品或 Review 中修改 verdict。

仅完成本次同步与 Archive；未创建本仓库 Flowkit Run、未执行 Git checkpoint/push、未更新 stable manager 或消费项目。
