## Context

见 [proposal.md](proposal.md) 的范围。当前发行 `flowkit` 只有 `status/next/doctor`；现有 `startCanonicalActionRun()` 能在当前 manager 安装下绑定 Guidance 并 create-once 写 `action.md`，但返回的 package/current/input 只在调用进程内存中。一般 Run reader 要求三文件齐全，对 partial 报 `run-chain-invalid`。`20260930-001-explore` 的真实开始与只读探针、`20260930-002-review-explore` 的批准支持这一边界；它们不是新命令验收。

## Goals / Non-Goals

**Goals:** 一个固定发行入口在两个独立进程完成同一 Action 的机械开始和结束；所有权限/身份重建来自当前安装与 target 正式事实；真实 partial 和重复请求有确定结果。新路径仍可用于已支持的 prepared Owner correction。

**Non-Goals:** CLI 不代替 Agent 执行 OpenSpec、编码、审查或测试；不增加第四个 Run 文件、session DB、PID/PTY 预留、通用锁、自动工作流、第二份 Policy 或 target glue 程序。不修改旧 Run/Proof，也不在 D07 中用 candidate 管理自身。

## Decisions

### 1. 固定命令与请求边界

同一 `bin.flowkit` 增加 `action start`、`action finish`、`proof inspect`，保留原查询命令。复杂请求由 `--input <file|->` 提供 JSON 数据，`-` 表示 stdin 数据流；命令行可见 target 参数与 JSON 内 target 必须一致。解析器用封闭字段集合，拒绝重复 JSON key、未知 authority-bearing 字段、相互冲突的目标与任何 script/module/callback/eval 字段。`actionId` 是明确 Standard Action ID；不增加模糊 `review`/`revise` 自动路由。Role 由实际执行者声明并与该 Action 的既有角色合同匹配。

Owner correction 的输入边界沿用 `OwnerAuthorityFact` 与 `startPreparedOwnerCorrectionRun`：收到明确 Owner 指令的受信 Agent 宿主在 `action start` 数据中提交 exact fact，包含可指向 conversation 的真实 `sourceRef`。宿主负责把该 fact 对应到 Owner 输入；manager 只验证既有结构、`decision=revise-action`、Delivery/Change、单元素 revise scope、当前 prepared Author Run 及 Policy/transition，不把 sourceRef 当签名或自动生成授权。无需预先把 conversation 写入 Delivery manifest，也不新建 Owner registry。start 将 exact fact/sourceRef 存入 ActionPackage 与 prepared context 的开始 descriptor；finish 从这些已绑定 bytes 重建并复核 Policy，拒绝 finish 另带不同 fact，不要求在第二进程重新访问聊天。普通 Action 没有新 Owner fact 前置。

命令输出统一带 effect（`blocked`、`not-written`、`started`、`incomplete`、`written-unconfirmed`、`confirmed` 等）与 exact 受控 Run 定位；非确认效果不能被解释为 durable completion。查询结果的既有 shape/退出行为不改变。候选可以由独立 target 验收；目标仓库位置不会反选安装。

### 2. 开始前读取与 package-bound readiness

复用当前 CLI 的可信 target/coordination/OpenSpec/唯一完整链 resolver 与既有 Policy；运行入口在开始前完成 Action、Role、Owner、previousRunId、occurrence、Git bytes、Guidance 的核对。编号由唯一完整链递增，不能由请求指定或按目录最大值猜。prepared Owner correction 走既有 Policy/transition 检查，指向原 prepared Run 的唯一 successor。当前 `single-action-execution-terminal-boundary` 的 package-bound preparation 与本安装 `skills/actions/<id>/SKILL.md` 是检查来源；manager 只把可机器判定的条件收敛为固定检查，不把 Author/Reviewer 的内容判断搬进 CLI。start seam 在写入前二次解析 Guidance 并核对 expected ref；不能传入调用者脚本，也不能无条件返回 ready。

