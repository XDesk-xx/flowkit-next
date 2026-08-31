## Context

见 `proposal.md` 的 Why。当前实现已经有 closed `StandardActionId`、`ActionPackage`、single-Action invocation 与 `ActionPackageRef → ApplicableCheck executionInputRef` identity chain，但存在三个直接约束：

- `ActionPackage` 目前 `extends RunContextRecord`，且 `isActionPackage()` 直接调用 exact-field `isRunContextRecord(value)`；新增 execution-only Guidance field 会被现有 RunContext validator 拒绝。
- `invokeSingleAction()` 当前在 exact Action prepared 后直接 `formActionPackage()` 并调用 Agent callback，没有 repository-owned canonical Guidance resolution seam。
- `skills/actions/**` 是 product-side canonical root，但当前 D03 staging 只有 root/README；`.agents/skills/**` 仍必须作为 flowkit-next 自身 D03/D04 Author / Reviewer 的独立 bootstrap plane，不能成为 production fallback，也不能在本 Change 中被收敛掉。

既有 `deriveActionPackageRef()` 已对 exact cloned ActionPackage 做 hash，ApplicableCheck execution identity 已包含 `actionPackageRef`，因此 Guidance identity 只需要进入 existing package projection。

## Goals / Non-Goals

**Goals:**

- 用 closed `StandardActionId` deterministic 解析 product-side canonical `skills/actions/<actionId>/SKILL.md`。
- 形成包含 canonical repository-relative path 与 exact content SHA-256 的 `ActionGuidanceRef`。
- 让 `ActionPackage` 拥有自己的 exact envelope，复用 RunContext facts 但不修改 durable RunContext schema。
- 在 exact Action 已确定之后、Agent callback 之前完成 trusted Guidance resolution；failure fail closed。
- 让 Guidance content drift 通过 existing `ActionPackageRef → executionInputRef` 链自然改变 execution identity。

**Non-Goals:**

- 不创建或迁移最终 Author / Reviewer `skills/actions/**` bodies；Changes 2/3 负责该工作。
- 不删除、变薄、替换 `.agents/skills/**`，不进行 self-hosting takeover。
- 不新增 Skill/Guidance Registry、Router、Planner、Runtime、cache、method mapping 或第二套 execution identity。
- 不修改 `context.json` / `result.json` durable schema，不新增 Run artifact、Standard Action 或 lifecycle state。
- 不实现 Agent compatibility / Skill content delivery protocol；本 Change 只冻结 exact product-side Guidance identity。

## Decisions

### 1. `ActionGuidanceRef` 使用 canonical path + content SHA-256，不建立新的 execution-ref namespace

新增一个小型 domain contract（实现位置建议 `src/domain/action-guidance-execution.ts`）：

```text
ActionGuidanceRef
├─ path
└─ contentSha256
```

其中：

```text
path
= skills/actions/<StandardActionId>/SKILL.md

contentSha256
= exact file bytes 的 lowercase SHA-256 hex
```

`contentSha256` 是 Guidance bytes 的内容身份，不是新的 invocation/execution correlation identity。真正的 execution identity 继续由 existing `ActionPackageRef` 承担。

**Why:** 这满足 Explore 要求的 canonical path + exact content identity，同时无需扩展 ApplicableCheck 的 hash-ref prefix family，也不会制造 `guidanceExecutionRef`。

**Alternative rejected:** 新增 Guidance Registry id / cache id / execution id。没有 proof 支持，而且会复制现有 ActionPackage identity 职责。

### 2. Resolver 只接受 trusted repository root + exact `StandardActionId`

提供 bounded async resolver，概念签名：

```text
resolveActionGuidanceRef(repositoryRoot, actionId)
→ Promise<ActionGuidanceRef | null>
```

处理规则：

1. 验证 `actionId` 为 existing closed `StandardActionId`。
2. canonicalize trusted repository root。
3. deterministic 构造 `skills/actions/<actionId>/SKILL.md`。
4. 要求最终 resolved path 仍等于 canonical expected path，并拒绝 symlink / directory / non-regular entry。
5. 读取 exact bytes 并计算 SHA-256。
6. 返回 exact `ActionGuidanceRef`；任何 missing/unreadable/non-canonical case 返回 fail-closed `null`。

resolver 不接受 caller-provided Guidance path/name/ref，不搜索 `.agents`，也不做 repository-wide discovery。

**Why:** `StandardActionId` 已经是 closed deterministic key，直接 mapping 足够。

**Alternative rejected:** Skill discovery/ranking/registry。会把 HOW binding 扩成新的 control plane。

### 3. `ActionPackage` 改为自己的 exact envelope，同时通过 RunContext projection 复用既有 validation

`ActionPackage` 不再依赖“整个对象也是 exact `RunContextRecord`”这一假设。它应显式包含：

```text
现有 RunContext execution facts
+
GuidanceRef
```

`isActionPackage()` 的最小策略：

