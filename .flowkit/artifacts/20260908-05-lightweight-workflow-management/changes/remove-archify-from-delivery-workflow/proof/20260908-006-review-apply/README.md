# 独立 Review Apply 证据

归属：D05 / `remove-archify-from-delivery-workflow` / `20260908-006-review-apply`，审查 Author `005-apply`。

`verify.mjs` 核对 approved Proposal 引用、任务仅勾选变化、Author 变更/删除清单与证据摘要，再真实执行 typecheck、12 个相关测试文件、OpenSpec strict 和 git diff --check。脚本不调用 Author finalize/check，也不生成 Reviewer verdict；语义结论由独立审查产生。

- `attempt-01`：沙箱启动 Node 子进程返回 EPERM，原始 command/error 已保留，不计成功。
- `attempt-02`：获准后相同脚本重试，87/87 测试通过、0 skipped，类型和结构检查 exit 0。33 个变更文件、135 个来源及 16 个已退役文件的现状与 Author Result 一致。
- `build-readback.json`：额外全新 outDir 构建成功，39 个当前模块无退役模块/引用。现存被忽略 dist 的 6 个旧 emit 文件不在当前引用路径；未清理，不能把该混合目录直接当成干净发布物。
- Author Windows/Linux 最终日志均已核对摘要与实际内容；Linux 日志包含 source-copy equality、exact installed lock、无网络连接、非 root/glibc、259 domain + 5 acceptance 全通过。本 Reviewer 没有重新运行 Linux 全套。
- 端到端 fixture 真实执行 checks 与本地隔离 Git；OpenSpec observation/远端和预先接受的 Change closure 为明确 fixture，不声称真实跑完整 Change 生命周期。

复跑须从仓库根使用新的 attempt：

```text
node .flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/remove-archify-from-delivery-workflow/proof/20260908-006-review-apply/verify.mjs <new-attempt>
```

必要方法、输出、错误和输入关联默认长期保存在本项目 `.flowkit/artifacts/`；不覆盖旧 attempt，不扩充 Run 三文件。清洁构建的临时 emit 位于 `.tmp`，不是必要证据唯一来源。所有测试只在 fixture 内使用 Git，不对目标仓库 add/commit/清理。

复验不是 Formal Delivery Full Test、Owner/Git authority 或自动 Archive 许可；原始 Explore PASS 没有被当成本次实现证明。
