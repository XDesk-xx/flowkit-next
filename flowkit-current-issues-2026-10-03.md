# Flowkit 当前问题与 D09-A 事故记录

记录日期：2026-10-03。范围是 LearningPlatform 使用固定安装 `D:/tools/flowkit-manager/node_modules/flowkit-next@1.0.0` 执行 D09-A `role-workspace-and-shared-shell` 时得到的 Run、修复记录、归档诊断与当前安装代码。本文是问题清单，不是新的 Flowkit Run、Reviewer 结论或后续 Action 授权。D09 的实时阶段仍以 coordination 和固定 manager 的 `status/next` 为准。

| 编号 | 问题 | 当前判断 | 归属 |
| --- | --- | --- | --- |
| FKI-01 | Review 成功收口时未要求 Archive 必需的精确 Author Run 绑定 | manager 缺口；Run 006 已经一次性修复 | Flowkit manager |
| FKI-02 | terminal Run 元数据错误没有受控、保留原件的正式纠正通道 | manager 缺口；Run 005/006 采用 Owner 授权特例 | Flowkit manager |
| FKI-03 | Archive 隔离副本的 `node_modules` junction 被 pnpm 拒绝，且失败诊断丢失 | manager 缺口；D09-A 已以适用检查完成归档 | Flowkit manager |
| FKI-04 | 候选工作树原始字节与 Git 实际 blob 字节可能不同，检查晚于审核 | 项目检查待加；manager checkpoint 可设末道防线 | 项目 + Flowkit manager |
| FKI-05 | Reviewer 的真实 `rejected` 结果不能持久化 | 当前安装 Guidance 明示的限制；本次未触发 | Flowkit manager |

## FKI-01：Review/Archive 候选身份合同不一致

`20261003-006-review-apply` 已独立审核 Run `20261002-005-apply` 的 52 文件候选并给出 `approved`。Result 原有 `facts.reviewedAuthorRunId`，却缺少 `facts.reviewedRunId`；固定 manager 允许 Review terminal，随后 Archive readiness 要求 `review.result.facts.reviewedRunId === author.context.runId`，因此以 `archive-candidate-unbound` 阻断。要求发生在当前安装的 `dist/cli/action-readiness.js:226`，而 Review finish 没有相应的跨 Action 检查。

Owner 授权后，[Run 006 修复记录](../.flowkit/artifacts/d09-teacher-student-workspaces/repairs/2026-10-03-run-006-review-binding/repair-record.json)逐字节封存原始三文件，仅向 canonical Result 增补 `facts.reviewedRunId = "20261002-005-apply"`；Reviewer verdict、候选、Proof 和其余 Run 文件未变。这解决了本次归档，不证明入口缺口已修。

**建议修复：** 在 `review-apply finish` 写入 terminal 文件前，验证 `reviewedRunId` 存在、等于本次精确 Author `runId`，并与已有候选摘要、`reviewedAuthorRunId`、`previousRunId` 一致；不一致时保持 prepared，给出缺失字段和预期值。用“Review 可 finish、Archive 不再因同一绑定失败”的跨 Action 回归测试验收。

## FKI-02：terminal Run 缺少受控纠正机制

D09-A 的 `20261002-005-apply` 曾缺少完整候选身份；UI revise 后要让独立 Reviewer 审核精确候选，只能先按 Owner 特例[封存原始 Run 并修订 canonical Result](../.flowkit/artifacts/d09-teacher-student-workspaces/repairs/2026-10-03-run-005-ui-correction/repair-record.json)。Run 006 的字段遗漏又重复了这种做法。两次都有[明确的 Run 005 Owner 决定](owner-decisions/2026-10-03-run-005-canonical-exception.json)及[Run 006 Owner 决定](owner-decisions/2026-10-03-run-006-review-binding.json)、原件及 hash；这不是可推广的常规流程。当前安装的 `dist/cli/action-commands.js:36-46` 只接受 prepared Author Owner correction，不能用它纠正 terminal Reviewer/Author Run。

当前 `checkResultArtifactsOnFinish` 已要求成功的 `apply`/`revise-apply` 校验 `artifactHashes`（`dist/cli/action-artifact-hashes.js:100-125`），因此 Run 005 的**原始遗漏应作为历史回归案例**，不能直接宣称当前版本仍会接受同样的空身份。仍缺少的是 terminal 后发现元数据错误时的正式恢复路径。

**建议修复：** 优先在 finish 前拦住缺失身份；确需事后恢复时，设计仅 Owner 可授权的追加式 correction/supersession，绑定原三文件 hash、精确字段差异、角色及下游失效范围，保留原始 canonical 字节。对“已被后续 Run 消费”的情况明确重新审核或继承条件。验收时不允许隐式覆盖原 Result，也不允许 Author 代填 Reviewer verdict。

## FKI-03：Archive 隔离环境与错误可诊断性

固定 manager 在 Archive preflight 把工作区复制到临时目录后，将真实仓库的 `node_modules` 以 junction 接入（`dist/cli/action-readiness.js:285-297`）。隔离副本运行 `pnpm run check:fast` 时，pnpm 因模块目录实际指向副本之外，报 `ERR_PNPM_UNSAFE_MODULES_DIR`；项目检查尚未开始。manager 只返回笼统的 `archive-check-failed`，未保留该命令 stdout/stderr，随后删除 scratch。原始输出和同规则复现见[诊断材料](../.flowkit/artifacts/d09-teacher-student-workspaces/repairs/2026-10-03-archive-preflight-pnpm-junction/diagnostic.json)与[stdout](../.flowkit/artifacts/d09-teacher-student-workspaces/repairs/2026-10-03-archive-preflight-pnpm-junction/check-fast.stdout.txt)。

