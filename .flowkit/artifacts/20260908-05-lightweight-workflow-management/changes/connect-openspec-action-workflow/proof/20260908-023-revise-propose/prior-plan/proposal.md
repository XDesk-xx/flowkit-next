## Why

Flowkit 已有单次 Action、Policy 和三文件 Run 内核，但用户仍需手工选 Run、实现 callback，不能通过既有宿主直接续接真实工作。必要执行日志又被具体 Change 路径例外绑定到源码文本检查，导致每次提交重复修改 `.gitattributes`。

## What Changes

- **BREAKING**：`status` / `next` 的用户请求不再携带 `currentRunId` / `changeStartSequence`；在明确 target 内由 OpenSpec、coordination 和唯一有效 Run 链定位上下文，歧义、缺失、bootstrap 历史与空闲明确区分。
- 增加 `flowkit action --input <path>`，支持当前既有交互式 Agent/终端宿主通过同一进程 JSON Lines 往返执行一次明确 Role/Action。复用 package、Policy、admission 与 persistence；不调用模型 API、不轮转角色或自动下一 Action。
- 在宿主执行前占用本次受控 Run 目录；必要材料保存、结果接纳、三文件写入与读回完成后才报告 terminal。EOF、中断、拒绝及部分写入不得消失成 idle 或旧 PASS，不自动恢复。
- 必要 Action proof 在 target `.flowkit/artifacts/<delivery-id>/changes/<change-id>/proof/<run-id>/` 默认长期保留；Run 仅保存有界引用及交接事实。当前相关引用核对归属、路径、完整可读和实际结果，不遍历全部历史原始 proof。
- 一次性通用 stdout/stderr Git attributes 替代两个 Change 专属例外，保护原始 bytes；保留源码、Run JSON、脚本、人工摘要的文本规则。不改 `.gitignore` 或 Full Test 范围。

## Capabilities

### New Capabilities

无；复用现有 CLI、单次执行、Run persistence 和 Guidance 的职责，不新建管理子系统。

### Modified Capabilities

- `foundation-cli-surface`：自动解析有界当前上下文、单次宿主 CLI 入口及对应发行/分根边界。
- `single-action-execution-terminal-boundary`：实际交互宿主协议、准备/执行/结果保存顺序、失败与 STOP、真实接入验收。
- `run-result-persistence`：同一次 invocation 的 create-once 预占与完成写入；部分目录不删除、不回退旧 Run；已完成三文件不覆盖。
- `action-guidance-execution`：必要 proof 的产生/交接/相关消费、原始流与结构化文本边界、两套 HOW 独立。

## Impact

实现涉及 `src/cli/**`、single-action/Run persistence、最小内部宿主与 proof 校验接缝、相应 domain exports/tests、`.gitattributes`、直接受影响的产品 Action HOW、独立 bootstrap HOW 和 AGENTS。保留现有 package/Run/Result closed 字段、Policy 算法与四类 authority；不新增运行依赖、Registry、EvidenceStore、第四个 Run 文件、模型平台、WAL、锁服务或自动恢复。

依据为本 Change `015-explore` 经 `016-review-explore` approved 的范围及 `proposalCarryForward`，以及 Owner 明确要求本项消除重复 attributes 修改的决定。必要材料留项目内，`.tmp` 可丢弃，历史材料与既有 Owner 清理授权不追溯改写。原始实验只支撑设计；Apply 必须另做真实两 Change、独立 Review、一次 revise 与跨会话验收。

D05 继续独立 bootstrap；本项不接管 D05 自身，不执行 Archify、Full Test、Start/Final 简化或 Git 调用。650 行源码 gate 保持，超限按职责拆分。本轮仅规划，完成后交 `review-propose` 并 STOP。
