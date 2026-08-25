## Context

见 `proposal.md` 与 `explore.md`。当前 domain 已提供 canonical Delivery/Change/Standard Action identity、OwnerAuthorityFact validator 与 `prepared/resumed/terminal` current Action lifecycle；仓库也已经存在外部 orchestrator 生成的 `.flowkit/runs/<delivery>/<change-root>/<occurrence>/action.md|context.json|result.json` 历史。当前缺口是 candidate runtime 自己的最小 durable persistence seam。

Owner 已将输入域收缩为顺序 Author ↔ Reviewer handoff：Run address 由 Flowkit 控制生成，不接受 arbitrary external path；multi-Agent、并发 writer、crash recovery/WAL 与 generic filesystem hardening 均后置。

## Goals / Non-Goals

**Goals:**

- 让一次 Standard Action execution 拥有独立于 semantic ActionIdentity 的 Change-scoped occurrence。
- 对齐现有 repository topology 和三文件 stable Run surface。
- 为 `context.json` / `result.json` 建立 exact runtime validation、JSON round-trip 与 linkage validation。
- 复用既有 identity、role、OwnerAuthorityFact 与 lifecycle validators，不创建第二套 authority/identity contract。
- 让下一 Actor 能从指定 Change 的 durable history 读取上一 Run，而不依赖聊天历史。

**Non-Goals:**

- Result admission / ActionPackage。
- Policy next-boundary legality、跨阶段 repair legality。
- automatic-next、scheduler、Agent assignment、multi-Agent concurrency、locking。
- crash recovery、WAL、database registry、distributed synchronization。
- arbitrary user-supplied RunId/path API、symlink/junction/reparse hardening、exhaustive Windows namespace hardening。
- CLI、OpenSpec adapter、mutation/Git checkpoint、Delivery Full Test。

## Decisions

### Decision 1 — Keep semantic ActionIdentity and Run occurrence separate

新增一个 plain-data `RunOccurrence` 概念，最小包含：

```text
date        canonical YYYYMMDD
sequence    positive bounded Delivery Action sequence
actionId    known StandardActionId
```

其 human-readable occurrence id / directory segment 由 Flowkit 确定性生成：

```text
YYYYMMDD-NNN-<actionId>
```

`NNN` 为至少三位零填充的十进制 sequence；sequence 大于 999 时不截断。Run occurrence 永远引用既有 ActionIdentity，而不是把 date/sequence 加入 ActionIdentity。

**Rationale:** 重复 `review-explore` 已证明 semantic Action identity 不能唯一标识 execution occurrence；同时用户需要日期和 sequence 都可直接阅读。

**Alternative considered:** arbitrary opaque RunId string。拒绝，因为它扩大为 generic filesystem input protocol，且 Owner 已明确排除。

### Decision 2 — Generate repository addresses only from validated controlled fields

Change root 使用：

```text
.flowkit/runs/<deliveryId>/<changeStartSequence>-<changeId>/
```

Run directory 使用 generated occurrence segment。Persistence API 接收 typed/canonical fields 与 repository root，不接收“Run directory path string”。生成后再进行 direct-child invariant check；invalid input 在 filesystem call 前 fail closed。

**Rationale:** 把 filesystem safety 问题限制在 Flowkit 自己的 closed inputs，满足当前产品需要，同时保留历史 traversal/reserved-name findings 的设计教训。

**Alternative considered:** reusable path sanitizer。拒绝，因为会重新引入 Owner 已后置的通用 filesystem subsystem。

### Decision 3 — Preserve the stable three-file surface but assign machine authority to JSON records

每个 durable Run 使用：

```text
action.md
context.json
result.json
```

- `action.md`: 人/AI 可读 descriptor；不单独作为 machine completion authority。
- `context.json`: occurrence + ActionIdentity + role + lifecycle/authority/input reference 等 continuation facts。
- `result.json`: occurrence/linkage + 分离的 author/reviewer/verification outcome fields + reported next boundary + bounded JSON-compatible result facts。

JSON records 使用 exact own-field validators；嵌套 identity/authority/lifecycle 直接复用现有 validators。可扩展结果放入一个显式 JSON-compatible `facts` object，而不是允许 envelope 任意额外字段。

**Rationale:** 既兼容当前稳定 handoff 的可读形态，又给 candidate runtime 一个小而可验证的 machine envelope。

**Alternative considered:** 为每个 Standard Action 定义不同 Result schema。后置；当前 Change 只负责 persistence，Action-specific semantics 以后由 ActionPackage/Result admission/Policy 管理。

