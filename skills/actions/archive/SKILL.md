---
name: archive
description: Execute the already-decided Flowkit archive Action with canonical OpenSpec convergence, persisted projectOrdinal naming, completion/continuity materialization, handoff, and STOP.
metadata:
  author: flowkit
---

# Archive Action Guidance

## Authority

Flowkit/Policy has already supplied the exact current legal Action `archive`.

At archive entry the Change is still `active`.
This Guidance MUST NOT decide archive legality and MUST NOT require a pre-existing `completed` Change state.

`completed` is a post-archive materialization fact owned by the existing Flowkit lifecycle/coordination contract.

This Guidance does not decide the next Change, activate another Change, perform Delivery Final, or own Git authority.

## Required inputs

本 Skill 与 `skills/tools/openspec/SKILL.md` 均相对 manager 安装根解析；项目事实与 OpenSpec 命令 cwd 使用 target repositoryRoot。target 同名 Skills/lock 不接管系统来源，系统文件缺失不回退到 target 或 bootstrap。

Establish the exact current Delivery ID/manifest, semantic ChangeId, exact Change coordination entry, already-authorized `archive` Action, accepted terminal review/apply facts, current OpenSpec status/delta state, and handoff/continuity requirements.

Use `skills/tools/openspec/SKILL.md` for subordinate OpenSpec mechanics.

## Consume the persisted project Change ordinal

`semantic ChangeId` remains canonical Change identity. `projectOrdinal` is only a durable project-wide monotonic sequence/archive-naming fact that must already have been assigned during first actual Explore.

For the exact current Change coordination entry:

1. Require exactly one semantic ChangeId match.
2. Require an existing valid positive-integer `projectOrdinal` on that exact entry.
3. Verify assigned projectOrdinal facts are not duplicated/contradictory in durable Delivery Change coordination data relevant to this repository. If the current value is missing, malformed, duplicated or inconsistent, STOP fail-closed before archive target materialization.
4. Reuse the persisted value unchanged. Archive MUST NOT allocate, increment, compact, repair, or recompute it.
5. Format the persisted value with at least three digits for the archive name.

Never derive or substitute the archive ordinal from Delivery manifest array position, Run sequence, `changeStartSequence`, completed-Change count, archive-directory count, physical Run-group prefix, or any archive-time count.

## Archive target

Materialize:

```text
YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>
```

For current Change `converge-author-action-guidance` with persisted `projectOrdinal: 21`, the target uses `021` regardless of Run numbering.

Do not stack another date prefix.

## Package-bound archive preparation

Archive readiness is real self-check HOW, not a new Action or lifecycle state. It runs inside the already-decided `archive` invocation only after the exact canonical Guidance identity is frozen into the exact ActionPackage and before archive mutation begins.

Check at minimum, when materially applicable:

- the accepted `review-apply` after `apply` / `revise-apply` still corresponds to the exact candidate bytes;
- no post-review repository/canonical byte drift invalidated that acceptance;
- the exact Change is still the active archive target and its persisted projectOrdinal remains valid;
- OpenSpec planning/tasks/delta-sync and archive-target collision/identity facts are ready;
- an isolated canonical-convergence dry-run succeeds and the resulting converged candidate passes affected domain verification plus any materially applicable engineering gates before real archive mutation;
- completion-transition readiness is satisfied without requiring a pre-existing `completed` state;
- handoff/removal facts needed for continuation are complete;
- no known correction blocker remains.

Treat post-convergence verification as part of preparation, not as a post-mutation cleanup check. The dry-run MUST exercise the canonical bytes that archive would actually materialize. A verification failure that proves repository/canonical bytes must change is a correction blocker even when OpenSpec structural validation itself passes.

If readiness is blocked by an environment-only condition and candidate bytes remain unchanged, STOP without archive mutation and allow same-candidate retry. If readiness finds a correction requiring repository/canonical byte mutation, including a post-convergence verification failure, STOP before archive mutation and return to the existing Owner-controlled correction path; changed bytes require a fresh `review-apply` before archive can be attempted again.

A valid `review-apply` acceptance makes normal archive execution ready through existing Policy. Do not require a second Owner archive execution authorization.

## Canonical convergence

Use the applicable OpenSpec archive/sync mechanics to assess delta sync, converge approved requirements into canonical specs, verify convergence, and move the exact Change to the derived target.

Do not fork OpenSpec semantics or redesign accepted production behavior during archive.

## Completion / continuity materialization

After successful archive movement/convergence, update only existing Flowkit completion/continuity/handoff facts required by the accepted lifecycle.

This is where the Change may become `completed`; never require that state before archive.

No hidden next-Change activation is allowed.

## Complexity / scope-drift

Do not introduce production redesign, new lifecycle state, ordinal allocator/counter service, Registry/Router/Planner/Runtime, historical mass rename, automatic next Change, or automatic Git action.

## Run / handoff

Continuation must preserve the latest delta plus all materially required uncommitted ancestor state. Use cumulative payloads or exact retrievable ancestor references and carry exact removal information when needed; do not introduce a payload registry/database.

Keep the three-file Run concise and record exact archive path, persisted projectOrdinal, spec-sync result, completion/continuity facts, and material artifact/hash identities.

