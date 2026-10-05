## Context

动机和 E01–E04 基线见 [proposal.md](proposal.md) 与 [explore.md](explore.md)。本设计仅收敛四项已定位限制；当前主合同明确阻断普通 Author FAIL、无 ordinal 基线，因此先修改相关条款，不将旧行为描述为已经违反新合同。

当前采取直接 OpenSpec 规划，没有本 Change 的 Delivery/Run 或独立 Review verdict。规划依赖当前源代码与保存的 Explore 观察，不能将基线探针视为实现 PASS。

## Goals / Non-Goals

**Goals:** 保持现有 authority、三文件、prepared/terminal、单写者和 exact candidate/proof/Git 验证；让四项正常使用场景在原入口形成确定结果，并把拒绝原因报告清楚。

**Non-Goals:** 不增新 CLI 命令、持久 ordinal seed、结果外置协议、通用 retry/recovery、machine partial 修复或自动下一步。Run/proof byte 限制不扩大；Archive partial/unknown intent 不变。

## Decisions

### D01：按已解析命令选择有界输入预算

在既有 request/entrypoint seam 共享默认 65,536 bytes 和 Git 1,048,576 bytes 常量。仅固定 Support 命令 `git checkpoint / git push / git integrate` 选择较大值；其余命令与内部 correction/manifest parser 保留默认。JSON 不可指定额度，解析前不能依据 body 中的 command/operation 决定额度。既有 CLI help 的 input 描述同步显示默认/Git 额度，不新增命令或可调预算配置。

文件与 stdin 共用同一有界 Buffer 收集规则：最多保留所选 limit 的 payload；观察到第一个超限部分就拒绝，不先将整份文件无限制读入。文件的大小预检查不能代替实际读取计数，避免读取期间文件增长绕过限制；处理结束/失败时关闭文件 handle。Buffer 收集完成后检查 UTF-8 bytes、重复 key、depth 32、JSON 和原封闭 schema。

保留 `FoundationCliInputError.kind=invalid-request-json` 表达请求 bytes 超限，超限 message 固定为 `request exceeds JSON limit`。读入 catch 透传已有输入错误，仅把实际文件/stream I/O 故障归为 `invalid-arguments`；不将正常 domain/authority 拒绝包装成容量错误。

容量错误增加安全、封闭的 `error.budget`，字段为：

```json
{
  "subject": "request",
  "dimension": "bytes",
  "limit": 1048576,
  "observed": 1048577,
  "measurement": "lower-bound"
}
```

subject 只取 `request/result-facts`；dimension 只取 `bytes/depth/nodes`；limit/observed 为非负安全整数；measurement 只取 `exact/lower-bound`。流在首次超限即停止，observed 只声明已经观察到的 bytes 下界，不假装知道完整大小。预算输出不带 payload、Owner source 内容、任意异常 cause 或 stack。已有 error.kind 和进程非零语义保留；budget 仅出现于对应容量错误。

选择显式额度而不是全局放大 parser，可保持 Run/correction/普通查询原边界；选择相同读取逻辑避免文件/stdin 再次分裂。无路径 manifest、分批提交、Git fallback 或新增 dependency。

### D02：以 exact failed pair 和 Owner fact 核准新 revise

在 Policy 的 exact target/terminal linkage 校验之后、普通失败分支直接返回之前处理专门 correction；不修改 PASS/Reviewer/Archive normal matrix。限定：

1. active Change；exact current terminal Author 是六个普通 Author Action。
2. context 确实为 terminal/author，context/result/current identity 和 runId 一致；Author conclusion 精确 FAIL，Reviewer/Verification 为 null。
3. reported next 必须 null；非 null 在 authority 判断前返回 `reported-boundary-conflict`。stale/missing pair、错误角色/state 在授权前拒绝。
4. 未请求 correction 保持 `unrecognized-or-unsuccessful-author-outcome`。请求目标先按 reached-stage/revise matrix 核对，forward/非 revise 为 `unsupported-owner-correction`；合法目标缺 authority 为 `owner-authority-required`，wrong decision/target/scope 为 `owner-authority-rejected`。
5. authority 使用现有 `revise-action`、exact Delivery/Change、单项 requested revise。阶段矩阵不变：Explore → revise-explore；Propose → revise-propose/revise-explore；Apply → 三个 revise。

普通不同 identity 使用原 prepare；仅三个 revise 自身失败后同 identity 的情况，使用新增窄结构转换。它只暂存新 occurrence 的 prepared candidate，不改旧 terminal，不根据裸 `ready-action` 自行认定 FAIL 或 Owner authority。Policy 和生产消费点必须先验证上述失败 correction，才调用该结构边；普通 prepare、PASS 同名 revise、Archive retry 均不扩大。

