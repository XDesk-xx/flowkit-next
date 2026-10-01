## Context

见 [proposal.md](proposal.md)。A/B 已把机械操作收回固定发行命令；当前候选 `src/cli/action-request.ts`、`support-request.ts` 定义封闭请求，`entrypoint.ts` 返回 JSON 帮助与结果。十个 Action Skill 已含固定 `action start/finish`，Delivery Start/Full Test/Git HOW 仍有内部模块与 callback 路径。当前正式 D07 由外部 Stable manager 管理，候选资产仅供实施和验收。批准依据是 `20261001-027-explore` 与独立 `20261001-028-review-explore`；后者没有 finding。

## Goals / Non-Goals

**Goals:** 将当前发行自有 HOW 的调用、权限、结果读回与 proof 生产规则收敛到 A/B 已有的封闭接口；使独立角色从接入说明能找到同一安装并完成一个合法节点。

**Non-Goals:** 修改固定命令的产品语义；在 C 加入 proof 目录机器扫描、TS/临时脚本与权限门禁；改写历史 Run/proof、B 的 54 文件、vendor 或本 Delivery 的 `.agents` bootstrap；新增自动 Reviewer、Agent/Tool Registry、聊天监听或执行器。

## Decisions

### 1. 以发行请求 parser 为唯一示例来源

每个有效 HOW 示例从本安装的固定 CLI、`src/cli/action-request.ts` 与 `src/cli/support-request.ts` 对照生成。调用均用 `--input <path|->`；support 写命令带 `--repository-root`，Delivery/Change 命令带相应可见 ID，实际 JSON 中包含同值 `repositoryRoot`、`flowkitHome`。`status/next/doctor` 先判边界；CLI 的退出码与 JSON `kind/status/effect` 都要读，`effect=confirmed` 只表示记录读回。

| 操作 | 请求中除共同 target 外的当前字段 | HOW 归属 |
|---|---|---|
| `action start` | `deliveryId, changeId, actionId, role`；仅适用时 `ownerAuthority, applicableChecks` | 十个 `skills/actions/**/SKILL.md` |
| `proof inspect` / `action finish` | `deliveryId, changeId, runId, path` / `deliveryId, changeId, runId, role, terminal, result` | 十个 Action Skill |
| `project init` | `projectId, repository, runtimeFamily, sourceRef` | onboarding、Delivery Start |
| `delivery start` | `deliveryId, ownerAuthority, planningReference, manifest` | Delivery Start |
| `change activate` / `change archive` | `deliveryId, changeId, ownerAuthority` / `deliveryId, changeId, runId` | onboarding、archive HOW |
| `memo list/get/create/promote/dismiss` | 无 / `memoId` / `memo, ownerAuthority` / `memoId, target, ownerAuthority` / `memoId, ownerAuthority` | onboarding、相关交接 |
| `delivery full-test` / `current` | `deliveryId, ownerAuthority, attemptId, expectedCurrentAttemptId` / `deliveryId` | Full Test |
| `delivery final` | `deliveryId, ownerAuthority` | Final |
| `git checkpoint` / `push` | `deliveryId, changeId, ownerAuthority, gitRequest`；`changeId` 只在 Change Git 节点出现且需可见匹配 | repository integration |
| `git integrate` | `deliveryId, ownerAuthority, gitRequest, integrationInput` | repository integration |

该表说明顶层封闭字段，不缩写嵌套对象的既有验证合同。Apply 应以真实 parser 和命令返回为准完善至少一个可执行数据例及每组失败/部分成功示例。不得用 callback 代替嵌套输入，也不得把 `sourceRef` 当成 CLI 已认证聊天的证明。考虑过仅把旧宿主 HOW 链接到 README；这无法消除有效 reference 中的旧调用，因此逐资产直接修正。

### 2. 逐资产处置，保留已正确的 Action 方法

