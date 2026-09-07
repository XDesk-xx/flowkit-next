## Context

动机及影响见 [proposal.md](proposal.md)。本设计承接 approved Explore 4–6 节和 `069-review-explore`，只落实一个内容连续性合同。当前源码中候选 reader 与 check 排序已有窄接缝；Start 仅接收 surface validated，Final 只列 completed Change IDs，Integration 只支持新建一次 commit 并比完整 tree。这些位置一起修正，不能仅更换 hash helper。

设计条件已满足：跨多个直接消费者、包含 closed schema/projection 变更与兼容性边界，因此不跳过 design。本文是实现选择，不是执行证明。

## Goals / Non-Goals

目标：一种有效材料记录，两个读取入口；在既有 Start/Final/Integration owner 内补足完成事实、具体操作与必要证据，保持可独立验收。

设计边界：不提供通用 evidence API/Registry、算法版本选择器或新的 lifecycle；外部真实来源由已有可信 host/Verification/Reviewer 执行方提供，本 Change 增加窄的依赖读取与校验接缝，不实现下一 Delivery 的跨会话持久化 host。不以 self-signed JSON 或任意 callback 返回 true 代替来源。

## Decisions

### D1. 两个 reader 复用同一材料编码

从 `src/internal/applicable-check-candidate.ts` 抽出 record/hash 与 Git 原始读取的窄 helper，保留公开 applicable-check 派生接口。object reader 仅接受 trusted root 与已解析 exact SHA-1 commit；先用 Git 确认 object format 和 commit 类型，再用 NUL 分隔路径及 Buffer 读取 blob。不把 `.trim()` 文本 observation helper 扩充成 blob reader。

共享 record 固定为 `{path, kind, mode, materialRef}`，kind 为 regular/symlink，mode 保留 Git 可见有效值，materialRef 取 bytes SHA-256。候选域固定 `flowkit-applicable-check-candidate-v2`；check 域固定 `flowkit-applicable-check-v2`；都保持 `domain + 0x00 + JSON.stringify(固定投影)`。check 投影顺序为 checkId、program、args、configRefs、toolRefs、environmentRefs。

无序排序只使用 `Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"))` 的窄 comparator。candidate path、refs、Action check 派生/校验都复用它；Action 检查按 checkId 再 checkRef，显式 Full Test 顺序与 argv 不排序。不要新增泛化 canonical-JSON 框架。

取舍：两套独立 reader/hash 容易产生不同候选；只把 `localeCompare` 换成 JS 默认 sort 仍不满足非 BMP UTF-8 顺序。新 domain 即使在 ASCII 排列未变时也隔离旧 PASS；不要在生产保留 v1 回退。

### D2. 缺席是可验证事实，Memo 隔离是 exact path 规则

worktree reader 在完整 index/非忽略 untracked 枚举和 mode 观察后读取材料；用 read 前后 lstat/fstat 与枚举/index 可见性重验检查可检测变化。稳定 ENOENT 且同一观察中可确认路径缺席时不发 record；权限错误、类型替换、unmerged、unsupported mode、无法确认的变化直接失败。不采用“任何 null/error 都过滤掉”的 Explore 原型机制，不声称无文件系统快照也能抵抗任意并发对手。

读取 `.flowkit/memos.json` 时先验证边界/regular 类型，再隔离其内容；object reader 对同名目录/链接也拒绝。不要把 `.flowkit/memos.json/child` 当成被隔离文件。合法缺席只影响 collection 语义，Memo-consuming checks 仍使用显式 presence/content 材料；Memo schema 不复制到 candidate reader。

取舍：排除整个 `.flowkit` 会漏掉项目身份等产品材料；让候选 reader 解析完整 Memo schema 会制造第二 owner。Git clean 检查继续独立，Memo-only dirty 不自动提交或强制无关产品检查。

### D3. Start 从实际输出形成内容完成记录

保持 preparation 的 exact acceptedBaseCommit、planningReference、Owner scope 和 clean-start；在调用 materialization 前重验同一 package，并给 Agent defensive copy。post-validation 不再仅接受 `{status:"validated"}`。

