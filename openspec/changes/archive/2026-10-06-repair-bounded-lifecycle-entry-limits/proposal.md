## Why

真实 checkpoint 的 910 条精确路径生成约 128 KiB 请求，被共享 64 KiB 输入限制拒绝；合法 candidateGit 在约 34–36 KiB 时又触发 1,024 节点限制。已接纳普通 Author FAIL 和全新项目无 ordinal 基线也缺少常规继续路径，需要在既有权限和证据合同内修复这四项限制。

## What Changes

- **E01**：仅 `git checkpoint / git push / git integrate` 的文件/stdin JSON 请求采用 1 MiB 预算；其他请求保持 64 KiB，超限使用一致、安全、可操作的 machine 诊断，保留全部精确路径及授权/Git 核对，并使 CLI help 如实显示分级额度。
- **E02**：active Change 的六个普通 Author terminal FAIL/null 在 exact Owner `revise-action` 授权后，可按已到达阶段进入新 revise 的 Policy/结构边界；仅在原机器 readiness 通过后创建 occurrence，包括 revise 自身失败后的同名 revise；原失败、唯一父链和独立复审义务保留。
- **E03**：canonical product-managed 首次 Explore 在已获合法边界且验证完整 coordination、无已消费执行/归档历史后，可用 1 作为首个 projectOrdinal；实际持久化仍属于 Explore HOW，已有编号复用/max+1，历史缺失或矛盾继续拒绝。
- **E04**：facts 保持 64 KiB、深度 16，仅将 JSON 节点预算调整为 4,096；固定输入及 manager 生成 candidateGit 后的最终 admission 共用预算诊断，在 machine 写入前拒绝超限。
- 更新直接相关发行 Guidance/onboarding 和回归验收，不增加 command、lifecycle state、持久 seed、registry、通用恢复器或自动下一 Action。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `foundation-cli-surface`：命令选择的分级请求预算、有界读取及容量诊断。
- `policy-and-next-boundary`：普通 Author FAIL 的 exact Owner correction、原阶段规则和结构可进入性。
- `action-lifecycle`：terminal absorbing 保留；窄的失败 Author 同名 revise 新 occurrence 结构边。
- `single-action-execution-terminal-boundary`：已核准失败 correction 与既有 single-Action entry/preparation 一致，不自动恢复。
- `stable-action-command-execution`：start/inspect/finish/chain 的同一 correction 读回，首次 Explore readiness 和 metadata 写前诊断。
- `author-action-guidance`：fresh first Explore 的首值 1 和可验证分配/持久化边界。
- `run-result-persistence`：有界 facts 预算、不可改写的失败 successor 和统一 read/admission 规则。

## Impact

修改范围集中在 `src/cli/request.ts`、`entrypoint.ts`、Action request/start/inspect/finish/readiness/chain，既有 domain Policy/lifecycle/single-action/persistence，以及相应 tests、发行 Skills、独立 bootstrap HOW 的边界澄清（不新增 bootstrap 首值自动分配）和 onboarding。不新增依赖；`repository-integration-and-next-base-continuity` 的授权、paths/index/candidate/blob/remote 合同保持，不因 transport 额度调整额外修改该 capability。

依据为 [explore.md](explore.md) E01–E04 及其 17 项基线观察。Owner 已明确选择直接 OpenSpec Propose；未声称已有独立 Review approval。本阶段仅形成规划，不生成 Run、不改生产实现/主规格、不执行 Git 或更新 manager。

非目标：machine partial 修复、Archive partial/unknown-intent 恢复、通用同 Action retry、扩大 Run/proof bytes、外置 candidateGit、SHA-256 Git 支持、Full Test timeout、`.cmd/.bat` 执行、自动 Review/next/commit/push 或历史迁移。
