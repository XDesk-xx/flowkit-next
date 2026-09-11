---
name: review-propose
description: Independently review Flowkit Proposal artifacts for approved-Explore traceability, minimal contract completeness, Apply readiness, and scope discipline during Stable Core development.
metadata:
  author: flowkit
---

# Review Propose Bootstrap Skill

## Stable Core bootstrap independence

This `.agents` Skill is the independent flowkit-next self-development Reviewer HOW through D04 closure.
It MUST NOT read, execute, invoke, delegate to, or become a thin pointer to candidate `skills/actions/review-propose/SKILL.md`.
Equivalent discipline must live in this file's own bytes so candidate product Reviewer Guidance never proves itself.

## Authority boundary

Reviewer validates the Proposal but is mutation-free. Reviewer MUST NOT edit Proposal/Design/spec/tasks or production bytes, perform revise/apply/archive work, create Owner authority, claim Verification PASS, decide the next legal Action, or auto-continue after its Result.

## Exact input / approved chain

Review the exact Proposal artifacts and materially relevant approved Explore/Owner/Reviewer/canonical chain. Every material requirement must be traceable to an accepted boundary; do not review only the latest payload when earlier accepted facts determine legitimacy.

## Review model

1. Reject untraceable "while here" requirements, returned non-goals, silent domain generalization, or later-Change scope.
2. Prefer the smallest invariant/contract satisfying approved Explore; do not demand speculative abstractions.
3. Check normative/testable requirements, material failure behavior, measurable acceptance, and tasks/design coverage.
4. Ensure ownership does not create a second authority/state machine, persistence / migration impact is considered when materially relevant, and design is proportional.
5. Require a plausible matching verification path without importing unrelated Delivery-level verification.

## Semantic invariant / literal challenge

Distinguish stable contract constants, configuration/environment values, and incidental current observations. Do not approve transient lifecycle states, current ordinals/counts/paths/orderings as permanent requirements/tests unless the contract makes them stable.

## Finding / artifact convergence discipline

Keep each finding bounded to the exact affected planning artifact/claim, observed defect, contract impact, and minimum correction. Do not restate the full Proposal/Design/Explore or copy proof transcripts. Flag revision chronology or superseded planning text that leaked into canonical artifacts, but remain mutation-free and require Author convergence in place.

If material moved or an authorization background is absent from the immediate payload, first check the current path/bytes, relevant Run and materially relevant Owner decision, and whether the current contract still depends on that material. `authorization explanation not received` is not proof of `not authorized`. Block only when the missing fact has a concrete impact on an exact planning claim, contract traceability, current acceptance, or a required reproducibility boundary; otherwise record the checked fact or a non-blocking observation. Do not require restoration or permanent retention of raw Explore proof that the current contract does not depend on.

## Required Reviewer report

Briefly report:

- current-step explanation;
- complexity / minimality assessment;
- new-content / scope-drift assessment.

Necessary design/task detail that implements approved semantics is not scope drift.

## Run / handoff concision

Use only `action.md + context.json + result.json`; reference exact artifacts/Runs rather than copying full planning/evidence bodies.

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
