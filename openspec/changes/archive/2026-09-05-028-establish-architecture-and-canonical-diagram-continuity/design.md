## Context

见 `proposal.md` 与 approved `explore.md`。Change 1/2 已建立 closed Delivery operation envelope、content-bound Guidance、`delivery-full-test` terminal candidate/execution identity 与 managed tool resolution。当前缺口是第三个 concrete operation：把 valid Full Test PASS 后的 Architecture/diagram closure作为 derived finalization执行，同时不能让该 operation 获得任意 repository mutation authority。

D04 当前 repository 已有 Delivery-scoped Current/Planned/Current→Planned，以及 canonical `architecture/system/data-flow.json`；Workflow/Lifecycle repository-scoped baseline 尚缺失。D04 自身真实 Actual/final system views 不能在本 Change Apply 阶段提前生成，必须等待后续最终 D04 Formal Full Test PASS。

## Goals / Non-Goals

**Goals:**

- 在既有 `DeliveryOperationPackage` 上增加一个 closed `delivery-architecture-finalization` facts/package variant。
- 从 trusted terminal passed Full Test outcome 与 current repository bytes派生/验证 exact finalization prestate。
- 让 trusted host 独占六个固定 derived output slots，derived logic只返回 content/result，不拿 repository writer/path capability。
- 复用 managed Archify runtime验证需要 materialize/update 的 Architecture/system-view outputs。
- 返回 compact exact closure refs/hashes，供后续 Delivery Final读取，不引入新的 Evidence store。

**Non-Goals:**

- changed-path fallback scanner、generic path allowlist/mutation taxonomy/mutation engine。
- `ArchitectureCandidateId`、architecture-excluded candidateRef、Verification/Diagram Registry/Planner/Runtime/lifecycle。
- 新 Owner authority type，或复用 Full Test Owner authority作为 Architecture Finalization authority。
- 本 Change Apply 时生成真实 D04 Actual/Workflow/Lifecycle finalization artifacts。
- Change 4/5、Delivery Final、Git integration。

## Decisions

### 1. Add one architecture-finalization facts variant to the existing package envelope

在 `delivery-operation-execution` domain 中增加一个 closed `DeliveryArchitectureFinalizationOperationFacts`。最小信息内容为：

```text
verifiedCandidateRef
fullTestExecutionRef
currentArchitectureRef
  artifact
  contentSha256
plannedArchitectureRef
  artifact
  contentSha256
systemViewPrestate
  workflowSha256: string | null
  lifecycleSha256: string | null
  dataFlowSha256: string | null
```

具体 type/name 可按现有代码风格调整，但不得增加 caller-selected paths 或第二 candidate identity。

`DeliveryOperationPackage` 增加第三个 concrete variant；`delivery-start`/`delivery-full-test` 保持原样，`delivery-final`/`delivery-repository-integration` 继续 fail closed。

**Why:** Change 1 已证明 stable envelope，Change 3 只需要补一个具体 facts validator，而不是新 package family。

### 2. Preparation consumes a trusted passed Full Test terminal outcome and derives current architecture prestate

新增 bounded architecture-finalization host/domain seam。Preparation input 接受 exact Delivery identity 与 trusted terminal `delivery-full-test` passed outcome（或等价 compact trusted proof object），但不接受 caller 覆盖 `candidateRef`、Current/Planned hashes或system-view hashes。

Trusted host执行：

```text
validate Full Test outcome = terminal/passed
↓
extract candidateRef + executionRef
↓
derive current repository candidateRef
↓
require exact equality
↓
read deterministic Delivery-scoped Current/Planned paths
↓
hash exact bytes
↓
read three fixed system-view paths as present hash / null
↓
resolve exact architecture-finalization Guidance
↓
form DeliveryOperationPackage(ownerAuthority = null)
```

**Why:** 让 Git/Verification/actual files继续拥有事实，package只冻结 exact context。

### 3. Architecture Finalization explicitly rejects Owner authority

该 package 的 `ownerAuthority` 必须为 `null`。Operation WHAT由 trusted Delivery boundary/caller已决定；Full Test authority、Delivery Final authority、Git authority都不得塞进 architecture-finalization package。

**Alternative rejected:** 新建 `authorize-architecture-finalization` Owner decision。Final reference/Explore没有 proof 需要它。

### 4. Trusted host owns six named slots; derived logic returns content only

定义一个 operation-local derived output result（名称按实现风格决定），具有六个**命名字段**，而不是 path map/list：

