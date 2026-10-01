---
name: flowkit-delivery-repository-integration
description: 在独立 Owner Git 授权下消费已确认 Final，并核验明确 checkpoint 操作及真实 repository acceptance。
---

# Delivery Repository Integration

只执行已经确定的 `delivery-repository-integration`。保持 singleton Owner authority 与同一 manager 的 content-bound Guidance；不读取 `.agents/skills/**` 或 target 同名系统 Guidance，不选择下一操作。

- preparation 与 Git mutation 前，从 project/固定 manifest 的 readDeliveryFinalization 取得 completed record，必须有有效 confirmationRef。null/缺失/mismatch/unconfirmed 不执行 `git integrate` 的 Git 操作，不补确认或重跑 Final。
- 不要求 caller 提供 Final 全 package、requiredEvidence、finalizedCandidateRef、Full Test 日志或历史 Run 快照；不计算替代整仓摘要或重新验收 Final。
- 绑定实际 HEAD、Delivery branch、targetMainRef/prestate、既有 acceptedBaseCommit provenance 和 Owner 明确 checkpointOperation。base 是本次 Git 来源，不回流为 Start 或安装身份门槛。
- create-new 显式包含排序唯一 exact paths、单行 commitMessage、commitShape（null 或 Owner 指定 parents/count）。不默认单普通提交或全仓 clean；null 也不授权额外 squash/rebase/多提交。reuse-existing 只核对已授权 exact object 与来源，不检查无关 index、不制造额外 commit。
- 新建前核对完整待提交 index，不是仅限制 add 参数，也不是把全部 tracked 文件当范围。范围外 staged/冲突先报告，不 unstage。每笔写入前重验权限/相关目标；用 literal argv，rename 两端均在范围。新建后逐个实际提交核对范围/指定形状，不用最终净 diff 掩盖中间越界。
- 两路径在 acceptance 前重验 target prestate。publication/PR/review/merge 仍是外部有界 mechanics；命令成功、PR id 或返回 SHA 不替代接受来源。
- 从 Git 实读 canonical targetMainRef，并由可信 acceptance source 绑定本次 exact finalCommit、原 target prestate、Owner 指定操作/接受关系和 acceptedMainCommit。不能只凭任意同内容对象或 generic ancestry 放行。
- 返回最小 Integration record，nextDeliveryBase 等于真实 acceptedMainCommit，然后 STOP。

不重验 accepted object 中全部历史 evidence 或 Final v2 projection。Git 操作失败如实交接已经发生的效果，不自动补交、回滚、rebase、解决冲突、撤销 Final、重开 Change、发布 release 或启动下一 Delivery。旧形状不丢字段重签；D05 不由 candidate HOW 自我管理。

## 固定命令调用

普通 Start 后 commit / Change checkpoint / push 不需要 Final 或 Integration package。在本安装 `flowkit git checkpoint`、`flowkit git push`、`flowkit git integrate` 中按已授权的 exact 节点选一个，提交封闭 JSON 请求并核对结果后 STOP。`git integrate` 只在真实外部接受关系可核对时确认；PR/merge 的实际接受仍由外部有界 mechanics 完成。具体可见参数、请求字段及部分成功交接见 [固定命令 HOW](references/host-call.md)。targetRoot 是实际 target Git 根，发行命令来自 manager；target 无需复制 Flowkit 资产。

Agent 从宿主真实 Owner 输入形成本次 `OwnerAuthorityFact` 与 `sourceRef`，提交的 `gitRequest.ownerSourceRef` 必须匹配；CLI 核对目标、结构、当前事实和适用 evaluator，不独立监听或认证聊天。Change checkpoint 另消费既有 evaluator；Integration 另消费 singleton/source/有效 Final。fixture 的合成来源不能声称真实 Owner/独立 Review。

固定命令返回 `status`、`effect` 和有界 `outcome`（包括适用的 phase、reason、checkpoint/remote 与 remaining）。`completed` 只代表请求节点；push 以本次 remote/ref 查询为准，不以 exit 0 或本地 ref 代替远端。PR id/pending/无 provider 交接未完成；内部 Integration 仍 failed + record=null。已有 commit 保留，未知用 null；下一调用读回事实、核对权限后明确 reuse 或人工处理，不盲重试。必要命令流按 Buffer 存 target artifacts，不新建 Git Run、不回写 SHA 触发额外提交。
