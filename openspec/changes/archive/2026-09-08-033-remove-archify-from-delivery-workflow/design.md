## Context

动机与能力范围见 [proposal.md](proposal.md)。`001-explore` 的三个有界反例已由 `002-review-explore` 独立复现并 approved；当前 Explore 文件 SHA-256 与审查绑定一致。这里收敛已批准结论，不重跑 Explore，也不把历史 59/59 当实现验收。

本变更跨 operation、Start、Final、共享证据和工具合同，包含 breaking shape/projection 变化，故需要 design。D05 继续使用独立 bootstrap，不要求尚未实现的产品 host 管理自身。

## Goals / Non-Goals

Goals：一次闭合 producer 与直接 consumer 的去架构变更；保留现有通用权限、来源验证、窄写和失败顺序；让无 Archify/图的真实路径可验证。

Non-Goals：不重做 resolver/root 模型，不更改 v2 文件选择，不建立新的 evidence/schema version/兼容层；不因为删除中间步骤而免除现有 candidate/Full Test 核对。仅非产品图文变化不重测是 D05 总体方向，但测试范围与 candidate 的通用解耦由后续 Change 实现，本 Change 不声称已实现。

## Decisions

### 1. 删除活动能力，不保留可选分支

operation catalog 固定为 Start、Full Test、Final、Integration 四项，原有四条 Guidance 路径不变。删除 Architecture variant 的 formation/clone/validator/export，以及 domain 下 `delivery-architecture-finalization-{execution,identity,operation}.ts`、internal 下 `delivery-architecture-finalization-{archify,artifacts,closure}.ts`。

选择直接退役而非 optional/skip，是因为 doctor 和共享证据反例已证明“没有调用绘图步骤”不等于解除必填消费者。不要保留返回空成功的旧导出；调用者必须改用新合同，旧 literal 拒绝。

### 2. Start 输出只保留 manifest，但不改其余入口条件

`delivery-start-content.ts` 的固定 outputs 只剩 `openspec/delivery-groups/<delivery-id>.yaml`。validation checks 按原相对顺序保留 `git-start-prestate`、`openspec-delivery-manifest`、`content-receipt`，继续使用既有 check/outcome/source/artifact shape；receipt 输入为 planning identity 与唯一 manifest artifact。只删三个 Archify checks，不新增免检标记。

保留 acceptedBaseCommit、clean-start、planning ref/hash、manifest regular-file/path/bytes、exact validation source、candidate 和 checkpoint callback 结果校验。Previous-Actual 从产品 Start HOW/活动合同退出。只产生图以符合旧校验的 Start fixture 要改为无图正向 fixture；无效 receipt、missing/changed manifest、wrong authority/Git 反例保留。

### 3. Final 直接接续 Full Test，字段一次收敛

| Surface | 去除 | 保留/接续 |
| --- | --- | --- |
| Final preparation input | `architectureOutcome` | `{deliveryId, ownerAuthority, fullTestOutcome, flowkitHome}` |
| operationFacts | `architectureFinalizationRef`、`architectureMaterializedCandidateRef` | `{verifiedCandidateRef, fullTestExecutionRef, coordinationPrestateRef, completedRequiredChangeIds, requiredEvidence}` |
| terminal record/coordination | 上述两个架构 refs | 现有 Full Test、coordination 与 Final continuity；不加入新代际字段 |
| requiredEvidence | `architecture` | `{projectId, deliveryId, changeClosures, fullTest}` |
| evidence source contract | `readArchitecture` 和相应 expected refs/outcome | `readChangeClosure`、`readFullTest` 及其现行归属/真实性/完整性验证 |
| Integration | 对旧 Final/架构证据的假设 | 使用新 Final validator/projection 和共享 evidence reader；accepted-object 核验仍在 |

Final preparation 的 current v2 candidate 与 `fullTestOutcome.record.candidateRef` 直接比较；执行前后继续按 retained trusted package 重验。Final 合法窄写 manifest 后，派生实际 `finalizedCandidateRef`，因此 verified 与 finalized 可以不同，不能要求两者相等或伪造中间 candidate。

不选择删除所有 candidate/完整来源校验：这超出已批准 Explore。来源 reader 仍从真实 owner 取回所需事实，不因为去掉 architecture 就接受随意 sourceRef、synthetic outcome 或 caller 缩小链。

### 4. Deterministic projection 明确 breaking，不做隐式历史升级

Final 的域标签、分隔符、ref prefix 不变；删除架构字段后的完整顺序以 `delivery-finalization` delta 为准。derive 与 validator 使用同一固定投影；input property 重排不影响 identity，included value/array 改变影响 identity。增加新 golden vector 和旧形状拒绝测试，不仅更新一个 expected hash。

Integration 的自身 ref projection/authority/checkpointOperation 不变，但其绑定的 Final ref 将来自新投影。prepare、callback 前后重验、accepted-object 必要证据读取都必须使用新形状。不能只在 preparation 不读架构，却在 acceptance 仍调用旧 reader。

选择 strict 新形状而非双版本执行：旧记录仍是历史事实，读取原始 JSON/YAML 不需要调用新 terminal validator；新 validator 拒绝旧架构字段/旧 ref。不开启历史 materialization、旧 outcome 转换或兼容接纳。历史读取回归只验证原 bytes/类型可读取、无 Archify 依赖，并同时证明其不能成为新 execution input；不冒充旧 runtime 的重演验收。

