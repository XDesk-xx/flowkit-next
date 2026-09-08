# Review Explore：管理资产与目标项目分根

结论：`approved`，无阻断 finding。精确审查 `20260908-008-explore`；沿用 `projectOrdinal: 34`。

## 当前步骤

Owner 请求“根据最新run，review”。已核对 D05 active Change、激活来源、依赖 `007-archive` 的完成事实与本 Change 首次 `008-explore → review-explore` 交接。未将跨 Change 的 archive 伪装为本 Change 的 previousRun，也未按最大目录号选择 current。

依据独立 `.agents/skills/review-explore` 审查 Owner 规划、现行规范、源码和必要 proof；未读取或调用 candidate 同名 Reviewer HOW，未用 candidate CLI 管理本轮。

## 决定性事实与判断

- 当前 OpenSpec adapter 的同一个根同时用于 lock 与子进程 cwd；Action/Delivery Guidance 的解析和 Delivery 实际读取也使用该根。Explore 定位准确，不能只改 CLI 参数或 resolver 而漏掉 prepare/read 消费者。
- 独立复现无 lock/Guidance 的 target 失败、同名资产改变解析、相同管理资产换目录仍保持相对路径/内容身份、缺 runtime 的局部诊断；额外确认 manager 的 exact Delivery Guidance ref 在 target/冲突根读取被拒绝。
- 真实 OpenSpec 1.10.0 在独立 bare target 执行成功，返回根精确匹配；该 target 无 Flowkit package、lock 或系统 Skills。这里证明分根组合可行，不证明产品安装接入已实现。
- 已核对 54 个精确输入引用及原始命令输出；Author 的 26/26 定向测试仅作为现行行为背景，本 Reviewer 未重跑该测试组。首次 ordinal 的既有值唯一性与 max+1 读回成立；计数、路径、HEAD 仅定位本次事实，不新增准入常量。

## 复杂度与最小性

通过。复用固定路径、内容绑定、现有 runtime confinement 和 OpenSpec observation，只分清 manager/target/tool runtime 归属；不需要 Registry、存储平台、全目录 runtime 摘要或新宿主执行器。

安装入口的可信根注入、最小发行内容及安装后验收属于下一 Propose/Apply 的有界设计与实现工作。Proposal 须保留 Explore 已列出的实际安装布局 CLI/adapter 验收、同名冲突、移位与直接消费者闭包；不得用本次组合实验替代。

## 新内容与范围漂移

scope drift: NONE。manager 自身安装身份与 D05 自开发独立 bootstrap 分开说明，不让普通 target 以上一 Delivery commit 定义 manager，也不在本轮更换管理本仓库的 authority。

宿主接入、idle/current 自动发现、Full Test 范围/保存、Start Git 前置、Final 简化及 Git 调用仍留给后续 Changes；必要 artifacts 的 target 归属只明确边界，不提前实现存储协议。

## 证据与 STOP

[Reviewer proof](../../../../artifacts/20260908-05-lightweight-workflow-management/changes/separate-manager-assets-from-target-project/proof/20260908-009-review-explore/README.md) 保存独立方法、输入、输出和失败尝试。脚本生成插值错误发生在写入前；实际 attempt-01 因沙箱 Git spawn EPERM 结束，同一脚本获准后 attempt-02 成功。按错误恢复 Skill 区分命令/环境问题，没有修改产品或历史证据。

1717 个受保护文件的前后摘要一致。本次只新增 Reviewer Run/proof；不修改 Author Explore/manifest、产品或旧 Run。

报告现行约定下的 Propose readiness，未执行 Propose、Apply、Formal Full Test 或 Git。Reviewer approved 不是实现/Verification PASS 或新 Owner authority。STOP。
