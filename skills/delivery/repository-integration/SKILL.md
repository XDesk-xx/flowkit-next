---
name: flowkit-delivery-repository-integration
description: 在独立 Owner Git 授权下消费已确认 Final，并核验明确 checkpoint 操作及真实 repository acceptance。
---

# Delivery Repository Integration

只执行已经确定的 `delivery-repository-integration`。保持 singleton Owner authority 与同一 manager 的 content-bound Guidance；不读取 `.agents/skills/**` 或 target 同名系统 Guidance，不选择下一操作。

- preparation 与 Git mutation 前，从 project/固定 manifest 的 readDeliveryFinalization 取得 completed record，必须有有效 confirmationRef。null/缺失/mismatch/unconfirmed 不执行 Git callback，不补确认或重跑 Final。
- 不要求 caller 提供 Final 全 package、requiredEvidence、finalizedCandidateRef、Full Test 日志或历史 Run 快照；不计算替代整仓摘要或重新验收 Final。
- 绑定实际 HEAD、Delivery branch、targetMainRef/prestate、既有 acceptedBaseCommit provenance 和 Owner 明确 checkpointOperation。base 是本次 Git 来源，不回流为 Start 或安装身份门槛。
- create-new 仍验证恰好一个普通 commit、bound parent/count=1 和 clean poststate；reuse-existing 核对已授权 exact object、来源与 clean，不调用新建 callback，不制造额外 commit。
- 两路径在 acceptance 前重验 target prestate。publication/PR/review/merge 仍是外部有界 mechanics；callback success、PR id 或返回 SHA 不替代接受来源。
- 从 Git 实读 canonical targetMainRef，并由可信 acceptance source 绑定本次 exact finalCommit、原 target prestate、Owner 指定操作/接受关系和 acceptedMainCommit。不能只凭任意同内容对象或 generic ancestry 放行。
- 返回最小 Integration record，nextDeliveryBase 等于真实 acceptedMainCommit，然后 STOP。

不重验 accepted object 中全部历史 evidence 或 Final v2 projection。Git 操作失败如实交接已经发生的效果，不自动补交、回滚、rebase、解决冲突、撤销 Final、重开 Change、发布 release 或启动下一 Delivery。旧形状不丢字段重签；D05 不由 candidate HOW 自我管理。
