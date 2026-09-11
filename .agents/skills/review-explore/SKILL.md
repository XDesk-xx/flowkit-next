---
name: review-explore
description: Independently review Flowkit Explore evidence for truth, bounded proof, scope discipline, Proposal readiness, minimality, and scope drift during Stable Core development.
metadata:
  author: flowkit
---

# Review Explore Bootstrap Skill

## Stable Core bootstrap independence

This `.agents` Skill is the independent flowkit-next self-development Reviewer HOW through D04 closure.
It MUST NOT read, execute, invoke, delegate to, or become a thin pointer to candidate `skills/actions/review-explore/SKILL.md`.
Equivalent discipline must live in this file's own bytes so the candidate product Guidance never proves itself.

## Authority boundary

Reviewer may inspect facts, challenge assumptions, reproduce decisive proof, issue bounded findings, and return a verdict.
Reviewer is mutation-free: it MUST NOT modify Author artifacts/production bytes, perform revise/apply/archive work, create Owner authority, claim Verification PASS, decide the next legal Action, or auto-continue after its Result.

## Exact input / chain

Review the exact supplied Explore artifact and materially relevant approved Owner/review/canonical chain. Do not guess current truth from Run history or inspect only the latest payload when prior accepted boundaries materially determine the verdict.

## Review model

1. Confirm real Owner goal / actors / input domain / non-goals and explicit scope corrections.
2. Separate fact / assumption / unknown / historical evidence / future possibility.
3. Require only decisive proof that can change the bounded contract; do not block on exhaustive proof for explicit non-goals.
4. Reject claims broader than evidence or happy-path-only proof for a material invariant.
5. Confirm remaining uncertainty cannot change Proposal, otherwise request the smallest missing proof.
6. Prefer reuse/minimal boundary over Registry/Router/Planner/Runtime/control-plane growth.

## Semantic invariant / literal challenge

Classify material literals as stable contract constant, configuration/environment value, or incidental current-state observation. Lifecycle-transient states, current ordinals/counts/paths/orderings are not durable invariants merely because they match today. Require the stable semantic invariant or synthetic fixture instead.

## Finding / artifact convergence discipline

For each material finding identify the exact affected artifact/claim, observed fact, contract impact, and minimum correction. Do not restate the whole Author Explore or proof transcript. Flag chronology that leaked into canonical Explore when superseded or no longer material when it no longer explains current truth. Reviewer remains independently mutation-free.

## Required Reviewer report

Briefly report:

- current-step explanation;
- complexity / minimality assessment;
- new-content / scope-drift assessment.

Necessary detail inside the already-approved boundary is not scope drift.

## Run / handoff concision

Use only `action.md + context.json + result.json`. Keep exact reviewed identities, decisive facts, bounded findings, verdict, assessments, and continuation refs; reference large canonical artifacts/evidence rather than duplicating them.

## Verdict / STOP

Use `approved`, `changes-requested`, or `rejected`.
Reviewer approval is not Verification PASS or Owner/Git authority.
After the real Result is materialized, STOP and do not execute the next boundary.


## 必要材料与相关交接

必要 proof 在产生时保存到 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，默认长期保留；`.tmp` 仅放可丢弃工作文件。没有必要新材料时不创建空 proof 目录。不得覆盖历史材料或把旧 PASS 当成本次实现验收。

原始流按 Buffer bytes 保存，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`；命令、起止时间、实际退出状态及环境限制另存必要摘要，secret 不收集。不得为通过文本检查格式化原始流，也不得把脚本、Run JSON、摘要改名冒充日志。本仓库四条通用 attributes 规则覆盖这些原始流，不逐 Change 追加例外，不与 `.gitignore` 或 Full Test 范围绑定；其他 target 的 Git 配置仍由该项目控制。

交接只携带下一步确需的文件引用与会影响判断的 Owner 决定（真实 sourceRef、简要决定、材料处理授权与保留边界），不复制聊天或默认传递全部祖先 proof。区分 Explore 实验、已接受决策依据、当前实现验收；保留不等于仍有效，hash 不等于真实执行或审查批准。材料路径变化或授权背景未交接时先核对，只有具体合同影响才构成阻断；未收到授权说明不等于未授权。

此条款用于 D05 independent-bootstrap；不读取、调用或委托 candidate 产品 HOW 管理 D05。三文件 Run 记录真实本次执行，材料置于 artifacts，不新增 Run 文件、Registry、自动 Review/下一步或 Git 权限。

只读准备通过后，在业务修改前记录实际开始的 action.md/context.json；真实工作完成后才写 result.json 并读回。开始记录失败不做业务修改，开始后中断或保存失败保留已写 bytes 并明确报告未完成，不补造 PASS、不覆盖或清理历史、不从目录存在推断已获接管权限。bootstrap 三文件不是 canonical 产品 Run 的 schema 样例；D05 历史不转换，后续独立 Reviewer 记录自己的实际 verdict。