| exact Action | package-bound 机器检查与 canonical 来源 | 仍由实际角色完成 |
| --- | --- | --- |
| `explore` / `revise-explore` | active target、Owner activation/适用 correction、唯一链与受控 `projectOrdinal` 基线；`policy-and-next-boundary`、`skills/actions/explore` / `revise-explore` | Author 核对真实问题、proof、范围并写 Explore；缺 ordinal 的 Owner 决定不由命令猜测 |
| `review-explore` | 当前 terminal Author Explore 与所指产物/必要引用存在且归属匹配；`skills/actions/review-explore` | Reviewer 独立判断 proof 真假、范围和 Proposal readiness |
| `propose` / `revise-propose` | approved Explore 或 exact changes-requested Proposal 的链与 OpenSpec Change/status 可读取；`skills/actions/propose` / `revise-propose` | Author 收敛或修复规划语义，决定最小合同 |
| `review-propose` | 当前 terminal Author Proposal、当前 OpenSpec schema 所需 artifact 路径与已声明身份可读；`skills/actions/review-propose` 与 OpenSpec status | Reviewer 独立审查 traceability、可测试性、Apply readiness；机器存在性不等于 approved |
| `apply` / `revise-apply` | exact approved Proposal 或 changes-requested Apply、必需规划产物/任务与适用 OpenSpec strict 结果可核对；`skills/actions/apply` / `revise-apply` | Author 实施代码与适用测试，不从结构检查推断实现正确 |
| `review-apply` | exact terminal Author candidate、已声明 diff/验证引用及 Git byte identity 可核对；`skills/actions/review-apply` | Reviewer 独立判断实现、回归、范围与证据 |
| `archive` | exact accepted `review-apply` 与候选 bytes 未漂移、受控 ordinal、OpenSpec delta/目标 collision、隔离 canonical-convergence dry-run、适用已配置检查的真实执行结果、completion-transition/handoff 可物化；`skills/actions/archive` 的 package-bound preparation 与现有 completion evaluator | Author 判定哪些 domain 检查 materially applicable、解释失败是否需修候选，并进行已准备好的真实 archive；不能用 `review-apply approved` 或请求布尔值代替准备 |

表中的 artifact/检查仅是机器可验证的地址、状态、执行结果与引用；内容质量判断仍归实际角色。`archive` 的固定准备在同一个 package 绑定后、`action.md` 和 archive mutation 前运行：manager 用受控 OpenSpec/convergence 与目标已配置检查执行或核对必要结果，Agent 以数据声明适用检查与依据，命令拒绝未配置的任意命令、缺失证据和失败结果。completion-transition readiness 只预测既有完成写入能否合法形成，不预先要求 Change 已 `completed`。环境阻断保留原候选；发现需改 canonical/candidate bytes 则回到既有 Owner correction 与新 `review-apply` 边界，不由 CLI 自动修改。

普通 Action 和 correction 使用同一 create-once 开始路径。任何开始前可检测失败不创建 occurrence；写入或读回失败时保留实际 bytes 并报告 exact effect。Agent 只有得到经读回的 `started` 才开始实质工作。这个顺序保留现有受信 manager 安装的来源边界，不声称抵御任意本机恶意写盘者。

### 3. 新开始 descriptor 与跨进程 finish

新命令的 `action.md` 保持 `# Action started` 标题和其后单个受限 JSON 对象；对象增补 `formatVersion: 1`、`commandOrigin: "flowkit-action-start"`、`changeStartSequence`、`actionPackage`、`preparedContext`。其余完整机器结果仍只在既有 `context.json/result.json`。此格式只适用于新命令创建的 occurrence；旧完整记录原样读取，旧未知 partial 不自动升级。格式标记不是签名；finish 必须对照 exact path、原 bytes、受控 Run 地址、上下文/package 校验器、当前可信安装 Guidance、唯一前序链、已绑定 Owner fact 与 coordination/Policy。可重建字段从这些事实生成，start 输出的 runId 只是定位器，不用于绕过核验。

当前安装的 canonical Guidance path 与 bytes 必须匹配开始时的 `GuidanceRef`；改变安装绝对路径但相对路径与 bytes 不变可继续。当前 manager 在一个 Delivery 内正常不更换。差异、损坏或已绑定 Owner fact 与 package/Policy 不一致时报有界 blocked；conversation sourceRef 无须被 CLI 重读。不把 `status/next` 对 partial 的 fail-closed 诊断改成自动恢复。

### 4. 结束、proof 与重复请求

