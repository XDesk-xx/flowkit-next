# Flowkit 1.0.0 在 MenDi 的问题记录

记录日期：2026-10-03。目标仓库：`D:\Projects\MenDi`。实际管理器：`D:\tools\flowkit-manager\node_modules\flowkit-next`，其 `package.json` 标示版本为 `1.0.0`。本文记录当前安装和 MenDi 持久记录的观察结果，供 Flowkit 修复与回归验收使用；未修改管理器、既有 Run 或归档内容。

## 当前状态与结论

D01-C `establish-delivery-change-and-multirun-kernel` 已完成归档。`20261003-011-archive` 的 `action finish` 返回 `effect: confirmed`；随后 `status` 返回 `archived`、Change 为 `completed`。`next` 为 `ready-checkpoint-evaluation`，但 checkpoint 的 `authorized` 为 `false`，原因是 `owner-authority-missing`。本文不代表 checkpoint 或 Git 操作。

目前有两项需要修复的管理器问题：新 Change 的 Run 编号重置，以及归档隔离检查与 pnpm 的依赖目录保护冲突。后者还暴露了错误诊断和未完成 Run 恢复信息不足的问题。

## F-01：同一 Delivery 的 Run 编号重置

### 观察

同一个 Delivery `20261002-01-engineering-foundation-and-trusted-workflow-core` 中，三个 Change 的持久目录如下：

| Change | `projectOrdinal` | 实际 Run 分组 | 实际 Run 序号 |
| --- | ---: | --- | --- |
| D01-A 工程基线 | 1 | `001-establish-engineering-baseline-and-runnable-skeleton` | `20261002-001` 至 `20261002-011` |
| D01-B 身份与授权 | 2 | `012-establish-identity-role-and-authorization-contract` | `20261002-012` 至 `20261003-022` |
| D01-C 生命周期 | 3 | `001-establish-delivery-change-and-multirun-kernel` | `20261003-001` 至 `20261003-011` |

证据位于 [`.flowkit/runs/20261002-01-engineering-foundation-and-trusted-workflow-core/`](.flowkit/runs/20261002-01-engineering-foundation-and-trusted-workflow-core/)；各 Change 首个 `explore/action.md` 和 `context.json` 都保存了实际的 `changeStartSequence`、`occurrence.sequence` 与 `previousRunId: null`。D01-C 的 proof 目录也使用重复的 `001-...` 分组。归档名中的 `001/002/003` 来自独立的 `projectOrdinal`，本身正确，不能拿它替代 Run 序号。

### 已定位原因与未确认部分

当前**已安装**管理器的 `dist/cli/current-run-chain.js` 在找不到目标 Change 的 Run 分组时固定返回 `changeStartSequence: 1`；`dist/cli/action-commands.js` 在没有该 Change 的前序 Run 时用 `(previous?.context.occurrence.sequence ?? 0) + 1` 分配新序号。因此新 Change 会从 `001` 开始，不读取同一 Delivery 其他 Change 的最大 Run 序号。D01-C 的实际结果与该代码一致。

D01-B 曾从 `012` 开始，但其首个 Run 的 `previousRunId` 也是 `null`。仅凭现存 Run 和当前安装，无法证明当时由哪一版管理器算法分配 `012`；不要反推或补造历史来源。若合同要求 Delivery 内连续编号，D01-C 在 D01-B 的 `022` 后本应从 `023` 开始；现存 D01-C Run 为不可变历史，不能直接重命名为 `023–033`。

影响是同一 Delivery 已有两组 `001–011`。当前目录仍靠 ChangeId 区分；但以日期、Run 序号和 Action 组成的 `runId` 在两个 Change 同日启动时可能重复。依赖 Delivery 范围唯一序号的统计、关联或未来迁移不能把这些历史记录直接当成连续无重号链。

Flowkit 源码工作区 `D:\Projects\flowkit-next` 当前存在**未提交**的 `src/cli/action-commands.ts`、`src/cli/current-run-chain.ts` 编号改动和新测试；这些不是已安装管理器的功能。该草案按 Delivery 汇总旧序号，并在重号或缺口时报错。按其现有判断，MenDi 的两段 `001–011` 会触发 `Delivery Run sequences overlap or have a gap`，因此修复方案还必须明确如何读取既有不可变历史，不能只验证全新 fixture。

### 修复与验收建议

1. 明确 Run 序号的正式作用域。如果仍是 Delivery 内连续序号，新 Change 的首个 Run 须从已确认的 Delivery 历史分配，分组前缀与首个 Run 一致；后续 Run 接续该 Change 的前序。
2. 对 MenDi 这种已归档且存在重号的历史制定**只读兼容/迁移策略**，明确未来编号与旧记录的关联方式；不得静默重命名或重写已完成的三文件 Run、proof 引用和哈希。
3. 回归测试同时覆盖全新 Delivery 的多个 Change、跨日期接续、同日潜在 `runId` 碰撞，以及已有 `001–011`、`012–022`、`001–011` 历史下的只读查询和后续分配。测试应使用真实固定入口及持久文件读回。

