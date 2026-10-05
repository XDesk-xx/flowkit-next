# author-action-guidance Specification

## Purpose

为 Flowkit 的七个 Author Standard Actions 建立稳定、Action-aligned、content-bound 的 canonical product HOW，并在不改变 Core lifecycle/authority 的前提下收敛 revise、Mechanical Preflight、archive naming、handoff 与 STOP discipline。

## Requirements

### Requirement: Every Author Standard Action has exactly one canonical product Guidance entry
Repository SHALL provide exactly one canonical product Guidance entry for each Author-owned Standard Action: `explore`、`revise-explore`、`propose`、`revise-propose`、`apply`、`revise-apply` 与 `archive`，其 canonical path SHALL be `skills/actions/<actionId>/SKILL.md`. Proof/convergence/preflight/handoff/archive-ordinal SHALL remain internal methods or disciplines and SHALL NOT become additional top-level Action Guidance identities.

#### Scenario: Seven Author entries are complete
- **WHEN** repository Author Action Guidance coverage is inspected
- **THEN** all seven Author Standard Actions SHALL each have their own canonical `skills/actions/<actionId>/SKILL.md`, with no extra Author top-level identity for an internal method or phase

#### Scenario: Canonical Author Guidance remains Action-aligned
- **WHEN** exact current Action is `revise-propose`
- **THEN** the product Author HOW SHALL be owned by `skills/actions/revise-propose/SKILL.md` rather than by a method-named or shared top-level Skill

### Requirement: Canonical Author SKILL.md is identity-complete for Flowkit-specific normative HOW
Each canonical Author `SKILL.md` SHALL itself contain the Flowkit-specific normative HOW whose change is intended to change that Action's product Guidance identity under the existing single-file `GuidanceRef` contract. It SHALL NOT require a project-owned transitive normative Guidance graph whose bytes can change while the canonical `SKILL.md` content identity remains unchanged. Vendor/tool mechanics MAY be referenced as subordinate mechanics only when they do not become an alternate Flowkit Action Guidance authority.

#### Scenario: Normative Author behavior changes alter canonical Guidance bytes
- **WHEN** a Flowkit-specific normative rule for an Author Action is changed
- **THEN** the corresponding canonical `skills/actions/<actionId>/SKILL.md` SHALL change so the existing content-bound Guidance identity reflects that change

#### Scenario: OpenSpec mechanics remain subordinate
- **WHEN** an Author Action needs OpenSpec explore/propose/apply/archive mechanics
- **THEN** canonical Author Guidance MAY direct use of the applicable OpenSpec mechanics while retaining Flowkit-specific scope, authority, handoff and STOP rules in the canonical Action entry

### Requirement: Author Guidance preserves bounded Action-specific execution discipline
Canonical Author Guidance SHALL preserve the already-decided Action boundary and SHALL NOT decide next Action, Role, Owner authority, Reviewer verdict, Verification truth or archive legality. `explore` SHALL be proof-first and Proposal-bounded; `propose` SHALL preserve approved Explore and create planning artifacts only; `apply` SHALL implement the exact approved Proposal with minimum mutation and relevant preflight; each `revise-*` SHALL converge exact Reviewer findings without unrelated redesign. When Flowkit supplies exact current Action `archive`, canonical `archive` Guidance SHALL execute only that already-authorized archive boundary, perform canonical OpenSpec convergence and required continuity/completion materialization, and STOP without hidden next-Action execution. Guidance SHALL NOT require a pre-existing `completed` Change state; `completed` is a post-archive materialization fact owned by the existing lifecycle/coordination contract.

#### Scenario: Propose does not enter implementation
- **WHEN** canonical `propose` completes the required Proposal artifacts from an approved Explore
- **THEN** it SHALL STOP at `review-propose` and SHALL NOT begin Apply in the same Action

#### Scenario: Revise remains findings-bounded
- **WHEN** canonical `revise-apply` receives exact Reviewer findings
- **THEN** it SHALL change only findings-relevant scope, preserve already-approved content, rerun only newly relevant proof/checks, and STOP at `review-apply`

