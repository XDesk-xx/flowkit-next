## Context

见 `proposal.md`。当前 Foundation 已有 canonical SemanticId、Delivery-scoped `OwnerAuthorityFact`、Run occurrence/runId parser、durable Run persistence、single-Action execution 与 pure Policy seam。本 Change 需要增加一个 project-level durable concern sidecar，同时避免把 Memo 塞进现有 588 行 Run persistence 或 438 行 Policy kernel。

## Goals / Non-Goals

**Goals:**

- 用一个独立、小型的 domain + persistence seam 实现 `cross-delivery-memo` spec。
- 复用现有 identity、Owner authority 与 runId canonical validation，而不改变这些 contract。
- 保持单 writer、单 JSON document、deterministic serialization 与 fail-closed read/update。
- 让未来 Delivery Start 可以只读消费 open Memos，而不把 Memo 接入当前 Policy/lifecycle。

**Non-Goals:**

- project-scoped/no-Delivery OwnerAuthorityFact；当前仍消费已有 Delivery-scoped authority。
- issue tracker、backlog、priority/tag/search index、scheduler、notification、comments/dependency graph。
- database、WAL、lock service、multi-writer concurrency/crash-recovery protocol。
- Memo 自动创建 Delivery/OpenSpec Change 或自动转成 requirement。
- generic repository mutation declaration、Git checkpoint/commit permission；这些仍属于后续 Change。

## Decisions

### 1. 一个 project-level `.flowkit/memos.json`

使用：

```text
.flowkit/memos.json
```

canonical document：

```ts
interface ProjectMemosDocument {
  readonly formatVersion: 1;
  readonly memos: readonly ProjectMemo[];
}
```

缺失文件在 read path 上解释为空 collection，但不会仅因读取而创建文件。写入前必须读取并验证现有 document；invalid existing file 直接失败，不允许用空 document “修复”。写出的 records 始终按 memoId 排序。

选择单文件而不是 `memos/<id>.json` + index，是因为 V1 Memo 创建由 Owner 显式 gate，真实 cardinality 和 writer 模型均很小；单文件使 list-open 与 deterministic diff 最简单，也避免双 truth/index consistency。

### 2. Memo domain 与 Memo filesystem persistence 分离，但不建立抽象框架

优先实现两个窄模块：

```text
src/domain/cross-delivery-memo.ts
src/domain/cross-delivery-memo-persistence.ts
```

前者拥有 record/document closed validators、authority eligibility 与 state transitions；后者只拥有 fixed path 的 read/create/update/list persistence。不要建立 MemoRepository interface、registry、service factory 或通用 document store。

现有 `run-result-persistence.ts` 与 `policy-and-next-boundary.ts` 应保持不承担 Memo 职责。若共享 Owner `ref` validation 需要暴露一个极小 existing helper，可以在 authority module 做不改变现有 contract 的复用性调整；不要复制第二套 Owner authority model。

### 3. Provenance 复用 canonical identity/run occurrence seam

Memo `source` 是 closed hierarchical union：null、Delivery、Delivery+Change、Delivery+Change+Run。Delivery/Change 使用 `isSemanticId`；Run 使用既有 `parseRunOccurrenceId`，不在 Memo 中另写 regex 或接受任意字符串。

source 与 authorization 分离：source 可以为空，也不需要与 mutation authority 的 Delivery/Change 相同，因为它只描述 concern 的发现来源。

### 4. Owner-gated mutation只做 eligibility，不拥有 authority lifecycle

所有 mutation 接收一个 caller-supplied、已经建立的 `OwnerAuthorityFact`，先通过 `isOwnerAuthorityFact`，再做 Memo-specific eligibility：

```text
create   → decision=create-memo,  scope=[memoId]
dismiss  → decision=dismiss-memo, scope=[memoId]
promote  → decision=promote-memo, scope=[memoId]
            + authority.deliveryId/changeId === target.deliveryId/changeId
```

Memo 只把实际使用的 `authority.ref` 写入 record；不持久化 authority object，不生成 authority，不从 Reviewer/PASS/source 推断 authority。

Promotion 的 target existence 由 caller/integration boundary 在调用前建立。本 module 只验证 canonical target + exact authority binding，不扫描 Delivery manifest/OpenSpec，因此不会形成反向 integration coupling。

### 5. 一次 rewrite 完成 mutation，保持 bounded single-writer model

每次 create/promote/dismiss 的 persistence sequence：

```text
read existing/missing
→ closed validate
→ pure domain transition
→ canonical sort + JSON serialize
→ same-directory temporary write
→ replace memos.json
```

实现需要避免在 validated current document 之前删除/截断 canonical file。具体跨平台 replace 机制由 Apply 测试验证；本 Change 不声明多 writer locking、WAL 或 crash recovery。

### 6. Public seam 保持五个操作，没有 defer API

对外只需要：

```text
createMemo
getMemo
listOpenMemos
promoteMemo
dismissMemo
```

`defer` 是 no-op：Owner 不选择 promote/dismiss 时 record 继续 open。不要增加 `deferMemo`、reopen、history 或 status workflow。

## Risks / Trade-offs

- **[单 JSON 文件在并发 writer 下可能 lost update]** → V1 明确是 bounded single-writer repository workflow；不引入锁/WAL。若未来真实多 writer 需求出现，另起 Change。
- **[跨平台 file replacement 语义有差异]** → Apply 使用真实 temp/write/replace tests 覆盖支持的平台行为；不借此建立 generic transaction subsystem。
- **[OwnerAuthorityFact 仍要求 deliveryId，因此完全 standalone project Memo mutation 暂不支持]** → 保持现有 authority core 不变；当前真实用例在 Delivery execution / Delivery Start 上下文中足够。未来若确有 standalone use case，单独做 authority-contract Change。
- **[Memo 可能演化成 backlog]** → schema 和 API 保持 closed，不加入 priority、tag、assignee、dependency、comments、scheduler 或 automatic planning。

## Migration Plan

这是新 capability，无历史 `.flowkit/memos.json` 需要迁移。不存在文件即为空 collection。Archive 后 canonical spec 新增 `cross-delivery-memo`；既有 Runs、Policy、OpenSpec specs 与 Delivery history 不迁移、不重写。
