# Review Propose 核对材料

归属：D05 / `remove-archify-from-delivery-workflow` / Reviewer `20260908-004-review-propose`。本次核对 Author `003-propose`，没有执行其 `validate.mjs`（该脚本会写 Author Result）。

`audit.mjs` 是本次只读审查的独立方法，核对 `001 → 002 approved → 003` 链、计划与引用摘要、delta 名称、未执行任务；用 exact OpenSpec 1.10.0 实际执行 validate/status，原始命令、退出状态和 stdout/stderr 按尝试保存。

- `attempt-01`：沙箱内 OpenSpec 子进程启动返回 `EPERM`，无成功声明；保留原始 failure 和 command/stdout/stderr。
- `attempt-02`：经允许在沙箱外运行同一未修改脚本，只有输出 attempt 不同；validate/status/git diff --check 均 exit 0。9 个计划输入、6 个 base spec、27 个 delta 条目及 16 个未执行任务已核对。
- `attempt-02/summary.json` 绑定输入及成功执行输出的 bytes/hash；独立 Reviewer 语义结论见 Run，不由此脚本自动生成 approved。

从仓库根复核时须使用新 attempt，不能覆盖历史：

```text
node .flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/remove-archify-from-delivery-workflow/proof/20260908-004-review-propose/audit.mjs <new-attempt>
```

必要材料默认长期保留在本项目 `.flowkit/artifacts/`，不扩充 Action 三文件，不依赖 `.tmp`。结构通过、摘要匹配只证明各自有限事项，不证明新实现或 Full Test；本次没有重新运行旧 Explore proof，也没有更改产品/Author/历史内容。环境失败按错误恢复 Skill 分层核对，不通过修改合同、跳过检查或伪造成功来消除。