#### Scenario: Archive executes only the already-authorized boundary and has no hidden continuation
- **WHEN** Flowkit supplies exact current Action `archive` for an active Change after the existing lifecycle/Policy has made that Action legal
- **THEN** canonical `archive` Guidance SHALL perform the authorized archive convergence and required completion/continuity materialization, SHALL NOT require the Change to already be `completed`, and SHALL STOP without activating or executing the next Change

### Requirement: Mechanical Preflight is internal to apply and revise-apply and reuses existing quality facts
Canonical `apply` and `revise-apply` SHALL include Mechanical Preflight as an internal Author HOW phase that reuses applicable D02 Lightweight Gate, Structural Dependency Health, Repository Entropy Hygiene and Applicable Check facts plus directly relevant artifact/spec/task/handoff/diff checks. Preflight SHALL NOT become a Standard Action, lifecycle stage, Reviewer, Verification authority or independent quality platform.

#### Scenario: Apply performs only relevant preflight
- **WHEN** an Apply candidate is ready for Reviewer handoff
- **THEN** Author Guidance SHALL obtain or reuse the minimum relevant mechanical facts needed for that exact candidate and SHALL NOT mechanically rerun unrelated Full Test scope

#### Scenario: Preflight cannot approve semantics
- **WHEN** all mechanical preflight checks pass
- **THEN** that PASS SHALL NOT substitute for Reviewer verdict, Verification truth or next-boundary authority

### Requirement: Project Change ordinal is a durable sequence fact assigned only when a Change first actually enters Explore

`semantic ChangeId` SHALL remain the canonical Change identity. A Change that actually enters Explore SHALL have exactly one durable `projectOrdinal` project-wide monotonic sequence / archive-naming fact persisted on its exact Delivery Change coordination entry. For product-managed execution, canonical `skills/actions/explore/SKILL.md` SHALL own the assignment/persistence HOW only after Flowkit/Owner has already made exact Explore current/legal. During D03/D04 independent self-development, existing `.agents/skills/explore-proof-based/SKILL.md` SHALL independently own the same bootstrap assignment/persistence HOW and SHALL NOT consume candidate `skills/actions/explore/SKILL.md`. A planned-only Change SHALL NOT reserve or carry a `projectOrdinal`. Once assigned, `projectOrdinal` SHALL remain stable through review/propose/apply/archive and SHALL remain consumed if that explored Change is later cancelled. The number SHALL NOT become Policy authority, Owner authority, Action identity, Run identity, `changeStartSequence`, ActionPackage identity or a replacement Change identity.

无基线自动首值 1 的 fresh 例外 SHALL 仅用于 canonical product-managed first Explore；独立 bootstrap SHALL 保留原无基线的 bounded Owner 决定与自身记录格式，不套用 canonical descriptor predicate。已赋值复用/max+1/唯一性/取消消费纪律保持共同适用。

Ordinal derivation SHALL 首先校验所有相关 Delivery manifests 的 assigned 值为全项目唯一的正安全整数；当前已赋值 SHALL 复用，已有其他值 SHALL 取 max+1，溢出 SHALL 拒绝。仅当无任何 assigned 值时，首值 1 SHALL 要求以下 fresh predicate 全部成立：regular/unlinked/readable 的已初始化 runtimeFamily=new project 与有效 projectId；全部 Delivery YAML 名称/id/entries 有效，当前 entry 有可信 active activation provenance，其他 entries 均 planned 且无 ordinal；唯一 OpenSpec active 为当前 Change；start 前无任何 Run，continuation 仅有当前 exact first Explore 的有效 descriptor、previousRunId=null、无 context/result、原 root/Guidance/target/Run 一致；Change-scoped artifacts 无先前或 orphan 材料，continuation 仅允许当前已验证 Run 的 proof；archive 根 absent 或可判定为空。未知、linked、unreadable、malformed、bootstrap、partial、其他 occurrence/active/cancelled/completed 或历史 archive SHALL 阻断无基线分支，不将 absence 单独当 fresh 证明。

fresh 判定 SHALL 只影响首次 Explore readiness，不在 Init/Start/Activate/只读查询中写 ordinal。canonical descriptor 成功后产品 Explore HOW SHALL 重读上述事实和 manifest bytes、确认无漂移后仅在 exact current entry 持久化一次；已有 ordinal SHALL 不改写。新 terminal Explore PASS 的 finish SHALL 校验持久值有效、唯一且与 Result 相同；真实 FAIL/null 和合法非终态 SHALL 保持原接纳规则，不因尚未编号而禁止记录失败。Delivery-level Full Test、Memo、临时文件 SHALL NOT 作为 Change ordinal 消费记录；无基线但有历史 SHALL 继续要求 bounded Owner bootstrap，不创建 seed/计数器/预留锁，不迁移历史。

