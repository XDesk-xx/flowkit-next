## Context

动机与范围见 [proposal.md](proposal.md)。实现基线为 `9b96b150eec8b59c40d1a72eb61054695a6e763b`，受控 CLI 实测为 OpenSpec `1.10.0`。

依据分三类，不能相互冒充：

| 来源 | 已知事实或要求 | 本设计的用途 |
| --- | --- | --- |
| Owner 附件 `flowkit-archive-lifecycle-repair-plan.md` 第 4–20、22–25 节 | 去掉模拟器，先 Run 再真实 archive，三类结果，安全失败可新 Run 重试 | Archive 目标行为 |
| 本会话后续 Owner 要求与 LF Explore | LF/CRLF 同时修；不改 Git 授权，不全仓 normalize | 对附件第 21 节的明确范围扩展 |
| 已读基线源码 | `action-readiness.ts:269–639` 重复预演；`current-run-chain.ts:129–170`、`action-commands.ts:574–580` 把 archive 当成 completed；`reviewed-checkpoint-candidate.ts:153–269`、`support-delivery-final.ts:31–41`、`delivery-required-evidence-source.ts:224–234` 假设 archive 的直接前序就是 Review | 必须一起修改的消费者 |
| LF Explore 实测 | LP 三文件为 `i/lf w/crlf`，仅 CRLF→LF 的投影等于 index；临时仓库中 CRLF 源码与 `.cmd` 均被现有 guard/暂存读回拒绝，raw 日志与 binary 对照通过 | 问题复现，不是修复后验收 |

Git 原始 hash 与 blob hash 的差异不自动代表内容遭篡改；反之也不能仅因转换后与当前 index 相同就继承旧 Review。当前 canonical specs 明确要求预演和 raw==filtered，因此本次是有界合同修订，不是只删除实现。

## Goals / Non-Goals

**Goals:** 一个真实 Archive attempt 对应一个已开始 Run；原生效果、安全重试与 immutable history 一致；候选执行字节和 Git 存储字节分别绑定，贯通 Author、Review、Archive、checkpoint，并使 retry 后的成功终点可由 Delivery required Change 完成来源正确消费。

**Non-Goals:** 不重做 OpenSpec merge/rollback，不创建通用 retry/recovery engine、ActionInstance、错误 Registry、候选数据库或自动流程；不为 Git 做通用 filter/encoding 适配；不更改全局/项目 Git 配置、旧 Run/旧证据、消费项目、普通阶段顺序或授权 schema。Formal Full Test 的 raw 输入与 PASS 复用规则不因本次 EOL 支持放宽。

## Decisions

### 1. Archive preparation 只保留 admission

固定顺序为：

```text
active + exact Policy + valid approved candidate + projectOrdinal + unique chain
  -> create/read back archive action.md
  -> record bounded operation prestate
  -> invoke exact OpenSpec archive once
  -> observe/classify actual effect
  -> finish the same Run with a real result
  -> STOP
```

`action start` 仍做 Role、Guidance、受控 Run 地址、证据 Git 字节和必要上下文检查；Archive 专属部分不读取未被候选明确引用的 ignored data/runtime，不遍历仓库根，不复制依赖，不执行 OpenSpec validate/archive dry-run 或项目 checks。有效 start 不是归档成功预测。task/delta/retirement/collision 等原生判断在 Run 开始后交给真实 OpenSpec。

新 Archive descriptor 保留 `formatVersion: 1` 和原 package/context，增加封闭 `archiveContractVersion: 2`；新 start 请求移除 `applicableChecks`，出现该旧字段时给明确迁移诊断，不能静默忽略。旧 descriptor 的该字段仅供历史读取，不用于推断新合同。

删除只有 Archive 使用的 `archive-dependency-snapshot`、`archive-check-selection` 及其死代码；保留其他 Action/Full Test 真实需要的共享验证能力。仅因旧测试引用而留下已退役生产模块不是保留理由。

替代方案：继续修 pnpm shim/ignored glob 或只删一次预演，仍会复制环境并保留重复语义，拒绝。

### 2. 有界实际效果材料，不预测 canonical spec 后态

沿用 target-owned artifacts 与原始流 helper。每 Run 的 Archive 材料使用一个 version-2 结构，绑定 descriptor、exact Author/Review、工具身份和以下事实：active Change 的完整相对文件集合与 raw hashes、实际受影响 canonical specs 的 before/after hashes（缺失为 null）、默认与 ordinal 目标路径/目录身份、coordination 的原 bytes 及仅本 Change active→completed 的允许变化。

