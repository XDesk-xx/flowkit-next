# 在已有 Agent Node/终端宿主中显式调用

这是一次已授权节点的 HOW，不是 stdin CLI、权限文件或自动流程。manager 安装必须已 build/pack；从安装位置导入，不从 target 同名文件导入。

```js
const { pathToFileURL } = await import("node:url");
const path = await import("node:path");
const host = await import(pathToFileURL(path.join(managerRoot,
  "skills/delivery/repository-integration/references/git-host.mjs")).href);

// readOwner 是 Agent 的实际 Owner 输入能力，不是 JSON.approved 或恒 true callback。
// 本次来源在授权工具/独立输入中已存在；缺失返回 null，不自造授权。
const material = await readOwner(ownerSourceRef);
if (!material) throw Error("Owner 来源不可读");
const result = await host.runCheckpoint(material.request, readOwner);
console.log(JSON.stringify(result)); // 读回 outcome，然后 STOP，不自动 push。
```

`material.request` 的精确形状（实际值由上述来源取得，不以例值执行）：

```js
{
  targetRoot: targetGitRoot,
  node: "delivery-start", // 或 change-checkpoint / repository-integration
  deliveryId,
  changeId: null, // change-checkpoint 才有 exact ChangeId
  ownerSourceRef,
  expectedBranch,
  operation: {
    kind: "create-new",
    paths: ["docs/决定.md", "src/main.ts"], // exact、排序、唯一；不是目录/glob
    commitMessage: "change(example-change): implement scoped update",
    commitShape: null // 或 {parents: [actualParent], count: 1}
  }
}
```

删除文件允许不存在，rename 要含源/目标。普通首个 commit 允许 unborn HEAD。目录、submodule、重定向 Git 环境或无法安全解释目标交人工核对；不扩张范围。

Change checkpoint 的 reader 还返回 `checkpointAuthorization`：既有 evaluator 输入 `{policyDecision, ownerAuthority, deliveryId, changeId}`。从当前事实取得 readiness，Owner fact 的 sourceRef 与本次来源一致；不要编造 Policy/权限。Start 后 Git 不需要这个 Change 输入。无关 dirty/staged 不阻断 reuse/push，但 create-new 不夹带范围外 staged。

独立 push 调用使用另一次明确授权的 request：

```js
const publication = await readOwner(pushOwnerSourceRef);
if (!publication) throw Error("push Owner 来源不可读");
// operation 为 {kind:"push", localCommit: exactSha, remote:"origin", targetRef:"refs/heads/main"}
const pushed = await host.runPush(publication.request, readOwner);
console.log(JSON.stringify(pushed)); // STOP。不是 PR/merge accepted。
```

当前薄宿主支持已配置的单一同读写 remote、refs/heads 目标与非强制推送；特殊多 push URL 由已有工具人工处理，不声称本入口已完成。失败先读回已有效果，不自动 retry/force/delete/rebase。

Integration 仍使用现有可信 preparation/source 输入及外部 acceptance：

```js
const integration = await readOwner(integrationOwnerSourceRef);
if (!integration) throw Error("Integration Owner 来源不可读");
const outcome = await host.runIntegration(integration.request, {
  input: integrationPreparationInput,
  readOwner,
  readIntegrationSource,
  // 可省略。省略或 PR pending 返回 incomplete，并携带已确认 checkpoint。
  performAcceptance: existingAuthorizedAcceptanceTool
});
console.log(JSON.stringify(outcome)); // STOP
```

`readIntegrationSource` 是已有 trusted source capability；不能用 callback status/PR id 生成 acceptance truth。远端接受时，宿主的真实来源须包含本次 remote 查询与 canonical ref 的一致核对，再返回既有 acceptance material。没有原生 provider 时人工交接，不重验 Full Test 日志或历史 proof。后续要复用时由当前权限明确选择 `{kind:"reuse-existing",checkpointCommit:actualSha}`，不要从头再 commit。