#### Scenario: First actual Explore owns ordinal materialization without deciding legality

- **WHEN** Flowkit/Owner has already made an exact Change's `explore` Action current/legal and that exact Change has no `projectOrdinal`
- **THEN** the applicable product or independent bootstrap Explore HOW SHALL derive the next project-wide ordinal from valid durable assigned facts and persist it exactly once on the exact Change coordination entry; only product-managed execution SHALL use 1 after the closed fresh-project predicate above succeeds, while independent bootstrap without a baseline SHALL retain its bounded Owner decision boundary; assignment SHALL NOT create activation or legality authority

#### Scenario: Bootstrap Explore remains independent from product candidate

- **WHEN** flowkit-next itself performs D03/D04 Explore through the independent `.agents` development plane
- **THEN** `.agents/skills/explore-proof-based/SKILL.md` SHALL perform the same projectOrdinal assignment/persistence discipline without reading or executing `skills/actions/explore/SKILL.md`

#### Scenario: Planned-only Change does not reserve a number

- **WHEN** an exact Delivery Change remains `planned` and has never actually entered Explore
- **THEN** its coordination entry SHALL have no `projectOrdinal`, and the next numeric value SHALL remain unassigned until an actual Explore materializes it

#### Scenario: Current explored Change preserves its assigned number

- **WHEN** an exact Change has already entered Explore and its coordination entry records a valid assigned `projectOrdinal`
- **THEN** every later Action for that exact Change SHALL preserve that ordinal unchanged without substituting Run sequence, `changeStartSequence` or physical group prefix

#### Scenario: Explored then cancelled Change keeps the gap

- **WHEN** a Change was assigned `projectOrdinal: 8` after actually entering Explore and is later cancelled
- **THEN** `008` SHALL remain consumed and SHALL NOT be compacted or reused by a later Change

#### Scenario: Assign one on a verified fresh first Explore

- **WHEN** 完整 fresh predicate 成立且 exact first Explore 已合法建立 descriptor
- **THEN** 产品 Explore HOW SHALL 重读后仅写当前 entry projectOrdinal=1，不从 Run sequence 推导编号

#### Scenario: Continue the current first Explore descriptor

- **WHEN** 无 assigned baseline，只有当前已验证 first Explore descriptor 和归属正确当前 proof
- **THEN** fresh predicate SHALL 允许该 continuation，不把它当既往消费；HOW/finish SHALL 核对真实持久值

#### Scenario: Reject missing ordinal history instead of reseeding

- **WHEN** 无 assigned baseline 但存在 complete/partial/bootstrap Run、orphan proof、未知/归档 entry 或非 planned 其他 entry
- **THEN** 系统 SHALL 拒绝自动首值 1，不修复/删除历史，不以目录空缺消除已发现历史

#### Scenario: Reject malformed or drifting ordinal inputs

- **WHEN** assigned 值重复/非法/溢出，或 HOW 写前发现 manifest/eligibility 漂移
- **THEN** 系统 SHALL 拒绝，不重新编号，不创建第二份 ordinal truth

#### Scenario: Use an existing valid baseline without a fresh-project gate

- **WHEN** 项目有合法唯一 assigned baseline，当前无编号
- **THEN** HOW SHALL 按原 max+1 规则分配，不要求已使用项目满足 fresh predicate

#### Scenario: Keep bootstrap initialization outside the product fresh exception

- **WHEN** 独立 bootstrap 无已赋值基线，且自身已有 action.md/context.json 开始记录
- **THEN** bootstrap HOW SHALL 保留原明确 bounded Owner 决定边界，不调用产品 predicate/Guidance、不删除 context.json 冒充 canonical descriptor-only，也不声称自动获得首值 1

