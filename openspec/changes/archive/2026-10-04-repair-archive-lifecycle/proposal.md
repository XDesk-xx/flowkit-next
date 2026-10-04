## Why

当前 Archive 在 Run 建立前复制仓库和依赖、模拟 OpenSpec 归档并重复运行检查，使 LP ignored data symlink 与 pnpm shim 成为真实归档之外的阻断；失败后的同 Action 重试、候选修订和结果读回也未闭合。另一个已复现问题是把候选原始字节与 Git blob 强制视为同一身份，导致正常 CRLF→LF 入库及明确要求 CRLF 的 `.cmd/.bat` 被误拒绝，需要在同一修复中消除这两个错误边界。

## What Changes

- **BREAKING**：新 Archive start 只做 Flowkit 自有 admission，不再接受 `applicableChecks`，不执行 isolated convergence、项目检查、repository/dependency snapshot、symlink 全仓扫描或 pnpm shim 解析；先保存 started Run，再执行真实受控 OpenSpec archive。
- 用真实进程和有界文件前后态记录 `completed`、`failed`、`partial`。安全失败保存 terminal FAIL；仅同候选、安全 active 状态允许下一次明确调用创建新的 Archive Run；partial/unknown 保留证据并阻断，不能靠非零退出码猜测无副作用。
- 增加 Archive-only retry structural transition；修复 Policy、Run-chain、start/finish/inspect、查询、checkpoint 与 Delivery required Change 完成来源中的 completed-only、direct-review-only 假设。需要修改候选时，允许安全失败后的明确 Owner `revise-action` 进入 `revise-propose` 或 `revise-apply`，再独立复审；不新增 `revise-archive` 或通用 Multi-Run。
- 保留 projectOrdinal 命名和可信归档转换材料，但由真实 OpenSpec 执行结果形成，不从预演生成期望后态；Git 失败不得触发再次归档。
- **BREAKING**：新候选接纳区分 raw SHA-256 与受支持的 Git blob 身份，并绑定相关 stage-0 index 前态；按普通 staging 的实际 EOL 语义区分 identity 与 CRLF→LF，不将无 `-w` 的 `hash-object --path` 单独视为入库预测。raw 与原 index blob 相同但 clean/EOL 结果不同时，普通 add 可能跳过转换，该分支在成功候选前明确 unsupported，单纯 stat 改变也不放行。Review、Archive 和 scoped checkpoint 使用同一绑定，支持已有 CRLF index 的自动文本保留分支；Run/proof/日志及字节敏感材料仍逐字节保留。
- 保留旧 Run、历史归档和证据的原义与原始字节；无新身份的旧记录不被自动回填或追认。同步当前 Skills、onboarding 与必要回归；不升级 OpenSpec，不操作消费项目或已安装 manager。

## Capabilities

### New Capabilities

无。新增事实和窄边界归入既有能力，不创建恢复平台、候选数据库或错误分类 Registry。

### Modified Capabilities

- `action-lifecycle`：仅 retryable terminal Archive 的新 occurrence 可通过专用 retry 转换进入 prepared，普通 prepare/terminal 吸收规则保持。
- `single-action-execution-terminal-boundary`：复用同一窄 retry seam，并将 Archive preparation 明确限定为 admission。
- `policy-and-next-boundary`：安全失败重试、partial blocked、失败后明确 Owner revise 以及 outcome-aware completed 判定。
- `run-result-persistence`：封闭 Archive outcome、不可变连续 retry 链、历史兼容与 raw/Git 身份分离。
- `stable-action-command-execution`：轻量 Archive start、失败/partial finish 与读回、retry 前序解析、候选 Git 身份接纳及 inspect。
- `stable-delivery-support-command-execution`：真实 OpenSpec 单次执行、原始诊断、有界实际效果观察和后处理，移除依赖预演要求。
- `repository-integration-and-next-base-continuity`：按已绑定 Git 存储身份核对 projected/index/commit，消费真实归档转换且保持证据原字节。
- `delivery-finalization`：选择当前可信 Archive PASS 终点，通过连续安全失败父链定位 approved Review/Author，保留既有完成来源完整性、Full Test 和 Final 授权条件。
- `author-action-guidance`：收敛 Archive HOW、失败后修订与 Git EOL 身份生成/消费说明。
- `reviewer-action-guidance`：独立审核 raw 候选与合法 Git 转换的绑定，不把正常入库换行转换当作新业务修改。

## Impact

实现涉及 `src/cli/{action-readiness,action-commands,action-descriptor,action-request,action-context,action-inspect,archive-finish,current-run-chain,support-change-archive,support-delivery-final,action-artifact-hashes,review-candidate,run-effective-facts}.ts`、相关 lifecycle/Policy/persistence/单 Action 组合，以及 `src/internal/{archive-effects,archive-file-identities,archive-process,candidate-git-bytes,checkpoint-candidate-tree,reviewed-checkpoint-candidate,git-index-run-chain,git-checkpoint-execution,delivery-required-evidence-source}.ts`；`src/domain/delivery-final-execution.ts` 的准备和相关复验继续消费同一完成来源规则。仅 Archive 使用的 dependency snapshot/check selection 模块退出生产链并按真实引用删除；共享验证和证据保护不能一并删除。

范围依据为 Owner 提供的 `flowkit-archive-lifecycle-repair-plan.md` 及本会话两轮 Explore。后续 Owner 明确要求把 Git LF/CRLF 一并修复，因此原稿第 21 节的“不改 Git checkpoint/Apply/Review”收窄为“不改生命周期顺序和授权语义，但修改必要的候选及 Git 字节校验”。Delivery Final 仅收敛 retry 后完成证据的读取与接纳，不改变其授权、当前 Full Test、确认发布或 Git 边界。原稿提到的 `dist/**` 是发行产物，实施编辑 `src/**`，不直接打补丁到安装包。

本 Change 自身由原生 OpenSpec 管理，不创建 Flowkit runs/Delivery。Proposal 只写本 Change 的规划文件；后续实现仍需新请求。保留 OpenSpec 1.10.0 基线、现有编号和三文件 Run、Owner/Reviewer/Verification/Git 分权；不做 Git 配置修改、全仓换行整理、历史迁移、实际 Full Test/Final、发布安装、commit/push 或 MenDi reopen。