```text
actualArchitecture
currentToActualCompare
plannedToActualCompare
workflow
lifecycle
dataFlow
```

每个字段只承载待 materialize 的 content/result与必要 validation metadata；不得包含 output path。Trusted host通过 exact Delivery identity/static ownership把六个字段映射到六个固定路径并执行写入。

实现**只采用这个 preferred model**。不同时实现 Explore 里证明等价的 changed-path fallback inspection。

**Why:** 结构上不给 arbitrary path/writer capability，比事后扫描/classify mutation更小、更 fail closed。

### 5. Derived output closure uses staged validation before final admission

Host SHOULD 在 repository 外或临时 staging位置验证 generated content，再将 validated content写到六个固定 slots；对于 unchanged existing canonical view，应通过 semantic/result decision返回“preserve existing”或等价状态，使 host不重写 exact bytes。

建议 output intent保持 closed per slot，例如：

```text
materialize exact bytes
or
preserve existing exact bytes
```

Workflow/Lifecycle在 missing baseline时允许首次 materialize；Data Flow或其他已存在 baseline只有 accepted represented semantics变化时才 materialize新 bytes，否则 preserve。

Actual与两个 compares每次合法 finalization必须形成当前 exact closure。Compare继续使用现有 thin receipt模式，不复制完整 Architecture文档。

### 6. Managed Archify is validation mechanics, not truth authority

Architecture/system-view generated bytes需要 validation时，host通过既有 `resolveManagedTool(..., toolId="archify")` 得到 exact managed runtime并以无 shell的 bounded process invocation执行相应 Archify validate/compare mechanics。任何 non-zero/formal validation failure导致 finalization failure/STOP，不得把 Archify输出升级为 truth。

若实现中可直接复用已有 Archify artifact/compare validation helper则优先复用；否则新增的 process wrapper保持 architecture-finalization-local，不扩展 Foundation CLI成为 Architecture runner。

### 7. Closure fact is compact and content-bound

成功结果只需返回 exact derived closure identity，例如：

```text
verifiedCandidateRef
fullTestExecutionRef
outputs
  actualArchitectureRef
  currentToActualCompareRef
  plannedToActualCompareRef
  workflowRef
  lifecycleRef
  dataFlowRef
```

每个 output ref至少包含 deterministic artifact identity/path语义与 content SHA-256；需要 byte count时可沿用 compare/artifact receipt模式。该 record不是 Evidence database，也不保存历史 finding。

### 8. Product-truth correction is a STOP result, never a writer branch

Architecture Finalization host不提供 source/OpenSpec writer callback。若 derived logic发现无法在六槽内正确收敛，返回 bounded `correction-required`/STOP outcome（名称按既有 result style调整）；host不做 correction、不自动激活 Change、不写 repository product truth。

随后由外部 normal Owner-controlled correction/revise flow修改 repository，形成新 candidate并重新 Full Test。

### 9. D04 self-application is deferred by construction

Change 3 Apply只实现/测试 capability。Tests在临时 fixture repository中证明：

- package preparation from passed Full Test proof；
- stale candidate/input rejection；
- only six fixed writes；
- no caller-selected paths；
- missing Workflow/Lifecycle first baseline；
- unchanged Data Flow exact-byte preservation；
- product-truth correction STOP；
- managed Archify validation path。

不得拿当前 D04 candidate直接运行真实 Architecture Finalization生成D04 Actual/final canonical views。真实 operation 等最终 D04 Formal Full Test PASS后再执行。

## Risks / Trade-offs

- **[Risk] Six-slot result shape变成通用 diagram framework** → 保持 operation-local named fields/static paths，不抽象成 path registry或generic output collection。
- **[Risk] 为“检测非法 mutation”重新引入 changed-path scanner** → 不实现 fallback；derived logic没有 writer/path input，host自身只有六个固定 writes。
- **[Risk] unchanged canonical view被序列化重写导致噪音** → closure contract显式支持 preserve-existing；semantics unchanged时不写文件。
- **[Risk] Archify process mechanics扩散到 Foundation CLI** → bounded host/local helper + managed tool resolution即可，不增加 CLI lifecycle surface。
- **[Risk] Full Test proof被复制成Architecture evidence store** → package/closure只绑定现有 candidate/execution refs，不保存第二份 check history。
- **[Risk] Apply提前生成D04真实Actual** → tests只用 fixtures；D04 self-finalization必须等待后续 final candidate Full Test PASS。