### Decision 4 — Store linkage explicitly and cross-check on read

`context.json` 与 `result.json` 都保存同一个 occurrence id、DeliveryId、ChangeId 与 ActionId。读取完整 Run 时必须交叉验证这些 linkage fields 完全一致，否则整个 Run fail closed。

`previousRunId`/input Run reference 允许为 null 或一个 canonical generated occurrence id，用于顺序 handoff provenance；本 Change 不根据该引用推导 legal next boundary。

**Rationale:** 防止拿错 result 或跨 Run 串线，同时不提前实现第四个 Change 的 Result admission。

### Decision 5 — Verdict fields remain separate data, not derived authority

Result envelope 保留独立槽位：

```text
authorConclusion
reviewerVerdict
verificationVerdict
```

当前 persistence 对这些值只做自身 wire contract validation和 round-trip，不把一个字段推导成另一个字段。`verificationVerdict = null` 明确合法。

`nextBoundary` 也只作为 opaque/canonical handoff token 保存；其 legality 留给 Policy。

**Rationale:** 与 Foundation 已冻结的 authority separation 一致，避免 persistence 变成 Policy。

### Decision 6 — Change-local listing only; no global discovery

提供指定 Delivery / Change root 的 valid Run listing，按 occurrence sequence 稳定排序。listing 遇到 malformed candidate Run 时 fail closed，而不是跳过后假装 history 完整。

**Rationale:** 下一 Actor 只需要当前 Change 的顺序 handoff history。全局 index/scheduler 没有当前产品价值。

### Decision 7 — Run occurrences are create-once and sequence-unique within one Change

在当前单写者、顺序 handoff 模型下，一个 generated Run occurrence 一旦存在即视为 immutable durable history。Persistence 创建 Run 前必须检查 exact Change root：

- 如果目标 generated occurrence directory 已存在，创建 SHALL fail closed，且不得覆盖、truncate 或重写其中已有 `action.md`、`context.json`、`result.json` bytes。
- 如果同一 Change history 中已经存在相同 controlled Action sequence，即使其 ActionId 不同，新 occurrence 也 SHALL fail closed，从而保证 sequence ordering 没有 unresolved tie。

该检查只定义当前顺序/single-writer contract；不承诺 multi-process race freedom、locking、WAL 或事务语义。

**Rationale:** Run history 是 Author / Reviewer durable handoff 的事实链，旧 bytes 被覆盖或 sequence 出现平局都会破坏可追溯顺序。

**Alternative considered:** overwrite existing occurrence 或允许 same-sequence tie 后再用名称排序。拒绝，因为两者都会使 sequence 不再是可靠 occurrence order。

### Decision 8 — No crash-atomicity contract in this Change

普通 filesystem write/read 足以完成当前顺序 handoff。若存在 partial/truncated JSON，后续读取必须 fail closed；本 Change不承诺 power-loss atomicity、journal/WAL 或 multi-process transaction。

**Rationale:** Owner 明确后置 crash recovery / WAL。当前价值是 durable bytes 可重读，而不是建设 storage engine。

## Risks / Trade-offs

- **[Risk] Action-specific result facts 很多，统一 envelope 可能过早固化业务字段。** → 只冻结 role/verdict/linkage 等跨 Action 必需字段；Action-specific 内容进入 bounded JSON `facts`，后续 admission Change 决定语义。
- **[Risk] 非原子多文件写入可能留下 partial Run。** → 完整读取要求三文件存在且 JSON/linkage 全部 valid；partial 状态 fail closed。本 Change不承诺自动恢复。
- **[Risk] 现有外部 orchestrator 历史 JSON 形状与 candidate runtime 新 envelope 不完全一致。** → 不迁移/重写历史 bytes；历史作为 compatibility/product evidence，candidate runtime 从本 Change 起使用正式 contract。
- **[Risk] date/sequence display 可能被误当全局 identity。** → occurrence 明确 Change-scoped，address 必须同时位于 exact Delivery/Change root；不提供 global Run registry。

## Migration Plan

1. 新增 Run/Result persistence domain + filesystem seam 与 validators，不修改既有 archived Run history。
2. 增加 isolated temp-repository tests，证明 generator、create-once collision rejection、duplicate-sequence rejection、round-trip、linkage、history ordering 与 fail-closed cases。
3. 保持现有 `.flowkit/runs` 历史不变；本 Change 只使 candidate runtime 能产生符合新 contract 的后续 Run。
4. 如 Apply verification 发现 proposal scope 外的平台 filesystem 问题，记录为后续 Full Test/dedicated hardening，而不是扩张当前 Change。
