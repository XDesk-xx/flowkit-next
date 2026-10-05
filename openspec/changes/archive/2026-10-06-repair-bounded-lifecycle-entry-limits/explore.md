# Explore：修复四项有界生命周期入口限制

## 范围、授权与当前边界

- Change：`repair-bounded-lifecycle-entry-limits`。
- Owner 当前输入：`走 openspect 流程，最小修复，这4个问题，开始 explore`。
- “四个问题”对应上一轮修复建议的四项：E01 Git 请求容量及超限诊断；E02 普通 Author terminal FAIL 的 Owner 修订入口；E03 首个 projectOrdinal 初始化；E04 候选 metadata 的节点预算及写前诊断。
- 本次沿用 Owner 已授权的直接 OpenSpec 工作方式：由 exact OpenSpec CLI 建立 Change，保存探索和实测材料，不创建 Delivery coordination、canonical/bootstrap Run 或 OwnerAuthorityFact。
- 本文是有界 Explore 材料，不是 approved Proposal、Reviewer verdict、正式 Run 或实现验收。当前 schema 为 `spec-driven`，`explore.md` 是项目补充材料，不属于该 schema 的四个 planning artifact。
- 只授权到 Explore。生产实现、主规格同步、归档、Git checkpoint/push 和更新 manager 均不在本次执行范围。

## 核实基线及证据

| 事实               | 当前读回                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------- |
| repository         | `D:/Projects/flowkit-next`                                                                |
| Git branch / HEAD  | `main` / `96179b50b70a7582e264a7af111436d3ca52f788`                                       |
| 开始前 worktree    | clean                                                                                     |
| 外部 manager       | `D:/tools/flowkit-manager/node_modules/flowkit-next`，`flowkit-next@1.0.0`                |
| 安装绑定           | `file:../../releases/flowkit-next-1.0.0-96179b50b70a.tgz`                                 |
| exact OpenSpec     | `C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js`，实际版本 `1.10.0`        |
| 创建 Change 前查询 | installed manager `status=idle`、`next=idle`、`doctor=pass`；OpenSpec active Changes 为空 |
| 创建方式           | exact CLI `new change repair-bounded-lifecycle-entry-limits`，生成 `.openspec.yaml`       |

可复现探针在 [evidence/explore-probes.mjs](evidence/explore-probes.mjs)，实际输出在 [evidence/observations.json](evidence/observations.json)。输出包含 source SHA-256、Git HEAD、manager package、Node/platform、输入规模和真实函数/CLI响应。

复现命令：

```powershell
node openspec/changes/repair-bounded-lifecycle-entry-limits/evidence/explore-probes.mjs D:/Projects/flowkit-next D:/tools/flowkit-manager/node_modules/flowkit-next
```

探针仅读取当前 Git/manager；ordinal 使用系统临时目录并在结束时删除 exact disposable files。合成 Owner/Run 对象仅为函数输入，均未写入 `.flowkit`，也未用于实际生命周期或 Git mutation。910 条路径来自指定基线 commit 的真实 diff；通过请求形状校验不表示获得提交授权。观测以保存的基线为准，不要求未来实现仍复现这些旧阻断。

## E01：Git 精确路径请求超过共享 64 KiB

### 问题、证据和根因

`git checkpoint` 的 create-new 请求必须带全部 exact paths；共享 JSON parser 和 stdin reader 都限 65,536 UTF-8 bytes。当前文件入口先完整读入文件，再由 parser 检查大小。

本次对基线 commit 的 910 条实际路径形成封闭结构请求，`parseSupportRequest` 和 `snapshotGitHostRequest` 通过，序列化为 131,035 bytes，parser 拒绝 `request exceeds JSON limit`。这个 byte 数属于本次 fixture，不能替换真实 Owner 请求的身份。

parser 对 65,536 bytes 的合法 JSON 接受，对 65,537 bytes 拒绝。installed CLI 的超限文件输入返回 `invalid-request-json`，同等超限 stdin 返回 `invalid-arguments`：Support 入口把 `readStdin` 抛出的输入错误重新包装为读取文件失败，最终 JSON 还丢失了具体超限信息。

根因位置：

- `src/cli/request.ts`：`parseFoundationCliRequestJson`、重复 key/depth 校验。
- `src/cli/entrypoint.ts`：命令 dispatch、`readStdin`、read catch、error rendering 和 help。
- `src/cli/support-request.ts`：固定 Git 命令及封闭字段。
- `src/domain/git-workflow-host.ts`、`src/internal/git-checkpoint-execution.ts`：授权及真实 Git 校验，保持原义。

### 最小修复方向

仅三个固定 Git 命令 `git checkpoint / git push / git integrate` 使用 1,048,576 bytes 请求预算；由已解析的命令选择预算，不允许 JSON 自报额度。其他命令、correction/proof manifest 的共享默认 parser 继续 65,536 bytes。

