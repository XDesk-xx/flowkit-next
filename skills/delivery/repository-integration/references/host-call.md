# 固定 Git 命令的数据调用

这份 HOW 只用于已经确定且有独立 Owner 授权的 Git 节点。`$cli` 是本次选定 manager 的 `package.json#bin.flowkit`，`$target` 是实际 target Git 根，`$toolHome` 是实际 `FLOWKIT_HOME`。Agent 从真实 Owner 输入形成 `$ownerFact`；请求文件仅承载该事实，CLI 不监听或认证聊天。一次命令完成或返回未确认后即 STOP。

## 普通 checkpoint

以下 PowerShell 数据例使用已经核对的 `$ownerFact`、`$deliveryId`、`$expectedBranch`、`$paths`、`$commitMessage`。这些变量须来自本次真实授权和 Git 事实；不要将示例值当成授权。普通 Delivery Start 后的节点使用 `node="delivery-start"`、`changeId=null`。Change checkpoint 改用 `node="change-checkpoint"`、exact `changeId`，并在命令行附匹配的 `--change-id`；CLI 同时核对当前 Policy/evaluator。

```powershell
$gitRequest = @{
  targetRoot = $target
  node = 'delivery-start'
  deliveryId = $deliveryId
  changeId = $null
  ownerSourceRef = $ownerFact.sourceRef
  expectedBranch = $expectedBranch
  operation = @{
    kind = 'create-new'
    paths = $paths
    commitMessage = $commitMessage
    commitShape = $null
  }
}
$request = @{
  repositoryRoot = $target
  flowkitHome = $toolHome
  deliveryId = $deliveryId
  ownerAuthority = $ownerFact
  gitRequest = $gitRequest
}
$requestFile = Join-Path (Join-Path $target '.tmp') ('flowkit-git-' + [guid]::NewGuid().ToString('N') + '.json')
[IO.File]::WriteAllText($requestFile, ($request | ConvertTo-Json -Depth 12), [Text.UTF8Encoding]::new($false))
node $cli git checkpoint --repository-root $target --delivery-id $deliveryId --input $requestFile
```

`$paths` 是 exact、排序、唯一的路径集合，不是目录或 glob；rename 包含两端。`commitShape` 可为 Owner 选定的 `{parents,count}`。删除文件可已不存在。create-new 写前核对整个 index，不夹带范围外 staged，也不清空用户 index。失败读取 JSON `status/effect/outcome` 的已确认 commit、phase、reason 和 remaining；`written-unconfirmed` 不等于无副作用。不自动 push、rebase、force 或重试。`reuse-existing` 只在本次明确授权且现有对象可核对时使用。

## Push 与 Integration

`git push` 是另一次独立授权：顶层字段仍为 `repositoryRoot`、`flowkitHome`、`deliveryId`、适用的 `changeId`、本次 `ownerAuthority`、`gitRequest`；后者的 `operation` 固定为 `{kind:"push",localCommit,remote,targetRef}`，`ownerSourceRef` 与本次 Owner fact 一致。调用 `flowkit git push --repository-root <target> --delivery-id <deliveryId> [--change-id <changeId>] --input <request.json>`，核对本次 remote/ref 读回，不能以 exit 0、本地 ref 或 PR id 代替远端确认。特殊多 push URL 或 provider 接受由已有工具人工处理，交接未完成效果。

`git integrate` 使用独立 `decision=authorize-repository-integration` 的 Owner fact、有效 Final confirmation 与真实外部接受来源。请求顶层为 `repositoryRoot`、`flowkitHome`、`deliveryId`、`ownerAuthority`、`gitRequest`、`integrationInput`；`gitRequest` 的 `node="repository-integration"`、`changeId=null`、`operation=<checkpointOperation>` 与 `integrationInput.checkpointOperation` 完全一致。`integrationInput` 恰含 `acceptedBaseCommit`、`checkpointOperation`、`targetMainRef`。调用 `flowkit git integrate --repository-root <target> --delivery-id <deliveryId> --input <request.json>`。当 PR/merge 尚待外部接受时，命令交接已确认 checkpoint 和剩余步骤；外部完成后以 exact `reuse-existing` 请求和 target main ref 的真实 Git 关系只读确认，不从 callback 或 PR id 生成接受事实。

上述命令都要求可见目标与 JSON 匹配，输入中不放任意程序、模块路径、callback 或自签 `approved`。每次读取退出码与 JSON：`status="completed"` 只确认本次节点，`incomplete` 或部分效果须报告已确认对象和未知部分。Final、Review、测试 PASS 均不自动形成 Git 授权；不建立 Git Run，也不回写 SHA 制造下一次 commit。
