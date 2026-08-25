## Purpose

为 Flowkit Foundation 提供最小、Change-scoped 且可重读的 Run / Result durable persistence contract，使顺序执行的 Author 与 Reviewer 能通过 `.flowkit/runs` 交接真实执行事实，而不依赖聊天历史，也不把 persistence 扩展成 Result admission、Policy 或多-Agent orchestration。

## ADDED Requirements

### Requirement: Run occurrence is distinct from semantic Action identity

系统 SHALL 为每次实际 Standard Action execution 建立独立的 Change-scoped Run occurrence；同一 `ActionIdentity` 在同一 Change 中重复执行时 SHALL 能产生不同 occurrence，且 occurrence information SHALL NOT 被写回或替代既有 semantic `ActionIdentity`。

#### Scenario: Distinguish repeated review executions

- **WHEN** 同一 Delivery / Change 中先后执行两次 canonical `review-explore`
- **THEN** 两次 execution SHALL 拥有不同 Run occurrences，同时两者 SHALL 仍引用同一个 semantic `ActionIdentity`

#### Scenario: Preserve Action identity semantics

- **WHEN** 一个 Run occurrence 被创建
- **THEN** 系统 SHALL 保持其 DeliveryId、ChangeId 与 StandardActionId 的既有 canonical semantics，而不得通过 Run sequence/date 改写 Action identity

### Requirement: Flowkit generates the canonical Change-scoped Run address

系统 SHALL 只从 Flowkit-controlled canonical inputs 生成 Run directory address，并 SHALL 将 Run 按 Delivery / Change 聚合到 `.flowkit/runs/<delivery-id>/<change-sequence>-<change-id>/<run-occurrence>/`。Run occurrence directory SHALL 为 exact Change root 的单层 repository-relative child；外部 caller SHALL NOT 能以任意 filesystem path string 指定 Run directory authority。

当前 capability 的 canonical generated occurrence SHALL 使用 `YYYYMMDD-NNN-<known-action-name>` 形态，其中日期、正整数 Action sequence 与 Standard Action name 均在生成前验证为受控值。

#### Scenario: Generate a direct-child Run address

- **WHEN** 系统收到 canonical DeliveryId、ChangeId、Change start sequence、canonical date、positive Action sequence 与 known StandardActionId
- **THEN** 系统 SHALL 生成唯一 repository-relative Change-scoped Run directory，且该目录 SHALL 是 exact Change root 的直接子目录

#### Scenario: Reject invalid generator inputs before filesystem use

- **WHEN** date、sequence、DeliveryId、ChangeId 或 ActionId 任一不满足本 capability 所要求的 canonical controlled input
- **THEN** 系统 SHALL fail closed，且不得产生 filesystem address 或尝试将该输入 normalize 为可用 path

### Requirement: One durable Run uses the stable three-file record surface

系统 SHALL 为一个 durable Run 使用 `action.md`、`context.json` 与 `result.json` 三文件 surface。`action.md` SHALL 作为稳定的人/AI 可读 Action descriptor；machine continuation facts SHALL 由 `context.json` 与 `result.json` 的 validated data contract 承载。

#### Scenario: Persist a complete Run record

- **WHEN** 一个 Action execution 已形成可持久化的 validated context 与 result
- **THEN** 对应 Run directory SHALL 包含 `action.md`、`context.json` 与 `result.json`，且读取方 SHALL 能从该目录恢复同一 Run occurrence 的 machine facts

#### Scenario: Missing machine record is not treated as a complete Run

- **WHEN** Run directory 缺失 `context.json` 或 `result.json`
- **THEN** 系统 SHALL fail closed，而不得仅凭 `action.md` 推断 machine execution result

### Requirement: Run context round-trip preserves handoff identity and authority facts

系统 SHALL 以 JSON-compatible exact validated context record 保存 Run occurrence、Delivery / Change / Action identity、execution role、适用时的 Action lifecycle state、显式 OwnerAuthorityFact 或其 absence、以及 sequential handoff 所需的 previous/input Run reference。write → read round-trip SHALL 保留这些 durable facts，不得生成、删除、排序、trim、case-fold 或推断 authority/identity 值。

#### Scenario: Preserve explicit Owner authority through round-trip

- **WHEN** validated Run context 包含一个 structural-valid `OwnerAuthorityFact`
- **THEN** write → read SHALL 返回字段等价的 Owner authority fact，且 persistence SHALL NOT 判断该 authority 对某 boundary 的 Policy eligibility

#### Scenario: Preserve absent authority as absent

- **WHEN** validated Run context 未提供 Owner authority fact
- **THEN** write → read SHALL 保持 authority absent，且系统 SHALL NOT 根据 Reviewer verdict、terminal state 或其他事实生成 Owner authority

#### Scenario: Preserve Author and Reviewer handoff identity

- **WHEN** Author Run 或 Reviewer Run 被持久化并重新读取
- **THEN** Run occurrence、DeliveryId、ChangeId、ActionId、role 与 previous/input Run reference SHALL 与写入前一致

