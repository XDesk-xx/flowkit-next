---
name: flowkit-delivery-repository-integration
description: 在独立 Owner Git 授权下消费已确认 Final，并核验明确 checkpoint 操作及真实 repository acceptance。
---

# Delivery Repository Integration

只执行已经确定的 `delivery-repository-integration`。保持 singleton Owner authority 与同一 manager 的 content-bound Guidance；不读取 `.agents/skills/**` 或 target 同名系统 Guidance，不选择下一操作。

- preparation 与 Git mutation 前，从 project/固定 manifest 的 readDeliveryFinalization 取得 completed record，必须有有效 confirmationRef。null/缺失/mismatch/unconfirmed 不执行 Git callback，不补确认或重跑 Final。
- 不要求 caller 提供 Final 全 package、requiredEvidence、finalizedCandidateRef、Full Test 日志或历史 Run 快照；不计算替代整仓摘要或重新验收 Final。
- 绑定实际 HEAD、Delivery branch、targetMainRef/prestate、既有 acceptedBaseCommit provenance 和 Owner 明确 checkpointOperation。base 是本次 Git 来源，不回流为 Start 或安装身份门槛。
- create-new 显式包含排序唯一 exact paths、单行 commitMessage、commitShape（null 或 Owner 指定 parents/count）。不默认单普通提交或全仓 clean；null 也不授权额外 squash/rebase/多提交。reuse-existing 只核对已授权 exact object 与来源，不检查无关 index、不制造额外 commit。
- 新建前核对完整待提交 index，不是仅限制 add 参数，也不是把全部 tracked 文件当范围。范围外 staged/冲突先报告，不 unstage。每笔写入前重验权限/相关目标；用 literal argv，rename 两端均在范围。新建后逐个实际提交核对范围/指定形状，不用最终净 diff 掩盖中间越界。
- 两路径在 acceptance 前重验 target prestate。publication/PR/review/merge 仍是外部有界 mechanics；callback success、PR id 或返回 SHA 不替代接受来源。
- 从 Git 实读 canonical targetMainRef，并由可信 acceptance source 绑定本次 exact finalCommit、原 target prestate、Owner 指定操作/接受关系和 acceptedMainCommit。不能只凭任意同内容对象或 generic ancestry 放行。
- 返回最小 Integration record，nextDeliveryBase 等于真实 acceptedMainCommit，然后 STOP。

不重验 accepted object 中全部历史 evidence 或 Final v2 projection。Git 操作失败如实交接已经发生的效果，不自动补交、回滚、rebase、解决冲突、撤销 Final、重开 Change、发布 release 或启动下一 Delivery。旧形状不丢字段重签；D05 不由 candidate HOW 自我管理。

## 显式宿主调用

普通 Start 后 commit / Change checkpoint / push 不需要 Final 或 Integration package。已有 Agent 终端能力可显式导入本安装的 [git-host.mjs](references/git-host.mjs)，它只导出 runCheckpoint/runPush/runIntegration，导入零副作用；CLI/evaluator 仍只读。具体输入和可运行调用见 [host-call.md](references/host-call.md)。targetRoot 是实际 target Git 根，模块与 dist 均来自 manager；target 无需复制 Flowkit 资产。

权限 reader 必须来自宿主真实 Owner 输入能力，按 sourceRef 返回本次 target/node/完整 operation；不是 caller 自签 approved。Change checkpoint 另消费既有 evaluator；Integration 另消费 singleton/source/有效 Final。fixture 的合成来源不能声称真实 Owner/独立 Review。

宿主返回 completed/incomplete、phase、reason、observed checkpoint/remote、effect 和 remaining。completed 只代表请求节点；push 以本次 remote/ref 查询为准，不以 exit 0 或本地 ref 代替远端。PR id/pending/无 provider 交接未完成；内部 Integration 仍 failed + record=null。已有 commit 保留，未知用 null；下一调用读回事实、核对权限后明确 reuse 或人工处理，不盲重试。必要命令流按 Buffer 存 target artifacts，不新建 Git Run、不回写 SHA 触发额外提交。
