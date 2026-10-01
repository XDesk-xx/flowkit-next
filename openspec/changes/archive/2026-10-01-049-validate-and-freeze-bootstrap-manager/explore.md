# Explore: validate and freeze the bootstrap manager

## 问题与真实范围

Delivery 07 的前五项 Change 已归档并形成各自的 Change checkpoint。E 的任务是验收一份可独立安装的候选 manager、同包的固定命令与 Skills，以及一个小型真实新目标中的完整使用；只有证据满足后才形成供 Owner 选择的冻结材料。当前 Delivery 继续由外部 Stable manager 管理，候选只操作隔离验收目标。E 不借验收名义实现新的生命周期能力、补造 Reviewer finding、执行 Formal Full Test/Delivery Final，或把候选切换为本 Delivery 的 manager。

真实输入是 Owner 选择的候选包与独立目标、实际 Author/Reviewer 判断、宿主提供的 Owner 来源、exact OpenSpec runtime，以及可读回的 Git/Run/Proof。假 Agent、同进程重启或合成 fixture 只证明机制，不满足真实新会话和角色边界。

## 有界 proof 与决策影响

本 Run 的 `package-probe.mjs` 和 `bootstrap-probe.mjs` 是一次性实验源码，连同各命令原始 stdout/stderr、两份报告和原始 `candidate-package.tgz` 保存在本 Run proof 目录。它们不是新目标的标准生命周期入口。实验在 Git HEAD `2bab78b41750d1cff665a20b37dfca09ca1ca511` 的候选源码上运行；本 Change 新增的 manifest/Explore 不在发行 `files` 内。实验 tgz 的 SHA-256 为 `1b2c88c9263d5892946d3d9aacba79a6392eb3d8b3b37fa3c87aebcc1550cba0`，只是本次 proof 身份，不能预先充当 Apply 后的最终冻结包身份。

| 风险 / 问题 | 实测事实 | 对 Proposal 的影响 |
| --- | --- | --- |
| 发行包是否需要源码 checkout 或 devDependencies | `pnpm pack --json` 成功，列出 117 个文件：80 个 `dist/*`、11 个 Action Skill、6 个 Delivery Skill、15 个 vendor Skill，以及 onboarding 与工具 lock；没有 `src/*`、`tests/*`。新目录 `npm install --omit=dev` 成功，安装 `yaml`，未安装 `tsx` 或 `typescript`。 | 用确切 tgz 和新安装目录做验收；核对入口、被引用的发行资产及生产依赖，而非从源码目录运行。 |
| 空目标的首次查询能否直接工作 | 安装包内 CLI 对无 OpenSpec root 的空目标返回 `openspec-root-mismatch`；`doctor` exit 0 但 `status=fail`。 | 首次接入必须先按已有 onboarding 核对或建立 exact OpenSpec root；不能把 doctor 进程退出 0 当健康 PASS。 |
| exact OpenSpec 初始化后的查询 | 在同一隔离目标运行 OpenSpec 1.10.0 `init --tools none` 后，安装包内 CLI 的 `doctor.status=pass`，`status/next=idle`，各命令 exit 0。 | 固定安装与工具组合可以完成最小冷启动查询。`idle` 只说明尚无项目/Delivery，不证明完整工作流。 |
| 源码、包与安装的身份 | 本次探针记录了 HEAD、tgz bytes/SHA、包名版本、成员、安装路径、命令及原始流。 | 冻结记录应绑定实际构建输入和最终 tgz 摘要、运行依赖、工具 lock/Skills、安装读回与验证结果；同版本不同包须可区分。避免把包自身摘要写回包内或让本次提交依赖自身 SHA。 |

## 必须在 Apply 验收的事实

1. 从经审查的当前候选精确打包并安装到未使用的新目录，核对 tgz、安装内容和生产依赖；旧 Stable 安装及本 Delivery 的 Run/Proof 保持原字节。实际安装而非 checkout/dist 是受测 manager。
2. 选一个有真实需求且与本仓库、LearningPlatform 真实历史隔离的小目标。对现有文件先读后补，按 exact OpenSpec 和 Owner 项目身份完成接入；用固定入口跑真实 Change 路径。Author 工作、独立 Reviewer 结论和必要证据分别来自实际角色。若没有真实 finding，不制造 `changes-requested`；按计划的修改往返验收仍未满足，须如实报告并继续真实验收或交 Owner 决定范围。
3. 在真正独立的新 Agent 会话中，仅凭目标入口与该安装资产恢复当前事实并继续合法边界。仅重启 CLI、同一 Agent 重开进程、合成 Reviewer 或脚本驱动全程都不能冒充此证明。
4. 用受控 fixture 验证 prepared correction、partial 拒绝、Full Test 失败与新 attempt、Git 范围/对象/部分成功；实际目标的 Full Test、Final、Git 与远端接受仍各守自己的授权边界。覆盖 Linux x64 glibc 主验收与 Windows 已承诺的兼容性范围，未实测的平台和宿主权限如实列为限制。
5. 最终选择记录只在上述证据读回后写入：源码基线/构建来源、包名版本、tgz SHA、选定工具及 Skills、实际安装位置、真实目标与新会话证据、检查结果和明确限制。记录的候选资格不等于 Owner 已选择其管理新项目，也不等于 Delivery Final 或 Git 权限。

## 已解决与仍待证明

本次 proof 解决了最小发行组合与首次 OpenSpec root 前置的技术未知：包可在新目录以生产依赖安装，安装内查询可以在正确初始化后工作。Proposal 可以把后续工作收敛为一次有界发行验收和冻结记录，而非新增 Registry、自动 Agent 循环或新生命周期状态。

本次没有真实新目标的完整 Change、真实独立 Reviewer 修改往返、新 Agent 会话、Linux detached 验收、Formal Full Test/Final 或远端接受。隔离探针的 PASS 不替代这些正式证据；如果 Apply 无法取得其中的必需条件，就报告未满足，不签发稳定 manager 选择结论。

**Explore 结论：PASS。** 已有足够证据界定 Proposal 的验收输入、关键前置和失败边界；下一步为独立 `review-explore`。这不是产品实现、发行冻结或 Reviewer 批准。