1. 对 ActionPackage 自己执行 exact-field envelope validation。
2. 从 package 的 base fields 投影一个 RunContext-shaped record，并复用 `isRunContextRecord()` 验证 existing durable semantics。
3. 验证 lifecycle state 仍为 `prepared`、role 仍等于 deterministic execution role。
4. 验证 `guidanceRef` structural valid 且 `guidanceRef.path` 精确等于 package ActionId 的 canonical Guidance path。

`formActionPackage(currentAction, currentContext, guidanceRef)` 只接受已经由 trusted resolver 形成的 GuidanceRef，并继续执行既有 current Action/context/role/state consistency checks。

**Why:** 保持 D01 durable Run contract 不变，同时避免复制 RunContext 语义验证。

**Alternative rejected:** 给 `RunContextRecord/context.json` 增加 Guidance field。Guidance 是 execution-package identity，不是 durable Run continuation fact，本 Change没有修改三文件 Run surface 的授权或需求。

### 4. single-Action invocation 在 package formation 前解析 Guidance，并复用 existing failure boundary

`invokeSingleAction()` 增加 trusted repository-root input，由 Flowkit Action host 提供，而不是 Agent/caller提供 Guidance selection input。

顺序固定为：

```text
establish/reuse exact prepared Action
↓
validate current RunContext
↓
resolve exact Action-aligned GuidanceRef
↓
form exact ActionPackage
↓
invoke Agent callback once
↓
existing Result admission / terminal / STOP
```

Guidance resolution 返回 `null` 时复用 existing `package-formation-rejected` bounded failure，不新增 lifecycle state 或 recovery branch。

**Why:** Guidance 在 Action 已决定后才出现，天然不能获得 Policy / Role / next-Action authority；复用 existing failure surface 比增加 `guidance-resolution` lifecycle 更小。

**Alternative rejected:** 在 Action selection 前解析 Skill 或让 callback 自己选择 Guidance。前者会让 HOW 影响 lifecycle，后者无法建立 trusted exact package identity。

### 5. `ActionPackageRef` 直接包含 GuidanceRef；ApplicableCheck 只更新 package clone/projection

`deriveActionPackageRef()` 继续使用 existing ActionPackage hash contract。只需确保 ActionPackage clone/hash material 包含 exact `guidanceRef`。

结果：

```text
Guidance bytes change
↓
contentSha256 change
↓
ActionPackageRef change
↓
existing ApplicableCheck executionInputRef change
```

ApplicableCheck 的 candidate/check/execution identity semantics 不变。

**Why:** Explore 已通过 counterexample 证明该传播链成立。

**Alternative rejected:** 新 `GuidanceExecutionRef` 或 ApplicableCheck redesign。属于重复 identity。

### 6. Change 1 使用 bounded fixtures，不要求当前 repository 已具备最终 canonical Action bodies

Changes 2/3 尚未创建最终 `skills/actions/<actionId>/SKILL.md` bodies。因此 Change 1 的 resolver/package/single-action tests 使用受控 temporary repository fixtures 创建最小 canonical Action Guidance file。

对真实缺失 canonical entry 的行为则直接测试 fail closed。

`.agents/skills/**` 继续驱动 flowkit-next 自身 D03/D04 开发过程，但 production resolver 永不 fallback 到 `.agents`。

**Why:** 这样可以单独接受 binding contract，而不偷做后续 Guidance convergence，也避免 candidate self-hosting。

## Risks / Trade-offs

- **[Risk] Change 1 完成后真实 repository 仍缺部分/全部 canonical Action Guidance bodies，因此 Flowkit-managed product invocation 会 fail closed。** → **Mitigation:** 这是已批准的 D03 staging；Changes 2/3 负责填充 Author / Reviewer canonical HOW，flowkit-next 自身开发继续使用独立 `.agents` bootstrap。
- **[Risk] filesystem symlink / path redirection 可能让 lexical canonical path 指向 repository 外内容。** → **Mitigation:** resolver 使用 canonical repository root，并要求 expected entry 的 resolved path 与 deterministic canonical path 一致，同时拒绝 non-regular/symlink entry。
- **[Risk] GuidanceRef 只冻结 identity，不直接把 Guidance bytes 塞进 ActionPackage。** → **Mitigation:** 这是本 Change 的明确边界；Core 只知道 exact Guidance identity，不承担 Agent Skill execution/content-delivery。后续只有 real compatibility proof 失败时才讨论额外 compatibility surface。
- **[Risk] `ActionPackage` 不再直接 `extends RunContextRecord` 可能导致 base-field validation 漂移。** → **Mitigation:** `isActionPackage()` 通过显式 RunContext projection 继续调用现有 `isRunContextRecord()`，只把 GuidanceRef 作为 package-only extension。

## Migration Plan

无 durable data migration、dependency migration 或 schema-version migration。

Apply 顺序：

```text
ActionGuidanceRef + resolver
↓
ActionPackage exact envelope / formation
↓
single-Action invocation integration
↓
ApplicableCheck package clone/hash propagation
↓
focused regression + OpenSpec strict validation
```

Rollback 为同一 Change implementation revert；现有 durable Run records 不需要转换，因为 `context.json` / `result.json` contract 不变。
