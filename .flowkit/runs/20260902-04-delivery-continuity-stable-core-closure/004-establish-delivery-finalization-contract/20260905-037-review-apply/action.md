# Action — Review Apply

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: establish-delivery-finalization-contract
role: reviewer
action: review-apply
input: 20260905-036-apply
approved-proposal: 20260905-035-review-propose
base: a170da0373867296813a888c57db8325025a8f5d
```

## Verdict

```text
CHANGES REQUESTED
```

Apply 的总体方向、边界与复杂度合理，但 canonical Delivery manifest writer 存在一个阻断性的合同偏差。修订只需要局部修正 writer 与 focused test，不需要重做 Delivery Final 设计。

## D04-RA004-001 — writer 全量重序列化 manifest，越过批准字段边界

批准合同明确要求：

```text
design.md:204
→ writer 保留 manifest 其他 accepted content/ordering

tasks.md:20
→ 只更新 approved Delivery/finalization fields
```

当前实现先把完整 YAML 解析成 plain object，再替换两个字段，最后对整个 document 执行：

```text
src/internal/delivery-final-coordination.ts:304
→ stringify(parsed.document)
```

这不是只更新批准字段。Reviewer 对当前 canonical manifest 做了与 writer 相同的只读 `parse → stringify` 复现，即使不设置任何 Final 字段也已得到：

```text
byte equal                 → false
original                   → 12,839 bytes / 207 lines
reserialized               → 12,868 bytes / 248 lines
positionally changed lines → 248
quoted delivery id         → quotes removed
```

因此真实 Delivery Final 会在写入获批 closure fields 之外，同时重写大量无关 YAML 表示：引号、换行、空行与长 scalar wrapping 都会变化。Git 以 repository bytes 为事实边界；这些额外字节 mutation 没有获得本 Change 的语义授权，并且会不必要地扰动 completed coordination identity 与后续 candidate identity。

现有测试只证明唯一目标文件发生修改，并检查几个 completed 字段；它没有证明 target 文件内的其他 accepted content/ordering 保持不变。

### 最小 revise-apply

只修正 operation-local writer：

1. 对 canonical manifest 做 bounded、保留其他内容/顺序的更新；可以采用能保留 YAML document presentation 的局部方式，但不要引入 generic patch/schema/mutation framework。
2. 只允许 `delivery` 的批准状态/lineage fields 与新增 exact `finalization` block 发生变化。
3. 增加 focused fixture，包含 quoted scalar、长 scalar、空行或 comment 以及无关 section；断言所有非目标内容/顺序保持不变，同时保留现有 staging/replace/re-read fail-closed 和 single-target 证明。

## 已通过的实现审查

除该 writer 偏差外，Reviewer 确认下列实现与批准 Proposal 一致：

```text
Architecture callback retained-lineage isolation
exact nine-field thin compare admission
exact ten-field presentation values
post-materialization candidate continuity
architecture-finalization exact projection/ref
closed delivery-final package + exact Owner authority
complete prerequisite and six-output revalidation
defensive bounded callback
delivery-finalization exact projection/ref
no finalizedCandidateRef self-reference in manifest
no Git / repository integration / next-operation capability
no actual D04 Final operation or Change 5 execution
```

## 独立验证

```text
managed OpenSpec change --strict → PASS
managed OpenSpec --all --strict  → 21/21 PASS
acceptance                       → 5/5 PASS
focused Windows rerun            → 29/30 PASS
git diff --check                 → PASS
```

Focused 唯一失败是 `tests/unit/domain/delivery-operation-execution.test.ts:306` 的 `chmod(0o000)` unreadable fixture 在 Windows/NTFS 上仍可读取；这是已记录的平台夹具差异，不是本 Change 的产品缺陷，也不是本 verdict 的依据。

OpenSpec structural PASS 与其他测试 PASS 不能覆盖 D04-RA004-001，因为当前 suite 没有断言 target manifest 内非目标内容保持不变。

## Complexity / scope assessment

```text
implementation complexity → PROPORTIONAL_AND_BOUNDED
new control plane          → NONE
new authority              → NONE
scope drift                → NONE
blocking defect            → ONE_LOCAL_WRITER_CONTRACT_DEVIATION
```

本 finding 不授权新增通用 YAML 编辑平台、Registry、transaction/rollback framework 或其他 Delivery lifecycle。

## Current step

本次 Review Apply 的问题是：`036-apply` 是否忠实实现已批准 Proposal，并具有足以进入 archive 的独立证据。

当前结论：主体实现可保留，但 writer 尚未满足 exact bounded mutation contract；`archiveAllowed=false`，下一合法边界为 `revise-apply`。

STOP.
