## Context

见 `proposal.md` 与 `specs/openspec-thin-integration/spec.md`。前一 Change 已提供 `resolveManagedTool({ toolId: "openspec" })`，能返回 exact managed OpenSpec 1.10.0 runtime root 与 entrypoint，但明确不负责 invocation。当前 source surface 是一个扁平 `src/domain` 模块集合；Policy canonical spec 同时明确禁止 Policy 自己读取 OpenSpec filesystem/CLI。

真实 OpenSpec 1.10.0 proof 已确认：`list --json` 和 `status --change <id> --json` 能提供当前所需 machine facts；missing Change 可以 `exit 1 + valid JSON`；从 nested cwd 调用 OpenSpec 会按 nearest-root 向上绑定 parent project，因此程序化 adapter 必须额外校验 exact root。

## Goals / Non-Goals

**Goals:**

- 新增一个小而封闭的 read-only OpenSpec observation module。
- 复用 managed-tool resolver，保证只能调用 exact managed OpenSpec runtime。
- 为 active Change set 与 exact Change artifact/planning status 提供最小 typed projection。
- 明确区分 formal non-zero OpenSpec outcome 与 process/JSON/root integration failure。
- 用 exact canonical repository-root binding 防止 nearest-root 静默漂移。

**Non-Goals:**

- Generic `runOpenSpec(args)` / arbitrary command executor。
- `instructions`、`context`、`validate`、`show` 或任何 mutating OpenSpec command wrapper。
- OpenSpec state machine / readiness reimplementation、Markdown scanning 或 `.flowkit` state mirror。
- Policy/Memo/Action/Run/Result/authority 修改。
- `.agents` Skill runtime dependency、Skill migration 或 self-hosting。
- Foundation CLI、Archify integration、Git checkpoint 或 whole-manager cross-platform acceptance。

## Decisions

### 1. 在现有扁平 domain surface 中增加一个 focused observation module

实现使用一个 focused module（例如 `src/domain/openspec-observation.ts`）并通过现有 `src/domain/index.ts` 暴露 approved observations/types，不创建 `OpenSpecManager`、service registry 或新的 integration framework。

**Rationale:** 当前仓库所有 Foundation capability 都通过同一扁平 domain surface 暴露，新增目录/manager abstraction 没有第二个 consumer 支撑，会扩大结构而不增加 contract value。

**Alternative considered:** 建立 `src/integration/openspec/*` service hierarchy。拒绝，因为当前只有两个 read-only observations，尚不足以证明新的层级/registry。

### 2. Internal command surface 固定为 `list --json` 与 `status --change <id> --json`

Public API 只表达两个 typed observation，不暴露 raw arguments。内部 command builder 采用 closed branches；caller 无法传 arbitrary OpenSpec args。

**Rationale:** 这直接落实 reviewer 的 scope containment，并使以后增加 command 必须经过新的真实 consumer/contract，而不是因为 OpenSpec CLI 已存在就自动 wrapper。

**Alternative considered:** 一个通用 `runOpenSpec(args)` helper 作为公共 seam。拒绝，因为它会立即把当前 Change 扩张成 generic OpenSpec transport API，并绕过 future scope review。

### 3. 调用 exact managed entrypoint，使用 current host Node 和 argument-array process execution

每次 observation 先调用现有 `resolveManagedTool({ repositoryRoot, flowkitHome, toolId: "openspec" })`。成功后使用当前 host `process.execPath` 执行 resolved entrypoint，并将 approved OpenSpec arguments 作为 argument array 传入；`cwd` 设置为 canonical requested repository root；不启用 shell，不查 PATH。

实现优先使用 Node built-in child-process API（例如 `execFile`/等价 argument-array seam），不增加 npm dependency。

**Rationale:** managed resolver 已经证明 exact runtime identity；当前 host Node 是 product runtime compatibility concern，而不是 managed patch lock。直接用 Node executable + exact JS entrypoint 同时满足 Windows/Linux portability 与 no-PATH rule。

**Alternative considered:** 直接执行 `openspec` 名称或 resolved JS 文件。拒绝，因为前者依赖 PATH/shebang，后者在 host executable association 上更不明确。

### 4. JSON parsing 发生在 exit-code semantic classification 之前

Invocation 层收集 stdout/stderr 与 exit outcome，但不会把 transport detail暴露为 stable public result。处理顺序：

1. spawn/process 层是否成功产生 command outcome；
2. required stdout 是否可解析为 JSON machine document；
3. 若 exit 非零且 JSON 合法，则返回/抛出 closed `formal-outcome` category，不继续把它解释为 success shape；
4. 若 exit 为零，则进行 command-specific minimal shape validation 和 exact-root validation；
5. 只有全部通过才投影 typed observation。

**Rationale:** OpenSpec 1.10.0 missing Change 已真实证明 `exit 1 + valid JSON`。先按 exit code 失败会丢失 OpenSpec formal outcome；反过来把所有 JSON 都视为 success 又会误接受 formal failure。

**Alternative considered:** 解析 `status[].message` 判断 `not found` 等具体语义。拒绝，因为这会依赖英文文本并开始复制 OpenSpec lifecycle/error semantics。

### 5. Successful observation 必须 exact-bind canonical requested root

调用前使用 host `realpath` canonicalize requested repository root；OpenSpec success payload 中必须存在 `root.path`，并以同样 host semantics canonicalize。二者必须精确一致。