Keep `projectOrdinal`, `changeStartSequence`, current Run sequence and physical Run-group prefix distinct.

## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

## Agent 顺序执行与 canonical Run

CLI 仅查询 `status/next/doctor`，结束即退出。Agent 读取本次 manager 安装的 canonical Guidance，用已有工具完成一个明确 Action；不使用 action 命令、JSONL、PID/PTY reservation 或 target 胶水工程。普通 Action 不增加 Owner 审批。Author 不能填写 Reviewer approved；Reviewer 必须独立执行并填写自己的真实 verdict。

以下是可在 Agent Node 文件工具中分段执行的示例，不是新 API、常驻程序或需要放入 target 的 helper。managerRoot 来自本机实际 Flowkit 安装位置，不由 target 请求覆盖；domain 取自该发行的 `dist/domain/index.js`。地址输入来自实际 target/coordination/唯一 Run 链，新 occurrence 必须尚未使用，不能拿 projectOrdinal 代替 changeStartSequence。

先读取既有 `evaluatePolicyAndNextBoundary` 所需真实 facts，确认本次 Action 合法且已明确执行，再完成只读 preparation。输入 preparedContext 使用既有 RunContextRecord 字段：runId、occurrence、actionIdentity、role、lifecycleState:"prepared"、ownerAuthority、previousRunId；保留有意义的 null，不填猜测权限。previousAction 为 null 或不同 terminal 时调用现有 prepare transition；若已是 exact same prepared，则复用它，不 duplicate prepare；不同 prepared target 必须拒绝。下面 currentForExecution 展示这一分支，其结果经 `resolveActionGuidanceRef` 核对 Guidance 后交给 startRecord。再次执行仍使用新 occurrence/previousRunId 与新 package，不覆盖旧失败记录，不接管 partial。不得用自造 terminal JSON 代替这些步骤。

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

async function startRecord(domain, input, currentAction, preparedContext, guidanceRef, ready) {
  const fs = await import("node:fs/promises");
  const path = (await import("node:path")).default;
  const assert = (await import("node:assert/strict")).default;
  assert.equal(ready, true, "preparation blocked");
  const address = domain.buildRunAddress(input);
  assert.ok(address, "invalid address");
  const actionPackage = domain.formActionPackage(currentAction, preparedContext, guidanceRef);
  assert.ok(actionPackage, "invalid package/Role");
  assert.equal(address.runId, actionPackage.runId);
  assert.deepEqual(actionPackage.actionIdentity, {
    deliveryId: input.deliveryId, changeId: input.changeId, actionId: input.occurrence.actionId,
  });
  const root = await fs.realpath(input.repositoryRoot);
  const relative = path.relative(input.repositoryRoot, address.changeRoot);
  assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  let parent = root;
  for (const segment of relative.split(path.sep)) {
    parent = path.join(parent, segment);
    try { await fs.mkdir(parent); } catch (error) { if (error.code !== "EEXIST") throw error; }
    assert.equal((await fs.lstat(parent)).isSymbolicLink(), false);
    assert.equal(await fs.realpath(parent), parent, "Run parent escaped");
  }
  for (const name of await fs.readdir(parent)) {
    const occurrence = domain.parseRunOccurrenceId(name);
    assert.ok(occurrence, "invalid Run entry");
    assert.notEqual(occurrence.sequence, input.occurrence.sequence, "sequence already exists");
  }
  const directory = path.join(parent, address.runId);
  await fs.mkdir(directory); // existing occurrence 不接管
  const actionMarkdown = "# Action started\n\n" + JSON.stringify({
    startedAt: new Date().toISOString(), repositoryRoot: root, actionPackage,
  }, null, 2) + "\n";
  await fs.writeFile(path.join(directory, "action.md"), actionMarkdown, { flag: "wx" });
  assert.equal(await fs.readFile(path.join(directory, "action.md"), "utf8"), actionMarkdown);
  return { input: { ...input, repositoryRoot: root }, directory, actionMarkdown,
    currentAction, preparedContext, actionPackage };
}
```

保留本次 exact 执行上下文（上例返回值）后，用 Agent 工具执行实际工作。不是要求一个 Node 进程一直存活，也不要求 callback；不能仅凭遗留目录在另一个会话接管。开始后中断保留 partial，查询应报告 incomplete；action.md 单独存在不是机器 prepared 或 terminal。业务修改前开始文件保存失败即停止。

材料在产生时保存并核对，接纳前及后续相关消费时复核。facts 示例为 `{proofRefs:[{path,bytes,sha256,deliveryId,changeId,runId,purpose}],handoff:{summary,ownerDecisions:[{sourceRef,summary}],evidenceRefs:[{sourceRunId,path}]}}`；无新必要材料可用空数组，不创建空目录。旧 Run 不追溯强制这些键。只传当前判断需要的本次或同 Change 前序已声明引用；冲突/重复引用先核对，不能把 hash 相同当归属相同。以下只核对已声明单个文件，不扫描历史或创建目录：

```js
// agent-check-proof: producer/admission/related consumer，非 status/next。
async function checkProof(root, ref, identity) {
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

After archive completion/materialization:

```text
STOP
```

Do not activate another Change, finalize the Delivery, or commit/push/merge unless a separate legal boundary supplies those actions.
