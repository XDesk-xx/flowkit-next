# Propose Action

- delivery: `20260824-01-foundation-lifecycle-kernel`
- change: `establish-lifecycle-authority-and-identity-contracts`
- run: `20260824-005-propose`
- role: `author`
- action: `propose`
- entry base: `23ca52715df7c52738edeb59206f496c7bf2d2a9`
- source review: `20260824-004-review-explore`
- source review verdict: `approved`
- owner authorization: `owner:11cffd71771d89e9f9c7ced1ed0e2f5f22018c2782e63501c001a60a5a225b24`

## Goal

依据已批准的 Explore，用 exact managed OpenSpec 1.10.0 完成本 Change 的正式 planning bundle：

```text
proposal.md
specs/lifecycle-authority-and-identity/spec.md
design.md
tasks.md
```

## Planning boundary

允许：

1. 读取 `explore.md` 与 004 approved review；
2. 依次执行 OpenSpec `status` / `instructions`；
3. 创建 proposal / specs / design / tasks；
4. 执行 OpenSpec strict validation；
5. 写入本 Propose Run 的 `action.md / context.json / result.json`。

禁止：

- production source / tests implementation；
- Apply；
- Git commit / push；
- 自动进入 `review-propose` 之后的任何 Action。