新增的 terminal `contentCompletion` 固定为 `{projectId, deliveryId, acceptedBaseCommit, planningReference, outputs, candidateRef, validation}`。outputs 为四槽有序数组：manifest、Current、Planned、Current→Planned compare，每项 `{artifact, contentSha256, bytes}`；路径由 Delivery/static owner 决定，hash/bytes 来自实际 readback，不接受 Agent 选择路径。planningReference 保持已有 artifact/contentSha256 形状。validation 固定为 `{sourceRef, artifacts}`，artifacts 为可信执行方保存的完整要求检查/receipt 材料 `{artifact, contentSha256, bytes}`，按 UTF-8 artifact 排序；sourceRef 来自本次可信验证执行，不允许裸 validated 或自填 PASS。

host 验证 validation 的项目/Delivery、exact accepted base/planning、四槽输出和实际工具/检查输入；重读输出、确认无未授权产品变动、推导 v2 candidate 后形成内容记录。需要跨会话取回时仍由真实来源 owner 负责；本 Change 不实现新的证据保存服务。后续准备消费整个已核验记录，不只拿其中的 candidateRef。

未请求 checkpoint：返回 terminal、contentCompletion、fixedPointCommit=null，Git callback 不调用。明确要求 checkpoint：保留已有独立 commit authority 检查；mutation 前重验 package/当前内容，由 Git 观察真实 SHA、唯一普通 parent/count、clean poststate、共享内容连续性。失败就不报告 checkpoint 成功；可能已形成的 contentCompletion 仅作为实际效果交接，不新建 resumed state、不自动再提交。

取舍：只改 stopped-before-commit 名称没有解决输出来源；强制一个新 SHA 则继续把 Git 操作当产品完成身份。contentCompletion 没有单独 registry/ref lifecycle，其事实随既有 outcome 交接。

### D4. 必要证据覆盖由 Final 的既有前置关系决定

`requiredEvidence` 的固定字段和顺序见 [Final delta](specs/delivery-finalization/spec.md)。它是嵌在现有 Final operationFacts 内的有限材料快照，不单独落库、生成 evidenceId 或维护全局索引。Integration 通过 Final ref 绑定并重验它，不复制出第二 durable truth。

可信 Final host 读取 canonical projectId、manifest 的 required Change 顺序，向既有已接受 Change/Run owner 取得每项确切 archive 和其已接受 review-apply。地址使用现有受控 RunAddress 推导，不能按最大目录号猜 current。按这些已绑定输入的 previous/input 链及现有完整性链接读取必要祖先；以该 Change 已验证的首次输入/接受来源为边界，拒绝链断裂、循环、歧义或 caller 截断。若链接合法指向被依赖的其他 Run，也必须携带其必要材料，不能以目录不同为理由省略；不扫描无关历史生成全集。

三文件原 bytes 都绑定 hash/长度；地址/身份、context/result linkage、role、terminal/accepted verdict 与实际 admission 来源分别验证。复用 `readDurableRun` 的既有结构验证，不把它的“可解析”当作可信 Reviewer verdict。archive/review anchors 来自已接受的真实执行 owner；结构上伪造且重新签 hash 的文件没有此来源，仍拒绝。完整性快照一旦绑定，结果 admission 与 Integration 不允许更换 anchors 或删减成员。

Full Test、Architecture 使用完整现有 outcome 和真实执行来源；有限输入接缝同时提供对应 owner 的实际材料读取，host 自己算 artifact hash/bytes。sourceRef 是原执行的取回引用，不是任意 URI/文件路径路由器。已有受信任执行方或已验证的独立 bootstrap 接入负责解析；未知来源、路径越界、重定向、取回失败均拒绝。Artifact locator 相对于该已绑定 source 的受控根解析，不直接作为任意 filesystem path 打开。

这没有宣称当前 D04 已具备外部 durable source：本 Change 的产品验收在受控 fixture 中用真实运行/持久化的 canonical Run 和真实检查输出证明接缝与拒绝行为；D04 自身闭合仍用独立 bootstrap 的真实记录，不迁移其格式。下一次真实 Full Test 前外部保存/取回 proof 另行完成，不能以 fixture PASS 替代。

取舍：只传 caller 列表可隐藏 B 的证据；要求完整 Git tree 不等又会误拒无关历史追加；新建 Evidence Platform 超出范围。有限前置快照覆盖本次真实依赖即可。

### D5. Final 与 Architecture 保持内容 lineage

Full Test 只使用新的共同 candidate/check identities；显式 ordered checks 和现有 authority 不变。Architecture 保持原六槽及 compare/closure projection，接入 v2 reader 和来源重验；读取后候选可因合法派生输出改变，不以三阶段相等代替因果链。

