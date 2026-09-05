# architecture-and-canonical-diagram-continuity Specification

## Purpose
为 valid Formal Full Test PASS 后的 Architecture Finalization 提供 bounded derived-description closure，使 Actual Architecture、thin compares 与 canonical Workflow/Lifecycle/Data Flow 在不创建第二 truth/evidence system 的前提下精确收敛，并结构性阻止任意 repository mutation 被 finalization 隐藏。

## Requirements

### Requirement: Architecture Finalization consumes one exact passed Full Test candidate and exact architecture inputs
Architecture Finalization SHALL 只接受一个 terminal passed `delivery-full-test` proof，并 SHALL 绑定该 proof 的 exact candidate identity 与 exact Full Test execution identity。Preparation SHALL 确认 current repository candidate 仍与 passed candidate 精确一致，并 SHALL 绑定 exact Current Architecture、Planned Architecture content identity，以及 Workflow/Lifecycle/Data Flow 三个 canonical system-view 的 exact pre-operation presence/content identity；任何 stale/mismatched candidate、Full Test proof、Current/Planned content 或 system-view prestate SHALL fail closed before derived output materialization。

#### Scenario: Prepare finalization from exact passed Full Test proof
- **WHEN** Full Test terminal verdict 为 passed、其 candidate/execution identity internally consistent、current repository candidate 未变化，且 Current/Planned/system-view prestate 与 preparation 读取的 exact bytes 一致
- **THEN** 系统 SHALL 允许形成 Architecture Finalization execution context，而不得重新推断或复制 Verification truth

#### Scenario: Reject stale candidate or architecture inputs
- **WHEN** Full Test 后 repository candidate 已变化，或 Current/Planned/system-view prestate 与 bound exact identity 不一致
- **THEN** Architecture Finalization SHALL fail closed before writing derived outputs，并 SHALL NOT 将 stale Full Test PASS 用于新的 candidate

### Requirement: Trusted Architecture Finalization host owns exactly six fixed derived output slots
Architecture Finalization SHALL 使用一个 operation-local fixed output surface。Derived-finalization logic / Agent SHALL 只返回 exact derived output content/result，且 SHALL NOT 获得 arbitrary repository-write authority 或 caller-selected output path。Trusted host SHALL 独占并只 materialize以下六个 fixed slots：Delivery-scoped `actual.architecture.json`、`current-to-actual.compare.json`、`planned-to-actual.compare.json`，以及 repository-scoped `architecture/system/workflow.json`、`architecture/system/lifecycle.json`、`architecture/system/data-flow.json`。Closure SHALL 只在六槽输出全部满足所需 validation/identity contract 后 admitted。

#### Scenario: Materialize only the fixed six derived slots
- **WHEN** valid Architecture Finalization execution 返回六槽对应的 exact derived output content/result
- **THEN** trusted host SHALL 只将这些输出写入由 exact Delivery identity/static system-view ownership确定的固定位置，并 SHALL NOT 接受 caller 提供额外路径

#### Scenario: Arbitrary product-truth mutation cannot be hidden by valid derived outputs
- **WHEN** finalization 需要或观察到 source、OpenSpec、canonical product-truth 等六槽之外的 repository mutation
- **THEN** current Architecture Finalization closure SHALL be invalid、SHALL STOP before admission，且 SHALL NOT 把这些 mutation 归类为合法 derived-finalization output

