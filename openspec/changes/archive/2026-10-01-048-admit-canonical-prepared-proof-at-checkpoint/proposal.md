## Why

Managed Change checkpoint 当前只接纳 `terminal` Run 声明的新增 proof，因而拒绝已经通过合法 Owner correction 或同 Action continuation 接续的完整 `prepared` Run proof。Change F 使这类历史原始证据能首次进入 Git，同时保证 checkpoint 保存的候选树自身包含证明合法接续所需的 Run 链。

## What Changes

- 对新增 managed proof 保留现有唯一 `proofRefs` 声明、身份、path/bytes/SHA 和 index/worktree 原始字节校验，以及 `terminal` owner 的既有准入。
- 为 `prepared` owner 增加有界准入：完整三文件 Run、四个 null outcome/next 槽、非 tip 的唯一合法后继，以及复用既有 canonical Run 链与 Policy edge 的整链验证。
- 从本次 checkpoint 的候选 Git 树读取必要 Run 链；仅存在于未提交工作区的后继不能证明该 checkpoint 合法。缺文件、冲突、fork、非法 edge 或证据不匹配时，提交前按既有 Git host 结果 fail closed。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `repository-integration-and-next-base-continuity`：扩展 create-new checkpoint 对新增 managed proof 的准入，限定合法 `prepared` 前驱及候选 Git 树闭包，同时保留 terminal 和原始字节保护。

## Impact

预计涉及 `src/internal/managed-evidence-checkpoint.ts`、候选 Git index 读取与现有 Run 记录/链校验的窄接线，以及对应单元和隔离 Git fixture。无新 CLI 命令、Owner 权限、Run 状态或依赖；不迁移历史 Run/Proof，不改写 LearningPlatform，不提前执行 Change E 的发行验收。
