## Context

见 `proposal.md` 与 `explore.md`。当前 `inspectActionProof` 和 own-Run closure 只认语义 Proof 目录，而实际 Run 分组是 `NNN-<changeId>`；checkpoint 又把 Proof 目录段误作语义 ChangeId。MenDi 的已接受 Propose Result 保存项目根相对 `artifactHashes`，`review-propose` 却用 Change 目录解析。LearningPlatform 的当前 Explore 只有 `action.md`，其绑定的 1.0.0 Skill SHA 与现安装一致；finish 会重算该 SHA。现有 `status/next` 对不完整三文件报告 `run-chain-invalid`，但固定 finish 可以凭 exact descriptor、前序与当前安装恢复。

## Goals / Non-Goals

**Goals:** 用一个有界的路径解释规则覆盖 Action inspect、finish、后续消费与受管理 checkpoint；让项目根相对 Proposal 摘要在成功 Result 接纳时和 Review 启动前得到相同验证；保留两个项目现有文件及 Guidance 绑定，提供可执行的恢复顺序和回归证明。

**Non-Goals:** 不迁移历史 Proof，不新增路径注册表或运行时状态，不修改 `status/next` 对 partial Run 的 fail-closed 结果，不弱化 `package-drift`，不在 manager Change 的 Apply 中替 LearningPlatform finish 或替 MenDi 启动 Reviewer Action，也不授予安装切换或 Git 权限。

## Decisions

### 1. 从唯一 Run 分组派生新 Proof 地址，并有界兼容旧地址

为一个 exact `(repositoryRoot, deliveryId, semantic changeId, runId)`，先查唯一 canonical Run 分组 `NNN-<changeId>` 并验证 occurrence 存在。由此得到两个候选目录：`changes/<run-group>/proof/<runId>` 与 `changes/<changeId>/proof/<runId>`。新 HOW 只写前者；读取和 finish 在后者是唯一存在目录时接受既有材料。两者均存在即报告冲突，连空目录也不静默忽略；两者均不存在仅允许显式空 `proofRefs`。路径归属比较 exact segment，不用字符串后缀模糊推断，也不把编号段写进 `proofRefs.changeId`。

可以将纯路径分组判断抽成小型共享函数，由 Action 和 checkpoint 各自提供可信 Run/候选树上下文；不建立通用 resolver/registry。checkpoint 仍以 HEAD+index 候选树、Result 与原始字节为准，不让工作区单独证明可提交性。此选择比只改 `action-proof.ts` 多覆盖实际 Git 消费者，也比把所有历史目录重命名更能保持证据原貌。

### 2. 生产者闭合集先看两个精确目录，再核对引用

finish 先检查两个候选目录是否存在及其类型；若恰有一个，枚举其直接文件并与显式 `proofRefs` 双向比较，再复用单条 proof 的 regular/no-link、Git bytes、SHA 与身份检查。这样 LearningPlatform 的编号目录不会因语义目录缺失而被当作无 Proof；MenDi 已有的语义布局仍可读。嵌套目录、链接、空目录、双目录或不可读条目按现有闭合语义拒绝。后继 Action 仅校验本次实际引用，不在常规查询中扫描历史目录。

### 3. Proposal 摘要以项目根解析，成功 Result 写前验证

把 `artifactHashes` 的键限制在当前 `openspec/changes/<semantic-changeId>/` 下的 Proposal/Design/Tasks 与 `specs/**/spec.md` 规划产物，保留 MenDi 当前真实键；用统一的 project-root-relative 安全文件检查。成功 `propose`/`revise-propose` 的 fixed finish 在写 `context.json/result.json` 前做校验；`review-propose` start 对已接纳产物复核并以 `repositoryRoot` 作为根。Author `FAIL` 走原有结果合同，不凭缺失规划文件虚构 PASS。这样能在 producer 边界发现错误，且不扩大 `review-apply` 对源码产物的合法范围。

### 4. 已启动 Run 的恢复使用旧 Skill bytes 的兼容构建

