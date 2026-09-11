## Context

动机见 proposal.md。054 Explore 与 055-review-explore 已接受三项依据：现有 clean/parent/count 是待变更合同；真实 index 范围由执行宿主负责；既有失败只读确认及 Git 原生命令可复用。本次设计跨 operation/source/ref/HOW，需明确兼容与副作用顺序，因此生成 design，而非跳过。

本 Change 仍由独立 bootstrap 管理。相关 Owner 决定见 054 context.json#ownerDecisionsRelevant；必要材料留 target artifacts，临时 fixture 可丢弃，不复制所有实验作为长期计划前置。

## Goals / Non-Goals

**Goals:** 接通一种可用的宿主调用，限制到本次目标和授权范围；减少隐含 Git 限制，同时真实报告已有副作用。

**Non-Goals:** 新 CLI 写命令、Git Standard Action/Run、Runtime/Policy/Run schema、通用 Git SDK、provider/凭据平台、自动恢复、强制公网 PR 验收、结果数据库、额外安装或历史迁移。前五个 Change 的 Final confirmation、Full Test、manager/target 及 Archify 边界保持。

## Decisions

### 1. 固定宿主入口，不引入第二套 CLI

受支持入口固定为 manager 自有 `skills/delivery/repository-integration/references/git-host.mjs`，提供供已有 Node Agent/宿主显式导入的 `runCheckpoint`、`runPush` 和 `runIntegration` 三个薄函数。模块导入没有副作用，不自动读 stdin、选择下一步或执行 Git；不注册新的 flowkit 子命令。

普通节点由 Agent 终端工具启动一次有界 Node 调用。HOW 提供可运行调用示例和最小权限注入示例，而不是只放伪代码；模块复用 manager dist 的 Git 范围/读回 helper。安装位置从模块自身解析，targetRoot 单独传入，Git cwd 必须是实读的 target Git 根，target 不能通过同名模块接管来源。package files 的既有 skills/delivery 范围应包含 reference，另验 packed 安装读取，不引入新的安装路径身份。

- `runCheckpoint`：本次新建或复用 checkpoint；只处理这一节点，不随便 push。
- `runPush`：推送指定本地 commit 到明确 remote/ref，成功仅表示 publication，经远端读回确认；不表示 Delivery Integration 已接受。
- `runIntegration`：使用现有 prepare/invokeDeliveryRepositoryIntegrationOperation，注入上述有界 commit mechanics 和既有 trusted source；外部 acceptance 由宿主显式提供，默认未提供时返回人工交接而不是模拟成功。

普通 Start 后节点只核对 Owner 对该次 Git 操作的授权；Change checkpoint 仍先消费既有 checkpoint evaluator 的 readiness/Owner 结论；只有 Integration 要求已确认 Final。reference 不自建 Policy，也不让产品接管 D05。

替代方案不采用：只删除 domain guard（没有实际安全调用），在 next 中自动 Git（越权），统一多 provider 执行器（超出用例）。

### 2. 最小宿主输入与可信权限来源

本轮不提供接受任意 JSON 后即可写 Git 的命令。宿主调用输入在内存中包含：

| 输入 | 约定 |
| --- | --- |
| targetRoot | 明确项目 Git 根；绝对位置是本次执行参数，不持久作为 manager 身份 |
| node | 已决定的 Start 后 Git / Change checkpoint / Delivery Integration；不作为新 lifecycle enum |
| deliveryId / changeId | 来自当前真实上下文；普通 Start/Integration 不制造假的 changeId |
| ownerSourceRef | Owner 独立指令的真实来源，不是 callback 自签批准 |
| expectedBranch | 当前授权操作所在分支；读回不匹配则不写 |
| operation | checkpointOperation，或 push 的 exact localCommit、remote、targetRef；不是任意命令字符串 |
| authority reader | 由 Agent/宿主的既有 Owner 输入能力注入，按 ownerSourceRef 读取本次操作/target/范围；缺失即停止 |

该 reader 是可信 host capability，而非接受 caller 自带 approved 布尔值。返回当前 Owner 来源、目标、节点和完整操作后，宿主逐项与请求核对；不生成新的持久授权文件或扩张 OwnerAuthorityFact schema。Change checkpoint 另外使用已有 evaluator；Integration 继续要求 singleton OwnerAuthorityFact 和 ReadRepositoryIntegrationSource，普通授权不得冒充 Integration 权限。

真实宿主示例从本次显式 Owner 输入获得 reader，fixture 中使用明确标注的合成来源。测试不能证明任意自签 callback 可信；Apply 的分根示例要展示实际授权交接和真实 Git 结果，不能只有恒 true 授权函数。

