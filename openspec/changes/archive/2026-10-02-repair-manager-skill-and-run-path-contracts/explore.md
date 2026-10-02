# Explore: repair manager Skill and Run path contracts

## 真实问题与边界

Owner 授权在 manager 源码仓库直接建立独立 Change，不建分支、不归属 Delivery；本次只做 Proof Explore。两个受影响目标是 `D:\AI\src\LearningPlatform` 和 `D:\Projects\MenDi`。它们的现有 Run、Proof、OpenSpec 与 Git 状态均为只读输入，不允许通过重命名目录、改写 Result、补造 Run 或替换已绑定的 Skill 来消除报错。本 Change 的后续 Proposal/Apply 应修正 manager 源码、发行 Skill/文档与回归测试，并证明两个已启动流程能安全继续。

本次独立 Change 没有 Delivery 身份，也没有经 Policy 确定的 canonical Explore Action；因此本文件是有界调查材料，**不是** Flowkit 三文件 Run、Author terminal Result 或 Reviewer verdict。`.tmp/repair-manager-path-counterexample.mjs` 是可丢弃实验，不是 durable proof；下面记录其输入、输出和可复核的源码位置。

## 两个目标的原始事实

| 目标 | 当前事实 | 必须保持的兼容性 |
| --- | --- | --- |
| LearningPlatform | `d09-teacher-student-workspaces` / `role-workspace-and-shared-shell` 的 canonical Run 分组为 `001-role-workspace-and-shared-shell`。`20261002-001-explore/action.md` 已存在，声明 `prepared`，尚无 `context.json`、`result.json`；本 Run 的 40 个文件位于 `.flowkit/artifacts/d09-teacher-student-workspaces/changes/001-role-workspace-and-shared-shell/proof/20261002-001-explore/`。descriptor 绑定 Explore Skill SHA-256 `79504e4f23eb22052f75d6d350f315db599bd985e2a7f82d9208d4f3b6d9135d`，与当前安装一致。 | 保留 `action.md` 与全部 proof 原始 bytes；修复后须能检查、完整声明、finish 同一个 prepared Run，不得创建第二个 Explore 或把空 `proofRefs` 当作闭合。 |
| MenDi | `20261002-01-engineering-foundation-and-trusted-workflow-core` / `establish-engineering-baseline-and-runnable-skeleton` 的 Run 分组为 `001-establish-engineering-baseline-and-runnable-skeleton`；Explore、Review Explore、Propose 三个 Run 已完整，下一合法 Action 为 `review-propose`。既有 Proof 使用 `changes/establish-engineering-baseline-and-runnable-skeleton/proof/<run-id>/` 语义目录。Propose Result 的 `artifactHashes` 键是项目根相对路径；`proposal.md` 的实际与声明 SHA-256 均为 `023d7d79ffd40020260915cf98515cf972e3e3951595c5174d3b4ba134bd25f7`。 | 原有语义 Proof 路径继续有效；修复后 Reviewer 可从原 Propose Result 校验并读取同一份 Proposal，不改写历史 Run。 |

两个目标都只读检查过；本次未执行 MenDi 的 `review-propose` start，也未对 LearningPlatform 的 prepared Run 调用 finish。LearningPlatform 的 `status/next` 对只有 `action.md` 的当前目录报告 `run-chain-invalid / Incomplete Run record`。这说明查询不能替代 descriptor 读回与原 Run 恢复；是否调整 prepared 查询合同须在 Proposal 中有界决定，不能为使查询变绿而补写虚构的两文件。

## 有界反例与源码定位

