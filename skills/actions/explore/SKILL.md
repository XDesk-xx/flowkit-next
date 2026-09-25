---
name: explore
description: Execute the already-decided Flowkit explore Action with proof-first bounded investigation, first-Explore project ordinal persistence, concise handoff, and STOP discipline.
metadata:
  author: flowkit
---

# Explore Action Guidance

## Authority

Flowkit/Policy has already decided the exact current Action `explore`.
This Guidance owns HOW only. It does not decide activation, legality, next Action, Role, Owner authority, Reviewer verdict, Verification truth, Change completion, Delivery Final, or Git authority.

## Required inputs

本 Skill 与 `skills/tools/openspec/SKILL.md` 均相对 manager 安装根解析；项目事实与 OpenSpec 命令 cwd 使用 target repositoryRoot。target 同名 Skills/lock 不接管系统来源，系统文件缺失不回退到 target 或 bootstrap。

Establish the exact Delivery/Change context, Owner scope, repository base, OpenSpec facts, accepted references, explicit non-goals, and the exact current Delivery Change coordination entry.

Use `skills/tools/openspec/SKILL.md` only for subordinate OpenSpec tool mechanics. OpenSpec remains specification/artifact truth.

## First-Explore project ordinal materialization

This phase runs only after Flowkit/Owner has already made the exact Change's `explore` Action current/legal.

`semantic ChangeId` remains the canonical Change identity. `projectOrdinal` is only a durable project-wide monotonic sequence/archive-naming fact.

For the exact current Change coordination entry:

1. If a valid positive-integer `projectOrdinal` is already present, reuse it unchanged. Do not allocate again.
2. If `projectOrdinal` is absent, inspect durable already-assigned `projectOrdinal` facts from repository Delivery Change coordination entries.
3. Require every assigned fact used for sequencing to be a valid positive integer and require assigned ordinals to be unambiguous/unique. If durable facts are malformed, duplicated, contradictory, or otherwise insufficient to derive one next value safely, STOP fail-closed.
4. Derive the next value as `max(existing assigned projectOrdinal) + 1` and persist it exactly once on the exact current Change coordination entry.
5. Planned-only Changes do not reserve numbers. An explored Change that is later cancelled keeps its already-assigned ordinal consumed.

Do not derive or substitute `projectOrdinal` from Delivery manifest array position, Run sequence, `changeStartSequence`, completed/archive counts, physical Run-group prefixes, or archive-directory counting.

If no durable assigned ordinal baseline exists, STOP and require an explicit bounded bootstrap/Owner decision rather than inventing a number.

## Method

Proof before platform: prove only what can materially change the bounded contract; prefer the minimum decisive proof.

1. Separate observable `fact / assumption / unknown / future possibility`.
2. For every material uncertainty use `risk → question → minimum decisive proof → evidence → decision impact`.
3. Prefer focused source/spec inspection, controlled experiments, counterexamples, or bounded non-production fixtures.
4. Do not implement production behavior during Explore.
5. Reuse accepted contracts/tools before proposing new abstractions.
6. End with durable facts, required invariants, resolved contract-changing unknowns, explicit non-goals, limitations, smallest Proposal-ready direction, and `PASS / FAIL / UNKNOWN`.
7. Never convert UNKNOWN into PASS.

## Canonical artifact convergence

Treat canonical Explore as the current bounded proof/rationale for the Change, not as an append-only revision chronology.

Keep facts, counterexamples, failed proof, or prior observations only when they still materially explain the current invariant or limitation. Express such material as current rationale rather than as `Reviewer correction`, `Owner correction`, or revision-diary sections.

Execution/review chronology needed for durable continuation belongs on the existing Run surface only at the bounded level required by the existing concise Run contract. Prefer concise exact Run/finding references when deeper provenance is useful. Git preserves exact repository history.

File size and line count are diagnostic signals only. They may trigger a semantic duplication/convergence check but are not correctness Gates.

## Concept ownership / mutation-order checks

Use these checks proportionally, only when the Explore is introducing a new concept/mechanism or involves stateful mutation.

Before naming a new mechanism, ask whether the need already belongs to an existing capability/entity, operation, state, configuration, validation/proof mechanic, or Guidance/HOW. Introduce a new capability only when the existing ownership model cannot express the proven need.

For stateful or side-effecting designs, identify validation, the mutation/commit point, what happens on failure before and after commit, and whether retry/rollback/correction remains legal. Simple non-mutating work does not require artificial state-machine analysis.

## Complexity / scope-drift check

Explicitly check for unjustified new capability, authority, lifecycle semantics, acceptance requirement, compatibility surface, later-Change content, or control plane.

Do not create Registry/Router/Planner/Runtime/cache/new lifecycle/identity subsystem/counter service merely to make ordinal persistence or an edge case cleaner.

## Run / handoff

