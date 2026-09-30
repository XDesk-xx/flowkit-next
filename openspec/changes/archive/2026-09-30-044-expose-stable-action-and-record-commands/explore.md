# 标准 Action 与记录的稳定入口：proof Explore

## 当前 Action 与范围

Delivery `20260929-07-bootstrap-execution-and-skill-hardening` 的首个 Change `expose-stable-action-and-record-commands` 已依据 Owner 输入 `owner-input:2026-09-30:activate-first-change:proof-explore` 激活。本次是 Author `explore`，Run `20260930-001-explore`，`projectOrdinal: 44`。规划合同来自 `docs/D07-bootstrap-execution-and-skill-hardening-plan.md` 第 6 节；本 Change 仅处理标准 Action 开始、结束、记录、证据辅助与已支持的 prepared Owner correction 的固定入口。Delivery/Memo/Final/Git 辅助入口属于后续 B，全目录 Skills 收敛属于 C。

目标是让已选 manager 的发行包以固定、数据化的入口完成一个真实 Action 的机械开始与结果接纳，不再要求正常 Agent 自写生命周期程序。Role、Owner、Policy、OpenSpec、Reviewer、Verification 和 Git 权限仍各归其原权威。

## 最小真实证明

| 风险与问题 | 本次事实 | 决定影响 |
| --- | --- | --- |
| 固定入口是否已有写命令？ | `src/cli/request.ts` 的 `FoundationCliCommand` 只有 `status / next / doctor`；`src/cli/entrypoint.ts` 只解析 `--input` 请求并调用查询。发行 `package.json#bin.flowkit` 指向该入口。 | A 需要增加受控的发行写入口及请求/结果合同，不能把现有只读 CLI 改名当作完成。新入口不得成为任意 callback、scriptPath 或动态模块执行器。 |
| 开始是否已有可复用可信 seam？ | `src/domain/canonical-action-run-start.ts` 的 `startCanonicalActionRun()` 在写前重新解析本安装 Guidance、形成 package、执行 package-bound readiness、核对 Guidance 与地址，检查目标 Git bytes 属性，然后 create-once 写 `action.md` 并读回。本次真实 `action.md` 由该安装入口产生，Guidance SHA 为 `6809528efa7c09ff041ded3772a6851feda905084313d4d1efecf5df37eeb13c`。 | 复用既有 start seam；CLI 不应再造一套 package/provenance 判断，也不能仅凭 caller 提供的结构合法 ref 创建记录。D06 保护必须回归。 |
| 跨进程结束可从磁盘读到什么？ | 本次 `action.md` 持久保存 `startedAt`、repositoryRoot 和 ActionPackage：runId、occurrence、identity、role、prepared state、Owner fact、previousRunId、GuidanceRef。`changeStartSequence: 1` 不在 package 内，只由受控 Run 组路径 `001-expose-stable-action-and-record-commands` 表示。`startCanonicalActionRun()` 返回的 input、目录、Markdown、CurrentAction、preparedContext、package 是内存 held 值。 | 新 finish 可以把返回 handle 当定位数据，但必须从唯一受控路径、已存开始记录、真实 Owner/Policy/manager 来源重新核对；不能要求用户重填内部对象，也不能把 `.tmp` held 文件当持久权威。Proposal 需冻结新开始记录的可识别格式及旧记录兼容/拒绝语义。 |
| 现有查询如何看待只写 `action.md`？ | 在本次真实开始后、结束前，已安装 manager 的 `status` 与 `next` 均 exit 2，返回 `run-chain-invalid` / `Incomplete Run record: 20260930-001-explore`。原始 stdout/stderr、命令元数据和请求数据副本在 `.flowkit/artifacts/20260929-07-bootstrap-execution-and-skill-hardening/changes/expose-stable-action-and-record-commands/proof/20260930-001-explore/`。`src/domain/run-result-persistence.ts` 的 `readDurableRun()` 同时读取三文件；`src/cli/current-run-chain.ts` 调用完整链读取，并对目录组唯一性、Policy edge、fork 和断链判定。 | 现有查询不能代替新 finish 的开始记录接续。新 finish 必须有独立、有界的 partial 识别和读回路径，同时保持 `status/next` 对未知 partial 的 fail-closed 行为；不得以目录存在即视为合法可接管。 |
| 结果和重复写入已有何种保护？ | `admitActionResult()` 检查 package/current/occurrence/role/result linkage；`RunResultRecord` 验证形状与 JSON 上限；现行 Guidance 用 `wx` 仅创建缺失的 context/result，读回三文件。`readDurableRun()` 对 `action.md` 只检查非空和大小，不解析其中开始对象。 | A 应把可复用的机械结束逻辑收回 manager 并补足新 start descriptor 的严格读取；先核对材料和候选，再 create-once 写入。响应丢失后的重复 finish 只读确认同一结果或明确拒绝，不能覆盖或重执行业务。 |
| 自有 HOW 的重复范围有多大？ | `rg` 找到 10 个 `skills/actions/**` 文件含 `agent-record-start` / `agent-record-finish` / `agent-check-proof` 样板。 | A 至少同步与新入口直接冲突的帮助/示例；C 再完成全套有效 Skill 的语义收敛。不得把重复代码移动到另一个需 Agent 复制执行的 references 文件。 |