ordinary push 只支持明确 remote 与 refs/heads 目标的一次非强制推送，不默认 force/delete/rebase。PR/merge 通过原有工具人工衔接，可读回具体操作及接受来源即可，不要求复制远端平台。

### 3. operation 与 ref 的精确收敛

保留 create-new/reuse-existing 二分，create-new 改为：

```text
{ kind: "create-new", paths: string[], commitMessage: string,
  commitShape: null | { parents: SHA1[], count: positiveInteger } }
{ kind: "reuse-existing", checkpointCommit: SHA1 }
```

paths 是已由 Owner 范围展开得到的 target-relative exact 文件路径，使用 /、无重复、稳定排序；不接受绝对路径、..、.git 控制路径、glob 或目录通配。实际 Git 访问用 literal pathspec 和独立 argv；空格/中文合法，NUL 分隔解析 index/rename，不按行或空格拆文件名。删除允许工作树路径不存在，rename 的源/目标都须在范围。未知 repo 边界、submodule 或无法安全解释的目标停止并交接，不升级为全域输入支持。

commitMessage 非空单行，不通过 shell 拼接。commitShape 显式 null 表示没有额外 parent/count 资格门槛，不表示授权额外操作。宿主默认一次普通 Git commit 是该调用的实现行为，不是所有 callback/后续 Integration 的必需形状。已有多个已授权提交优先使用 reuse-existing，不为“通过”额外造一个固定点。外部 callback 确实按 Owner 执行其他形状时，以该具体来源及 explicit shape 核对，不猜测 squash/rebase。

package、source authorization、clone、equality、record-for-package、ref projection 同步使用同一个完整 operation。canonical projection 次序以 delta specs 为准；null 不能被省略，parents 顺序不能排序，paths 不依赖输入对象属性顺序。保留原 ref 前缀，旧 create-new 缺字段作为新执行输入拒绝，不转换/重签历史。reuse-existing 形状未改变，仍需当前授权/prestate/真实对象。

### 4. 提交范围与副作用顺序

复用并扩充现有 Git helper，必要职责可拆为独立范围/观察文件；不造仓库快照数据库或锁服务。

1. 实读目标根/branch/HEAD、已有 index、相关冲突与权限；新仓库普通首个 commit 允许 HEAD absent，Integration 保留其既有 HEAD/base 要求。
2. 提交前若完整 index 存在范围外条目，立即停止，连本次 add 都不执行；不 reset/unstage 用户工作。
   范围比较读取 index 相对 HEAD 的全部待提交差异（unborn 用空树），不是要求所有已跟踪文件属于 paths。每笔 Git 写入前重验本次权限及相关 branch/target。
3. 记录本次范围涉及的 Git index/object/worktree 观察；只暂存授权 literal paths，然后重读完整 index、branch/HEAD 和相关目标。范围外新增、未合并、相关漂移均停止。发生过 add 时报告已有暂存效果，不伪称完全未写。
4. 紧邻 commit 再核对实际待提交 index，调用一次真实 commit。提交选中的 staged bytes；不以全仓 clean 判断资格。
5. 从 Git 读回新对象及其实际路径，核对范围和 explicit shape。外部 commit callback 的结果同样读回核验，不能仅以 status=committed 成功。若提交涉及多个对象，不能只看最终净 diff 隐藏中间越界；按本次可证明的实际提交集合核对，不扩大到全历史。
6. reuse/push 不暂存任何内容、不检查无关 index 为全局门槛。仅当实际操作会覆盖当前工作树时核对其冲突；不因 push 存在 untracked 文件而失败。
7. Integration acceptance 前保留目标 prestate、实际 commit 来源与 Final confirmation 复核；不重新验收 Full Test 日志。

实现假设为一个授权宿主顺序执行；不建设并发事务。能够观察到的竞争拒绝，commit hook/外部进程造成的已生效越界在读回中报告部分失败，不假称可无副作用回滚。源码质量验收和 Git 空白诊断分开，保留已有 .gitattributes，不增加路径例外。

### 5. 最小结果与人工交接

宿主 reference 的非持久返回值固定为：

```text
status: "completed" | "incomplete"
phase: "preflight" | "stage" | "commit" | "publication" | "acceptance" | "readback"
reason: string | null
observed: { checkpointCommit: SHA1 | null, remoteCommit: SHA1 | null }
effect: "none" | "confirmed" | "unknown"
remaining: string[]
```

reason 为可读具体诊断，不引入全局错误 Registry。completed 只表示请求的该节点完成，不是整个 Delivery 完成；未知事实用 null，不回填旧 PASS。内部执行错误也回交，不以抛错丢掉已知 checkpoint。