### Requirement: Archive Guidance consumes the persisted project ordinal and never allocates or recomputes it
When Flowkit supplies exact current Action `archive`, canonical Author `archive` SHALL require the exact current Change coordination entry to already contain a valid assigned `projectOrdinal`, and SHALL materialize `YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>`. Archive HOW SHALL NOT allocate a new ordinal or derive one from Delivery manifest array position, Run sequence, `changeStartSequence`, external Run-group prefix, completed-Change count, archive-directory count or any other archive-time count. Missing, malformed or inconsistent ordinal/handoff facts SHALL STOP archive before target materialization.

#### Scenario: Current Change archives with project ordinal 021
- **WHEN** exact current Change `converge-author-action-guidance` reaches authorized archive with persisted `projectOrdinal: 21`
- **THEN** archive target SHALL be `YYYY-MM-DD-021-converge-author-action-guidance` using the actual archive date

#### Scenario: Run numbering cannot replace project Change numbering
- **WHEN** the exact Change has `projectOrdinal: 21`, canonical `changeStartSequence: 14`, and the current archive Run has another Run sequence
- **THEN** archive naming SHALL use `021` and SHALL NOT substitute `014` or the current Run sequence

#### Scenario: Missing persisted ordinal stops archive
- **WHEN** exact current archive Action resolves a Change coordination entry without a valid assigned `projectOrdinal`
- **THEN** Author archive HOW SHALL STOP and SHALL NOT infer or allocate the missing number

### Requirement: Stable Core self-development keeps independent bootstrap ordinal parity without product self-hosting
During D03/D04 Stable Core development, flowkit-next self-development SHALL continue to use independent `.agents/skills/**` bootstrap HOW rather than candidate `skills/actions/**`. Existing `.agents/skills/explore-proof-based/SKILL.md` SHALL own first-actual-Explore projectOrdinal assignment/persistence for the bootstrap plane, and repository SHALL provide one minimal project-owned bootstrap archive wrapper/composition at `.agents/skills/archive/SKILL.md` that consumes the same persisted projectOrdinal and reuses existing OpenSpec archive mechanics. Neither bootstrap path SHALL consume or execute candidate `skills/actions/explore/SKILL.md` or `skills/actions/archive/SKILL.md`, and repository SHALL NOT create additional `.agents` wrappers solely for product symmetry.

#### Scenario: Bootstrap archive uses Flowkit ordinal without consuming product candidate
- **WHEN** flowkit-next archives a D03/D04 Change through the independent `.agents` development plane
- **THEN** `.agents/skills/archive/SKILL.md` SHALL consume the exact Change's persisted projectOrdinal and reuse subordinate OpenSpec archive mechanics without executing `skills/actions/archive/SKILL.md`

#### Scenario: Existing bootstrap Explore HOW is updated in place rather than wrapped again
- **WHEN** first-Explore projectOrdinal assignment requires D03/D04 bootstrap parity
- **THEN** Change 2 SHALL update existing `.agents/skills/explore-proof-based/SKILL.md` in place and SHALL NOT create another top-level Explore wrapper merely to mirror product Guidance

### Requirement: Author canonical artifacts converge to current material truth while Run provenance remains bounded and concise
Canonical Author Guidance SHALL treat OpenSpec Change artifacts as the current converged representation of material proof, decisions, trade-offs and rationale. During `revise-explore` and `revise-propose`, superseded claims SHALL be replaced or removed in place rather than retained merely to narrate prior Reviewer/Owner correction chronology. Evidence, failed proof or counterexamples that still materially explain the current invariant MAY remain, but SHALL be expressed as current rationale rather than as a revision diary. Execution/review chronology needed for durable Action continuation SHALL remain on the existing `.flowkit/runs` surface only at the bounded level required by the existing Run contract and Guidance: concise Action/finding/revision facts, bounded reasoning, and exact references when material. Canonical artifacts SHALL NOT duplicate that chronology. This requirement SHALL NOT require exhaustive Reviewer discussion, full proof transcripts, or revision diaries to be copied into Run prose. Git SHALL retain exact repository evolution. Canonical artifacts MAY use concise exact Run/finding references when deeper provenance is useful.

#### Scenario: Revise Explore replaces a superseded conclusion in place
- **WHEN** an exact Reviewer finding invalidates a current Explore claim and the revision chronology is already represented by the corresponding Runs
- **THEN** `revise-explore` SHALL replace or remove that superseded claim in the canonical Explore, preserve unaffected current proof, and SHALL NOT append a correction-history section merely because the revision occurred

