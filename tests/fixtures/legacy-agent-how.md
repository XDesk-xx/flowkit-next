```js
// agent-record-start: preparation 已真实通过后执行；失败则不开始业务修改。
function currentForExecution(domain, previousAction, identity) {
  if (!domain.isActionIdentity(identity)) return null;
  if (
    domain.isCurrentAction(previousAction) &&
    previousAction.state === "prepared"
  ) {
    return ["deliveryId", "changeId", "actionId"].every(
      (key) => previousAction.identity[key] === identity[key],
    )
      ? previousAction
      : null;
  }
  return domain.transitionCurrentAction(previousAction, {
    type: "prepare",
    identity,
  });
}

async function startRecord(
  domain,
  installation,
  input,
  currentAction,
  preparedContext,
  guidanceRef,
  prepare,
) {
  const assert = (await import("node:assert/strict")).default;
  assert.equal(typeof prepare, "function", "package-bound readiness required");
  return domain.startCanonicalActionRun(
    installation,
    input,
    currentAction,
    preparedContext,
    guidanceRef,
    async (actionPackage) => prepare(actionPackage),
  );
}
```

```js
// agent-check-proof: producer/admission/related consumer，非 status/next。
async function checkProof(root, ref, identity, checkGitBytes) {
  const fs = await import("node:fs/promises");
  const path = (await import("node:path")).default;
  const assert = (await import("node:assert/strict")).default;
  const { createHash } = await import("node:crypto");
  for (const key of ["deliveryId", "changeId", "runId"])
    assert.equal(ref[key], identity[key]);
  assert.ok(typeof ref.purpose === "string" && ref.purpose.trim());
  assert.ok(typeof ref.path === "string" && !ref.path.includes("\\"));
  const prefix = `.flowkit/artifacts/${identity.deliveryId}/changes/${identity.changeId}/proof/${identity.runId}/`;
  assert.ok(ref.path.startsWith(prefix));
  assert.ok(
    ref.path.split("/").every((part) => part && part !== "." && part !== ".."),
  );
  assert.equal(typeof checkGitBytes, "function");
  await checkGitBytes(root, ref.path); // current manager domain.assertManagedEvidenceGitBytes
  const canonicalRoot = await fs.realpath(root);
  let file = canonicalRoot;
  for (const part of ref.path.split("/")) {
    file = path.join(file, part);
    assert.equal(
      (await fs.lstat(file)).isSymbolicLink(),
      false,
      "linked material",
    );
  }
  assert.equal(await fs.realpath(file), file, "material escaped");
  assert.equal((await fs.stat(file)).isFile(), true, "not regular");
  const bytes = await fs.readFile(file); // Buffer；不可读即失败
  assert.equal(bytes.length, ref.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), ref.sha256);
  return bytes;
}
```

```js
// agent-record-finish: 不执行业务，不自动 next。
async function finishRecord(
  domain,
  held,
  result,
  materialChecked,
  terminal = true,
) {
  const fs = await import("node:fs/promises");
  const path = (await import("node:path")).default;
  const assert = (await import("node:assert/strict")).default;
  assert.equal(materialChecked, true, "necessary material unchecked");
  assert.equal(await fs.realpath(held.directory), held.directory);
  assert.equal(
    await fs.readFile(path.join(held.directory, "action.md"), "utf8"),
    held.actionMarkdown,
  );
  assert.deepEqual(
    (await fs.readdir(held.directory)).sort(),
    ["action.md"],
    "already completed or partial save",
  );
  const admitted = domain.admitActionResult(
    held.actionPackage,
    held.currentAction,
    held.input.occurrence,
    result,
  );
  assert.ok(admitted, "Result admission rejected");
  let context = held.preparedContext;
  if (terminal) {
    const ended = domain.transitionCurrentAction(held.currentAction, {
      type: "terminal",
      identity: held.actionPackage.actionIdentity,
    });
    assert.ok(ended, "terminal rejected");
    context = { ...context, lifecycleState: ended.state };
  } else {
    for (const key of [
      "authorConclusion",
      "reviewerVerdict",
      "verificationVerdict",
      "nextBoundary",
    ])
      assert.equal(result[key], null, "prepared has no outcomes");
  }
  for (const [name, value] of [
    ["context.json", context],
    ["result.json", admitted],
  ])
    await fs.writeFile(
      path.join(held.directory, name),
      JSON.stringify(value, null, 2) + "\n",
      { flag: "wx" },
    );
  const saved = await domain.readDurableRun(held.input);
  assert.deepEqual(saved, {
    actionMarkdown: held.actionMarkdown,
    context,
    result: admitted,
  });
  return saved;
}
```
