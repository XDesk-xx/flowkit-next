---
name: review-apply
description: Independently review Flowkit Apply candidates for approved-Proposal fidelity, minimal implementation convergence, real evidence, and scope discipline during Stable Core development.
metadata:
  author: flowkit
---

# Review Apply Bootstrap Skill

## Stable Core bootstrap independence

This `.agents` Skill is the independent flowkit-next self-development Reviewer HOW through D04 closure.
It MUST NOT read, execute, invoke, delegate to, or become a thin pointer to candidate `skills/actions/review-apply/SKILL.md`.
Equivalent discipline must live in this file's own bytes so candidate product Reviewer Guidance never proves itself.

## Authority boundary

Reviewer inspects implementation evidence but is mutation-free. Reviewer MUST NOT modify implementation/Author artifacts, perform revise/apply/archive work, grant Owner authority, claim Delivery Verification PASS, decide the next legal Action, or auto-continue after its Result.

## Exact input / approved chain

Compare exact approved Proposal/Design/spec/tasks and materially relevant accepted Reviewer findings against the exact candidate/diff/check identities. For revised Apply, verify both exact finding convergence and preservation of already-approved unaffected content.

## Review model

1. Trace every meaningful mutation to approved contract or necessary verification.
2. Reject deferred/non-goal capability, unrelated cleanup, new dependency/layer, or speculative Registry/Router/Planner/Runtime/control-plane growth.
3. Check implementation correctness/fail-closed behavior and preservation of canonical behavior.
4. Reproduce materially decisive facts when needed and verify evidence matches the exact candidate/config/tool identity.
5. Keep Author conclusion, Reviewer verdict, and Verification verdict separate; `review-apply = approved` is not Delivery Verification PASS.
6. If the approved Proposal is materially defective, STOP with a contract blocker/boundary-return finding instead of redesigning it during review.

## Semantic invariant / literal challenge

Distinguish stable contract constants, configuration/environment values, and incidental current-state literals. Permanent tests must not encode lifecycle-transient `active/planned`, current ordinals/counts/paths/orderings as durable invariants when normal legal progression changes them; require the stable semantic/synthetic invariant.

## Finding / handoff concision discipline

For each material finding identify the exact affected implementation/artifact/claim, observed fact, approved-contract impact, and minimum correction. Do not restate the whole Author Apply handoff, Proposal, diff, or test transcript. Reviewer remains independently mutation-free.

## Required Reviewer report

Briefly report:

- current-step explanation;
- complexity / minimality assessment;
- new-content / scope-drift assessment.

Necessary implementation detail inside approved semantics is not scope drift; report `scope drift: NONE` when appropriate.

## Run / handoff concision

Use only `action.md + context.json + result.json`; persist exact candidate/check identities, decisive facts, bounded findings, verdict, assessments, and continuation refs without duplicating canonical artifacts/evidence.

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