### Requirement: Architecture Finalization materializes one complete Actual and two thin exact compares
对于 exact passed candidate，Architecture Finalization SHALL materialize一个 complete Actual Architecture，并 SHALL materialize `Current → Actual` 与 `Planned → Actual` 两个 thin compare。每个compare SHALL 使用established exact nine-field top-level surface：`schemaVersion`、`kind`、`deliveryId`、`pair`、`left`、`right`、`classification`、`summary`与`presentation`；left/right SHALL 分别精确绑定pair-specific artifact ref与expected content SHA-256/bytes。`classification` SHALL 是ordered unique `["semantic", "presentation"]`，`summary` SHALL exact只含`semantic`与`presentation`两个non-empty string。`presentation` SHALL exact只含：`mode="side-by-side"`、`renderer="flowkit-reference-side-by-side"`、`leftPosition="before"`、`rightPosition="after"`、`equalFrame=true`、`interactive=true`、`overlay=false`、`deltaColumn=false`、`artifactPolicy="disposable-html-not-retained-in-git"`与`resolution="resolve-left-right-ref-to-architecture-render"`。Admission SHALL 比较exact field set/value而不依赖input property order；任一missing/extra/changed presentation field/value、extra top-level field、embedded Architecture/product payload、unknown/duplicate/reordered classification或nested/mismatched summary SHALL fail closed before materialization。Compare SHALL NOT复制完整Architecture文档或成为独立truth source；closure facts SHALL 绑定exact Actual/compare output refs/content identities。

#### Scenario: Actual and thin compares close the passed candidate
- **WHEN** valid finalization为exact passed candidate产生complete Actual与两个exact-shape compare
- **THEN** closure SHALL 精确绑定Actual、Current→Actual、Planned→Actual的output identity/content hash/bytes，并保持Git/OpenSpec/Verification为evidence owners

#### Scenario: Reject extra or embedded compare payload
- **WHEN** 任一compare包含第十个top-level field、嵌入Architecture/product payload或其他非canonical content surface
- **THEN** Architecture Finalization SHALL fail closed beforefixed-slot materialization

#### Scenario: Reject unbounded classification summary or presentation
- **WHEN** classification包含unknown/duplicate/reordered value、summary不是matching exact non-empty string map，或presentation缺少/增加field或任一fixed literal/boolean发生变化
- **THEN** Architecture Finalization SHALL reject该compare，且 SHALL NOT仅凭Archify process PASS或file hash/bytes接受其语义

### Requirement: Canonical Workflow Lifecycle and Data Flow use one repository-scoped baseline continuity rule
Repository-scoped canonical system views SHALL 固定为 Workflow、Lifecycle、Data Flow 三种。若某 fixed view 在建立 repository-scoped ownership 时不存在，Architecture Finalization MAY 从已接受语义首次 materialize baseline；baseline 一旦存在，represented accepted semantics 未变化时 SHALL exact-byte preserve，只有 represented accepted semantics 发生变化时才 SHALL 更新 derived current view。每个 materialized/updated canonical view SHALL 使用 exact managed Archify validation；生成的 HTML SHALL NOT 作为 canonical repository truth。

#### Scenario: Materialize a missing baseline once
- **WHEN** Workflow 或 Lifecycle canonical view 尚不存在，且当前 finalization 正式建立该 fixed repository-scoped ownership
- **THEN** trusted host MAY 从 accepted semantics materialize其首次 canonical baseline，并 SHALL validate该 derived output

#### Scenario: Preserve existing baseline bytes when semantics are unchanged
- **WHEN** canonical Data Flow/Workflow/Lifecycle baseline 已存在且 represented accepted semantics 没有变化
- **THEN** Architecture Finalization SHALL 保持该 view exact bytes 不变，而不得为了 refresh/version/timestamp 等非语义理由重写

### Requirement: Product-truth correction exits Architecture Finalization and restarts verification on a new candidate
Architecture Finalization SHALL 只收敛 derived descriptions，不拥有 source/OpenSpec/canonical product-truth correction authority。若 finalization 发现必须修改这些 product-truth bytes，系统 SHALL STOP current finalization before performing/admitting correction；后续 mutation SHALL 走独立 normal Owner-controlled correction/revise flow，形成新的 repository candidate，并 SHALL 重新建立 Formal Full Test PASS 后才能再次进行 Architecture Finalization。

#### Scenario: Required product correction returns to normal correction flow
- **WHEN** finalization 发现 Actual/canonical view 无法在不修改 source/OpenSpec/product truth 的情况下正确收敛
- **THEN** current finalization SHALL STOP、SHALL NOT perform hidden correction，且 corrected candidate SHALL require a fresh Formal Full Test boundary before another finalization attempt

