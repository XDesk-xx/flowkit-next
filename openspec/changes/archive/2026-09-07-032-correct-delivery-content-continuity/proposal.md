## Why

D04 闭合前的 proof 已确认：Memo 内容、删除的暂存状态和默认 locale 会造成候选身份伪差异；Start 与 Integration 又把特定提交形状当作通用内容接续条件。修正这些耦合时，必须同时补齐 Start 完成来源及 Final/Integration 必要执行证据覆盖，否则“内容相同”可能掩盖证据丢失。

本提案承接 [Explore](explore.md) 与 `20260907-069-review-explore` 的 `approved`；Change 为 `correct-delivery-content-continuity`，`projectOrdinal: 32`。本轮只生成计划，不代表实现或审查通过。

## What Changes

- **BREAKING**：统一 worktree/exact Git object 的有效材料模型；确认缺席不生成 record，只额外隔离 exact `.flowkit/memos.json` 内容，读取失败和异常类型仍拒绝。
- **BREAKING**：无序集合统一 UTF-8 bytes 顺序，candidate/check 使用固定 v2 hash domain；旧算法 PASS 不兼容复用，历史记录不重写。
- **BREAKING**：Start 返回可核验的内容完成记录，绑定 accepted base、规划、实际输出及验证来源；专属 checkpoint 不再是通用完成条件，Git 权限仍独立。
- **BREAKING**：Final 增加从 canonical required Changes 与可信前置事实确定的必要证据绑定；Integration 同时验证内容、具体 Git 操作及证据完整性/来源。支持已授权 exact checkpoint 复用，不再无条件制造新 commit 或要求完整 tree/通用 ancestry 相等。
- 保持 Full Test 显式检查顺序、`verified → architecture-materialized → finalized` 因果链、精确 prestate/authority 和单次 STOP；保留所有必需 OpenSpec/Archify/architecture 义务及行数 gate。
- 收敛阶段 Skill HOW：Author 的最小交接携带会影响后续判断的相关 Owner 决定及材料处理/保留边界，但不复制全部聊天；明确 Explore 实验、已接受决策依据、当前实现验收证据三者不可互相冒充；Reviewer 对材料路径变化或授权背景缺失先核对事实，只有能指出具体合同影响时才形成阻断。

## Capabilities

### New Capabilities

无；全部使用已有能力及其窄内部接缝，不创建身份系统、证据平台或恢复平台。

### Modified Capabilities

- `applicable-check-execution`：有效材料、双 reader、UTF-8 排序、v2 摘要及精确复用规则。
- `cross-delivery-memo`：产品材料隔离不豁免 Memo reader、消费它的 check 或 Git 状态约束。
- `delivery-operation-execution-and-start-continuity`：Start 内容完成与 Final/Integration package 直接消费者合同。
- `formal-full-test-execution-and-correction`：v2 身份、Memo/Git 材料及旧 PASS 拒绝与 correction 分界。
- `architecture-and-canonical-diagram-continuity`：共享材料模型下的合法候选变化与来源连续性。
- `delivery-finalization`：完整必要证据覆盖、可信来源与 content-bound Final closure。
- `repository-integration-and-next-base-continuity`：具体操作约束、object projection、必要证据验收及 exact next base。

## Impact

- 影响 applicable-check 内部 reader/hash、Start、Full Test、Architecture/Final、Integration 的类型、closed validators、摘要 projection、直接 Guidance 与对应 domain/acceptance 测试；同时计划更新独立 bootstrap `.agents/skills/{explore-proof-based,proposal-convergence,revise-propose,review-propose}/SKILL.md` 与 product `skills/actions/{explore,propose,revise-propose,review-propose}/SKILL.md` 的对应 HOW；不增加第三方依赖。
- 新旧 package/closure 不做自动升级。旧 Run、archived Change、既有验证 bytes 保留；新候选按新合同取得真实适用验证。当前已审查 Explore proof 保持历史实验，不混入永久产品测试清单。
- Apply 同步修正当前 D04 coordination 中仍把专属 Start commit 当通用要求的 scope/acceptance 表述及当前相关 Guidance；对 `.agents` 只修改上述独立 bootstrap HOW bytes，不引入外部管理或让 candidate product Skill 管理同一 D04；不重写历史 Start/Change/Owner 决定，不提前做 archive/spec sync。
- `src/**/*.ts` 超过 650 行须按职责拆分，不关闭 gate、不把生产逻辑迁到免检目录。所有当前 Change 实现验收必须在交付 review-apply 前完成。
- 不包含 manager/target/FLOWKIT_HOME 三 roots 接入、跨会话 trusted host 实现、D05、SHA-256 Git/submodule、自动 Git/next、Registry、统一 proof 存储、原始 proof 永久保留义务、Runtime/Policy/Run schema、WAL 或通用恢复机制；OpenSpec/Archify 不变为 optional。
- D04 下一次真实 Full Test 前，独立 bootstrap/Verification 仍须建立 Owner 认可的仓库外耐久证据位置与取回/来源 proof。该后续边界尚未具备，本提案不伪造位置或 PASS，不在 Standard Action Runs 中记录 Full Test。