Use only the existing concise three-file Run surface by default:

```text
action.md
context.json
result.json
```

Persist decisions and material identities, not duplicated canonical artifacts or command transcripts.

Carry materially relevant Owner decisions that affect later judgment, including authorized material handling and retention boundaries, using concise exact references rather than the full conversation. Distinguish temporary Explore experiments, accepted decision basis, and current implementation acceptance evidence. Historical proof is not current implementation PASS, and raw experiments need not be retained permanently unless the current contract or explicit Owner boundary requires their bytes.

Keep these namespaces distinct in handoff when relevant:

```text
projectOrdinal
changeStartSequence
current Run sequence
physical Run-group prefix
```

## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。今后新 Run 的三个 exact 文件路径在开始前检查；新必要 proof 的 exact 路径在接纳前用本次 manager domain.assertManagedEvidenceGitBytes 核对，作为 checkProof 的第四个参数传入。结构化证据保留空白诊断，历史证据不追溯。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

## Agent 顺序执行与 canonical Run

CLI 仅查询 `status/next/doctor`，结束即退出。Agent 读取本次 manager 安装的 canonical Guidance，用已有工具完成一个明确 Action；不使用 action 命令、JSONL、PID/PTY reservation 或 target 胶水工程。普通 Action 不增加 Owner 审批。Author 不能填写 Reviewer approved；Reviewer 必须独立执行并填写自己的真实 verdict。

以下是可在 Agent Node 文件工具中分段执行的示例，不是新 API、常驻程序或需要放入 target 的 helper。managerRoot 来自本机实际 Flowkit 安装位置，不由 target 请求覆盖；domain 取自该发行的 `dist/domain/index.js`。地址输入来自实际 target/coordination/唯一 Run 链，新 occurrence 必须尚未使用，不能拿 projectOrdinal 代替 changeStartSequence。

先读取既有 `evaluatePolicyAndNextBoundary` 所需真实 facts，确认本次 Action 合法且已明确执行，再完成只读 preparation。输入 preparedContext 使用既有 RunContextRecord 字段：runId、occurrence、actionIdentity、role、lifecycleState:"prepared"、ownerAuthority、previousRunId；保留有意义的 null，不填猜测权限。previousAction 为 null 或不同 terminal 时调用现有 prepare transition；若已是 exact same prepared，则复用它，不 duplicate prepare；不同 prepared target 必须拒绝。下面 currentForExecution 展示这一分支，其 expected GuidanceRef 只供 startRecord 对照；startRecord 调用 manager 自有 start 入口，以当前安装真实 Skill bytes 绑定 package、readiness 与 create-once 写入。纯结构 ref/package 不许可新 Run。再次执行仍使用新 occurrence/previousRunId 与新 package，不覆盖旧失败记录，不接管 partial。不得用自造 terminal JSON 代替这些步骤。

```js
// agent-record-start: preparation 已真实通过后执行；失败则不开始业务修改。
function currentForExecution(domain, previousAction, identity) {
  if (!domain.isActionIdentity(identity)) return null;
  if (domain.isCurrentAction(previousAction) && previousAction.state === "prepared") {
    return ["deliveryId", "changeId", "actionId"].every(key => previousAction.identity[key] === identity[key])
      ? previousAction : null;
  }
  return domain.transitionCurrentAction(previousAction, { type: "prepare", identity });
}

async function startRecord(domain, installation, input, currentAction, preparedContext, guidanceRef, prepare) {
  const assert = (await import("node:assert/strict")).default;
  assert.equal(typeof prepare, "function", "package-bound readiness required");
  return domain.startCanonicalActionRun(
    installation, input, currentAction, preparedContext, guidanceRef,
    async (actionPackage) => prepare(actionPackage),
  );
}
```

保留本次 exact 执行上下文（上例返回值）后，用 Agent 工具执行实际工作。不是要求一个 Node 进程一直存活，也不要求跨进程 callback；本次 start 所需的只读 package-bound preparation 函数只在本次调用内运行。不能仅凭遗留目录在另一个会话接管。开始后中断保留 partial，查询应报告 incomplete；action.md 单独存在不是机器 prepared 或 terminal。业务修改前开始文件保存失败即停止。

材料在产生时保存并核对，接纳前及后续相关消费时复核。facts 示例为 `{proofRefs:[{path,bytes,sha256,deliveryId,changeId,runId,purpose}],handoff:{summary,ownerDecisions:[{sourceRef,summary}],evidenceRefs:[{sourceRunId,path}]}}`；无新必要材料可用空数组，不创建空目录。旧 Run 不追溯强制这些键。只传当前判断需要的本次或同 Change 前序已声明引用；冲突/重复引用先核对，不能把 hash 相同当归属相同。以下只核对已声明单个文件，不扫描历史或创建目录：

