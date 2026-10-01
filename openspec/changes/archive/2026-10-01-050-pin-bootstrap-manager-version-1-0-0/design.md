## Context

当前正式源码和 E 留存的发行候选均为 `0.1.0`。已批准的 [Explore](explore.md) 与 `20261001-069-review-explore` 证明，在隔离副本仅调整版本与接入示例时，frozen lock、打包和生产安装可通过；其包 SHA 只是实验身份。现有 `config/verification/full-test.json` 已包含 `package.json`，但漏掉同包的 `docs/onboarding.md`。

## Goals / Non-Goals

**Goals:** 用当前源码形成可识别、可安装的 `1.0.0` 候选，并让打包的接入文档参与后续 Full Test 输入身份。

**Non-Goals:** 通用发布系统、registry 发布、自动改版、重写 E 证据、切换本 Delivery 的外部 Stable manager，或在本 Change 内运行 Formal Full Test、Final 和 Git。

## Decisions

1. 只改 `package.json#version` 与 `docs/onboarding.md` 中的 tgz 示例。保留 `private: true`、bin、依赖和工具 lock。Explore 的 frozen install 未要求改动 `pnpm-lock.yaml`；Apply 仍核对 lock 原字节与实际 frozen install，遇到不一致应停止并诊断，不默默扩大修改范围。
2. 在 `config/verification/full-test.json#inputs` 加一个精确条目 `docs/onboarding.md`。现有输入读取器按清单计算摘要，已批准的反例显示该条目足以让文档漂移改变 inputRef。复用现有输入机制，不把整棵 `docs/` 纳入，也不增加检查或运行时功能。
3. Apply 从正式修改后的源码执行适用检查和 `pnpm pack`，将实际 tgz 原始字节、SHA-256、命令原始流、安装读回及包成员对比保存在本次 Apply Run 的 proof。隔离生产安装使用新目录，不覆盖 D07 的外部 manager。对照 E 的 `0.1.0` 包，逐成员检查；版本与示例以外的差异须真实归因，不能直接宣布预期或套用 Explore 探针 SHA。
4. `skip_specs: true`：此处固定的是本 Delivery 发行身份与验证输入配置，产品命令、契约和权限均未变化。若 Apply 暴露了规范行为变化，应回到 Proposal 边界，而非附带实施。

## Risks / Trade-offs

- 实际构建包可能因未发现的生成内容或环境差异偏离探索包 → 以本次真实包成员和安装读回为准，记录差异并对无法归因的变化停止 PASS。
- Full Test 输入身份的反例只证明选择逻辑，没有执行正式检查 → Apply 验证配置选择；Formal Full Test 留待归档后对定版源码执行。
- `1.0.0` 包仍属候选 → 后续发布、Final、checkpoint 和 manager 选择各需其独立操作与授权。
