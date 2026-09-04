## Purpose

为 valid Formal Full Test PASS 后的 Architecture Finalization 提供 bounded derived-description closure，使 Actual Architecture、thin compares 与 canonical Workflow/Lifecycle/Data Flow 在不创建第二 truth/evidence system 的前提下精确收敛，并结构性阻止任意 repository mutation 被 finalization 隐藏。

## ADDED Requirements

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
对于 exact passed candidate，Architecture Finalization SHALL materialize一个 complete Actual Architecture，并 SHALL materialize `Current → Actual` 与 `Planned → Actual` 两个 thin compare。每个 compare SHALL 绑定其 left/right artifact identity、exact content SHA-256 与足够的 concise classification/summary surface，而 SHALL NOT 复制完整 Architecture 文档或成为独立 truth source。Finalization closure facts SHALL 绑定 exact Actual/compare output refs/content identities，使后续 Delivery Final 可读取 canonical closure facts而无需依赖 Run prose。

#### Scenario: Actual and thin compares close the passed candidate
- **WHEN** valid finalization 为 exact passed candidate 产生 complete Actual 与两个 compare
- **THEN** closure SHALL 精确绑定 Actual、Current→Actual、Planned→Actual 的 output identity/content hash，并保持 Git/OpenSpec/Verification 为 evidence owners

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
