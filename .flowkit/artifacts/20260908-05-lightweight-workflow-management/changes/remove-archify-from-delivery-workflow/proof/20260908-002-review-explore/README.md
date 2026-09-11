# Reviewer 独立复验材料

归属：`20260908-05-lightweight-workflow-management` / `remove-archify-from-delivery-workflow` / `20260908-002-review-explore`。被审查的是 Author `20260908-001-explore`，不是 Apply。

`review-proof.mjs` 是本次 Reviewer 的一次性复验方法，不是产品实现、通用证据平台或 lifecycle runner。真实执行输出位于 `attempt-01/`：三个反例观察、定向测试的 command/stdout/stderr，以及绑定输出摘要的 `summary.json`。必要材料默认长期保留；不覆盖已有尝试，不依赖 `.tmp`。

复验使用经源码和摘要核对的 Author list-only OpenSpec fixture，只读消费原 fixture 与 synthetic shape 输入，未执行 Author 的 `probe.mjs` / `seal.mjs`，未修改或补签 Author Result。复跑应从仓库根执行：

```text
node --import tsx .flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/remove-archify-from-delivery-workflow/proof/20260908-002-review-explore/review-proof.mjs <new-attempt-name>
```

观察边界：

- doctor 仅在模拟 OpenSpec 环境下复现 Archify missing-runtime；没有调用 candidate 管理本 Delivery。
- Start 只证明缺固定图输出触发 early guard，不证明其余完整 Start 前置已成立。
- required evidence 只做 synthetic shape 对照，不产生真实 accepted Run、Review 或 Full Test。
- 7 文件、59 项通过、0 跳过是当前旧合同的定向测试观察，不是 D05 拆除后的实现验收或 Formal Full Test，也不声称 Linux detached PASS。
- 29 个交接条目、39 个源输入、2 个历史样本的 bytes/hash 在复验前后匹配。历史样本仅做现存材料一致性核对，不冒充新产品历史读取回归。
- Reviewer 另做全体受保护文件的前后只读快照（1532 文件，不含本次自有 Run/proof），确认 Author/产品/历史未被本次审查修改。该快照仅审查隔离检查，不建立产品全仓 SHA 准入门槛。

独立语义 verdict 见本次 Run；局部摘要匹配自身不是执行真实性、Reviewer approval、Owner 或 Git authority。