- commit 失败后有界读取 HEAD/index：观察到新 commit 则保存该事实；读取失败为 unknown；不自动再 commit/push。
- push 成功需本次远端 exact ref 读回等于已授权对象，命令返回 0 不是充分证明；本地 ref 不是远端接受。
- PR id / open PR / provider pending 是 incomplete，列出 remaining；不创建远端客户端来强求闭合。
- Integration 仅完成全部既有真实 acceptance 核对才给 terminal record。其已有 failed outcome 的 gitEffects 扩充 phase/effect/known checkpoint/remaining，未完成仍 failed、record=null，不新增 Action lifecycle 状态。宿主 incomplete 从该事实映射，不重签。
- 最小 checkpoint、remote/ref、PR 引用和未完成步骤交给下一调用；下一调用先读取现有事实与权限，明确选择复用或人工步骤。不得因上次响应丢失从头自动运行。

如需保留命令证据，放 target artifacts 的有界本次材料并保留 Buffer；不写 Standard Action Run，不把 SHA 回写为必须再 commit 的 Final/manifest 资格字段。必要人工说明不是第二份 Git truth。

### 6. 直接消费者与验收

依据映射：

| 依据 | 合同/实现范围 | 新验收 |
| --- | --- | --- |
| E054-01、055 提醒 3 | operation/clone/ref/validator/source、Integration checkpoint requirement | shape null 与显式约束、新建/复用、旧形状拒绝、golden vectors |
| E054-02、055 提醒 2 | 宿主 + 共享 index/范围 helper | 范围外 staged 前置阻断、add 后 drift、无关 dirty 原 bytes 保留、rename/delete |
| E054-03、055 提醒 4 | failure readback、宿主 outcome、既有 acceptance source | commit 回执丢失、push 失败、未知、人工 pending、无自动续跑 |
| 055 提醒 1/5 | manager 自有 reference + HOW、分根调用 | 无 target Flowkit scripts 的真实 commit/push/复用读回；无权限无写入；CLI 不变 |
| 现有 canonical 合同 | confirmationRef、singleton authority、Git 对象来源 | unconfirmed Final 拒绝；不读无关历史证据，不用 local ref 冒充远端 |

产品 HOW 主入口仍是 skills/delivery/repository-integration/SKILL.md，新增 reference 只提供 HOW/有界调用，不创造 authority。Start/Final 及 Action archive 的产品 HOW 只补普通节点与 Git STOP 引用；不读取或复制 .agents 作为产品输入。仓库 AGENTS 必要说明在 Apply 同步；独立 bootstrap 与产品资产边界分别维持。

Apply 必须用当前 build 运行真实 native Windows Git fixture 和 Linux x64 适用回归。分根示例从 packed manager 的 reference 导入、对普通项目执行限定 commit、独立 push 到本地 bare remote 并读回；模拟 provider/权限明确标注，真实宿主接入不以合成 Final/Review 冒充完整 Delivery。至少验一个人工 acceptance 未完成交接；不强制公网凭据或实际 D05 PR。

## Risks / Trade-offs

- 可信宿主可以执行任意系统命令 → 明确能力边界，实际支持入口统一复用范围核对；不声称防恶意宿主沙箱。
- index 存在外部竞争/commit hook → 写前观察与写后真实结果核对；不自动回滚，无法确认即交接。
- 放宽形状被理解为任意 Git 权限 → source 与完整 operation 对照，null 仅取消默认形状，不授权更多操作。
- reference 漂移或依赖 target 资产 → 从 manager 模块定位、packed 分根回归、直接引用既有 helper。
- 原生远端工具不可用 → incomplete + 已知效果 + remaining；不是恢复平台或 Delivery 自动纠错。
- integration execution 接近 650 行 → 按范围/读回职责拆分直接代码，禁止新增巨型宿主函数或压行规避 gate。

## Migration Plan

只改变当前活动产品合同与直接消费者，不迁移历史 Run/archive/Final/Integration。旧 create-new 输入需要调用方按当前真实 Owner 决定重新准备完整 operation，不能自动补 paths/message/shape；当前内存 package 因形状变化重新 prepare。存量 bytes 不改写。

实施按 tasks 增量完成，先更新同一 operation 的全部直接生产者/消费者，再接宿主和验证。正式 Git 发布另由 Owner 决定；失败不自动 rebase/reset 或撤销 Final。没有需新建的持久存储或数据迁移，因而不设计自动回滚平台。

## Open Questions

无会改变本轮合同的未决项。具体公网 provider/凭据和额外 merge 策略不进入本轮；原生范围之外的人工交接按上述 incomplete 处理。