同一预算用于文件输入和 stdin，避免一处放宽另一处仍拒绝；文件读取也应有界，不以无限制 readFile 后再拒绝实现容量保护。保留重复 key、深度 32、字段闭合、target/Owner/paths/candidate/index/blob/commit/remote 核对。

保留可区分的超限错误，文件和 stdin 使用一致 machine 分类；输出只带安全的限制维度、budget 和已观测大小，不输出请求内容或把实际 I/O 故障伪装成容量错误。help/onboarding 同步实际分级预算。

不得增加普通 `git` fallback、隐式分批提交、路径 glob、caller callback、外部路径清单协议或绕开固定 checkpoint 校验。

### Proposal 必须覆盖的验收

- 超过 64 KiB、低于 1 MiB 的合法 Git 请求通过 transport，随后仍执行原 authority/domain 校验。
- 恰好 1 MiB 与超过 1 MiB 的 UTF-8 bytes 边界；文件与 stdin；多字节字符和分块 stdin。
- 非 Git 请求仍在 64 KiB 边界拒绝；重 key、超深度、额外字段仍拒绝。
- 超限不能发生 Git 写入；真实缺文件等 I/O 错误与超限区分。

## E02：terminal Author FAIL 无法进入 Owner 修订

### 问题、证据和合同性质

六个普通 Author Action：`explore / revise-explore / propose / revise-propose / apply / revise-apply`。

每个 exact-linked terminal FAIL/null fixture 即使有结构匹配的 `revise-action` authority，当前 Policy 都返回 `unrecognized-or-unsuccessful-author-outcome`。原因是 `normalBoundaryForTerminal` 对非 PASS 阻断，调用方在评估普通 Owner correction 前返回该阻断。

这是当前主合同明确规定的行为，不是简单的实现偏离：`policy-and-next-boundary` 的 normal matrix 和 Owner correction 条件只在可用 normal boundary 后处理 correction，另有专用 safe Archive failure 例外。新修复必须通过 Proposal 收敛合同，不能直接把 FAIL 当 PASS。

关键结构反例：普通 `apply FAIL → revise-apply` 的 identity 不同，ordinary prepare 可进入；但 `revise-apply FAIL → revise-apply` identity 相同，ordinary prepare 拒绝。`revise-explore`、`revise-propose` 同样如此。只修改 Policy 会产生假的 READY 或在 start/inspect/finish 阶段再次阻断。

根因及必要消费点：

- `src/domain/policy-and-next-boundary.ts`：normal/Owner/reached-stage/enterability。
- `src/domain/action-lifecycle.ts`：同 identity terminal 的结构限制。
- `src/cli/action-commands.ts`、`action-inspect.ts`、`action-finish.ts`：同一结构边的形成/重建。
- `src/cli/current-run-chain.ts`：唯一直接父链及 Owner-linked edge 读回。
- `src/domain/single-action-execution.ts`：既有单 Action 执行 seam；适用消费点须保持等价，不允许 CLI 与 domain 给出相反结构结论。

### 最小修复方向

新增窄的合法 correction 情形：active Change、exact current terminal Author、六个普通 Author Action、真实 `authorConclusion=FAIL`、Reviewer/Verification 槽和 reported next 全为 null、完整可信记录。没有 explicit matching Owner correction 时仍 blocked，不自动 retry。

Owner 使用既有 `decision=revise-action`、exact Delivery/Change、scope 仅 requested revise；复用 reached-stage 规则：Explore 只 revise-explore；Propose 可 revise-propose/revise-explore；Apply 可三个 revise。禁止 forward skip。

不同 identity 继续复用 ordinary prepare；同 revise identity 只开放经该失败 correction 规则核准的新 occurrence 结构边。新 Run 保存原失败为 `previousRunId`，保存开始时绑定的 Owner fact；新 Run 读回前不得宣布 current 已更换。原 FAIL/三文件/proof bytes 均保留。

新修订 PASS 后仍重新独立 Review；不继承旧 candidate approval。不要开放 PASS/null/UNKNOWN、Reviewer、Archive partial、machine partial、completed reopening 或通用 same-action retry。Archive safe failure/retry 和 prepared correction 保持现有专门规则。

### Proposal 必须覆盖的验收

- 六个 Author FAIL 的同阶段恢复，包括三个 revise 自身再次 FAIL；合法返回更早阶段及 forward skip 拒绝。
- 无 authority、错误 decision/target/scope、非 Author、非 terminal、stale Run、冲突 reported next、混入角色结论均拒绝。
- new start → inspect → finish → 独立 status/next 读回同一合法边；唯一父链、序号冲突和分叉检查继续有效。
- 旧 FAIL bytes 不变；Archive/Reviewer/prepared/PASS/completed 等既有边不扩大。