只有 success payload 才要求 root binding；non-zero formal outcome 可以在没有 `root.path` 的情况下保持 formal-outcome 分类。

**Rationale:** OpenSpec nearest-root 对交互 CLI 很方便，但 programmatic adapter 不能静默接受 caller 给错 root 后向上绑定 parent project。

**Alternative considered:** 允许 nested requested root 只要它位于 reported root 内。拒绝，因为这会让 Flowkit caller identity 与实际 OpenSpec project identity产生漂移。

### 6. Active Change observation 只暴露 canonical Change identifiers

`list --json` success shape 只消费 `changes[].name` 与 `root.path`。每个 name 使用既有 `ChangeId`/semantic-id validator 校验；不暴露 `completedTasks`、`totalTasks`、`lastModified`、free-text `status`。

**Rationale:** 当前 consumer 只需要 formal active set / existence evidence。其他 fields 没有现有 Flowkit contract 需要。

### 7. Exact Change status 只投影 planning/artifact contract fields

`status --change <id> --json` success shape 只消费：

- `changeName`
- `schemaName`
- `changeRoot`
- `isPlanningComplete`
- `isComplete`
- `artifacts[]` 中的 `id`、`status`、`requires`、`missingDeps`
- `root.path`

`changeName` 必须与 requested ChangeId 精确一致。Artifact id/dependency id 作为 non-empty machine identifiers；artifact status 只接受 OpenSpec 1.10.0 当前 machine status union（`ready | blocked | done | skipped`）。缺失 `missingDeps` 规范化为空 array，不重新计算 dependency/readiness。

不消费 `planningHome`、`artifactPaths`、`applyRequires`、`nextSteps`、`actionContext` 或 raw payload。

**Rationale:** 这些字段已经完整覆盖 091/092 proof 中的当前 formal artifact observation use case，同时没有把整个 OpenSpec status JSON 固化成 Flowkit API。

### 8. Integration diagnostics 保持 closed，并复用 resolver failure

Existing `ManagedToolResolutionError` 原样向 caller 暴露/传播，不再包装成第二套 tool-resolution diagnosis。OpenSpec observation 自己只增加当前 seam 必需的小型 closed diagnostics，例如：

- `invalid-observation-input`
- `openspec-process-failed`
- `malformed-machine-output`
- `invalid-machine-shape`
- `openspec-root-mismatch`
- `openspec-formal-outcome`

Error 可以带 factual debugging cause/detail，但 control flow 只依赖 closed discriminant；不得把 raw stdout/stderr/exit-code payload 提升为稳定 contract。

**Rationale:** 保持 machine distinguishability，同时避免重复 managed resolver truth 或建立 raw OpenSpec transport API。

### 9. Observation 不持久化，也不参与 Policy/authority

Module 返回 transient immutable observation；不写 `.flowkit`、不缓存 artifact readiness，也不调用 Policy。后续 Foundation CLI 可以消费该 observation，但是否 legal next boundary 继续完全由已有 lifecycle/Policy/authority contracts 决定。

**Rationale:** OpenSpec formal artifact truth 与 Flowkit lifecycle legality 是两套不同 concern；薄 integration 只负责 observation。

### 10. `.agents` 保持纯 bootstrap development concern

Production module 不 import/read/execute `.agents/skills/**`。当前 `openspec-explore/propose/apply/archive` Skill 继续由 Author/Reviewer AI 在开发阶段直接使用，与 product runtime integration 平行存在。

**Rationale:** 当前目标是先用 `.agents` 开发出完整 Flowkit 版本，不能在 Foundation 尚未完整时提前自托管或交叉迁移 Skill。

## Risks / Trade-offs

- **[Risk] OpenSpec 1.10.0 JSON shape drift after a future managed version upgrade** → 当前 managed version 是 exact `1.10.0`，shape validator fail closed；未来升级必须通过新的 Change/verification 明确适配。
- **[Risk] Child-process buffering/termination edge case 被误认为 formal OpenSpec result** → 只有 process outcome + parseable required JSON 才能进入 formal-outcome branch；spawn/timeout/buffer failure保持 integration failure。
- **[Risk] Exact root realpath 在 Windows/Linux path representation 不同** → 两侧都使用同一 host canonicalization 后比较；whole-manager cross-platform acceptance 仍留给最终 Change。
- **[Risk] Status projection逐渐膨胀成 OpenSpec mirror** → 只暴露 reviewer-approved fields；任何新增 CLI command/field都需要真实 consumer 与新 contract justification。
- **[Trade-off] Non-zero formal outcome 不提供细分 OpenSpec lifecycle meaning** → 这是刻意的：active set 可提供 existence evidence，具体 OpenSpec error semantics 仍由 OpenSpec authority/Skill/CLI 自己承担。

## Migration Plan

1. 新增 focused observation module/types/tests，不修改既有 Policy、Memo、lifecycle 或 managed-tool resolution contract。
2. 通过 fake managed OpenSpec fixtures 测试 closed command、no-PATH、formal non-zero、malformed JSON、root mismatch 与 shape validation。
3. 使用真实 managed OpenSpec 1.10.0 fixture 重新验证 exact-root `list/status` observation。
4. 运行 typecheck、完整 domain tests、format、strict OpenSpec validation 与现有 TypeScript code gate。
5. 无 runtime data migration、OpenSpec artifact migration、Skill migration 或 self-hosting transition。