1. `src/cli/action-proof.ts` 的 `inspectActionProof` 先找到唯一编号 Run 分组，随后却把合法前缀写死为 `changes/${target.changeId}/proof/${runId}/`。`checkDeclaredProofs` 复用它，故编号 Proof 在 inspect、finish 和后续消费均会被拒绝。`checkOwnRunProofClosure` 也只枚举语义目录。隔离 fixture 建立 `001-change-one` Run 分组和编号 Proof 后，inspect 返回 `Proof path is outside exact Run ownership`，而 `checkOwnRunProofClosure(target, runId, [])` **错误通过**，尽管物理目录已有 Proof。这是遗漏材料的完整性漏洞，不能只改报错文案。
2. `src/internal/managed-evidence-checkpoint.ts` 的 `declaredProof` 从 `changes/<segment>/proof/…` 直接把 `<segment>` 当作语义 `changeId`，再查找以 `-${changeId}` 结尾的 Run 分组。对 `001-change-one` 会错误查找 `*-001-change-one`；即使 Action finish 修好，受管理 Proof 的 Git checkpoint 仍可能拒绝它。需与 inspect、finish 使用同一归属规则，并保留 MenDi 的旧语义路径。
3. `src/cli/action-readiness.ts` 构造 `root = <repositoryRoot>/openspec/changes/<changeId>`，但 `review-propose` 在第 256 行用此 `root` 校验 Propose Result 的项目根相对 `artifactHashes`。MenDi 的真实键会被解析为 `<change>/openspec/changes/<change>/proposal.md`，该路径不存在。相邻 `review-apply` 和 `review-explore` 使用项目根校验。这是消费端路径根错误；Proposal 还应要求在 Propose Result 接纳时验证路径语义，使错误不延迟到 Review 才暴露。
4. `src/cli/action-commands.ts` 在 finish 时重新计算当前安装的 Guidance/package；与 start 绑定值不一致即报 `package-drift`。LearningPlatform 的 prepared Explore 绑定当前 1.0.0 Explore Skill 摘要。先原地改写该安装的 Skill，即使仅澄清 `<change>` 的措辞，也可能使原 Run 无法 finish。修复的构建、安装与恢复次序必须经过真实回归证明。
5. `skills/actions/*/SKILL.md`、`docs/onboarding.md` 和 `openspec/specs/action-guidance-execution/spec.md` 采用含糊的 `<change>`/`<change-id>` Proof 分组记法；`openspec/specs/run-result-persistence/spec.md` 已明确 Run 的物理分组带 sequence。现有产品测试的主要 fixture 使用语义 Proof 目录，四项相关测试当前全 PASS，却没覆盖编号目录、空引用漏检或真实 Propose→Review Propose。两个目标恰好使用不同的 Proof 布局，故不能把其中一种简单宣布为唯一历史格式。

隔离反例命令为 `node --import tsx .tmp/repair-manager-path-counterexample.mjs`；其输出分别记录编号路径、上述 inspect 拒绝、空引用误通过，以及重复拼接的 Proposal 路径。`node --import tsx --test tests/unit/domain/action-proof-closure.test.ts tests/unit/domain/action-command-cli.test.ts` 为 4/4 PASS，仅说明现有 fixture 未覆盖这些反例。实验目录与脚本在 `.tmp`，可删除且不作为正式 Run/Proof 引用。

## 对 Proposal 的硬约束

- 把语义 `changeId`、Run 分组名 `NNN-<changeId>` 与 Proof 目录段明确区分。基于唯一真实 Run 归属选择、校验允许的既有布局；编号与语义布局若同时存在且都可指向同一 Run，必须确定无歧义规则或拒绝，不能静默遗漏任何目录。不得把 `projectOrdinal` 推断为 Run 分组 sequence。
- inspect、own-Run finish 全量闭合、后续 `proofRefs` 消费和 managed Git checkpoint 使用一致的路径解释。编号目录有文件时，空 `proofRefs` 必须失败；每条已声明引用仍须检查来源、普通文件、Git 原始字节要求、bytes/SHA 和 Run 归属。历史语义目录继续可读。
- `artifactHashes` 的合同统一为项目根相对路径；Propose finish 接纳与 Review Propose start 均据此校验，拒绝越界、错误根和不匹配 bytes。保留已完成的 MenDi Propose Result，不重新生成其 Hash。
- 对已开始的 prepared Run，代码/发行 Skill 的升级顺序要保持绑定 Guidance 能完成，或提供经证明的精确兼容方案；不能关闭 `package-drift` 校验、直接编辑安装包、重写 `action.md` 或伪造 terminal Result。LearningPlatform 的 40 个文件须在恢复测试中逐一闭合。
- 同步修订**产品发行**的 Action Skills、相关规格和 onboarding，使新 Agent 能从实际 Run 地址确定 Proof 路径；审视 `.agents/skills/**` 中相同含糊措辞，但它们是仓库 bootstrap HOW，不能成为产品运行时的第二份权威。用编号与语义双 fixture、prepared 恢复、Propose→Review Propose 和 checkpoint 候选测试覆盖修复，并在实际安装的 manager 上对两个目标做只读/合法恢复验收。

不引入通用 Path Registry、Run 迁移器、多项目并发功能、自动 Review、自动 Owner 决策或 Git 权限。测试通过不等于已对这两个目标执行修复；任何真实 finish、Review start、checkpoint 与安装切换仍按各自当前 authority 和 Role 边界进行。

## 结论与待决问题

**Explore 结论：具备提出修复 Proposal 的证据。** 两处路径问题均可在 manager 源码中定位，并有真实目标与受控反例；最小修复需要同时覆盖 Proof 读写/闭合/提交、Proposal artifact 根目录、Skill 文案与回归测试。当前没有产品修复、正式 Flowkit Explore Result、Reviewer 结论或目标恢复成功声明。

Proposal 需明确新产生 Proof 采用哪一种路径、双布局冲突怎样 fail closed、prepared Run 在升级过程中怎样保留绑定 Skill，以及 `status/next` 对仅有 `action.md` 的准备中 Run 应报告何种边界。选定方案后才能 Apply；不得以修改两个目标的历史字节来代替兼容修复。