## E03：首个 projectOrdinal 没有常规初始化路径

### 问题、证据和合同性质

`readProjectOrdinal(target, true)` 只在已有有效 ordinal 时产生 `max + 1`。全新 fixture 没有 assigned ordinal 时拒绝 `Exact Change has no assigned project ordinal or durable baseline`；有效基线 8 返回 9；重复或 malformed 基线仍拒绝。

Project Init 只写 project identity；Delivery Start 建 planned Changes，不分配 ordinal；Activate 写 active/Owner provenance，不建立 ordinal。Explore start readiness 又要求基线。这与发行 Explore HOW 的“没有基线须 Owner bootstrap 决定”一致，但使已正常接入的新项目还需额外手工准备。

位置：`src/cli/action-readiness.ts#readProjectOrdinal`、`skills/actions/explore/SKILL.md`、`openspec/specs/author-action-guidance/spec.md` 和 `docs/onboarding.md`。独立 bootstrap HOW 的适用文字需与新正式合同一致，但本 Change 不制造或迁移 bootstrap 历史。

### 最小修复方向及安全边界

在已确定合法的首次 Explore 内，允许被证明尚未消费任何项目 ordinal/执行历史的初始化状态以 1 作为第一值；只有当前 Change 真正进入 Explore 后，才由既有 assignment HOW 在其 exact coordination entry 持久化一次。

不得仅凭“没有 assigned ordinal”判定 fresh：须验证完整可读的有关 Delivery coordination，无 malformed/重复值，且没有先前执行/归档等与首次初始化矛盾的项目事实。当前合法启动 descriptor 不应被误判成先前已消费历史。具体 fresh predicate 要在 Proposal 给出闭合定义和输入来源；不靠目录数、mtime、Git history 或 Run 序号推导编号。

已存在 valid ordinal 时仍 max+1，已有当前值复用不变，cancelled 已消费值不回收。已有旧执行/归档但基线缺失、材料 unreadable/linked/ambiguous 时仍 fail closed，不从 1 重新编号。planned Changes 不预留数字；Start/Activate/Init 不新增计数器、seed、registry 或额外命令。

这是 author-action-guidance 合同的有界调整，不是把初始化 Owner authority 变成 candidate 自授生命周期权限。正常 activation/Explore 的既有 Owner/Policy 准入继续成立。

### Proposal 必须覆盖的验收

- 已初始化新项目、已授权 activation 的首次 Explore：start 通过，持久化 1 后 finish/Review/Archive 消费同一值。
- 多个 planned Change 不占号；第二个实际 Explore 使用 2；取消后仍递增。
- 有有效历史基线复用/max+1；missing-with-history、duplicate、malformed、unreadable/linked 情形拒绝。
- 重复继续不重复分配；当前开始记录与真正先前历史严格区分；相关 input 漂移在写入/finish 时核对。

## E04：candidateGit 元数据在 64 KiB 前触发 1,024 节点上限

### 证据和根因

`isJsonObject` 同时约束 facts bytes ≤65,536、depth ≤16、nodes ≤1,024。成功 Author finish 根据 artifactHashes 生成 candidateGit，再执行第二次 admission；目前预算失败返回泛化的 `result-admission-rejected`。caller 输入先经过 `isRunResultRecord`，超限也可能先表现为泛化 invalid Result。

两组 structurally valid candidateGit fixture 的实际观测：

| indexBasis | 首次 nodes 拒绝 | bytes  | nodes | 同形状仍在 byte 预算内的最大样例       |
| ---------- | --------------- | ------ | ----- | -------------------------------------- |
| absent     | 113 files       | 35,985 | 1,028 | 205 files / 65,333 bytes / 1,856 nodes |
| entry      | 85 files        | 34,053 | 1,031 | 163 files / 65,301 bytes / 1,967 nodes |

这些是合成形状的边界测量，不是产品固定文件数，也不说明 bytes 预算内所有任意 facts 都应接受。proofRefs、检查事实、path 长度和字段形状会进一步消耗预算。

位置：`src/domain/run-result-persistence.ts`、`src/cli/action-request.ts`、`src/cli/action-finish.ts`、`src/cli/action-artifact-hashes.ts` 和共享 Result admission/readers。

### 最小修复方向

保留 facts 64 KiB、depth 16、action.md 64 KiB、proof 原始文件和 Archive 输出预算。只将 JSON node 安全预算调整为有界的 4,096，覆盖已证明 bytes 内合法候选形状，同时保留上限拒绝；不把它变成无限制 JSON，也不放宽具体 candidate/role/identity schema。