D09-A 后来按实际影响选择已配置的 `canonical-specs` 作为归档 convergence check：Run 006 已对未变的 52 文件源候选独立通过 `check:fast`，归档只新增 canonical spec；隔离 strict spec 检查为 42 passed/0 failed。[Run 007 报告](../.flowkit/artifacts/d09-teacher-student-workspaces/changes/001-role-workspace-and-shared-shell/proof/20261003-007-archive/archive-report.json)记录归档完成。这是本次的有界处置，不代表所有 Archive 都能用较窄检查替代源码检查。

**建议修复：** 给 pnpm 提供真正位于隔离项目内的依赖环境，或采用不会修改真实 `node_modules` 且能验证 convergence 的执行策略；在清理 scratch 前持久化有界的原始命令、退出码、stdout/stderr 和环境路径，错误响应指向诊断。Windows + pnpm 的归档回归应证明项目检查实际运行，失败时原始原因可读。

## FKI-04：Review 候选与 Git blob 的字节身份裂缝

仓库 [`.gitattributes`](../.gitattributes) 对文本使用 `eol=lf`，[`.editorconfig`](../.editorconfig) 也要求 LF；然而 D09-A 审核后的三个候选文件仍以 CRLF 存在于工作树：`config/verification/structure-policy.json`、`scripts/verification/structure-inventory.test.ts`、`scripts/verification/structure-sources.ts`。`git ls-files --eol` 对三者均显示 `i/lf w/crlf`；`git hash-object --no-filters` 与 `git hash-object --path=<path>` 的值不同。Git 提交 `b06e29b579dda9f0b2bb2f55b48489d773b09e1b` 已推送，真实 blob 为 LF 字节，因此原工作树候选 hash 不能直接当作 blob hash。已核对内容差异仅为 CRLF→LF；这说明语义内容等价，不使两个字节摘要相等。

现有 `git diff --check` 给出换行转换提示，但不以失败状态阻断。当前 manager 的 `dist/internal/git-checkpoint-execution.js` 做范围、工作树指纹、managed evidence 及提交对象检查，未见对所有候选文件的 raw-worktree 与 Git-filtered blob 身份比较。`.flowkit/runs/**` 和 `.flowkit/artifacts/**` 已在 `.gitattributes` 中设为 `-text`，正式证据应保持原始字节。

**建议修复顺序：**

1. 项目用 TypeScript 写只读字节检查，对本次候选文件比较 `git hash-object --no-filters -- <path>` 与 `git hash-object --path=<path> -- <path>`；有差异就列出路径并失败。将它接入 `check:fast` 和完整检查，并让 Author 在生成候选 hash 前按 LF 保存，Reviewer 独立运行同一检查。`AGENTS.md` 可写执行责任与失败处理，但不能替代可执行检查。
2. Flowkit manager 可在 Review finish 或 checkpoint 前复核“已审核原始候选如何进入 Git”，将过滤后的身份差异显式阻断或建立经授权的精确映射；不能仅靠说明文字或 `git diff --check` 警告。设计时应区分有意 `-text` 的 Proof 与普通源码。
3. 对已推送的 D09-A 保留 Run 与提交历史。若要求原候选 SHA 与 blob SHA 字面相等，需要另走 Owner 控制的候选修正与独立审核；若接受仅换行变换的映射，应另建不可变证据说明 raw→blob 关系。本文没有创建该映射，也没有修订旧 Run。

## FKI-05：Reviewer `rejected` 无法保留为 terminal 事实

固定 manager 的 `docs/onboarding.md` 当前明确写明：Reviewer 的真实 `rejected` 判断在写入机器文件前会被 finish 拒绝，Run 保持 incomplete，不能改写成 `changes-requested`。这次 D09-A Reviewer 为 `approved`，因此没有触发该限制；它仍是当前安装已披露的独立缺口。

**建议修复：** 允许 `rejected` 作为 terminal Reviewer verdict 原样持久化，给出合法后继 Action，并测试失败审查不会被迫伪装成别的判断。

## 边界与交付建议

这份记录只依据 D09-A 证据和上述固定安装代码。此前讨论的 manager 路径、Explore 阶段 `.tmp` 脚本等问题，本次没有新的可复现失败，因此不列为“仍存在的 manager 缺陷”；安装 Guidance 已规定 `.tmp` 仅用于可丢弃请求、诊断和隔离实验，不能当长期生命周期入口。后续若重现，再附精确命令、安装身份、Run 和原始输出立项。

优先修 FKI-01、FKI-03 的入口/执行缺口，同时给 FKI-02 设计不可变恢复通道。FKI-04 的项目侧检查可立即前移，manager 侧再补跨项目防线；FKI-05 单独作为 Reviewer 结果持久化修复。修改 Flowkit 时应在 `flowkit-next` 源码与测试中完成、发布新的固定安装，再让本项目按其 manager 绑定方式升级；不直接热改 `node_modules`。本清单没有执行新的 Flowkit Action、Git checkpoint、push 或历史 Run 修订。