Final 将 requiredEvidence 追加到现有 operationFacts 的 completedRequiredChangeIds 之后，derive/closed validator/clone/consumer 一起更新；Final closure 的完整有序 projection 以 delta 为准，既有 domain 不改。旧缺字段 package/record 必须拒绝，不自动升级。写 coordination 仍只改既有 active/pending/pending → completed/passed/completed 窄字段，保持非目标 bytes、顺序及 presentation，新增证据留在既有 outcome，不加入 manifest 的通用证据表。

取舍：snapshot 已通过 Final ref content-bound，无需另加 evidence 摘要系统；只改变验证 helper 而漏掉 clone/projection/admission 会产生可伪造或无法续接的新 record。

### D6. Integration 分别核验具体 Git 操作和 accepted 内容

在现有 operationFacts 末尾追加 checkpointOperation，两个 closed variants 见 delta。可信 host 根据 Owner 原始操作决定形成它，并将 authority source 与 exact Delivery/target/prestate 一起保留；外部 caller/Agent 不能仅换 variant 利用同一 scope。复用分支不要求提供新建 commit callback。

create-new 保留单普通 commit 的 parent/count/clean 检查。reuse-existing 读取已授权 exact checkpoint 的 Git object 和来源，验证 v2 projection 与 finalizedCandidateRef 相同、当前工作树满足 clean 要求；不要求 checkpoint SHA 与 preIntegrationHead 不同，也不自动 checkout/reset。两条分支在 acceptance 前再次确认原 target prestate，任何同内容 drift 仍使旧 invocation 失败。

repository acceptance 仍由有界外部 mechanics 执行。host 从 Git 重读 target，并用既有可信 repository acceptance 来源核验这次操作与原 target 的关系；callback success/opaque auditRef 自身不够。具体操作若要求 topology 则核验；经 Owner 明确授权的其他历史形状可通过来源与内容验收，系统不自动选择或实现 provider/rebase 策略。

从 accepted exact object 运行共享 reader 比较 finalized 产品内容，并读取该 object 内必需 Run 三文件验证 Final snapshot；不能只验本地工作树。外部执行证据从已验证 source owner 取回。仍存在正确产品但 required Run 丢失、来源未知或 target mutation 非预期时，必须拒绝整个 acceptance。

Integration hash 采用 delta 指定的既有 flat projection，仅在 preIntegrationHead 后插入 checkpointOperation，derive/admission 同步更新；不凭 field-order 或一个裸 SHA 判定有效。nextDeliveryBase 仍为实读 accepted SHA，Stable manager checkpoint 身份不受替换。

### D7. 直接消费者与 gate 一次收敛

闭合传播路径：材料模型 → check/Full Test reuse → Start/Architecture/Final → Integration；每一步同时更新 exact types、validators、defensive clones、fixed projection 和真实 tests。不在产品中保留 Explore prototype。

修改当前 `skills/delivery/{start,full-test,architecture-finalization,final,repository-integration}/SKILL.md` 以及实际引用旧语义的直接 Guidance；它们是本次产品交付物，不是管理同一 D04 的 HOW。当前 D04 manifest 只修正仍作为当前要求的 scope/acceptance 中 mandatory Start checkpoint 表述；不得改写历史完成条目/Owner 授权，不提前写 Full Test/Final 状态。canonical spec 在正式授权同步边界更新，Apply 验收用 delta 及隔离投影核对，不能改写 archived Change。

维持 `src/**/*.ts` 650 行 gate（含空行/注释）。按 reader、材料编码、Start completion、Final prerequisite、Integration operation/acceptance 的实际职责拆分窄文件；不一次重排整个 domain，不以文件移出 gate 消除错误。每个 task 只交付本 Change 的对应合同和验收。

### D8. 阶段 Skill HOW 区分决定、实验与当前验收

Author 的阶段交接只携带会影响后续判断的相关 Owner 决定：使用 concise exact Run/Owner reference 及其当前作用域，必要时明确材料的处理授权与保留边界；不复制全部聊天，也不把 Owner 决定改写成新的 Runtime/Policy/Run schema。本 Change 已知的材料事实是：原始 Explore proof 移到 `.tmp` 且无需长期保留来自 Owner 明确授权，不是 Author 越权；该事实用于修正后续判断，不要求在 canonical Proposal 中长期保存原始实验文件。

阶段 HOW 明确区分三类材料：

