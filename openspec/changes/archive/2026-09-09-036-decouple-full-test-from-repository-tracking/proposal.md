## Why

现行 Full Test 把 Git 可见文件、过程 artifacts 与代码测试身份绑在一起，且缺少可靠的当前尝试和日志保存；checkpoint 又把历史证据空白误当统一阻断。030 Explore 与 031 独立 approved review 已确认这些直接缺口，应按项目测试范围和真实执行事实分开处理。

## What Changes

- **BREAKING**：Full Test 从 target 的单一配置读取命令、cwd、输入与排除范围，不再接受 caller checks/priorFacts 作为该 operation 的配置来源，也不依赖 Git 根、HEAD、ignore/index。
- 每次实际调用创建独立 attempt，保存真实开始、原始输出和结果；既有 Delivery coordination 仅关联当前 attempt。新失败/中断/保存失败不回用旧 PASS，不自动恢复或跨尝试缓存。
- 只核对实际测试输入与配置/工具环境的有效性；非产品图文、真实 Runs/artifacts、合法管理状态不导致代码重测。排除历史材料不免除相关结果的来源、归属和完整性校验。
- 同步 Full Test package、Final 的当前测试消费和必要 evidence/coordination 接点；不全局更改其他 Action 的 shared candidate，不提前简化完整 Start/Final/Integration。
- 拆开源码 gate 与 Git 检查：保留 formatter/lint/650 行等代码要求，历史 proof/原始输入空白不成为 checkpoint blocker；不靠逐 Change attributes、重写证据或反复 Owner 豁免。
- 使用已发行的既有 Full Test API 与 HOW 供授权 Agent 调用，不新增 CLI 写命令、托管协议或目标项目专用胶水工程。

## Capabilities

### New Capabilities

无；在现有 Full Test 与必要直接消费者中收敛。

### Modified Capabilities

- formal-full-test-execution-and-correction：项目配置、独立输入、真实 attempt/结果保存及当前有效消费。
- delivery-operation-execution-and-start-continuity：Full Test concrete package 的 attempt/配置/输入事实。
- applicable-check-execution：明确 shared Action candidate/reuse 不再作为 Full Test 入口的范围和复用依据。
- delivery-finalization：当前 Full Test attempt 的必要消费与前后有效性；其余 Final/Git 连续性不扩张。
- lightweight-engineering-gate：源码质量范围与 Git checkpoint 检查分离，历史材料空白不升级为阻断。

## Impact

实现范围为 Full Test domain、最小项目配置/输入/attempt/日志辅助模块、相关 process 接点、Final/coordination/required-evidence 直接消费者、项目验证脚本、对应 specs/HOW 和 README/AGENTS 必要说明；保留其他 Action、Start 与 Git 流程的原语义。无需新增外部依赖、Registry、证据平台或新的 Runtime/Policy/Action Run schema。

依据：当前 explore.md、031-review-explore approved，以及 Owner 的 gate 修复决定。必要 proof 留在 target artifacts；历史实验不等于新实现 PASS。当前 Run 分组004、projectOrdinal36保持，历史不迁移。本轮仅计划，下一边界独立 review-propose。