## F-02：Archive 隔离检查与 pnpm 11 冲突

### 复现与结果

`archive` 的固定 `action start` 在创建 Run 前进行隔离收敛与 `test:domain`、`check` 验证。未调整环境时返回：

```json
{"kind":"archive-check-failed","message":"Post-convergence check failed: test:domain"}
```

在相同布局的临时副本中直接运行检查，pnpm 11.22.0 的实际错误为：

```text
[ERR_PNPM_UNSAFE_MODULES_DIR] Refusing to remove the modules directory ...
because its resolved target is not a strict subdirectory of the project root ...
```

临时副本的 OpenSpec 归档收敛已经成功；pnpm 在执行领域测试之前检查依赖状态并拒绝了跨目录链接。把 `pnpm_config_verify_deps_before_run=false` **仅设置在该归档命令进程**后，相同隔离副本的 `test:domain` 通过 33 项测试，完整 `check` 的类型检查、测试、构建和候选包检查也通过。原 Change 候选未因这个环境调整而改动。

### 根因与本次操作失误

已安装管理器的 `dist/cli/action-readiness.js` 将目标复制到系统临时目录，排除原 `node_modules`，然后以 Windows junction 将临时目录的 `node_modules` 指向 MenDi 原目录。随后它通过 `pnpm run <script>` 执行检查。pnpm 的运行前依赖同步检查发现链接目标不在临时项目内，故拒绝运行。这是管理器隔离布局与目标包管理器保护机制的兼容问题，并非领域测试失败。

`action start` 和 `change archive` **各自执行一次**上述归档预检。我第一次仅在 `action start` 进程设置了环境变量，漏传给 `change archive`；后者返回 `status: incomplete`、`effect: none`，留下只有 `action.md` 的 `20261003-011-archive`。这是我的操作遗漏。读回代码与目录确认失败发生在真实 OpenSpec 归档之前、没有归档副作用后，才在**同一 Run**中使用已验证的环境设置恢复；最终 `change archive` 返回 `completed / archive-and-coordination`，`action finish` 返回 `confirmed`。没有新建或伪造 Run。

### 修复与验收建议

1. 管理器应提供与 pnpm 11 安全检查兼容的隔离依赖布局或固定检查调用方式，确保不在临时副本自动安装、删除或改动原项目 `node_modules`，同时确实执行目标声明的检查。
2. `action start` 与 `change archive` 的同一预检应有一致、明确的环境合同；不依赖操作人给两个命令分别补隐藏环境条件。
3. Windows、pnpm 11、`node_modules` junction 的真实回归应证明归档后规范收敛、`test:domain`、`check` 都在隔离副本通过，并确认目标候选字节未漂移；失败测试仍须真实阻断归档。

## F-03：归档失败诊断与恢复状态不清楚

`dist/cli/action-readiness.js` 捕获检查异常后只输出 `archive-check-failed` 和检查 ID，丢失子进程退出码与原始 stderr。用户因而看到“`test:domain` 失败”，却看不到真正的 `ERR_PNPM_UNSAFE_MODULES_DIR`。应在保持密钥与输出边界的前提下暴露可诊断的退出状态及有界原始错误信息，区分测试断言失败、命令不可用和依赖环境失败。

本次 `change archive` 返回 `effect: none` 后，Run 只有 `action.md`，常规 `status` 和 `next` 均返回 `run-chain-invalid: Incomplete Run record: 20261003-011-archive`。拒绝把不完整 Run 当作正常状态是合理的；但恢复入口应能只读呈现该 Run、已确认效果、可否同 Run 恢复及禁止重做的边界，避免让使用者猜测或新建 Run。不同的 `effect`（`none`、`openspec-unknown`、`archived`、`coordination-unknown`）必须分别处理，不能统一自动重试。

## 历史事件与处理边界

此前 `review-explore` 曾因 `artifactHashes` 与 `facts.exploreArtifact` / `facts.exploreSha256` 的交接格式不一致而阻断；之后的 D01-B、D01-C Review 已成功执行。它是另一类历史问题，不是本次归档失败的原因，也不在本文声称仍然未修复。

当前 D01-C 已归档，本文仅记录管理器缺陷及待验收方向。修复应在 Flowkit 自身的变更流程中完成并安装经核对的新包；MenDi 不应手改历史 Run、归档目录或管理器安装目录来掩盖问题。
