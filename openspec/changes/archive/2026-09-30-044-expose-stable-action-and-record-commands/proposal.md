## Why

当前发行 CLI 只能查询；一次真实 Standard Action 的开始、跨进程结束和必要 proof 核对仍靠 Agent 临时编写 Node 生命周期程序。已批准的 `20260930-001-explore` 与独立 `20260930-002-review-explore` 确认了现有可信 start seam 和三文件 partial 诊断，也确认缺少固定、可接续的发行入口。

## What Changes

- 在选定 manager 的固定 `flowkit` 入口提供数据化、单次 Action 的 `action start` / `action finish` 与有界 proof 辅助操作；输入只表达目标、明确意图、实际角色、受信宿主收到的适用 Owner fact、准备材料与真实结果，不接受 caller 伪造的 current、Run 编号、Guidance 或可执行代码。Owner fact 的 `sourceRef` 可指向 conversation；它由宿主负责对应真实 Owner 输入，manager 按既有 Policy 绑定和核验，不建立新的授权存储。
- start 重新核对可信 coordination、OpenSpec、Policy、Role/Owner、前序链、当前安装 Guidance 和按 Action 划界的 package-bound readiness，分配受控 occurrence；业务开始前 create-once 保存可识别的新 `action.md` descriptor。finish 通过已存 descriptor 和当前可信事实跨进程重建同一 Action 的关联，在首次结果写入前预检 Policy outcome/boundary，接纳实际角色结果与必要 proof，create-once 保存剩余两文件并读回完整 canonical chain。
- 区分未写、已开始但未完成、保存部分成功、写入后未确认、已确认完成与冲突重复请求。旧未知 partial 保持 fail-closed；完整历史 Run 与 D06 prepared Owner correction 保留原字节，后者通过同一固定入口形成合法新 successor。
- 新 finish 只持久化当前 Policy 与 canonical Run-chain 均可接受的 outcome。Reviewer 的实质判断仍可为 `rejected`，但该 token 在现有链中不可读；本 Change 的固定入口须在写入 machine 文件前拒绝并报告未完成，不将其映射成 `changes-requested` 或声称完成。`rejected` 的正式持久化语义留待独立合同决定。
- 同步受影响的 Action HOW、CLI 帮助和调用示例；本 Change 不承担后续 B 的 Delivery/Memo/Final/Git 入口、C 的全目录 Skills 收敛或 F 的 prepared proof checkpoint 兼容修复。

## Capabilities

### New Capabilities

- `stable-action-command-execution`: 固定 Action 开始、结束、proof 核对、跨进程接续及失败/重复请求的可观察合同。

### Modified Capabilities

- `foundation-cli-surface`: 将封闭命令目录与机器结果扩展到受控 Action 写入口，同时保持只读查询和 bootstrap authority 边界。
- `action-guidance-execution`: 使正常产品 HOW 指向固定发行入口，不再把 Agent 临时生命周期程序作为标准路径。
- `run-result-persistence`: 明确新格式 `action.md` 仅供受控 finish 核对已开始的 partial，不把单文件当作完整 Run。

## Impact

影响 `src/cli/**`、现有 domain 的 start/admission/Run/Policy/Guidance 接缝、相应测试、`skills/actions/**` 的直接冲突说明、发行帮助与接入示例。仍由 D06 exact Stable manager 治理本 Delivery；候选命令只在独立 target 中验收。无新依赖、第四个 Run 文件、额外状态库或自动 Agent 循环。