先实现并测试路径与摘要修复，构造**不改变发行 Action Skill bytes** 的隔离兼容安装，核对其 Explore Guidance SHA 仍为 LearningPlatform descriptor 中的 `79504e4f23eb22052f75d6d350f315db599bd985e2a7f82d9208d4f3b6d9135d`。真实 `action.md` 还绑定 `repositoryRoot` 绝对路径；把原 descriptor 原字节复制到另一个目录会触发 `descriptor-linkage-mismatch`，不能用该复制品证明原 Run 可 finish。因此分开验收：对真实目标只读核对原 descriptor 的项目根、Guidance SHA、Run 地址与 40 个 Proof 的原始 bytes；在隔离 fixture 内用**该 fixture 自己的合法 descriptor**重现相同编号目录、文件集合和结果形态，验证逐项 inspect、完整声明、空声明拒绝及独立进程 finish。fixture 的模拟结论不是 LearningPlatform Author Result；原 Run 的实际 finish 仍须在原项目根由该项目 Author 判断实质 Explore 完成后进行。MenDi 同样只读核对原 Propose Result 与产物 SHA；其隔离测试使用 fixture 自有的完整 Run/项目根，复现相同项目相对键和语义 Proof 路径的 `review-propose` 机器 readiness，不形成真实 Reviewer verdict。

兼容构建确认后再更新发行 `skills/actions/**`、bootstrap `.agents/skills/**` 中相关路径说明及 onboarding，形成面向新 Action 的最终候选。最终候选的 Explore Skill SHA 会变化，不能直接替换 LearningPlatform 尚未 finish 的已绑定安装；任何实际切换应在该 Run 完成或另有经证实的精确恢复边界后，由目标的受信宿主独立决定。隔离兼容安装不是新的 Stable authority，不自动发布或选用。保持 `package-drift` 是可复核的保护，比为此次恢复引入旧 Skill 白名单或修改 descriptor 更小、更安全。

### 5. 不改变 partial 查询合同

仅有 `action.md` 的 prepared 开始状态尚不是完整 durable Run；`status/next` 继续报告 `run-chain-invalid / Incomplete Run record`，不得推断下一 Action。恢复指引以 exact `action.md`、开始响应和固定 `action finish` 为入口，校验当前安装 Guidance 与前序链；若仍不匹配则保留原字节并报告，不补 `context.json/result.json`。此处只澄清操作路径，不扩展查询协议。

## Risks / Trade-offs

- **两个 Proof 布局并存导致误认归属** → 在 exact Run 上检查两个候选目录并 fail closed；测试含“一个目录为空、另一个有文件”和编号与语义同名边界。
- **checkpoint 与 Action 用不同证据视图** → 共用纯归属判断，checkpoint 仍从候选 Git 树验证完整 Run/Result 和 index bytes；不使用未提交工作区后继给 prepared owner 授权。
- **Skill 更新先于 LearningPlatform 恢复** → 保存旧安装及隔离兼容构建身份；真实 target 切换前重核 descriptor SHA，不覆盖或热补安装文件。
- **成功 Proposal 检查误伤其他 Action** → 只在成功 Propose/Revise Propose 和 Review Propose 的规划摘要边界调用，Review Apply 的源码摘要继续按其原合同处理。
- **原 descriptor 与绝对项目根绑定** → 不把原 `action.md` 复制到不同目录执行 finish；隔离 fixture 自建合法 descriptor，真实目标只读核对原绑定，分别报告机制与未执行的实际恢复。
- **隔离 fixture 不等于真实角色完成** → 模拟结果仅用于测试；不宣称 LearningPlatform Explore 的业务结论或 MenDi Reviewer verdict。

## Migration Plan

1. 在源码与测试中先修正路径/摘要消费者，不改发行 Skill bytes；在隔离环境打包、安装并验证与既有 prepared Guidance 完全一致的兼容候选。
2. 对两个真实目标只读核对绑定、Run/Proof/Proposal 身份；在自有 descriptor 的隔离 fixture 上演练同形态恢复并记录候选安装身份、测试结果及其限制。失败则保留目标与旧安装并修复候选，不能从 fixture PASS 宣称原 Run 已完成。
3. 更新产品及 bootstrap Skill、规格相关指引与 onboarding，完成最终候选的适用测试、OpenSpec 验证和安装回归。最终包面向新 start；仍绑定旧 Skill 的 Run 继续使用已验证的兼容安装直至合法收口。
4. 目标实际 Action、manager 选用、Git checkpoint、push 或发布分别在各自权限边界进行；本 Change 的规划和测试不替代这些决定。无数据迁移或自动回滚；发生部分写入时保留 bytes 并报告 exact incomplete 状态。