`prestate` 在原生调用前保存；`after` 来自真实执行后只读观察，绝不来自 scratch。只观察当前 Change、其 delta 指向的 canonical spec、归档目标、coordination 与已绑定候选，不扫描无关数据。必要输入必须能绑定被审候选；缺失绑定不能由当前工作树补造。nested capability 路径沿用真实 delta 路径，不能继续只匹配一层 `specs/<name>/spec.md`。

实际命令、argv/cwd、tool version、start/end、exit/signal/spawn/timeout、raw stdout/stderr 和已观察效果分别保留。固定请求仍不接受程序、callback、checksPassed 或 caller 指定结果。OpenSpec 成功必须同时有真实受控调用的成功证据和一致后态；目录存在不够。OpenSpec 内部的 spec 语义验证仍由 OpenSpec 负责，Flowkit 不重新解释合并结果。

归档后的 source→destination 内容必须一致，projectOrdinal 不重算；ordinal rename 前检查目标，coordination 只窄写本条 state。真实 OpenSpec 已成功但后处理失败时保留成功子步骤，整体为 partial，不能说“什么都没执行”。

替代方案：删掉全部 Archive evidence 会破坏 checkpoint 的合法路径转换证明；保存全仓快照则重建了被移除的复杂度，均拒绝。

### 3. 结果由观察证明，不按错误文案猜测

`facts.archiveOutcome` 封闭为以下三个结构；不是新的 lifecycle state：

| outcome | Author / nextBoundary | 当前业务状态与后继 |
| --- | --- | --- |
| `{kind: completed}` | PASS / checkpoint 或 null | 已证实 ordinal archive、真实 spec 后态、completed coordination；checkpoint evaluation |
| `{kind: failed, effect: no-mutation\|rolled-back, retryable: true}` | FAIL / null | 命令已停止，active 输入、canonical specs、coordination 仍为可信 prestate；可请求新 archive |
| `{kind: partial, effect: recovery-required, retryable: false}` | FAIL / null | 不能证明完整成功或安全 active；blocked(archive-recovery-required) |

`no-mutation` 在这里是“没有已确认的持久业务差异且最终 prestate 一致”，不声称从未发生瞬时写入；只有有正面执行证据且回读一致才标 `rolled-back`。不能仅从最终相等反推 rollback 的执行轨迹。二者的重试安全性都依据同一真实最终状态，不建立错误分类平台。

预先存在的 collision target 要与 prestate 比较，不能因为 target 存在就当成此次归档成功，也不能删除它。并发输入漂移、无法停止的子进程、缺少 prestate、工具/效果身份不明一律不能给 retryable。timeout、截断或日志保存失败不提供 PASS；只有进程已停止且完整安全前态确实可证时才可记录安全失败，否则 partial/incomplete。

业务 partial 与机器文件 partial 分开：能验证 descriptor、父链和实际失败材料时，业务 partial 可以保存完整 terminal FAIL；写不到完整 `context.json/result.json` 时保留 incomplete，不伪造 terminal。coordination 读取失败也不能把真实失败记录硬塞进 completed-only 校验；composition 报 recovery-required，不伪造 `ChangeState=active/completed`。

### 4. Retry、修订与 same-Run continuation 是三个不同边界

普通重试：

```text
approved review-apply R15 -> archive R16 terminal FAIL -> archive R17
                                               R17.previousRunId = R16
```

共享 resolver 只沿当前 Change 的唯一真实 parent 链，穿过连续、已接纳的安全失败 Archive，解析到最近一份 approved `review-apply` 及其 direct Author。不能按目录最新时间挑 Review，不能跨过 partial、PASS、未知/缺失 outcome、fork 或其他阶段。新 Run 序号沿用现有分配规则，旧 FAIL 不变。

`retryTerminalArchive` 是内部结构 seam，不是新 Standard Action：只允许 terminal archive、same semantic identity、已验证 retry Policy boundary，返回新 occurrence 的 prepared candidate。普通 `prepare` 对 same terminal 仍拒绝；旧 occurrence 吸收不变。Policy、fixed CLI、inspect 重建和单 Action 组合复用它，不能各自特判。