在现有 validation/admission seam 共用预算测量和安全诊断；固定输入 validation 与 manager 生成 candidateGit 后的最终 admission 都能区分 bytes/depth/nodes，并报告对应 limit 和 observed/lower-bound 计数。计数若为防护提前停止，必须明确是下界，不能伪报 exact total。

“提前诊断”明确指在 `context.json/result.json` 写入前：metadata 生成后预算检查失败时保留原 descriptor/proof，不产生半份 machine Result。Explore 不承诺在 Author 开始前准确预测尚未形成的全部候选；不引入新 candidate inspect command、dry-run lifecycle、metadata registry 或拆分持久事实。

最终 facts 加 candidateGit 若超过 64 KiB 仍拒绝，不能靠 Git 的 1 MiB 请求额度接纳；成功接纳、写后读回、Review/Archive/correction consumer 必须使用一致预算，旧记录不重签/改写。

### 方案比较

| 方案                                       | 取舍                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 仅提高 node 预算并加入写前诊断             | 推荐。保持现有三文件、facts/candidateGit 形状和各消费者，不新增持久引用模型              |
| 将 candidateGit 外置为新 proof/ref version | 当前不选。需要调整 admission、Review、Archive、Git、历史兼容和引用闭包，超出这次最小修复 |
| 放宽全部 JSON/Run/proof bytes              | 排除。与 Git 专用额度及保持 Run/proof 大小限制的边界冲突                                 |

### Proposal 必须覆盖的验收

- 上述 node 反例及接近 64 KiB 的 absent/entry 候选可成功接纳和 round-trip；caller 未传 candidateGit 时生成结果也必须验收。
- 恰好/超过 4,096 nodes、depth 16/17、facts bytes 65,536/65,537 分别验证，避免另一维度掩盖所测边界。
- 超限输入/生成结果都输出可操作诊断；reject 不写 context/result；之后真实修正可按同 descriptor 继续。
- 无效 candidateGit、unknown fields、角色混写、hash/proof/Git 属性漂移仍拒绝；不削减 proofRefs 或 candidate identity 以凑预算。

## 合同收敛与最小改动面

| 问题 | 需要收敛的既有 capability                                                                                         | 主要实现消费面                                                      |
| ---- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| E01  | foundation-cli-surface；repository-integration-and-next-base-continuity 的固定 Git 请求边界                       | request/entrypoint/shared bounded input；help/onboarding            |
| E02  | policy-and-next-boundary；action-lifecycle；stable-action-command-execution；相关 single-action/run chaining 条款 | Policy + 窄结构 correction + start/inspect/finish/domain 消费一致性 |
| E03  | author-action-guidance；stable-action-command-execution/onboarding 的首次 Explore 条款                            | readiness + 既有 assignment HOW + input revalidation                |
| E04  | run-result-persistence；stable-action-command-execution 的输入/最终 admission 诊断                                | 共用 bounded validator + request/finish/readback                    |

不新建 capability 平台；只对上述既有合同的必要条款作 delta。Apply 的适用验证包括目标 unit/CLI 回归、installed-manager readback、type/build/相关 quality checks；不得把这些 Explore 观测声称为实现验收或 Formal Full Test。

## 明确非目标

- 通用 crash recovery、machine partial 修复、事务/rollback 平台、Action scheduler 或 automatic Author/Reviewer loop。
- 改变 Archive v2 的 one-native-call/unknown-intent/partial 规则，或重放历史 archive。
- 对独立 OpenSpec Change 伪造 canonical coordination/Run、恢复被卸载 manager、candidate 自我接管。
- SHA-256 Git repository、特殊 Git 路径支持、Full Test timeout、`.cmd/.bat` 执行或其他上轮审计发现。
- 放宽 Owner/Reviewer 边界，扩大所有命令 JSON bytes，扩大 Run/proof 文件预算，删除/压缩必要身份或 proofRefs。
- 新 registry、counter service、candidate snapshot DB、配置迁移、历史结果重写。
- 本次执行 Propose、Apply、Review、Archive、Full Test、Git 或 manager 更新。

## Explore 结论与下一边界

四项问题已经以当前安装和源码证据定位，最小方向可收敛为一个 Change。E02/E03 属于明确的合同调整，不能仅凭 audit 将其定义为实现违反主规格；E01/E04 属于容量/诊断与正常规模消费的冲突。

Explore 作者结论：有界证据已具备，Proposal-ready；这不是独立 Review approval。Proposal 必须明确 E02 同 revise identity 的窄结构输入及各消费点一致性、E03 fresh predicate 和开始/持久化时序、E01 safe machine error 形状、E04 bounded budget 诊断形状。它们是该方向内的合同细化，不得新增泛化恢复或第二持久事实。

当前停在 Explore；OpenSpec 的 proposal 尚未生成，specs/design/tasks 尚未生成。后续按 Owner 指定的 Propose 或独立 Review Explore 边界继续。
