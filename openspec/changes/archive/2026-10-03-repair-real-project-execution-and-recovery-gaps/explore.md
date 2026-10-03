# 真实项目执行与恢复缺口 Explore

Change：`repair-real-project-execution-and-recovery-gaps`。日期：2026-10-03。

## Owner 目标与本次执行边界

将 LearningPlatform 和 MenDi 暴露的问题合并为一个修复 Change，调查真实原因、历史兼容和最小修复范围。Owner 明确授权“直接使用 openspec 方式创建 explore，不走 runs”；因此本次由 exact OpenSpec `1.10.0` 的 `new change` 创建 scaffold，在该 Change 内保存调查，不创建 Delivery、Flowkit Run/Result、projectOrdinal 或 lifecycle authority，不调用 candidate 自管理。

本文件记录 Explore 事实和建议，供后续 Proposal 使用；不代表 Reviewer approval、当前实现 PASS、Formal Full Test、安装升级或 Git 授权。生产代码和已有测试草案均未修改。

## 输入、现场与证据层次

| Owner 输入（相对仓库根） | SHA-256 |
| --- | --- |
| [flowkit-current-issues-2026-10-03.md](../../../flowkit-current-issues-2026-10-03.md) | `0820086010e11b1f44ae95fdaf288b74c27a77350176270635ba3cb6dbc5cd12` |
| [flowkit-1.0.0-issues-2026-10-03.md](../../../flowkit-1.0.0-issues-2026-10-03.md) | `f88e8f376e0e17fcdd11299b770546a462c321cb540bc485367ba6f9162789ad` |

调查 base 为 `main@7ccd269bae0fa550fa6fd61b660c98390dd7937e`。现场已有未提交的 `src/cli/action-commands.ts`、`src/cli/current-run-chain.ts` 和 `tests/unit/domain/delivery-run-sequence.test.ts`，属于待评估编号草案；不能用它们证明已安装产品已修复。

实际报告与本次安装代码核对对象为 `D:/tools/flowkit-manager/node_modules/flowkit-next`，metadata 标示 `flowkit-next@1.0.0`，入口取其 `package.json#bin.flowkit`。创建本 Change 前，固定 manager `status/next` 返回 `idle`，`doctor` 返回 `pass` / OpenSpec `1.10.0`；这些只证明当时查询事实，不建立本 Change 的 Flowkit 生命周期。OpenSpec runtime 为 `C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js`，`--version` 实读为 `1.10.0`。

证据分为：Owner 报告的事故与建议、实读外部项目记录、已安装 manager 行为源码、当前仓库 spec 与代码草案。本次只读观察不是修复后的回归验收；报告建议也不自动成为已存在的规范要求。原报告内相对链接按原项目根解析，不能因为报告复制到 Flowkit 就改按本仓库解析。

## 单 Change 问题范围

| 子问题 | 原记录 | 现场证明或源码定位 | 现有能力归属 |
| --- | --- | --- | --- |
| Review 可 terminal，Archive 才首次要求精确 Author 绑定 | FKI-01 | `action-readiness.ts#archiveReadiness` 要求 `facts.reviewedRunId`；`action-artifact-hashes.ts#checkResultArtifactsOnFinish` 没有 Reviewer 对称检查；Run 006 repair 仅补该绑定 | Result admission / Review / Archive readiness |
| terminal 元数据错误没有保留原 bytes 的正式纠正入口 | FKI-02 | fixed start 仅接纳 prepared Author Owner correction；项目 Run 005/006 使用 Owner 特例覆盖 canonical Result | Run persistence / Owner correction / 直接后继消费 |
| pnpm 11 拒绝 Archive scratch 指向原依赖的 junction | FKI-03、F-02 | Archive 排除 `node_modules` 后创建 junction；项目原始 stdout 显示 `ERR_PNPM_UNSAFE_MODULES_DIR` | Archive convergence checks |
| raw 候选与 Git-filtered blob 身份不同 | FKI-04 | LearningPlatform 三文件当前仍为 `i/lf w/crlf`，raw/filtered hash 不同；checkpoint 没有对应候选映射或全候选字节对齐检查 | 候选身份 / scoped Git preflight |
| `rejected` 审查无法 terminal 持久化 | FKI-05 | Policy normal matrix 只识别 `approved`、`changes-requested`；finish 与 Run-chain 继承同一限制 | Policy / finish / Run-chain |
| 新 Change 序号重置，修复草案不能兼容旧重号 | F-01 | fixed start 按该 Change 前序或 0 分配；MenDi 三组各 11 个 Run，区间 1–11、12–22、1–11 | 既有 occurrence 分配 / 历史读取 |
| Archive 原始失败原因丢失，partial 的恢复信息不足 | F-03、FKI-03 | catch 仅返回 check ID，finally 删除 scratch；Archive 支持命令有 effect 分级，普通链读取拒绝 partial | Archive 诊断 / descriptor 只读观察 |