#### Scenario: Material counterexample remains as current rationale
- **WHEN** a failed hypothesis or historical counterexample is still necessary to explain why the current invariant is required
- **THEN** the canonical artifact MAY retain that evidence as current proof/rationale without preserving the surrounding execution chronology that produced the correction

#### Scenario: Current design rationale remains understandable and provenance remains traceable
- **WHEN** a current design decision was materially shaped by a prior Reviewer finding
- **THEN** the canonical artifact SHALL retain enough current rationale to explain why the decision exists and MAY reference the exact finding/Run for deeper provenance, while the bounded Reviewer finding/revision facts and references remain on the existing Run surface

#### Scenario: Propose and Design do not become a second Explore transcript
- **WHEN** approved Explore proof is converged into Proposal/Design artifacts
- **THEN** those artifacts SHALL contain only the current scope, requirements, implementation-relevant decisions and trade-offs they own, and SHALL reference rather than duplicate Explore proof or revision chronology by default

#### Scenario: Artifact size is diagnostic rather than correctness authority
- **WHEN** an Explore, Proposal or Design artifact is unusually large
- **THEN** Author/Reviewer Guidance MAY use size or line count as a signal to inspect duplication or superseded chronology, but SHALL NOT treat a fixed byte/line threshold as a correctness Gate

### Requirement: Archive preparation performs real package-bound readiness before archive mutation
当前product/bootstrap Archive HOW SHALL 将package-bound preparation限定为Flowkit自有admission：active、唯一Policy/Role、可信Review与未漂移候选、ordinal/identity、Guidance及记录完整性。有效普通archive不要求第二次Owner授权，也不要求预存completed。HOW SHALL 先保存started Run，再调用真实受控OpenSpec archive并如实记录结果；不得先运行隔离convergence、项目checks、仓库/依赖快照或shim解析来避免真实失败。

安全失败 SHALL terminal保存FAIL；同候选可在外部条件修复后经新明确调用创建新Archive Run。需要修改已审内容时 SHALL 请求既有Owner revise-propose/revise-apply并重新独立Review，不引入revise-archive。partial/unknown SHALL inspect和交接恢复，不盲重试、删Run或补成功。

#### Scenario: Archive readiness passes without a second Owner archive authorization
- **WHEN** approved review-apply绑定exact候选且Policy使archive合法
- **THEN** HOW SHALL 完成轻量admission后开始Run，不要求额外Owner archive审批

#### Scenario: Correction-requiring blocker stops before archive mutation
- **WHEN** admission发现已审候选漂移，或真实archive安全失败后发现需要修改候选
- **THEN** HOW SHALL 停止直接归档，区分尚未开始与已记录失败；经Owner修订和fresh review-apply后才再次archive

#### Scenario: Environment-only blocker can retry the same candidate
- **WHEN** 真实Archive已安全失败且候选未变，外部条件已修复
- **THEN** HOW SHALL 保存原terminal FAIL，并在新明确调用下创建新Archive Run，不覆盖失败或重复同Run原生执行

### Requirement: Continuation handoff preserves all materially required uncommitted state
Author product/bootstrap handoff HOW SHALL ensure that continuation can reconstruct the exact materially required uncommitted candidate state, not merely the latest delta. The handoff MAY use one cumulative package or exact retrievable ancestor payload references; when deletions are material, it SHALL carry exact removal information. It SHALL NOT require copying every historical Run/proof transcript or introduce a payload registry, continuation database, background sync or second lifecycle.

#### Scenario: Latest delta depends on an uncommitted ancestor
- **WHEN** the next session needs bytes introduced by an earlier uncommitted Action in addition to the latest delta
- **THEN** handoff SHALL carry those materially required bytes cumulatively or provide exact retrievable ancestor references sufficient to reconstruct the exact candidate

#### Scenario: Deletion survives continuation reconstruction
- **WHEN** a materially required handoff includes deletion of a previously present tracked path
- **THEN** the handoff SHALL carry exact removal information sufficient to prevent the deleted path from reappearing during reconstruction

