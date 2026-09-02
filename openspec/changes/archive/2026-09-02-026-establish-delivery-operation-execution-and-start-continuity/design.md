## Context

见 `proposal.md`。当前 accepted product 已有 `StandardActionId → skills/actions/** → content-bound ActionGuidanceRef → ActionPackage → invokeSingleAction` 的 exact-operation seam，但 repository 中不存在 production `DeliveryOperation*` contract 或 `skills/delivery/**`。D04 的 five-operation set 与 Start fixed-point contract 已由 Final Reference / approved Explore 冻结；当前 D04 本身仍必须使用独立 `.agents/skills/**` bootstrap，不得 self-host candidate Delivery Guidance。

## Goals / Non-Goals

**Goals:**

- 以最小 product seam冻结 five-value `DeliveryOperationId`、deterministic canonical Guidance mapping、content-bound `DeliveryGuidanceRef` 与 stable `DeliveryOperationPackage` envelope。
- 让 shared package 只绑定 validated operation-specific facts；Change 1 只实现 `DeliveryStartOperationFacts` 与 `skills/delivery/start/SKILL.md`。
- 复用 `OwnerAuthorityFact`、Git exact revision 与现有 hash/regular-file fail-closed mechanics，不建立第二 truth/identity subsystem。
- 用 bounded callback/host seam证明 exact package + exact HOW 能交给 Agent/execution host，同时保持 operation identity/lifecycle authority已在 package形成前确定。

**Non-Goals:**

- Delivery lifecycle state machine、Delivery operations as Standard Actions、Action Policy-owned Delivery sequencing。
- Registry/Router/Planner/dynamic Skill discovery、CLI auto-run Delivery operations、Agent-selected next operation。
- Change 2–5 的 concrete facts/HOW、self-hosting convergence、`.agents` product projection、automatic Git authority。

## Decisions

### 1. Closed compile-time operation catalog + deterministic path mapping

在 product domain 中使用 closed five-value literal catalog，并以 compile-time/static function 从 exact operation derivation canonical path。不要提供 caller-nominated path 或 registry insertion seam。

**Why:** D04 composition 已固定五个 operation；static mapping 已足以满足可验证性并避免 discovery/routing authority回流。

**Alternative rejected:** generic Skill Registry / configurable mapping。当前没有 proof 需要 runtime extensibility，反而会扩大 authority/validation surface。

### 2. DeliveryGuidanceRef mirrors Action Guidance path/hash mechanics, not Action lifecycle semantics

`DeliveryGuidanceRef` 使用 `{ path, contentSha256 }` exact identity；resolver验证 repository-relative canonical path、readable regular file、no symlink、exact bytes hash。实现 MAY 提取共享的低层 file-hash helper，但 SHALL 保持 Action/Delivery 的 canonical-path ownership独立，不为了类型对称重写 accepted Action semantics。

**Why:** exact content identity 是 Action 模式已证明的关键执行绑定；复制 lifecycle contract没有价值。

**Alternative rejected:** `.agents` fallback 或 Agent-native projection。Product package 已经直接携带 exact GuidanceRef，不需要再次 discovery。

### 3. One stable package envelope with closed per-operation facts validation

Shared `DeliveryOperationPackage` 只持有：`deliveryId`、`operationId`、`ownerAuthority`、`operationFacts`、`guidanceRef`。Package validator先验证 shared envelope，再调用 exact operation 对应的 closed facts validator；不接受 arbitrary generic map 作为可执行 truth。

Change 1 的 concrete variant只需要：

```text
DeliveryStartOperationFacts
├─ acceptedBaseCommit
└─ planningReference
   ├─ artifact
   └─ contentSha256
```

`current Git/OpenSpec/Memo/Previous-Actual` 等 facts 由 Start host从 canonical owners读取/验证，而不是膨胀成 caller-supplied package payload。

**Why:** stable envelope 可以被后续 Changes 2–5 复用，而 operation-specific truth仍由各自 boundary owner验证。

**Alternative rejected:** package复制 `CurrentAction`/Run/role/prepared-terminal state。那会制造假的 second Action lifecycle。

### 4. Authority recognition remains boundary-specific

共享 structural validator继续使用现有 `OwnerAuthorityFact`。`delivery-start` host只识别 exact current Delivery 上的 `decision=create-delivery` 与 bounded scopes；`delivery-start` scope允许 Start execution，`single-delivery-start-fixed-point-commit` scope另外允许唯一 ordinary Start commit。Package本身不生成/升级 authority。

**Why:** 与 Foundation“structural validity不等于 boundary eligibility”原则一致。

### 5. Delivery Start host verifies repository truth before package-bound HOW execution

Start host在执行候选 Start HOW 前验证 exact accepted base、clean working tree 与 planning-reference identity/hash。可用状态直接复用；缺失状态先在 host外/前置 continuity mechanic中恢复并验证，再进入同一 preparation path。执行 callback收到 exact package 与 exact Guidance bytes/identity；callback只执行 bounded Start HOW并返回 closure/fixed-point facts。

Start surface保持：manifest + Current + Planned + compare。Archify evidence必须引用其 declared revision 上真实存在的 repository source；新 D04 manifest/未来 `skills/delivery/**` 不得反向作为 accepted-main revision evidence。

**Alternative rejected:** local/detached mode enum或 transport package identity。Transport不是 lifecycle。

### 6. Product Start Guidance is canonical HOW, D04 bootstrap remains separate

新增 `skills/delivery/start/SKILL.md`，内容只描述 already-decided `delivery-start` 的 HOW、validation、Git authority/STOP boundary 与 state-first continuity。它不得决定 operation selection或 fallback `.agents`。

D04 当前 Proposal/Apply/Review继续走 `.agents` bootstrap；candidate product Skill只作为未来 Flowkit-managed project 的被测产品资产。

## Risks / Trade-offs

- **[Risk] Shared package envelope 变成 generic untyped bag** → 每个 operation 必须有 closed facts validator；Change 1 只实现 Start variant，后续 variant由对应 D04 Change显式加入。
- **[Risk] 为复用 Action mechanics而重构 accepted Action contracts** → 只允许低层 mechanical helper复用；Action public/domain semantics保持不变，回归测试必须继续 PASS。
- **[Risk] Start package被误解为 Git authority** → start commit eligibility由 exact OwnerAuthorityFact scope独立判断；无 commit scope即使验证 PASS 也必须 STOP。
- **[Risk] Candidate Guidance参与当前 D04 self-proof** → D04 acceptance继续使用独立 `.agents` bootstrap；测试 candidate mechanism但不赋予它当前 Delivery lifecycle authority。