```js
// agent-check-proof: producer/admission/related consumer，非 status/next。
async function checkProof(root, ref, identity, checkGitBytes) {
  const fs = await import("node:fs/promises");
  const path = (await import("node:path")).default;
  const assert = (await import("node:assert/strict")).default;
  const { createHash } = await import("node:crypto");
  for (const key of ["deliveryId", "changeId", "runId"]) assert.equal(ref[key], identity[key]);
  assert.ok(typeof ref.purpose === "string" && ref.purpose.trim());
  assert.ok(typeof ref.path === "string" && !ref.path.includes("\\"));
  const prefix = `.flowkit/artifacts/${identity.deliveryId}/changes/${identity.changeId}/proof/${identity.runId}/`;
  assert.ok(ref.path.startsWith(prefix));
  assert.ok(ref.path.split("/").every((part) => part && part !== "." && part !== ".."));
  assert.equal(typeof checkGitBytes, "function");
  await checkGitBytes(root, ref.path); // current manager domain.assertManagedEvidenceGitBytes
  const canonicalRoot = await fs.realpath(root);
  let file = canonicalRoot;
  for (const part of ref.path.split("/")) {
    file = path.join(file, part);
    assert.equal((await fs.lstat(file)).isSymbolicLink(), false, "linked material");
  }
  assert.equal(await fs.realpath(file), file, "material escaped");
  assert.equal((await fs.stat(file)).isFile(), true, "not regular");
  const bytes = await fs.readFile(file); // Buffer；不可读即失败
  assert.equal(bytes.length, ref.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), ref.sha256);
  return bytes;
}
```

逐项核对 proofRefs 的唯一 path/归属，handoff.evidenceRefs 必须对应当前或已读前序 Run 的声明，再用 checkProof 校验。读回命令摘要/报告中的实际退出状态、对象和限制，与拟填结论逐一对应；hash 只证明 bytes，不证明 PASS/真实工作。发生矛盾先修正结论或真实材料，禁止拼出 PASS。原始 stdout/stderr 按 Buffer 保存，不能把 raw stream 当结构化结果或默认要求所有历史 proof 存在。

真实工作、必要材料核对完成后，result 由该角色实际结论形成；再次核对 held package/Guidance 与当前目标未漂移，使用既有 admission/transition。下面只创建 context/result 缺项；任何已存在文件都报错，不覆盖，也不删除部分记录：

```js
// agent-record-finish: 不执行业务，不自动 next。
async function finishRecord(domain, held, result, materialChecked, terminal = true) {
  const fs = await import("node:fs/promises");
  const path = (await import("node:path")).default;
  const assert = (await import("node:assert/strict")).default;
  assert.equal(materialChecked, true, "necessary material unchecked");
  assert.equal(await fs.realpath(held.directory), held.directory);
  assert.equal(await fs.readFile(path.join(held.directory, "action.md"), "utf8"), held.actionMarkdown);
  assert.deepEqual((await fs.readdir(held.directory)).sort(), ["action.md"], "already completed or partial save");
  const admitted = domain.admitActionResult(held.actionPackage, held.currentAction,
    held.input.occurrence, result);
  assert.ok(admitted, "Result admission rejected");
  let context = held.preparedContext;
  if (terminal) {
    const ended = domain.transitionCurrentAction(held.currentAction,
      { type: "terminal", identity: held.actionPackage.actionIdentity });
    assert.ok(ended, "terminal rejected");
    context = { ...context, lifecycleState: ended.state };
  } else {
    for (const key of ["authorConclusion", "reviewerVerdict", "verificationVerdict", "nextBoundary"])
      assert.equal(result[key], null, "prepared has no outcomes");
  }
  for (const [name, value] of [["context.json", context], ["result.json", admitted]])
    await fs.writeFile(path.join(held.directory, name), JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
  const saved = await domain.readDurableRun(held.input);
  assert.deepEqual(saved, { actionMarkdown: held.actionMarkdown, context, result: admitted });
  return saved;
}
```

不能接纳业务结论时，不强填终态；仅在真实原因可表示时，以 prepared context 和四个 null outcome/next 槽保存失败原因（上例 terminal=false），否则保留 partial。合法业务 FAIL/changes-requested 是 terminal，不等于未完成。保存/读回失败报告 exact path，保留已写 bytes，不重做业务、不自动恢复。再次执行需要合法新 occurrence，而不是覆盖历史。

完成记录后以独立 `flowkit status/next --input <request>` 查询当前/后续边界，不填 Run 编号。查询不执行模型、Action、Review 或 Git；真实 Result 读回成功后 STOP。测试合成值仅验证结构/分支，不冒充真实工作或独立审查。

## Terminal boundary

Successful Explore stops at:

```text
review-explore
```

Do not create Proposal content, Apply implementation, archive work, next-Change activation, Delivery finalization, or Git mutation.

STOP after the real Explore Result is materialized.
