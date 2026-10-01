## Context

见 [proposal.md](proposal.md)。目前 `requireNewManagedEvidenceBytes` 已在 create-new checkpoint 暂存和重读之后、commit 之前运行，按 Git index 的新增 managed 路径逐项核对 index/worktree bytes。`declaredProof` 从工作区读取所属 Run 的 context/result，并以 `terminal` 为唯一准入状态。`readDurableRun` 与 `resolveRunChain` 已分别拥有三文件记录校验和 canonical/Policy 链判定；这些规则不得在 Git checker 中复制。

## Goals / Non-Goals

**Goals:**

- 只为本次新增且属于完整 `prepared` 前驱的 proof 增加候选树内合法后继准入。
- 在现有 commit 前校验点证明候选 Git 树将保存判定所用的 Run 链及 owner Result；保留 proof 和 index 原始字节保护。
- 让 terminal 路径继续沿用现有准入，并让拒绝通过既有 Git host incomplete/已暂存效果报告。

**Non-Goals:**

- 不改变 Run lifecycle、Policy、Owner correction 或普通 `status/next` 的来源；不追加 CLI 或 Git authority。
- 不迁移历史 Run/Proof，不扫描无关 Change 或历史 proof，不处理发布/复用节点，不触及 Change E 的发行验收。

## Decisions

### 1. 以 index 候选树作为 prepared 链的读取边界

checkpoint 的 `git add` 已完成后，完整 Git index 表示本次 commit 的候选树：它含 HEAD 沿用的文件和本次暂存文件。prepared 分支仅枚举 proof 所属 Delivery/Change 的 Run group 的 index 路径，读取各路径的 index blob，要求每个 Run 的 `action.md`、`context.json`、`result.json` 齐全且记录、目录身份一致。不同 Run group、stage 冲突、partial 或非规范路径 fail closed。结果不从工作区补文件；本次新增 Run/proof 仍通过现有 index/worktree exact bytes 检查。

这种读取可局限在 `managed-evidence-checkpoint` 附近的窄适配，并复用已有 Git byte helper。只读取工作区链会让未暂存后继错误地授权一次 commit；为每次 checkpoint 创建临时 checkout 则增加副作用和平台复杂度，均不采用。

### 2. 复用现有记录与链规则

候选树中的三文件 bytes 使用与 `readDurableRun` 相同的格式、schema 和地址归属校验形成 `DurableRunRecord[]`；必要时抽出纯解析/校验逻辑，让文件系统读取与 index blob 读取调用同一规则。再由现有 `resolveRunChain` 判定完整链、Role、prepared 四个 null、唯一根/后继和 Policy edge。准入处只额外核对 proof owner 出现在链中、是 `prepared` 且非 tip，并有唯一直接后继。Owner correction 仍由链内现有 Policy 消费已保存 authority；同 Action continuation 也不另立规则。

只把 `terminal || prepared` 作为状态门会放行当前 prepared tip、fork 和非法后继；在 checker 中复制 Policy 状态机则产生第二份真相，均不采用。

### 3. 保留单 proof 声明和失败顺序

现有新增路径与 index/worktree bytes 校验先于 proof owner 准入；每个 proof 仍需在其 Result 中有唯一同身份声明并匹配 path/bytes/SHA。prepared 分支的 owner Result 以候选树 bytes 为准，同时核对本次新增 owner 文件的 index/worktree 一致；若工作区 Result 与候选树冲突，拒绝而不借任一来源补成合法链。terminal 分支不触发整链读取，保持既有行为。

链无效、Git blob 缺失或字节冲突都在 `executeScopedCheckpoint` 的现有 commit 前检验点抛出，交由既有 incomplete 结果报告已发生的暂存效果。Checker 不清空 index、不重试、不写 Run 或 proof。

## Risks / Trade-offs

- **[候选树读取增加每个 prepared proof 的 Git I/O]** → 只针对本次新增 prepared proof 的所属 Change 读取链；同 Change 多个 proof 可复用一次已验证的链，不全仓扫描。
- **[三文件解析规则分叉]** → 复用或抽取 `readDurableRun` 的纯解析/地址校验，再调用 `resolveRunChain`，用同一 fixture 比较两种来源。
- **[index 与工作区各有不同的完整链]** → 只让 index 候选树决定 checkpoint 合法性；本次新增 managed 文件的原始 bytes 仍由既有双源校验约束，冲突直接拒绝。
- **[现有 terminal 用户受 prepared 路径牵连]** → 以 terminal 回归和无新增 proof 的快路径测试确认不触发整链门槛。

## Migration Plan

无需数据迁移。Apply 中先增加有界正反例，再接入校验；历史 Run/Proof 原字节保持。若新校验拒绝某次 checkpoint，保持 index 和工作区供 Owner 按现有 Git 边界处理，不自动回退或重写记录。
