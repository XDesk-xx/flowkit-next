## Context

见 `proposal.md` 与 approved `explore.md`。现有 product 已有 closed five-value `DeliveryOperationId`、content-bound `DeliveryGuidanceRef`、Start/Full Test/Architecture 三种 concrete package，以及 Full Test和Architecture terminal outcomes。`delivery-final` 仍被 package validator显式拒绝；现有 Architecture terminal还缺少 callback lineage isolation、exact thin-compare admission与post-materialization candidate。

Delivery Final 的输入跨越 Git-derived candidate、OpenSpec active-set observation、Delivery manifest coordination、Verification outcome 与 Architecture closure，但这些 owner 不应被复制成第二套 truth。D04 Apply 只实现/验证通用 contract；真实 D04 finalization 必须等待所有 Changes完成及新的Delivery-level Full Test/Architecture Finalization。

## Goals / Non-Goals

**Goals:**

- 在现有 envelope 上增加唯一的 `delivery-final` concrete facts/package，并使用现有 `OwnerAuthorityFact` 的 exact operation-specific eligibility。
- 让 trusted host从完整 canonical outcomes/bytes形成 prerequisite facts，而不是接受摘要 boolean、任意 path或standalone digest。
- 修正 Architecture callback alias与thin-compare admission，并用现有 candidate algorithm记录Architecture materialization后的repository state。
- 只关闭一个canonical Delivery manifest，返回compact content-bound lineage并STOP。

**Non-Goals:**

- Change 5 repository integration、commit/PR/merge/tag/accepted-main读取、ZIP/bundle/handoff。
- actual D04 Full Test、Architecture Finalization或Delivery Final execution。
- Registry/Router/Planner、generic manifest/schema/immutability/mutation/transaction framework、第二candidate/evidence/state system。
- OpenSpec mutating command executor、automatic correction/rerun/next operation、Delivery operations转为Standard Actions。

## Decisions

### 1. Add one closed Final facts variant to the existing package envelope

新增一个 operation-specific facts shape；具体命名遵循现有 `Delivery*OperationFacts` 风格，信息固定为：

```text
verifiedCandidateRef
fullTestExecutionRef
architectureFinalizationRef
architectureMaterializedCandidateRef
coordinationPrestateRef
  artifact
  contentSha256
  bytes
completedRequiredChangeIds
```

`architectureFinalizationRef` 使用 Decision 5 冻结的唯一 serialization content-bind完整trusted Architecture terminal material；它不是新candidate identity，也不替代六个output refs。`coordinationPrestateRef`只能指向`openspec/delivery-groups/<deliveryId>.yaml`。Required Change ids保持manifest顺序、必须non-empty/unique/exact matching，不使用`projectOrdinal`作为identity或counter。

Package validator增加第四个concrete union member。Final authority recognizer只接受：

```text
decision = finalize-delivery
deliveryId = package exact Delivery
changeId = absent
scope = [delivery-final]
```

`formDeliveryOperationPackage`继续clone facts/authority/Guidance后再admit；`delivery-repository-integration`仍fail closed。

**Why:** 现有envelope和boundary-specific authority recognition已经足够。Final只需要一组closed facts，而不是新package family或Owner authority type。

**Alternative rejected:** 把complete terminal objects直接塞进package。Preparation需要消费完整objects做验证，但package只需保留其content-bound closure identity与最小causal facts。

### 2. Preparation reads complete facts from their existing owners

新增operation-local Delivery Final preparation/host seam。Input只包含exact Delivery、exact Final authority、trusted Full Test terminal、trusted Architecture terminal与managed-tool execution context；不暴露candidate、Change list、output paths或coordination hash override。

Preparation按一个bounded path验证：

```text
validate terminal passed Full Test internally
↓
validate trusted Architecture terminal and exact Full Test linkage
↓
re-read six fixed Architecture outputs and exact compare semantics
↓
derive/recheck current candidate = architectureMaterializedCandidateRef
↓
read exact Delivery manifest regular file
↓
require delivery state active + fullTest/finalization pending
↓
require every required Change completed and ids unique
↓
observe managed OpenSpec active Change set = empty
↓
resolve exact Final Guidance
↓
form exact delivery-final package
```

复用/提取现有passed Full Test exact validator与OpenSpec `observeOpenSpecActiveChanges`；Delivery manifest解析/materialization保持operation-local，不把CLI `trusted-change-coordination`扩成generic manifest API。完整input只用于可信验证，package不复制OpenSpec document、manifest或check history。

**Why:** Git/OpenSpec/Verification/Architecture/manifest继续拥有各自事实，Final package只冻结已经验证的exact linkage。

### 3. Retain Architecture lineage outside callback-visible objects

Architecture invocation把prepared package作为host-retained immutable baseline；derived callback收到由closed former重新形成的第二份deep clone，或只读content projection。Correction、post-derivation prestate validation、materialization与terminal record一律引用retained package。