### 5. 工具和 HOW 依职责退役

managed IDs 仅 `openspec`，lock 删除 Archify entry，保留 OpenSpec 1.10.0 与既有 provenance。resolver 保持 confinement、package/entrypoint exact identity 和 closed diagnostics；不新增配置/工具 Registry，不改变本 Change 尚未分根的 repository lock 位置。

doctor 只产生 `openspec-runtime`、`openspec-root`，只在两者均 pass 时整体 pass。无 Archify、不完整独立 Archify、目录完全无图均不影响结果；缺 OpenSpec 或 root mismatch 仍失败。

移除 `skills/delivery/architecture-finalization/`、`skills/tools/archify/`、`skills/vendors/archify/` 产品专属资产及发行/检查直接引用；不得删除外部 FLOWKIT_HOME 内的用户 runtime 或独立 `.agents` 安装。同步 `skills/delivery/start`、`final` 和相关 Full Test/Integration 文本；保留它们各自 authority/STOP 规则。

AGENTS/README 的当前工具、默认图目录和跨 Delivery 图前置改为独立按需绘图；D04 的完成事实、历史文档和 archive 不改。目前定向检查 `.agents/skills/**` 未发现产品式的活动 Archify 前置，通用“architecture exploration/expansion”不属于退役对象，因此不计划批量修改 bootstrap Skills；Apply 若遇直接矛盾，仅同步该条款并解释，不让产品执行 bootstrap HOW。

### 6. 保存与验证仍分责

Owner 的必要 proof 默认长期保留决定与本次 Propose 调用一起携带至 Run。既有 `001/002` proof 原样保留；本次 OpenSpec 校验输出保存于 `.flowkit/artifacts/<delivery>/changes/<change>/proof/20260908-003-propose/`，不扩充 Run 三文件，不声称新增产品 evidence 持久化能力。

后续 Apply 对新 candidate 产生新的必要报告并记录真实命令/输入/限制；原 proof 是 accepted decision basis 的来源，不默认长期依赖每一份原始 bytes，更不能冒充新实现 PASS。结构校验只证明规划格式；独立 `review-propose` 才给出计划 verdict。

## Risks / Trade-offs

- 共享 shape 只改 producer → 按上表同时覆盖 clone、derive、validator、source、coordination、Integration accepted-object 测试。
- 退役专属测试误删通用保障 → 专属六槽/compare 验收随能力删除；非架构的 authority、callback 隔离、来源损坏、窄写/失败顺序须迁入或保留于活动操作测试。
- 旧记录与新执行混淆 → 冻结历史样本 bytes，分开测试普通历史读取与 strict 新输入拒绝，不对旧数据重签。
- 大文件积累 → 使用现有 `src/**/*.ts` 650 行 gate；减法后未超限不先拆，超限或职责确需时沿 producer/consumer 边界拆分，不压行、不豁免。
- D05 后续耦合仍存在 → 保留 proposal 的明确非目标；无图路径验收不代表 `.gitignore`/test scope、Start SHA 或证据平台问题已解决。

## Migration Plan

先收敛共享新形状与其 consumers、fixture，再删除专属能力/导出和工具资产，最后完成定向回归与活动 guidance 核对。中间构建失败可作为同一 Apply 的未完成状态，不能提交或交接半边实现为 PASS；无需迁移本仓库 D04 运行记录。

本 Change 的调用者切换到新输入形状；旧在途 package 不重用，不提供自动转换。失败按既有边界报告实际效果，不自动回滚、Git revert 或补交 commit。若需产品回退，另由 Owner 在 Git/Change 正常边界决定。

规范最终同步时，已有 architecture capability 的 Purpose 应改为“界定架构交付能力退役后的历史保留与独立绘图边界”；managed-tool capability 的 Purpose 改为仅描述 exact OpenSpec。OpenSpec delta 不同步已有 Purpose，故在后续获授权的规范同步边界作这两处说明性收敛，不在本轮改 main specs；历史 archive 的旧 Purpose 保留。

## 验收映射

| 决策来源 | 计划条款 | 新实现证据 |
| --- | --- | --- |
| Owner 退役方向、Explore operation 闭包 | 四值 catalog、Architecture 八项 REMOVED | 旧 literal/导出无活动路径，无 skip stub |
| Explore doctor 反例、002 复验 | OpenSpec-only tool/doctor | 无 Archify 正向，缺失/错误 OpenSpec 负向 |
| Explore Start guard、现行内容合同 | manifest-only Start | 满足其余真实前置的完整 Start，无图，无 Git callback 越权 |
| Explore shared shape、Final/Integration 静态闭包 | 新 evidence/projection/consumer | Full Test → Final → Integration 无架构路径，新 golden vectors、旧形状拒绝 |
| 既有 owner/source/窄写合同 | 保留权限与来源失败检查 | failed/incomplete Full Test、必需 Run 损坏、candidate drift、非目标 bytes 等回归 |
| Owner 历史与保存边界 | 原类型历史读取、当前证据独立 | 历史 fixture bytes 不变，必要新结果可读，原 proof 不充当新 PASS |

没有待 Owner 决定的合同性未知；具体 helper 命名可在 Apply 内按既有结构选择，不改变上述字段、边界或任务范围。