安全失败后需改候选：Owner 使用既有 `decision=revise-action`、same Delivery/Change、单一 scope=`revise-propose` 或 `revise-apply`，创建指向失败 Archive 的新 revise Run，再走既有独立 Review。该 correction admission 校验安全 active 与原失败/父链，不要求正在修订的候选仍等于旧 Review，否则会再次锁死；直接 archive retry 则必须重新验证同候选和 Git identity。普通 Author FAIL、prepared Reviewer、partial/completed 不因此获得修订例外。

same-Run continuation 仅用于 descriptor-only、未保存 terminal 的操作：若没有 command intent 且 prestate 完整，可开始唯一原生执行；intent 已存在而没有可靠执行结果时先 inspect，禁止盲重放。若实际原生成功材料及后态已保存，可在明确调用下只做剩余 rename/coordination/finish；已完整完成只读返回。已记录安全 FAIL 必须先 finish，再用新 Run 重试，不在同 Run 反复执行 OpenSpec。

terminal partial 本次只提供原始事实、明确 blocked 与人工/显式 recovery 交接，不提供自动修复或自动重新准入。不能删除/改写其 FAIL，不能把外部修复后的目录存在当作旧 Run 成功；需要恢复治理时另行明确授权，不借普通 retry edge绕过。该限制与附件“不实现复杂 recovery engine”一致，不承诺本次提供通用 terminal-partial 恢复器。

### 5. 不用 Action 名称推断业务完成

`current-run-chain` 验证历史节点和 parent edge 时按可识别 outcome 区分安全 active 失败、partial stopped 与 completed PASS，不再遇 archive 就代入 completed。start、`archive-finish`、`action inspect`、query composition、候选树 Run reader 与成功消费者使用一致的 outcome/Review resolver。

finish 对三种结果分别核对材料。成功仍须 materialized completed；安全 FAIL 的查询仍为 current/active；terminal partial 可读且 blocked。只有当前 Change 的唯一可信完成终点，即 exact current terminal Archive PASS，才进入 checkpoint/Delivery 完成消费；之前的安全失败允许存在，但必须逐个验证，不能改 parent 或按最大目录号挑成功。旧无 outcome 的已接纳 Archive PASS 保持旧直接 Review 的成功校验路径，但旧 FAIL 不因名称或 Owner fact 升级为新 retryable。

Delivery completion 的选择器 `src/cli/support-delivery-final.ts` 与接纳器 `src/internal/delivery-required-evidence-source.ts` 必须共同复用第 4 节的来源解析：从所选 PASS 的 `previousRunId` 回溯零个或多个同目标、完整、已接纳的安全失败 Archive，停在 approved `review-apply`，再核对它的 direct Author。返回的 archive/review 必须与共享解析结果、受控三文件及原 accepted source refs 一致；拒绝 partial、未知结果、缺失父项、fork、跨目标、过期 PASS 或跨过其他阶段。不能只把接纳器的直接相等判断删掉，而让入口仍错误选取失败 Run 作为 Review。

`src/domain/delivery-final-execution.ts` 的准备与相关事实复验继续调用同一完成来源能力。`changeCompletions` 仍只有 changeId、archiveRunId、reviewApplyRunId、archiveResultRef、reviewResultRef 五个字段，按 manifest required 顺序；R15 Review → R16 failed → R17 PASS 时返回 archiveRunId=R17、reviewApplyRunId=R15。为证明该关联，只读取所选链和必要接受材料，不重新执行祖先 readiness/admission、实验或全部 proof，不另建完成快照。正式 delta 见 `specs/delivery-finalization/spec.md` 的两条 MODIFIED Requirements。Delivery active、required 全部 completed、空 active OpenSpec set、当前 Full Test PASS、独立 Final Owner authority 及确认发布合同保持不变；消费回归不等于执行实际 Full Test/Final。

### 6. Git raw 身份与存储身份分别绑定

保留现有 `artifactHashes`、Explore 专用 hash、proof SHA 的 raw 含义。新成功 Author 候选在既有 finish 的实测校验之后，由 manager 生成 `facts.candidateGit`；不新增 CLI 命令，不要求 Agent 手写 Git projection，不改变 Author 自己提交结论的责任。