合并理由：七项均属于现有固定命令对执行事实、候选身份和失败边界的闭合。Archive 环境与诊断在两项目重复出现；候选绑定、terminal 纠正和后继消费彼此相关，需要在同一个合同内防止“前一入口接纳、后一入口拒绝”。实现可分步，但本次不另建平台或拆出无关治理工程。

## 关键调查与收敛决定

### A. 身份应在首次 terminal 写前闭合

实读 LearningPlatform `.flowkit/artifacts/d09-teacher-student-workspaces/repairs/2026-10-03-run-006-review-binding/repair-record.json`。记录绑定 Run `20261003-006-review-apply` 与 Author `20261002-005-apply`，修改仅补 `facts.reviewedRunId`，其余候选与 verdict 保持原值。它证明这次事故的身份差异，不证明产品入口已修。

最小方向：Review finish 从真实 descriptor/predecessor 确认 exact Author Run，与 Result 的 `reviewedRunId`、已有 `reviewedAuthorRunId` 及候选身份一致；缺字段或冲突在 machine 文件写入前拒绝，保留开始记录。Archive 继续复核同一合同，不在下游首次引入关键必需字段。失败 Review 也绑定被审候选，不能为了存 rejected 取消身份核对。

当前 apply/revise-apply PASS 已要求非空 `artifactHashes` 并核对真实 bytes；Run 005 的历史遗漏不能被重复宣称为当前相同缺陷。验收需覆盖 missing、wrong predecessor、conflicting aliases、候选漂移，以及 Review 成功后 Archive 不再因同一绑定规则失败。

### B. 新序号分配保持旧 Change 链与旧历史

当前 `run-result-persistence/spec.md` 要求 occurrence 是 Change-scoped、create-once、sequence-unique，没有要求 Delivery 全历史连续。因此 Delivery 内新分配递增属于要明确扩展的合同，不是对现有 spec 的机械补丁。

本次枚举 MenDi `D:/Projects/MenDi/.flowkit/runs/20261002-01-engineering-foundation-and-trusted-workflow-core/` 的 context：

| 分组 | 首 Run | 序号区间 | 数量 |
| --- | --- | --- | ---: |
| `001-establish-engineering-baseline-and-runnable-skeleton` | `20261002-001-explore` | 1–11 | 11 |
| `012-establish-identity-role-and-authorization-contract` | `20261002-012-explore` | 12–22 | 11 |
| `001-establish-delivery-change-and-multirun-kernel` | `20261003-001-explore` | 1–11 | 11 |

固定安装的 `dist/cli/current-run-chain.js` 对不存在的分组返回 start sequence 1，`dist/cli/action-commands.js` 用 `(previous?.context.occurrence.sequence ?? 0) + 1`。现场草案 `nextDeliveryRunSequence` 要求其他 Change 所有序号排序后相邻为 +1；上述重号历史会令它失败。身份组为何历史上从 12 开始仍无已确认来源，不能反推 manager 版本。