本次探针只对当前已开始的 Run 运行只读 `status/next`。它证明现有 partial 诊断与开始记录字段，不证明新的两进程接口、真实 Reviewer 判断、Apply 回归或发行验收已经通过。探针中的 `.tmp` 请求与宿主程序只是本次旧 manager 下的有界实验；正式新入口不能依赖它们。

## 必须保持的合同

1. **入口与来源。** 开始请求的数据只表达 target、Role、明确 Action 意图及真实 Owner 材料位置；manager 从 target coordination、唯一合法 Run 链和当前安装解析 current/next、编号、地址及 Guidance。命令参数与数据内目标冲突时拒绝。caller 给出的 handle、hash、current 或结果 JSON 不单独产生权限。
2. **开始的提交点。** 准备、Owner/Role/Policy、OpenSpec、必要 Git bytes 与 Guidance 校验都在 create-once `action.md` 前完成。写后出错如实保留 partial，不清理、不复用 occurrence。新固定入口的开始记录需有可严格识别的最小版本/格式；不把旧未知 partial 当成新入口已授权开始。仅有可解析 JSON 或结构合法 package 不足以证明 manager 起源；本合同约束受信宿主的正常 Flowkit 路径，不声称抵御任意本机恶意文件写入。
3. **跨进程关联。** finish 按受控 target/Change/唯一 Run 地址读取新开始记录，并重新核对原始 bytes、package、受信安装、当前协调和前序链；`changeStartSequence` 从唯一合法 Run 组取得。handle 只是定位器。须明确安装/Guidance 在进行中变化、开始记录损坏、前序变化或 Owner 来源不可读时的 fail-closed 结果。当前 Delivery 不更换管理它的稳定安装。
4. **结束与重复请求。** Agent/Reviewer 仍实际完成各自工作并提交角色对应结论；manager 只接纳和保存真实结果，不创造 verdict、Verification PASS 或业务成功。必要 proof 的归属、SHA、原始 Git bytes 在接纳前核对。首次结束只创建缺失的 `context.json/result.json` 并读回；响应丢失、重复同值、冲突值、部分写入和并发 successor 的结果须可区别，不能覆盖或自动重试业务动作。
5. **历史与边界。** 历史三文件原字节及 D06 prepared Owner correction 不重签、不追溯。状态仍只有 `prepared / terminal`，不增 session DB、PID/PTY reservation、通用锁服务、Registry 或自动 Action 链。A 不预支 B/C/F 的合同，也不让候选管理本 Delivery。

## 最小 Proposal 方向

在发行 `flowkit` 入口增加固定、严格解析的 Action start/finish 与必要 proof 辅助能力；内部复用 `startCanonicalActionRun()`、Run 地址/链读取、Policy、Guidance、`admitActionResult()` 和既有证据校验。为新的 CLI 开始记录定义最小可读 descriptor，明确版本与历史 partial 拒绝边界，不扩大三文件 Run；finish 从该记录和当前可信事实重建关联，数据化接收真实角色结论。输出须区分 ready、blocked、incomplete、failed、written-unconfirmed 等实际效果，不以 exit 0 推断完成。至少两个 CLI 进程的 start→finish、丢响应与竞争、错 Role/target/Action、Guidance/Owner/材料损坏、D06 correction 回归由后续 Apply 验收。

Proposal 应明确开始前/后的失败顺序，以及结束写 `context.json` 成功而 `result.json` 失败时怎样报告并保留 partial。若无法在现有 `action.md` 内安全表达新 descriptor，先证明最小兼容补充的必要性，不能静默增加第四个 durable Run 文件。

## 结论与限制

**PASS（Proposal-ready Explore）**：真实开始和只读探针支持一个有界修复：复用 manager 现有 start/Run/Policy 能力，在固定发行入口补足可识别的跨进程开始记录和受控 finish；未知 partial 继续 fail-closed。尚未实现或验证两进程闭环，也没有修改产品代码、测试或候选 Skills。下一独立边界为 `review-explore`。
