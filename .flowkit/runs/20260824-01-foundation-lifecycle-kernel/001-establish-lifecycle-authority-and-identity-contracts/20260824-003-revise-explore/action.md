# Revise Explore Action

- delivery: `20260824-01-foundation-lifecycle-kernel`
- change: `establish-lifecycle-authority-and-identity-contracts`
- run: `20260824-003-revise-explore`
- role: `author`
- action: `revise-explore`
- entry base: `23ca52715df7c52738edeb59206f496c7bf2d2a9`
- source review: `20260824-002-review-explore`
- source review verdict: `changes-requested`
- blocking finding: `NEXT-RE-001`

## Goal

只关闭 Reviewer 的 `NEXT-RE-001`：用真实 managed OpenSpec 1.10.0 `new change` execution 重新建立 Change scaffold provenance，并据此修订 Flowkit `explore.md` Proof F。

## Exact external mutation

Managed entry：

```text
${FLOWKIT_HOME}/tools/openspec/1.10.0/bin/openspec.js
```

实际执行：

```text
TZ=Asia/Shanghai node ${FLOWKIT_HOME}/tools/openspec/1.10.0/bin/openspec.js \
  new change establish-lifecycle-authority-and-identity-contracts
```

结果：

```text
OpenSpec version = 1.10.0
exit code        = 0
.openspec.yaml   = 5f408ebe6a8c4d9c4c5e85f9e84c9ac47aa1192c4424a5f5f2224781c6f85fd7
```

## Mutation boundary

允许：

1. 用真实 OpenSpec 1.10.0 execution 重新生成 `openspec/changes/establish-lifecycle-authority-and-identity-contracts/.openspec.yaml`；
2. 只修订 `explore.md` 中与 `NEXT-RE-001` / Proof F 直接相关的证据；
3. 写入本 `revise-explore` Run 的 `action.md / context.json / result.json`。

禁止：

- proposal / design / specs / tasks；
- production source / tests；
- AGENTS.md；
- commit / push；
- 自动进入 propose。