收敛方向：保持每个 Change 内完整链校验及同 Change `previousRunId`；新 Change 首次序号取经验证同 Delivery 已占用最大值之后，首次 Run 和分组前缀一致。后续同 Change 在 single-current/single-writer 下继续递增，同时核对跨 Change 已占用冲突，不无条件假设已分配区间合法。旧跨 Change 重号/缺口作为可诊断兼容事实读取，不能阻断未来高于最大值的新分配；Change 内重复/断链、未知归属、非法序号及未解决 partial 仍 fail closed。合法 partial descriptor 的序号也是占用，不能因 result 缺失忽略它。

对该样本，未来新 Change 的首个候选值为 23；这不是对 MenDi 分配的实际执行或授权。既有生命周期组不改为 23–33；旧 runId 必须与 Delivery/Change 上下文一起定位。保留 1–11 原 bytes、Proof 和引用，不将 `projectOrdinal` 作为 Run 序号来源。

验收覆盖新 Delivery、多 Change、跨日期、同日碰撞、旧重号/缺口的查询及后续分配、partial 占用、无效链和真实固定命令读回。不建立 Registry、锁服务或跨 Delivery global counter。

### C. Archive 检查必须执行且不能偷偷安装原依赖

LearningPlatform 诊断材料位于 `D:/AI/src/LearningPlatform/.flowkit/artifacts/d09-teacher-student-workspaces/repairs/2026-10-03-archive-preflight-pnpm-junction/`。本次实读 `diagnostic.json` 和 `check-fast.stdout.txt`，原始输出含 `ERR_PNPM_UNSAFE_MODULES_DIR` 与 `pnpm install`，项目检查尚未开始。

再读本机 exact pnpm `11.22.0/dist/pnpm.mjs`：`runDepsStatusCheck` 在依赖状态不一致且 `verifyDepsBeforeRun == "install"` 时调用 install；script handler 在项目 script 之前调用它。pnpm 自身给子进程配置 `pnpm_config_verify_deps_before_run=false`，说明该设置影响 pre-run 同步，不能等同完整文件系统隔离。MenDi 报告的进程级设置是有界处置，本次没有再次执行其归档或声称新测试 PASS。

推荐最小调查方向是复用现有 Archive check executor，统一 `action start` 与 `change archive` 的局部执行环境，避免 pre-run 自动 install；若采用共享已有依赖，必须在依赖/lock 状态可核对且适用脚本不写共享依赖的真实输入域内证明，不宣称任意脚本隔离。不能只置一个环境变量就放行依赖不匹配。若真实目标需要写依赖或不能满足上述前提，则用 scratch 内独立依赖布局；不能自动安装或回写原项目。具体选型在 Proposal 固定，不预设所有项目都要复制整个依赖树。

清理 scratch 前持久化受控 argv/cwd、起止/退出状态、raw stdout/stderr 及环境限制，错误返回诊断引用。区分脚本断言失败、command unavailable、timeout、依赖环境失败；不能把 pnpm 前置失败伪称测试失败。start 前失败没有 Run，诊断归属不伪造 Run；继续使用 target artifacts 的有界材料而非通用证据平台。原始流不格式化，输出范围有限且不收集秘密配置。

验收必须包含 native Windows + pnpm 11：项目 script 确实执行，真实失败确实阻断，两处预检合同一致，原 candidate bytes 未漂移，原依赖未被 manager 安装/删除，失败原始原因可读。现有 Windows simulation、Linux acceptance 和较窄 canonical-specs 检查不能代替这个场景。

### D. partial 的可观察性与恢复权限分开

`support-change-archive.ts` 的 mutation 顺序是校验 descriptor/前序/候选 → 隔离预检 → 再验 current → `effect=openspec-unknown` → 真实 OpenSpec archive → archive 结果/命名核对 → `effect=archived` → `effect=coordination-unknown` → coordination 写入/读回 → completed。catch 只报告当次内存 effect，不能把它当跨会话持久执行事实。

最小方向为现有 descriptor/Action 支持一个只读、绑定 root/Guidance/Run 的诊断视图。它允许呈现合法 partial 的 exact 位置和可验证副作用，不放宽完整 canonical chain 的准入，不把仅有 action.md 命名为已有完整 prepared/terminal Run。