1. **Explore 实验**：为当时未知项提供有界观察，可进入 `.tmp` 或在不再被当前合同依赖时移除；它本身既不是已接受决定，也不是当前实现 PASS。
2. **已接受决策依据**：由当前 canonical Explore/Proposal、相关 Owner 决定及已接受 Reviewer Run 组成，保留足以解释当前合同的结论、边界和 exact references；Propose 默认不复制或永久依赖全部原始 proof。
3. **当前实现验收证据**：Apply/Verification 针对当前候选 bytes 与 exact 输入产生的真实证据；历史 Explore proof 只能解释设计来源，不能替代、冒充或被复用为当前实现 PASS。

Reviewer 发现材料路径改变、原始 proof 不在旧位置或交接缺少授权背景时，先核对当前路径/bytes、相关 Run/Owner 决定和当前合同是否仍依赖该材料。`未收到授权说明` 不等于 `未授权`。只有能够指出 exact planning claim、缺失事实及其对合同 traceability、当前可验收性或必要复现边界的具体影响时才形成 blocking finding；否则记录为已核对事实或非阻断观察，不要求恢复无合同依赖的原始 proof。

上述语义分别收敛到独立 bootstrap `.agents/skills/{explore-proof-based,proposal-convergence,revise-propose,review-propose}/SKILL.md` 与 product `skills/actions/{explore,propose,revise-propose,review-propose}/SKILL.md`。两组文件各自在自身 bytes 中包含所需 HOW，不互相引用或执行；bootstrap/product 独立边界保持不变。现有 `author-action-guidance` 与 `reviewer-action-guidance` 已拥有相关 Action-aligned、handoff、proof/Verification 和 bounded finding 责任，因此这是既有能力内的 HOW 优化，不新增 delta capability/spec。

## Risks / Trade-offs

- [v2 全面失效旧 PASS] → 明确一次性算法切换，保留历史 bytes；新输入取得新的真实适用结果，不做隐式兼容。
- [文件系统不能提供全仓库原子快照] → 有界前后观察及已知漂移拒绝；不假装解决任意并发写入、不新增锁/WAL。
- [hash 自洽但缺少执行来源] → 由既有执行 owner 绑定 exact input/output 与来源，单独检查真实保存/取回；缺少来源就失败，fixture 不代替 D04 handoff。
- [证据链被截断或被扩成全部历史] → 从 canonical required Changes 和可信 anchors 出发，仅追随本次必要链接；遗漏/歧义 fail closed，无关追加不纳入。
- [commit 成功后 acceptance 失败] → 当前失败 STOP；保存实际 SHA，后续仅在新的合法复用调用中核验，不自动重复 commit。
- [target 已变而响应丢失] → 先只读核验 ref/content/acceptance 来源；无法证明就 STOP，不再 push/merge。
- [Architecture 部分写入 / Final rename 后 readback 失败] → 不产生成功 closure；保留原输入与实际效果，后续恢复接入留给下一 Delivery，不盲目重写或回滚用户数据。
- [计划内容过早声称完成] → tasks 全部未勾选；当前 Change 必需实现验收在 review-apply 前完成；独立 D04 Full Test/handoff 不混进当前 Action 或伪报成功。
- [材料位置或授权上下文不完整导致误判] → Author 交接保存 decision-relevant Owner 边界，Reviewer 先核对再按具体合同影响分类；不反向要求复制全部聊天或永久保存全部原始 proof。

## Migration Plan

1. 在既有 Change 内实现上述闭合修改，更新所有直接消费者及 golden vectors；不动历史 evidence，不增加 runtime 算法配置。
2. 完成 tasks 的本地/隔离 Linux 验证、native Windows 对应语义检查和 engineering gates，再交付 review-apply；受支持平台不能用 skip 代替失败证明。
3. 后续各阶段按独立合法边界审查、修订、归档和同步；本次不执行它们。若需撤回尚未接受的新实现，保持旧已接受 checkpoint 与历史 evidence，不自动 reset 或转换新旧 PASS。
4. D04 实际 Full Test 前建立 Owner 认可的外部证据保存/取回 proof，在最终候选重新验证，然后才分别考虑 Architecture/Final/Integration；本设计不提前授权这些操作。

## Open Questions

仅保留已被 Explore/Review 明确推迟的运行接入项：未来 D04 外部证据具体位置与接收端。它们必须在真实 Full Test 前由 Owner 与独立 Verification 确定并验证，缺失则阻止那个边界；不改变本 Change 的来源/完整性合同，不以猜测默认位置填充。当前实现所需材料算法、字段、覆盖、操作 variants 与验收义务无待选分支。