Focused negatives必须分别覆盖：

- callback改写Delivery、operation、verified candidate和Full Test execution后返回correction；
- callback改写identity后返回valid ready outputs；
- nested facts/object/array alias mutation。

Outcomes必须保留pre-callback trusted identity；若另有repository prestate drift则按既有correction path停止。

**Alternative rejected:** `Object.freeze` only。浅freeze不能阻止nested alias mutation，也不提供清晰的host-retained source边界。

### 4. Admit one exact canonical thin-compare shape

将`Current → Actual`与`Planned → Actual` validator收紧到approved Explore证明的existing nine-field form：

```text
schemaVersion, kind, deliveryId, pair,
left, right, classification, summary, presentation
```

- `left`/`right` exact fields为`ref`、`sha256`、`bytes`，并与pair-specific expected bytes一致；
- `classification` exactly为ordered unique `["semantic", "presentation"]`；
- `summary` exactly含`semantic`与`presentation`两个non-empty string；
- `presentation`只允许以下十个exact fields及values（下列顺序只冻结host重建projection，不要求caller property order）：

```json
{
  "mode": "side-by-side",
  "renderer": "flowkit-reference-side-by-side",
  "leftPosition": "before",
  "rightPosition": "after",
  "equalFrame": true,
  "interactive": true,
  "overlay": false,
  "deltaColumn": false,
  "artifactPolicy": "disposable-html-not-retained-in-git",
  "resolution": "resolve-left-right-ref-to-architecture-render"
}
```

- validator按field set与value admission，不依赖input object property order；缺失、extra或任一changed value均拒绝；
- 任意extra field、embedded Architecture/product payload、unknown/duplicate classification、nested/mismatched summary或malformed presentation在materialization前拒绝。

Current focused fixture更新为canonical nine-field output，并增加上述negative cases；不引入JSON Schema registry或generic diagram validator。

**Why:** 六个accepted historical Current/Planned→Actual compares已共享该shape，直接固定它比允许开放对象后再扫描payload更小、更精确。

### 5. Architecture terminal adds post-materialization candidate and exact closure identity

Six-slot validation/materialization完成后，host重读output refs并调用existing `deriveApplicableCheckCandidateRef`。成功terminal增加`architectureMaterializedCandidateRef`；无法派生或admission前drift则fail closed。`.flowkit/runs/**`继续由existing candidate contract排除，不新增例外。

提供纯函数从validated Architecture terminal派生并重算唯一closure identity：

```text
ref format  = architecture-finalization:sha256:<64 lowercase hex>
hash bytes  = UTF-8("flowkit-delivery-architecture-finalization\0")
              || UTF-8(JSON.stringify(architectureFinalizationMaterial))
```

Domain literal末尾的`\0`是一个`0x00` byte；它与紧随其后的JSON bytes之间不再插入空格、BOM或newline。

`architectureFinalizationMaterial`不是对input object直接stringify，而是validator从trusted terminal重建下列exact insertion-ordered projection；object keys按下列顺序创建，array保持其明示顺序，string不trim/改写，number使用JSON number，`null`保持JSON null，且不包含derived `architectureFinalizationRef`自身：

```text
deliveryId
operationId = delivery-architecture-finalization
ownerAuthority = null
operationFacts
  verifiedCandidateRef
  fullTestExecutionRef
  currentArchitectureRef { artifact, contentSha256 }
  plannedArchitectureRef { artifact, contentSha256 }
  systemViewPrestate { workflowSha256, lifecycleSha256, dataFlowSha256 }
guidanceRef { path, contentSha256 }
record
  verifiedCandidateRef
  fullTestExecutionRef
  outputs
    actualArchitectureRef { artifact, contentSha256, bytes }
    currentToActualCompareRef { artifact, contentSha256, bytes }
    plannedToActualCompareRef { artifact, contentSha256, bytes }
    workflowRef { artifact, contentSha256, bytes }
    lifecycleRef { artifact, contentSha256, bytes }
    dataFlowRef { artifact, contentSha256, bytes }
  architectureMaterializedCandidateRef
```

因此ref同时绑定retained exact package lineage、六个fixed ordered output refs与post-materialization candidate，而不依赖caller/Run prose、incidental input property order或generic canonical JSON。Architecture terminal validator与Delivery Final preparation必须使用同一纯re-derivation；golden vector冻结prefix/domain/projection顺序，caller input property重排仍产生同一ref，任一included field/nested value改变则产生不同ref，malformed/ref mismatch必须fail closed。

**Alternative rejected:** 创建`ArchitectureCandidateId`或排除Architecture文件的新candidate。一个现有candidate algorithm在连续causal boundaries重复使用即可。

### 6. One bounded Final execution callback, one fixed coordination writer

Invocation读取exact Guidance bytes后，将defensive Final package copy与Guidance交给bounded execution callback。Callback只可返回closed `ready`或`correction-required` result，不返回path、manifest patch、Git command或next operation。Host保留原package并在callback后重验全部prerequisite、current candidate与coordination bytes。