| 观察到的边界 | 继续之前的必要核对 |
| --- | --- |
| `none` | 再核对 source Change、archive target、spec 和 coordination，证明确无业务副作用才考虑同 Run 恢复 |
| `openspec-unknown` | 先观察真实 archive/spec 效果；不重放可能已成功的 archive |
| `archived` | 不重放归档；只处理已确认剩余命名/协调/记录步骤 |
| `coordination-unknown` | 先读回协调，再确定剩余步骤；不能覆盖已完成状态 |
| 报告丢失或事实矛盾 | 保持 unknown、原 bytes 和阻断，交接所缺事实 |

有副作用的恢复仅复用 exact Run、同 package/Guidance、真实执行上下文和经校验的剩余步骤；不自动 retry、清理、另开 Run 掩盖 partial 或引入 `resumed`。必须覆盖失败前后各 commit point 的观察、重复调用和禁止重做边界。

### E. terminal 元数据纠正采用封闭、追加式合同

普通产品或候选内容修正先使用现有 revise + 独立 Review；本 Change 不引入任意历史编辑器。现有 Policy 已有 terminal 阶段 Owner revise eligibility，但 fixed start 限于 prepared Author，且现有 revise 不能替代对旧 terminal 引用自身的元数据纠正。因此 FKI-02 不能仅靠告诉操作者重跑解决。

建议只处理两个已证明元数据域：Author 候选身份声明、Reviewer exact Author binding。追加记录绑定原 action/context/result SHA、精确 expected-before/after、Owner sourceRef 和实际字段角色；原三文件保持 bytes。不得修改 verdict、outcome、role、occurrence、previousRunId、候选实际文件或 proof 内容，不能为历史缺失身份凭当前工作树补造“当时已审候选”。缺少原候选可证明来源时转入新的真实 revise/review。

Proposal 需冻结一个消费者统一使用的 corrected effective view，而非把追加文件写出来却仍让 Archive/checkpoint 读旧错误字段。其最低失效规则是：新纠正声明的身份若与任何已消费绑定或候选摘要不一致，则阻断旧结果继续提供准入，并要求实际 revise/review；纯缺字段补全也必须证明唯一前序、原候选与消费身份一致，不能仅因 Owner 授权继承旧 PASS。Reviewer-owned binding 的确认由真实 Reviewer 完成，Author 不代填。

对于已 archived/Final/推送历史，默认只读报告，不恢复旧 delivery 或改写既有接受事实；需要重新验收时进入新的受授权工作。Apply 中必须验证 correction 的 create-once、幂等只读、hash 漂移、角色防伪、冲突追加及下游失效；新增通道不得要求所有正常 Action 新增 Owner 审批。

### F. raw 候选与 Git-filtered 身份应在审核前对齐

本次对 LearningPlatform 的 exact 三路径执行只读 `git hash-object --no-filters -- <path>` 和 `git hash-object --path=<path> -- <path>`，结果如下。此表为 Git object hash，不是 Result 使用的 raw SHA-256。

| 路径 | raw Git hash | filtered Git hash |
| --- | --- | --- |
| `config/verification/structure-policy.json` | `298ff7938db2687bf8c84c7ab185960fdedcf5f0` | `55e7ffff9b74626ac3375259cdb1068e358f6972` |
| `scripts/verification/structure-inventory.test.ts` | `ca0429cbb0a1e90ac5f8ecc1163cc273fe4aa543` | `3674452a9cb73da2c390a37f2672ae2909afa330` |
| `scripts/verification/structure-sources.ts` | `0ca091f3a7f4144039dceefc2c46446f4a4b8531` | `f23761e86a2b59d08552dbc98c034c44f8b993a4` |

推荐对当前 exact candidate paths 前移 raw/filtered 字节差异检查，在形成 Author 身份与独立 Review 时检查；授权 checkpoint 再核对已审候选与实际候选 index/blob 的对应关系。差异采用阻断、按项目规则重新保存并重新形成/审查候选，不默认增加任意 filter 映射平台。`git diff --check` 只是空白诊断，不能代替该检查。