### Requirement: Architecture Finalization isolates trusted lineage from derived logic
Trusted Architecture Finalization host SHALL 将validated pre-callback operation package及其Delivery、operation、verified candidate与Full Test execution lineage保留为correction、materialization与terminal admission的exclusive source。Derived-finalization logic SHALL 只接收defensive deep clone或immutable content-only projection；对callback-visible Delivery/operation/candidate/Full Test identity的mutation attempt SHALL NOT改变host-retained facts。Post-derivation prestate SHALL 继续相对于retained trusted package重验。

#### Scenario: Callback mutation cannot rewrite correction lineage
- **WHEN** derived logic尝试改写callback-visible Delivery、operation、candidate或Full Test identity并返回correction-required
- **THEN** correction outcome SHALL 只暴露pre-callback trusted identities，且 SHALL NOT传播被改写的lineage

#### Scenario: Callback mutation cannot rewrite terminal lineage
- **WHEN** derived logic尝试改写callback-visible package identity并返回otherwise-valid ready outputs
- **THEN** materialization与terminal admission SHALL 只使用retained trusted package，或在其他prestate drift存在时fail closed，而 SHALL NOT形成带forged lineage的terminal

### Requirement: Architecture Finalization closure binds the post-materialization repository candidate
Architecture Finalization SHALL 在六个fixed derived outputs全部validated/materialized并exact重读后，使用existing repository candidate contract派生post-materialization candidate。Terminal closure SHALL 同时绑定pre-Architecture verified candidate、Full Test execution、六个output identities与该post-materialization candidate，并 SHALL 形成`architecture-finalization:sha256:<64 lowercase hex>` closure ref。该ref SHALL 对UTF-8 domain tag `flowkit-delivery-architecture-finalization`、一个single `0x00` byte及无BOM/newline的`JSON.stringify` projection bytes依次做SHA-256。Projection SHALL 由validator重建，并按顺序只包含：`deliveryId`；`operationId`；`ownerAuthority=null`；`operationFacts`中的`verifiedCandidateRef`、`fullTestExecutionRef`、`currentArchitectureRef {artifact, contentSha256}`、`plannedArchitectureRef {artifact, contentSha256}`、`systemViewPrestate {workflowSha256, lifecycleSha256, dataFlowSha256}`；`guidanceRef {path, contentSha256}`；以及`record`中的`verifiedCandidateRef`、`fullTestExecutionRef`、ordered `outputs`和`architectureMaterializedCandidateRef`。Ordered outputs SHALL 固定为`actualArchitectureRef`、`currentToActualCompareRef`、`plannedToActualCompareRef`、`workflowRef`、`lifecycleRef`、`dataFlowRef`，每项exact为`{artifact, contentSha256, bytes}`；projection SHALL NOT包含derived ref自身。Validator与Delivery Final SHALL 使用同一projection重算；golden vector SHALL 冻结domain/projection顺序，input property reordering SHALL NOT改变ref，任一included value改变 SHALL 改变ref。实现 SHALL NOT依赖Run prose或generic canonicalization；derive failure、ref mismatch或materialization后的unexplained drift SHALL NOT产生terminal success。

#### Scenario: Record the Architecture-materialized candidate
- **WHEN** 六个fixed output slots全部通过validation/materialization且repository处于对应exact post-operation state
- **THEN** terminal closure SHALL 记录该state的exact candidate identity，供Delivery Final重验current state

#### Scenario: Reject missing post-materialization candidate identity
- **WHEN** host无法从completed six-slot state派生exact repository candidate，或该state在terminal admission前发生drift
- **THEN** Architecture Finalization SHALL fail closed，且 SHALL NOT返回可供Delivery Final消费的terminal closure

#### Scenario: Closure reference is independently rederived
- **WHEN** trusted terminal fields完整且values不变但caller property order改变，或任一package、Guidance、output、post-materialization candidate value被改变
- **THEN** validator SHALL 使用fixed prefix/domain与ordered projection分别重得同一ref或不同ref，并 SHALL reject malformed或mismatched supplied ref
