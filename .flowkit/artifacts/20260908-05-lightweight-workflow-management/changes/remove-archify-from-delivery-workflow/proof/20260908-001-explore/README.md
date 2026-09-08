# D05 首个 Change：Explore proof

归属：`flowkit-next` / `20260908-05-lightweight-workflow-management` / `remove-archify-from-delivery-workflow` / `20260908-001-explore`。

Owner 要求按 D05 文档保存 proof；必要内容默认长期保留在此目录，不覆盖已完成 attempt，不依赖 `.tmp` 或项目外存储。本目录不是新的 Runtime schema、Registry 或 EvidenceStore。

## 内容

- `probe.mjs`：本次有界实验脚本，不是产品实现或生命周期执行器。
- `attempt-01/summary.json`：真实执行时间、平台、观察与限制。
- `attempt-01/*command.json`、`*.stdout.txt`、`*.stderr.txt`：实际命令、退出状态和原始输出。
- `attempt-01/source-inputs.json`：输入文件摘要和来源 HEAD，仅定位和局部完整性用途。
- `attempt-01/ordinal-inputs.json`：当前 manifest 已分配序号的实际读回。
- `attempt-01/fixture/`：模拟 list-only OpenSpec、工具 lock、project/manifest 最小输入；不是可发行或真实安装的 runtime。
- `attempt-01/doctor-observation.json`、`start-observation.json`、`required-evidence-*.json`：三个反例的必要输入/观察。
- `seal.mjs`、`handoff-audit.json`：本次 bootstrap 交接的局部读回与完整性记录，不是产品接纳实现。

## 实验结果与限制

doctor 在两个模拟 OpenSpec diagnostic 为 pass 时，仅因 Archify 缺失整体 fail；Start 缺图触发内容生成早期拒绝；共享 required evidence 去掉 architecture 后 shape 校验失败。七个现行定向测试文件 59/59 PASS，0 skipped。

这些是现有耦合与旧合同的局部基线，绝不表示 D05 拆除后实现 PASS、真实 OpenSpec 端到端 PASS、Linux detached PASS 或 Formal Full Test PASS。Start 实验只定位早期缺图 guard；合成 evidence 只用于 shape 校验，不是 Run/Review/Full Test 事实。

## 复验

在具备记录中的依赖和对应源码的仓库根目录执行：

```powershell
node --import tsx .flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/remove-archify-from-delivery-workflow/proof/20260908-001-explore/probe.mjs review-attempt-02
```

必须换用未存在的 attempt 名称，旧目录会被拒绝覆盖。源码变化后新观察只适用于新输入，不覆盖当时输出，不要求以后一定能够复现当时环境。脚本不会安装或卸载外部工具；现行定向测试使用自己的隔离 fixture。

`seal.mjs` 是本次 Author 收尾专用、一次性写入本 Run Result 的脚本，不在复验时重跑。Reviewer 使用新的审查记录，不覆盖 Author Result。

`handoff-audit.json` 记录此目录必要文件、Explore、manifest 与 Run 输入的本地 SHA-256/大小。其作用是发现交接后的变化；真实执行依据仍是实际命令输出和独立核验，hash 匹配不等于 Reviewer approved。