start/inspect/finish 和 current-run-chain 共同重建该边。start 的 Owner fact 绑定进原有 preparedContext/ActionPackage；新 occurrence 的 `previousRunId` 为直接失败 Run，sequence 按既有唯一 occupancy 分配。inspect/finish 从原 descriptor、exact parent 和绑定 authority 重建 Policy，不接受 caller 另填父链或内部 boundary。新 revise PASS 后回到自己的 Review 阶段。Policy/结构可进入不替代原机器 readiness：ordinal、coordination、必要 proof 和 runtime 等仍按原适用规则核对；失败不会删除这些前置条件。特别是 Explore 在编号持久化前失败而形成完整 FAIL 时，Owner correction 可通过 Policy，但 revise-explore start 仍因缺 ordinal 拒绝；有已消费 Run 的项目不能再借 fresh 分支自动设 1，需既有 bounded Owner bootstrap。

内核 `invokeSingleAction` 的适用 entry 复用同一窄结构规则。必要时增加一个可选末尾的内部失败来源参数，封闭包含 `changeState=active`、原 terminal context/result 和 Owner fact；目标 prepared context 必须绑定同一 Owner fact、直接 parent 及新 occurrence。通过既有 Policy 复核后才暂存。该参数不暴露到 CLI JSON，不是新 execution identity，原 Archive 参数/行为不改变；不凭不带失败来源的裸 READY token开放同名 Author retry。这里不补齐或泛化其他历史 prepared invocation API 行为。

替代方案“仅让 FAIL 进入普通 correction”会在三个同名 revise 上再次失败；“开放所有 terminal same-action prepare”会扩大 PASS/Reviewer/Archive 权限，均排除。

### D03：封闭 fresh predicate，分配仍在实际 Explore HOW

fresh 首值例外仅适用于 canonical product-managed first Explore；独立 bootstrap 保留自己的开始记录与原无基线 Owner 决定，不使用 canonical descriptor predicate 来转换或接管 bootstrap。

先沿既有 ordinal 规则验证完整相关 manifests：有效 assigned 值正整数、安全整数且全项目唯一；当前已有值直接复用，其他已有值取 max+1，溢出拒绝。仅当当前无值且全项目没有 assigned 值时，检查 fresh predicate，不把 absence 当有效历史：

| 输入                        | 首值 1 的必要条件                                                                                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| project identity            | 已初始化、可读取且 regular/unlinked 的当前 project，`runtimeFamily=new`，projectId 有效                                                                                                                                                         |
| coordination                | 全部 Delivery YAML 名称/id 和 Change entries 可验证；当前 exact entry 是可信 active，activation provenance 合法；其他所有 entries 只能 planned 且无 ordinal；unknown/cancelled/completed/其他 active 均不作为 fresh                             |
| OpenSpec active observation | 唯一 active Change 为当前语义 Change；不接管其他 active/独立 Change                                                                                                                                                                             |
| Run history                 | before start 无 occurrence；continuation 仅允许当前 exact 首次 Explore 的一个可读、已验证 descriptor，原 root/Guidance/target/Run 均一致，`previousRunId=null`，且无 context/result；其余 complete、partial、bootstrap 或未知 occurrence 均阻断 |
| Change-scoped artifacts     | 不存在先前/孤立 Change 执行材料；continuation 仅允许同一已验证当前 Run 的 proof，归属仍由既有 proof 检查核对；其他 Change/Run 的材料阻断，不读取其 transcript 来猜历史                                                                          |
| OpenSpec archive            | archive 根 absent 或空且可判定；任何历史/未知 entry、linked 或 unreadable 路径阻断                                                                                                                                                              |

必要目录 absent/空可正常表达尚无历史，目录本身 malformed/linked/unreadable 不视为 absence。检查是首次无基线分支的存在性/归属核对，不遍历历史 proof 内容或恢复旧证据；Delivery-level Full Test 材料和 Memo 不是 Change ordinal 消费记录，不据此重编号。`.tmp` 不作为历史来源。

fresh 得到 1 只使 first Explore admission 可进入，不在 Project Init/Start/Activate/只读查询期间写编号。descriptor 成功后，实际 Explore HOW 重读相同来源，窄写当前 coordination entry 的 `projectOrdinal: 1`；已有事实则遵循复用/max+1。采用既有默认顺序单写者，实际持久化前核对所读 manifest bytes 和有关 eligibility 未漂移；不增加锁、计数器或 durable 预留。

新 terminal Explore PASS 的 finish 要求已持久化值有效、唯一、与真实 Result 的 projectOrdinal 一致；真实 FAIL/null 和合法非终态继续保留原 Result 接纳规则，不因 HOW 尚未写编号而禁止记录失败。不把 runtime response、Run sequence 或 PackageId 作为 ordinal truth。已有 assigned 值不重写；首次候选值不是持久 seed。若上游记录、归档或 orphan proof 表明不是全新项目，却没有基线，继续要求 bounded Owner bootstrap 处理，不自动修复。