### Requirement: Proof-based Explore classifies concept ownership and mutation ordering proportionally
Canonical product Explore HOW and the independent D03/D04 proof-based Explore bootstrap HOW SHALL, when a proposed new concept/mechanism is material, first classify whether the need is already owned by an existing capability/entity, operation, state, configuration, validation/proof mechanic or Guidance/HOW before proposing a new capability. When state or mutation ordering is material, Explore SHALL identify validation and commit points and SHALL prove failure-before-commit versus failure-after-commit consequences, including retry/rollback/correction legality. These checks SHALL remain proportional and SHALL NOT be performed as ceremony when neither concept ownership nor mutation ordering can affect the contract.

#### Scenario: Existing mechanism prevents a redundant new concept
- **WHEN** Explore proposes a new named mechanism but proof shows the required behavior is already owned by an existing operation/state/HOW boundary
- **THEN** Explore SHALL prefer the existing mechanism and SHALL NOT promote the new name into a product capability without independent proof

#### Scenario: Mutation ordering determines correction legality
- **WHEN** a design can fail either before or after committing a material state mutation and that ordering changes recovery/correction legality
- **THEN** Explore SHALL identify the commit point and prove both failure consequences before converging Proposal direction

#### Scenario: Simple non-mutating work remains simple
- **WHEN** a Change introduces no material new mechanism and no state/mutation ordering risk
- **THEN** Explore SHALL NOT invent concept-ownership or transaction analysis merely to satisfy a checklist

### Requirement: Author HOW separates candidate bytes correction from metadata completion and observed recovery
Author HOW SHALL 在形成候选时保留实际raw identity，并使用fixed finish只读生成/核对包含相关stage-0 indexBasis的受支持Git projection；不能把正常CRLF→LF差异统一当成内容错误，也不能把已有CRLF索引下合法的auto identity误改成LF预期。无索引hash结果不能单独证明普通staging语义。不能为了checkpoint强制所有文件改LF、自动renormalize或用真实/临时add预测。项目格式规则仍在Author编辑和适用验证时遵守；实际raw、有效规则或非预期索引输入变化不能默默继承旧绑定，EOL存储支持不扩大Verification PASS复用。

HOW SHALL 区分 clean/EOL 内容与普通 add 的最终 index。raw 等于原 index blob 而 clean 不同时 SHALL 在保存成功候选前明确 unsupported；仅 stat 变化的对照仍拒绝，不指示自动 touch、refresh、renormalize、改配置或 stage 后重绑。该窄支持限制不提供自动迁移，不增加持久 stat 记录；已核实预期输出与 absent 对照按既有支持合同核对。

纯缺字段且有原证据的terminal补齐 SHALL 走Owner明确授权action correct；无原candidate proof、内容变化或下游冲突走真实revise/review，不改原Run，也不借correction为旧结果追认candidateGit。Archive SHALL 使用真实执行及诊断合同；same-Run仅在descriptor-only且已证实剩余步骤时继续，安全terminal FAIL用新Run，partial明确阻断。HOW SHALL 使用同安装fixed命令，不动态导入内部callback、不自造PASS、不自动retry/next/Git。

#### Scenario: Author corrects source formatting before declaring candidate identity
- **WHEN** 本次文件违反项目格式要求或其实际内容/属性发生变化
- **THEN** Author SHALL 在编辑/验证阶段形成真实新候选并独立审查，不追改历史hash；合法Git EOL存储差异本身不触发该修订

#### Scenario: Author preserves a supported indexed CRLF candidate
- **WHEN** 原index含非binary CRLF且自动文本规则保留修改后raw，或正常暂存已经形成绑定的预期输出
- **THEN** HOW SHALL 使用fixed只读校验保存或消费相应identity及indexBasis，不要求仅为无索引hash差异改文件、改索引或重做业务；不可解释状态在成功候选前明确停止

#### Scenario: Archive continuation starts with actual effect observation
- **WHEN** 已开始Archive遇unknown/incomplete
- **THEN** Author SHALL 先inspect实际效果，只有可证descriptor-only剩余步骤才同Run继续；terminal安全FAIL用新Run，partial不能用替代Run掩盖

#### Scenario: Author does not repair an unsupported prediction by touching files
- **WHEN** raw 与旧 CRLF index 相同而属性变化令 clean 为 LF，普通 add 存在 cache 跳过分支
- **THEN** HOW SHALL 报告具体路径和支持边界并停止成功候选接纳，不自动触碰时间戳或伪造稳定 LF 预期