### Requirement: Result round-trip preserves outcome facts without collapsing authority semantics

系统 SHALL 使 Run result 与 exact Run occurrence / Delivery / Change / Action linkage 绑定，并 SHALL 分离保存 Author conclusion、Reviewer verdict 与 Verification verdict。`verificationVerdict = null` SHALL 是普通中间 Change Run 的合法 durable value。reported next boundary SHALL 在本 capability 中仅作为 data 保存，不得被 persistence 解释为 legal boundary。

#### Scenario: Preserve Reviewer approval without inventing Verification PASS

- **WHEN** Reviewer Result 包含 reviewer verdict `approved` 且 `verificationVerdict = null`
- **THEN** write → read SHALL 保持这两个值不变，且系统 SHALL NOT 从 `approved` 推导 Verification PASS

#### Scenario: Preserve an Author conclusion independently

- **WHEN** Author Result 包含 Author conclusion 且 Reviewer/Verification verdict 不适用
- **THEN** write → read SHALL 保持 Author conclusion，并 SHALL 保持不适用 verdict 为 null/absent contract value，而不得复制 Author conclusion 到 Reviewer 或 Verification 字段

#### Scenario: Preserve reported next boundary as opaque handoff data

- **WHEN** Result 包含一个由当前 Action 报告的 next-boundary value
- **THEN** persistence SHALL 原样保存和读取该 value，且 SHALL NOT 判断该 boundary 是否由 Policy 允许

### Requirement: Run and Result integrity validation fails closed

系统 SHALL 在 durable bytes 被采用为 Run facts之前解析并执行 exact structural validation。invalid JSON、缺失 required field、未知字段（在 exact schema 处）、非法 identity/role/action/lifecycle/authority 值或 Run ↔ Result linkage mismatch SHALL 被拒绝；系统 SHALL NOT 通过 guess、default、trim、case-fold、alias、字段补齐或 silent repair 将 malformed durable state 变为有效事实。

#### Scenario: Reject malformed durable JSON

- **WHEN** `context.json` 或 `result.json` 为 truncated/invalid JSON
- **THEN** 系统 SHALL reject 该 Run record，且不得返回部分恢复的 durable fact

#### Scenario: Reject Run and Result occurrence mismatch

- **WHEN** `context.json` 与 `result.json` 声称属于不同 Run occurrence，或其 Delivery / Change / Action linkage 不一致
- **THEN** 系统 SHALL fail closed，且不得把二者 admission 为一个完整 Run

#### Scenario: Reject invalid embedded authority

- **WHEN** context 中携带 malformed `OwnerAuthorityFact`
- **THEN** 系统 SHALL reject context，且不得 normalize 或 fabricate authority

### Requirement: Durable Run occurrence creation is non-overwritable and sequence-unique

系统 SHALL 将一个已存在的 generated Run occurrence 视为 create-once durable history。创建新 Run 前，系统 SHALL 在 exact Change history 中拒绝已存在的目标 occurrence，并 SHALL 拒绝任何复用已占用 controlled Action sequence 的新 occurrence；失败 SHALL 在覆盖既有 durable bytes 之前发生。该 requirement 只适用于当前顺序/single-writer persistence contract，不要求 locking、WAL、事务或 multi-writer coordination。

#### Scenario: Reject writing an existing Run occurrence without changing prior bytes

- **WHEN** generated target occurrence directory 已经存在并包含 durable `action.md`、`context.json`、`result.json`
- **THEN** 新写入 SHALL fail closed，且 existing three-file bytes SHALL 保持完全不变

#### Scenario: Reject duplicate controlled sequence within one Change history

- **WHEN** exact Change history 中已有一个 valid occurrence 使用 controlled sequence `N`，随后请求创建另一个 sequence 同为 `N` 的 occurrence，即使 ActionId 不同
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 创建第二个 occurrence，从而保证 sequence ordering 无平局

### Requirement: Sequential Change-scoped history is readable without becoming a global registry

系统 SHALL 能够读取指定 Delivery / Change root 下的 durable Run occurrences，并按受控 Action sequence 确定稳定顺序，以支持 Author → Reviewer → Author 的顺序 handoff。该能力 SHALL NOT 构成跨 Delivery global Run registry、scheduler、locking 或自动 next-Action orchestration。

#### Scenario: Read a sequential Change history

- **WHEN** 指定 Change root 下存在多个 valid generated Run occurrences
- **THEN** 系统 SHALL 能够返回这些 valid Runs 的稳定 sequence order，使下一 Actor 能选择已明确引用/最新的 durable handoff fact

#### Scenario: Persistence does not auto-execute the next Action

- **WHEN** 最新 Result 报告一个 next boundary
- **THEN** history read SHALL 只返回该 durable fact，且系统 SHALL STOP 而不得自动 prepare、assign 或 execute 下一 Action
