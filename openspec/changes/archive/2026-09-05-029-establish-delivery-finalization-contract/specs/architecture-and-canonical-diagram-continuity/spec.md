## ADDED Requirements

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

## MODIFIED Requirements

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