Ready path在memory中生成exact closure，并只更新canonical manifest：

```text
delivery.state              = completed
delivery.fullTestStatus     = passed
delivery.finalizationStatus = completed
delivery.formalVerificationCandidate = verifiedCandidateRef

finalization.state = completed
finalization.verifiedCandidateRef
finalization.fullTestExecutionRef
finalization.architectureFinalizationRef
finalization.architectureMaterializedCandidateRef
finalization.gitCheckpoint = pending-owner-authorized-local-delivery-commit
```

`finalization`使用exact closed fields；writer保留manifest其他accepted content/ordering，先在temporary bytes上parse/revalidate，再确认original prestate未变并以same-directory temporary file替换single target。任何staging/replace/re-read failure不产生terminal success；不增加多文件transaction或rollback platform。

`finalizedCandidateRef`不写回manifest，避免candidate self-reference。Host在temporary file已清理且completed manifest exact重读后派生它，并在terminal Result中记录。

### 7. Terminal Result is execution lineage, not a second coordination store

Terminal record保持compact：

```text
deliveryFinalizationRef
verifiedCandidateRef
fullTestExecutionRef
architectureFinalizationRef
architectureMaterializedCandidateRef
coordinationRef { artifact, contentSha256, bytes }
finalizedCandidateRef
```

`deliveryFinalizationRef`使用唯一serialization：

```text
ref format  = delivery-finalization:sha256:<64 lowercase hex>
hash bytes  = UTF-8("flowkit-delivery-finalization\0")
              || UTF-8(JSON.stringify(deliveryFinalizationMaterial))
```

Domain literal末尾的`\0`是一个`0x00` byte；它与紧随其后的JSON bytes之间不再插入空格、BOM或newline。

`deliveryFinalizationMaterial`由validator从retained package与post-write trusted facts重建为下列exact insertion-ordered projection；object keys按下列顺序创建，`scope`与`completedRequiredChangeIds`保持已admit的array顺序，string/number不normalize，且不包含derived `deliveryFinalizationRef`自身：

```text
deliveryId
operationId = delivery-final
ownerAuthority { ref, decision, deliveryId, sourceRef, scope }
operationFacts
  verifiedCandidateRef
  fullTestExecutionRef
  architectureFinalizationRef
  architectureMaterializedCandidateRef
  coordinationPrestateRef { artifact, contentSha256, bytes }
  completedRequiredChangeIds
guidanceRef { path, contentSha256 }
coordinationRef { artifact, contentSha256, bytes }
finalizedCandidateRef
```

`changeId`因exact Final authority要求absent而不进入projection；若出现则package在hash前已被拒绝。Terminal admission与后续consumer re-derivation必须使用该同一纯projection；golden vector冻结prefix/domain/projection顺序，caller input property重排仍产生同一ref，任一included field/nested value或`completedRequiredChangeIds` array order改变则产生不同ref，malformed/ref mismatch必须fail closed。Manifest继续拥有Delivery coordination state；Run/Result拥有execution lineage。Change 5可消费这两个owner的exact facts，但Change 4不定义Git integration implementation，也不引入generic canonical-JSON/hash registry。

Terminal返回后无条件STOP。PASS、finalized candidate或`gitCheckpoint=pending...`都不产生commit/push/merge/tag权限。

## Risks / Trade-offs

- **[Risk] Manifest parser演化为generic workflow engine** → 只解析/更新Final所需exact Delivery/change/finalization fields与一个fixed path，不暴露通用patch API。
- **[Risk] Callback再次获得trusted object alias** → host保留独立package，callback只接收second clone/projection；correction/terminal mutation negatives锁定该边界。
- **[Risk] Tight compare shape拒绝历史上未规范的fixture** → 更新本Change focused fixtures到六个accepted historical artifacts已经使用的nine-field shape，并用negative cases证明fail-closed intent。
- **[Risk] Candidate identity形成自引用** → manifest只记录pre-Final Architecture candidate；post-closure `finalizedCandidateRef`仅进入terminal Result。
- **[Risk] Single-file replace失败** → staging/revalidation/replace失败不admit terminal；不为一个fixed target引入transaction/rollback framework。
- **[Risk] Product Final被误用于当前D04 self-finalization** → Apply只使用isolated fixture repositories；当前D04正式Final仍由后续独立Owner/Verification/Architecture boundaries触发。

## Migration Plan

这是additive candidate contract，无持久化数据迁移。Apply先扩展Architecture terminal与tests，再加入Final package/host/Guidance；existing Start、Full Test与Architecture baseline regression必须保持通过。真实D04 manifest不在Apply中执行Final mutation；若Change未被接受，移除新增variant/host/Guidance并恢复Architecture局部扩展即可，不需要重写历史Delivery或Run。