`proof inspect` 只为明确的当前材料返回受控路径、bytes、SHA-256 与有效 Git 原始字节结果；它不保存副本或认定业务 PASS。Agent 自己形成必要材料；finish 从 Result 所声明的当前 proof 引用逐项重新验证归属、路径、regular/readable、bytes/hash、Git bytes，检查与实际角色结论的对应。无必要材料可用空引用，不建空 proof 目录。

finish 先严格读新 descriptor 和当前事实，再验证候选 Result、材料、admission 与 terminal/prepared 转换；在首次 machine 文件写入前，以拟保存的 exact context/result 调用现有 `evaluatePolicyAndNextBoundary`，并要求该 outcome 可被现有 canonical Run-chain 接受。reported `nextBoundary` 与 Policy 正常边冲突时拒绝。真实 Author `FAIL` 且 `nextBoundary=null` 可用现有 Run-chain 的有界例外保存为 terminal blocked；它不是 PASS 或合法继续。Reviewer `rejected` 虽是 Reviewer Guidance 中可表达的实质判断，但当前 Policy 给出 `unrecognized-reviewer-verdict`，Run-chain 对 blocked terminal 仅允许 Author `FAIL`；本 Change 不改变这两处语义。新 finish 对 `rejected`（包括 `nextBoundary=null`）在写入 `context.json/result.json` 前返回明确 unsupported/incomplete，保留开始记录与真实材料，Reviewer 向 Owner 报告实际判断与未完成限制，不重标为 `changes-requested` 或声称正式 Reviewer Run terminal；后续需独立的合法 correction/Owner 边界。其他未知 Reviewer token 同样写前拒绝。prepared failure 的四个 outcome/next 槽保持 null。`archive` 的预检在真实 archive 业务和完成 transition 后使用可信 materialized `completed` facts，不由请求虚构完成状态。通过后以 `wx` 依次保存 `context.json`、`result.json`，再用完整 canonical chain resolver 与 Policy 读回本次 exact tip；仅 `readDurableRun()` 的三文件结构读回不够。`review-propose approved` 加 `nextBoundary=archive` 必须在写前被拒绝。`context.json` 已写而 `result.json` 未写、任何链/Policy 读回失败或写后响应丢失均保留原样并返回真实不完整/未确认状态；正常 retry 不补写 partial。若完整记录已存在，逐项核对与重发内容相同才只读返回 `confirmed`，否则拒绝冲突；`confirmed` 只表示持久记录成立，不表示业务 PASS。对并发同前序/同 occurrence 的竞争，以 create-once 与唯一链核对拒绝或报告未确认，不引入长时锁服务。

### 5. 直接消费者与回归范围

A 更新入口帮助、README/接入示例及与新命令直接矛盾的 Action HOW，将 start/finish/proof 机械示例换为固定命令使用；C 后续检查全部 Skills 的整体语义。产品测试覆盖两独立 CLI 进程、partial、重复和竞争、错目标/Role/Action、伪造包、Guidance/Owner/proof 漂移、conversation sourceRef correction、wrong reported boundary/unknown verdict、archive dry-run/完成前置阻断，以及旧 `status/next/doctor`、D06 Guidance provenance/原始 Git bytes 的回归。正式 Reviewer 和 Full Test 仍由各自后续边界完成。

## Risks / Trade-offs

- **新 descriptor 被手写伪造** → marker 仅作格式识别；finish 逐项重建可信上下文与当前安装身份。任意本机恶意文件写入超出本模型保护范围。
- **写入部分成功使 Action 暂时不可接续** → 保留并报告 exact partial，常规命令不伪造成功或自动覆盖；由独立合法纠正边界处理，不扩大 A 为通用恢复系统。
- **Action-specific readiness 的收敛遗漏旧检查** → 按上表、既有 Policy/Skill 来源建立有界映射与回归，尤其验证 archive convergence/完成前置及 Reviewer 独立判断；不用恒定 ready 或执行 Agent 工作的 callback。
- **当前 Guidance 在开始后变化** → finish fail closed；历史完整 Run 只按原始身份读取，不追溯否决。

## Migration Plan

先在候选包与独立 target 上验证两进程闭环和负例，再经本 Delivery 的独立 Review、Verification、Final 与 Git 边界发布。历史完整/partial Run 与旧 Stable 安装保持原字节；新命令只接续自身新格式的开始记录。回退发行包不迁移或清理项目历史。