Proof/Run 的 intentional `-text` 原字节保留，源码的 CRLF 或其他 filter 不能偷偷改变“已审核精确 bytes”。验收覆盖 LF、CRLF、其他 filters、intentional -text、相关属性变更和删除路径，不全仓扫描或夹带其他 staged 文件。项目侧可将其纳入既有 check:fast；本 Change 只修改 Flowkit 的相关 guard/HOW，不直接修改 LearningPlatform。

既有已推送 commit、原 Run 和三文件当前工作树保持历史，不在本次建立 raw→blob 追认映射。

### G. rejected 是真实 terminal 结果，不等于下一步已获准

当前 `stable-action-command-execution/spec.md` 明确要求 finish 拒绝 unsupported `rejected`，所以修复必须同步 Policy、finish、Run-chain 和 Guidance，不能只放宽 Result schema。

推荐保存真实 Reviewer `rejected` 为 terminal、`nextBoundary=null`；Policy 输出专门确定的 blocked diagnosis，普通 next 不自动选 revise/advance/archive。完整 Run-chain 可以读回这种已识别拒绝结果，不能因它是 blocked 就把真实 terminal 判为 incomplete/invalid。它仍需正确 role 和候选绑定。

Owner 后续若明确决定继续修正，使用现有对应 revise-family + 独立复审，但 Policy/入口需显式支持该已识别拒绝后的 exact Owner correction，而非把它伪装为 `changes-requested` 或绕过未知 outcome guard。普通 approved/changes-requested 流程保持现有行为。取消由现有 Owner 边界处理，不建立新自动决策。验收三个 review 阶段的持久化/重启读回、known rejection blocked、explicit correction 与缺授权反例。

## 受影响合同与最小实现切面

后续 Proposal 应收敛现有 `stable-action-command-execution`、`stable-delivery-support-command-execution`、`run-result-persistence`、`policy-and-next-boundary`、`repository-integration-and-next-base-continuity`，及必要 Author/Reviewer Guidance；只有正文 requirements 确实变化的能力才写 delta spec。

实现边界为既有 `src/cli/{action-commands,current-run-chain,action-readiness,action-artifact-hashes,support-change-archive}.ts`，相关 persistence/Policy、scoped checkpoint/evidence helper，及针对性 unit/acceptance、产品 Skills/onboarding。允许复用既有共同校验；不新建 Registry、Provider/Planner、Recovery Platform、动态 workflow、counter service、候选 snapshot DB、自动 Author/Reviewer loop 或 automatic next。

共同不变量为：single-current/single-writer、prepared/terminal、真实角色、exact manager/runtime、三文件原始事实不覆盖、必要 proof 原 bytes、Git 范围与 Owner 权限独立、失败可观察且不冒称 absence/success。

## Explore 结论与下一边界

**结论：七项问题已定位并收敛，可以进入一个 Change 的 Proposal。** 本次完成的是证据与范围调查；没有执行修复实现、独立 Review 或发布。Owner 的直接 OpenSpec 授权已解决本次捕获方式，无需创建 Flowkit Run 或 Delivery。

Proposal 必须明确三项设计选择：Archive 的有界依赖执行前提及不满足时的处理；追加 terminal correction 的封闭结构与统一消费/失效规则；known rejected 的 Owner correction 后继。以上已有建议边界，属于同一 Change 内要冻结的设计，不能在 Apply 临时补成任意恢复平台。

尚未执行、不能声明 PASS 的验收：修复后 fixed CLI 回归、隔离策略对原依赖不产生写入的真实实验、native Windows + pnpm 11，以及 correction/rejected 的实际端到端恢复。MenDi 历史算法来源保持 UNKNOWN，不影响旧记录只读保留及新分配合同。

明确不包含：历史 Run/proof 重命名或覆盖、两个项目自动迁移/升级、既有推送历史改写、包安装/发布、Full Test/Final、Git checkpoint/push/merge/tag、Archify、自动 Review 或继续下一 Change。

本次 STOP 在 Explore 文档完成；Proposal、Review 和实现由后续明确请求分别进入。