发行 Explore HOW 实现上述 canonical fresh 分支；独立 bootstrap HOW 仅澄清产品例外不适用于自身，在无 baseline 时仍要求其既有明确 bounded Owner 决定，不读取产品 HOW、不新增 bootstrap 自动分配或恢复路径。二者沿用相同已赋值复用/max+1/唯一性/取消消费纪律；接入说明给出产品正常首次流程。不执行、迁移或重编号现有 bootstrap 数据。

### D04：只调整 node 预算，诊断覆盖输入与生成后阶段

在 run-result-persistence 现有 JSON validation seam 共享预算测量，保留 boolean validators 对外含义和原 schema。facts nodes=4,096、depth=16、JSON.stringify 后 UTF-8 bytes=65,536；action.md、proof 文件及 Archive diagnostics 预算保持。

节点计数仍含根、对象/数组容器和所有值，不计 object key；深度仍以根为 0。有界深度优先 DFS：访问值先检查 depth，再递增/检查 nodes，超过即停止；完整 JSON-compatible 遍历后再核对序列化 bytes。多个维度冲突时按这一固定执行顺序报告第一个超限；已发现的非 JSON-compatible/schema 错误保持原错误，不被容量诊断遮蔽；预算提前停止无需遍历未访问部分证明全部 schema 合法，容量拒绝也不声明整个 payload 已通过 schema。提前停止的计数只能报 lower-bound，完整测量才报 exact。

固定 finish 输入预算失败保留 `invalid-request`，增加 `error.budget`；subject 为 `result-facts`，dimension 对应失败维度。生成 candidateGit 后预算失败保留 `result-admission-rejected`、已有 Action error 的 effect/runId，增加同形状 budget。两处均报告安全 message，不复制 facts。最终 merged facts 在 context/result 首写之前完成检查，失败保留 action.md 和 proof，不产生 machine partial；真实修正可用同 descriptor 继续。

CLI envelope 64 KiB 检查先于 facts validator；若 caller 的整个请求已超限，报告 request bytes，而不是保证一定到达 result-facts 诊断。未传 candidateGit 的正常请求可能经生成后才达到 facts byte 上限，必须覆盖该实际路径，不能只测 caller 提交 map。

成功 writer/readback、Review/Archive/correction 的相关 Result 消费共享同一新 node validator；不回填/重签历史。选择 4,096 是覆盖已证明 1,856/1,967 节点候选的固定有界调整，不承诺任意 ≤64 KiB facts 都接受。不外置 candidateGit 或删减 proofRefs/hash 身份来凑预算。

### D05：合同、HOW 与验证保持一套边界

七个既有 capability 的 delta 与 E01–E04 对应，见 proposal；主规格及历史归档本阶段不变。未改的 Git authorization/candidate/raw→blob/index/commit/remote 校验继续由原 capability 管理。

Apply 的决定性证据：分级输入边界；六个 FAIL 经 start/inspect/finish/独立查询的 correction 链；fresh first ordinal=1 和历史反例；生成 candidateGit 的 budget/write ordering。回归 fixture 独立构造所需有效 target/候选，不导入 Explore 探针、不把历史 observations 作为产品验收依赖。安装回归使用隔离打包候选，不能替换正在管理仓库的 manager。unit/CLI、type/build、相关 quality 和 package readback 是实现验证，不是自动 Review/Full Test/Final/Git 权限。

## Risks / Trade-offs

- [fresh 缺失历史被误认为全新] → 要求全部上述输入可判定；未知/partial/orphan 继续拒绝，不能只测 ordinals 集合为空。
- [裸 READY/同名结构 helper 被用于 PASS retry] → Policy 和所有 entry 消费绑定失败 pair/Owner，测试旁路和三个 revise 自身失败。
- [提高 node budget 被误解为提高 bytes] → 两层输入/facts 额度分开测试；未传 candidateGit 的生成后超限必须无 machine 写入。
- [诊断遗漏或泄漏请求内容] → budget 字段封闭、安全数值、精确/下界区分，文件和 stdin 同样输出；不序列化 cause/payload。
- [更新 Guidance 影响未完成 descriptor] → 保留原匹配 manager 继续旧 Run；候选验证使用隔离安装，更新本地 manager 留在独立授权边界。
- [检查与写入间输入改变] → 重读相关现有事实和 manifest bytes；保持单写者/create-once，不以本 Change 增加并发恢复协议。

## Migration Plan

先批准规划，再实现目标代码/Guidance/tests并验证隔离安装。无数据迁移、历史补写或编号重置；旧完整 FAIL 可以在新合同下由明确 Owner 授权创建新修订，原件保持。旧 descriptor 使用匹配 Guidance 的兼容 manager，不迁移未完成 Run。

Archive、checkpoint/push 和正式更新本地 manager 均在后续独立授权边界执行；本阶段没有部署或安装动作。