结构仍为尚未发行的 version 1：`objectFormat` 为仓库实际 Git object format；`settings` 记录相关 `core.autocrlf/core.eol/core.safecrlf` 的解析值；`files` 使用 exact repository-relative path，每项含 `rawSha256`、`blobOid`、`conversion`（`identity` 或 `crlf-to-lf`）、有效 `text/eol` 与 `indexBasis`。`indexBasis` 为 `{kind: absent}`，或 `{kind: entry, mode, blobOid, eol}`，后者绑定该路径普通 stage-0 条目的 mode、原 blob OID 和 Git 的内容 EOL 分类。EOL 分类区分 lf、crlf、mixed、none、-text；unknown、非普通条目、未合并 stages 或不能可靠解释的索引状态在形成成功候选前明确 unsupported。所有键、OID 长度、path/raw 绑定和既有 facts 大小上限继续校验，不存整个 index 或扩大候选集合。

这是 manager 新记录时计算的机械事实，不是新的 Reviewer/Verification verdict。caller 提供该保留字段时只接受与实测完全相同的值，否则拒绝；缺失时 manager 生成。响应说明保存后的 exact result identity。duplicate finish 使用已存不可变生成字段核对同值请求，只读返回，不重新给旧 Run 生成 projection，不因文件已合法归档而覆盖它。

预测对象限定为普通 `git add` 成功时的 blob，不含 `--renormalize`、merge/cherry-pick 的特殊转换。执行 clean/EOL 转换所得内容不一定是普通 add 的最终 index 内容：现存文件的 stat cache 命中时，add 可以跳过转换而保留原 blob。输入是同一 raw bytes、实际有效属性/设置及相关 stage-0 index，而不是仅一个路径的无索引 hash。只读查询采用 literal/NUL 路径，读取 `ls-files --stage`、`ls-files --eol` 及必要的 exact index blob；读取前后核对同一路径条目未漂移。`i/crlf`/`i/mixed` 只在 Git 将旧 blob 识别为非 binary 且包含 CRLF 时触发保留，不能把 binary 内偶然的 CR/LF 或 lone CR 当作该条件。

本次不持久绑定或模拟 stat cache。先依下表计算受支持的 clean/EOL 内容，再与原 index blob 及 raw 比较：若普通 entry 的原 blob bytes 与当前 raw 完全相同，而计算的 clean/EOL bytes 不同，形成成功候选前必须报 unsupported（具体路径及普通 add 跳过/转换两种可能），不能保存 LF 预期，也不能改选原 CRLF 作为通用 identity。该拒绝不依赖 mtime/ctime 是否改变、stat 是否 racy，故仅 touch 的对照也拒绝；raw/index/规则不变时不能通过时间戳操作从拒绝变为接纳。不新增 candidateGit/stat 字段、stat 数据库或通用 Git 模拟器。

absent、原 index 已等于所算预期内容，以及 raw 真正修改且其入库行为可由受支持规则确认的对照不因该窄拒绝失去支持。其他不能证明普通 add 结果的 cache/索引状态仍属于前置 unsupported，不能将“raw 已修改”或“stat 不同”单独作为转换已必然发生的证明。后续 Review/Archive/checkpoint 使用同一支持边界；输入仍为原 entry 时重新核对上述条件，已核实预期输出仍按既有输出合同消费，不改原 indexBasis。归档后 projection 按目标路径独立执行相同检查。

| 有效 Git 文本动作 | 相关 index 前态 | 执行 clean/EOL 时的内容；普通入库另须通过上述支持边界 |
| --- | --- | --- |
| 显式 `text`，含 `text eol=crlf` | 受支持普通条目或 absent | clean 为 CRLF→LF；raw 等于旧 CRLF blob 的条目 unsupported，不承诺普通 add 一定执行 clean |
| `text=auto`，含 `text=auto eol=lf/crlf` | 非 binary 的既有 CRLF/mixed blob | identity，保留当前 raw CRLF |
| 属性未指定而继承 `core.autocrlf=true/input` 的自动动作 | 同上 | identity，保留当前 raw CRLF |
| 上述自动动作 | absent 或无 CRLF 的既有条目 | 按 Git 文本判定处理；安全文本可 CRLF→LF，binary 保持 identity |
| `-text`/binary 或有效设置关闭转换 | 任意受支持前态 | identity |

先读取有效 `filter/working-tree-encoding/ident`，主动转换立即 unsupported，不执行任意 clean filter。对会影响结果但尚未支持的属性兼容形式或索引分支，同样在成功候选前明确 unsupported，不存“猜测的 LF”。规则判定必须使用 Git 的有效属性，不按扩展名、仅见 eol=lf 或仅见 CR 字节猜测。