| 当前资产 | C 的最小处置 |
|---|---|
| 七个 Author 和三个 Reviewer `skills/actions/<actionId>/SKILL.md` | 逐一核对；现有固定 start/finish 与实质方法保留，补全本 Run proof 文件集合规则、准确请求与 STOP；发现实质冲突才修改对应文件。 |
| `skills/delivery/start/SKILL.md` | 将 `writeManifest` 宿主步骤改为 `project init`（首次项目）与 `delivery start` 的各自固定请求、结果和部分成功处理。 |
| `skills/delivery/full-test/SKILL.md` | 将直接 `invokeDeliveryFullTestOperation` 改为 `delivery full-test current` + 授权的 `delivery full-test`；保留 attempt ID、当前关联、原始流和失败后不回用旧 PASS。 |
| `skills/delivery/final/SKILL.md` | 保留来源与两阶段确认语义，给出 `delivery final` 调用和确认读回；Git 授权仍独立。 |
| `skills/delivery/repository-integration/SKILL.md` 与有效 `references/host-call.md`、`git-host.mjs` | 将默认动态导入、`readOwner`/`performAcceptance` 回调示例改为 `git checkpoint/push/integrate` 封闭请求和待人工接受交接；核对旧 reference 的真实消费者，仅在无有效消费者后退役。`git-host.mjs` 当前确实导出 `runCheckpoint`、`runPush`、`runIntegration`；修正目标是默认 HOW 的调用路径，不是删除正确的导出。 |
| `skills/tools/openspec/SKILL.md` | 保留 exact OpenSpec runtime 与规格权威，说明其工具命令与 Flowkit 固定记录/支持命令各自用途；vendor 原字节保留。 |
| `README.md`、`src/README.md`、`docs/onboarding.md`、CLI help/示例、`AGENTS.md` 当前入口 | 仅修正仍称 CLI 只读、要求内部宿主/临时程序或指向错误命令的当前语句；不删历史 D01–D06 事实，不覆盖整文件。 |
| `.agents/skills/**` | 当前独立 bootstrap 仍在使用，保持其来源与字节；生产 `src/**` 不读取它们，不将候选 Skill 指向该面。 |

### 3. 将生产 Run 的完整声明与后续按需交接分开

Action HOW 在产生必要文件时使用本 Run 的正式 proof 目录。结束前列出该目录下的**完整文件集合**，对每个文件建立一条同 Run `proofRefs`，核对 bytes、SHA、Git 原始字节规则和用途；若无新材料，使用空数组且不建目录。Reviewer/后继 Action 可只取其中相关的已声明引用，不能因此删改生产者 Result。该文案修正当前“只传需要的引用”可能被读成“生产 Run 只列选中的文件”的歧义。C 以清楚 HOW 和样例约束生产者；D 实现 finish/checkpoint 前的有界机器闭合集核验。实现时不让 `status/next` 扫描历史 proof。

### 4. 按已确定边界展示失败与停止

每个调用范例注明其 `blocked`、`incomplete`、`written-unconfirmed`、已确认效果与未知部分的交接方式。Author 不填 Reviewer verdict，Reviewer 不修改 Author artifact；Full Test 只提供验证事实；Git checkpoint/push/integrate 只在独立 Owner 授权和真实 Git/外部接受事实下进行。一次命令返回后 STOP。选择直接对应现有结果形状，避免建立新状态翻译或另一份 durable truth。

## Risks / Trade-offs

- [当前 Skill 字节变化形成新 Guidance 身份] → 只改有实际差异的当前文件；历史 Run 保留原始 GuidanceRef，不重签。
- [说明示例与 parser 后续漂移] → Apply 在同一候选构建中验证帮助、请求字段、成功及阻断返回，并做仅限当前有效资产的语义 stale scan。
- [备份 proof 被误认为正式证据] → HOW 区分本 Run `proofRefs`、跨 Action handoff 与本地备份；D 继续负责机器约束，C 不补造 B 的旧 Result。
- [过度修改 bootstrap] → `.agents/skills/**` 的当前消费者已确认；保持其独立性，候选验收使用发行资产，不改写本 Delivery 正在执行的外部 manager。

## Migration Plan

在 C Apply 中同步更新受影响的发行 HOW 与文档，核对构建包包含并能解析这些文件；无需迁移持久数据。若候选验收失败，在当前 Change 内修正候选资产；当前 D07 正式执行仍使用既定外部 Stable manager。
