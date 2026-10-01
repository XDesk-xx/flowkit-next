# Explore: pin bootstrap manager package version 1.0.0

## 问题与边界

Owner 选定本 Delivery 的发行版本为 `1.0.0`，并授权新建及激活本 Change。当前 [Change E 的归档](../archive/2026-10-01-049-validate-and-freeze-bootstrap-manager/design.md) 验收的是 `0.1.0` 候选包；它的实际 tgz 与 proof 保持原字节。本 Change 在 Formal Full Test 前定版并重新验证实际包，不把版本号变化视为旧包验收的自动延续。

当前正式源码仍为 `package.json#version = 0.1.0`，`docs/onboarding.md` 的安装示例仍引用 `flowkit-next-0.1.0.tgz`。包为 `private: true`；本 Change 不增加通用 release CLI、不发布到 registry、不切换管理 D07 的外部 Stable manager，也不执行 Formal Full Test、Delivery Final 或 Git。

## 有界证据

| 风险 / 问题 | 最小证明 | 观察与决定 |
|---|---|---|
| 版本号与文档是否还有其他当前生产引用？ | 搜索 `package.json`、`pnpm-lock.yaml`、`docs`、`skills`、`src`、`tests`、`config`。 | 当前显式 `0.1.0` 来源仅 `package.json` 和 `docs/onboarding.md` 的 tgz 示例。生产代码没有发现硬编码版本选择。Proposal 以这两处为基本修改范围；不得改写 E 历史材料。 |
| 只改变版本和示例是否破坏 frozen lock、实际 pack 或生产安装？ | 在隔离副本仅将上述两处改为 `1.0.0`，执行 frozen install、pack、独立生产依赖安装，并读回安装内元数据与文档。 | 三条实际命令退出 0；副本未修改 `pnpm-lock.yaml`，得到 `flowkit-next-1.0.0.tgz`，安装内 version、bin 和示例均匹配。原始命令流、探针源码、包 bytes 与 [报告](../../../.flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/pin-bootstrap-manager-version-1-0-0/proof/20261001-068-explore/version-probe-report.json) 保留。本包 SHA `3d9c3a7a330be4a349ac0afc5ddaddf0a202f8af883722921721ba0a0bcb5eff` 仅属 Explore 副本，不能当作 Apply 后发行身份。 |
| Formal Full Test 能否发现同包接入文档的后续漂移？ | 核对 `config/verification/full-test.json` 和 `readFullTestInput`，在隔离副本对 `docs/onboarding.md` 做受控字节变化。 | 当前配置未选该文档，漂移后 inputRef 不变；只在副本将它加入 `inputs`，同样的漂移使 inputRef 变化，见 [反例报告](../../../.flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/pin-bootstrap-manager-version-1-0-0/proof/20261001-068-explore/full-test-input-report.json)。Proposal 应将该单文件纳入固定 Full Test 输入，保证定版文档参与 Final 的当前输入核对。 |

## Proposal-ready 合同

- 将实际 `package.json#version` 固定为 Owner 指定的 `1.0.0`，同步安装示例；保留 `private: true` 与既有包入口、运行依赖、Skills 和工具 lock。
- 将打包的 `docs/onboarding.md` 作为一个明确的 Full Test 输入。仅扩展输入身份，不增加新检查类型、Registry 或自动发行操作。
- 对真实修改后的候选重新执行当前适用检查、`pnpm pack`、包成员与独立生产安装核对，保存新 tgz 的原始 bytes/SHA、来源和实际结果；隔离探针不能充当 Apply PASS。核对与 E 已验收包的差异，只把实际证明的版本/示例变化视为预期。
- 定版完成并经独立 Review/Archive 后，才对新的当前输入申请 Formal Full Test；Final、Git、分发和 Stable manager 选择各守原有边界。

## 限制与结论

隔离探针证明当前来源可以形成并安装 `1.0.0` 包，也证明 Full Test 文档输入缺口；它没有修改产品源码，没有运行正式 Full Test 或 Linux detached 验收，不证明最终包身份。若 Apply 产生其他包成员变化，应按真实差异检查而非套用探针 SHA。

**Explore 结论：PASS。** 关键未知已收敛为上述窄范围；不需要新通用发布功能。此结论只表示可以进入独立 `review-explore`，不是 Proposal 或 Apply 批准。