共享有界投影逻辑先确定是否处于 auto 的已有 CRLF 保留分支。该分支直接以 raw bytes 为 clean/EOL 内容，不用无 `-w` 的 `hash-object --path` 输出覆盖它。其他已证明不依赖该保留分支、且属性解释与记录输入一致的情形，可用该命令辅助核对文本判定和仅 EOL 转换；它从来不是所有 staging 的充分预测。内容只可能是原 bytes，或安全 UTF-8/no-NUL 文本中仅删除 CRLF 的 CR；保留 BOM、lone CR、尾空格和其余 bytes，不重新序列化。先通过普通 add 的支持边界，再用不带 `-w` 的 `git hash-object --no-filters --stdin` 计算预期 OID。预测阶段不写真实/临时 index、object 或工作区，不调用 add 试算、touch、refresh、renormalize 或改配置，不复制开发环境。不能以 stage 后的实际结果回写预期来掩盖早期歧义。

该 index 保留分支的依据为 Git 的 [text 属性合同](https://git-scm.com/docs/gitattributes#_text) 及 [v2.49.0 convert.c 的 has_crlf_in_index/crlf_to_git](https://github.com/git/git/blob/v2.49.0/convert.c)。[git-add --renormalize](https://git-scm.com/docs/git-add#Documentation/git-add.txt---renormalize) 明确将强制重新应用 clean 定义为特殊操作，本方案不调用它。stat 命中与仅 touch 对照见独立 `review-propose-02.md` 的 RP-03；本机 Windows 语义对照是设计依据，不是产品候选验收，也不把该 Git patch 版本设为新生命周期前置条件。

Review/Archive 复核 raw、有效规则、相关 indexBasis 和预期 blob，再绑定或消费 exact reviewedRunId。当前 index 可以仍等于绑定的输入条目，也可以已等于绑定的预期输出 blob 并满足既有 mode/path 合同；后者是可验证的已暂存结果，不是候选修改，不为它改写原 indexBasis。除此之外的相关 index 变化在业务写前拒绝，不能悄悄重算 blob 继承旧 Review。无关文件的 index 变化不修改本候选 EOL 依据，Git checkpoint 的全量 pending-scope 约束仍独立。

字节敏感材料必须由项目以 `-text`/binary 明确标识，managed Run/proof 路径仍强制原 bytes。项目要求源码 LF 的质量规则仍在 Author 编辑/验证阶段执行。Git 存储等价不扩大 Verification PASS 复用；换 checkout 后 raw 不同仍不能冒称旧测试 bytes。`core.safecrlf`、权限等可使真正的 add 拒绝，即使 blob 投影已确定；预测不保证命令成功，执行不得关闭安全设置，真实拒绝保留为 Git 失败。

替代方案：只比较无 `-w` 的 `hash-object --path` 会遗漏已有 CRLF index；真实 add 后才发现 mismatch 太晚；用临时 index/object 预演又超出只读候选边界。采用有界 index-aware EOL 判断并在真实 staging 后核对，支持矩阵外前置明确拒绝。全局关 autocrlf、强制所有文件 LF 或对所有 hash 去换行仍不可取。

### 7. Checkpoint 核对预期 blob，Archive 只解释自己的机械变化

区分 worktree raw 检查和 Git tree 预期，不能只删除 `assertCandidateGitBytes` 后继续用 raw 哈希校验 index。

- 未归档：先验证 raw 等于已审 identity，并核对相关 indexBasis/有效规则，再消费绑定的预期 blob；对不在 staging 范围的已有文件直接要求 index/HEAD 中的 blob 符合预期，不强行要求其等于 raw。普通无 Review 关联 checkpoint 对授权文件使用同一 index-aware 算法形成临时预期，不伪造 Reviewer 凭证。
- 已归档：先验证 version-2 实际 transformation 的 source→ordinal suffix 集合及 raw 不变，affected specs 使用真实执行捕获的 after raw，coordination 只允许 state 变化；after projection 必须绑定归档目标路径自己的有效规则及 stage-0 indexBasis，不能继承 source 的索引前态。即使属性相同，source 为 i/crlf 而新 destination 为 absent，自动转换也可能由 identity 变为 CRLF→LF。旧路径与默认中间路径必须消失；其他源码仍按已审身份核对。
- stage 前 projected tree 的授权路径值是第 6 节确定的预期 blob/删除。当前相关 index 须等于绑定输入或已核实的预期输出；输入仍在且 raw 等于旧 blob 而 clean/EOL 不同时，按同一 unsupported 边界在 staging 前拒绝，不因触碰时间戳放行。只在内存投影，不用真实/临时 add 预测。工作区 raw fingerprint 与本次真实 index fingerprint 独立防漂移，已有/未授权路径仍来自真实 index，不扩大 paths。
- 与 projection 有关的版本化 `.gitattributes` 必须已在候选树或属授权 paths，不靠未暂存 worktree 属性证明未来 Git 树。执行前核对当前有效规则与该树可解释的规则一致；stage 后检查 cached 属性与实际输出 blob，不要求 index 仍保留 stage 前的旧 OID。这样既不会把正常 absent→LF 或 old-CRLF→new-CRLF 暂存误报为漂移，也不会放行无关 index 篡改。相关外部设置/属性变化仍拒绝。
- commit 前后核对实际 index/tree/blob、完整 pending index 与范围。预期 output 不能因实际 stage 结果不同而被回写；不符合时保留实际副作用并停止。Git EOL warning 不是独立失败，真实非零、安全转换拒绝或内容 mismatch 仍失败。原始证据始终 raw==index==blob。
- Git 失败只交接 Git 剩余步骤；不改 Archive terminal PASS，不重执行 OpenSpec，不自动 reset/renormalize。

### 8. 兼容路径必须显式且不回填历史

旧完整 Run、correction、Archive material version 1 按旧语义读取；原件和旧 proof 不迁移。新消费者可复用已证明 raw==blob 的旧候选，但不得凭当前工作区给旧 raw!=blob 记录生成历史 projection。后者需真正重新形成候选及独立审核，不能扩张 `action correct` 的字段许可。

旧 started descriptor 继续要求匹配原 Guidance 的兼容 manager；升级前先解决或交接已开始操作，不热替换管理器。新安全 FAIL、partial 与 candidateGit 是新合同事实，旧 manager 不保证可继续消费；因此一旦产生，不可通过删新证据/回退历史伪装兼容。

## Risks / Trade-offs

- 移除预演会让原生失败真正发生在 Run 内 → 完整记录失败与停止状态，以安全后态决定重试，不承诺 archive 必成功。
- 进程结果与材料保存之间崩溃 → 已知成功后态只继续剩余步骤；未知部分明确 partial/incomplete，不按 exit code或目录猜测。
- 上游错误输出无法区分瞬时写入与 rollback → 只记录可证明的持久效果，rolled-back需正面证据；不扩展错误分类服务。
- Git text=auto/索引历史/属性覆盖及 stat cache 会改变普通 add 结果 → 将相关 stage-0 indexBasis 纳入共享有界投影，区分 clean 与最终 index；raw 等于旧 blob 而 clean 不同的分支保守拒绝，不模拟 stat、不承诺仅 touch 可解锁，支持矩阵外在成功候选前明确拒绝。
- 原测试 bytes 和提交 bytes不同 → 二者均保留，Git 存储比较不扩大 Verification PASS 复用；byte-sensitive项目必须显式保留 bytes。
- 多个消费点容易局部修好 → 同一测试链覆盖 FAIL→retry→PASS→checkpoint→required Change completion 接纳，以及 FAIL→Owner revise→review→archive；不只测 helper，也不把完成证据接纳测试当成实际 Final。
- terminal partial 不提供通用自动解锁 → 明确交接、保留原件；避免用补成功/删 Run代替 recovery。

## Migration Plan

先在本 Change 的源码和隔离 fixtures 中实现，更新同一包的 parser、Guidance、schema/消费者和回归，再按后续独立授权发布。测试环境生成的合成 Run 不声称独立 Reviewer 已批准，本修复仓库自身不走 Flowkit runs。

验证覆盖原生 Windows Git/EOL、受控 OpenSpec、Linux 与 installed-manager 适用回归。无新事实产生前可以保持旧安装；新合同事实产生后保留 target与记录，使用兼容修复版处理，不自动降级、清理或迁移。

本次 Proposal 不执行上述实施/迁移。任务勾选、测试结果和最终发布事实只能来自后续真实执行。
