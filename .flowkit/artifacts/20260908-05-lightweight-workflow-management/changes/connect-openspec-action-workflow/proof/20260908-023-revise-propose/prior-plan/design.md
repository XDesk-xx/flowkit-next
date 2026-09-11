## Context

动机与范围见 proposal.md。当前 CLI 仅有 status/next/doctor；single-action 内核负责内存 package/admission/terminal，persistence 一次接收完整记录，失败时会清理新目录。直接把这两者串起来会丢失“实际执行已发生但未保存”的事实。

`016-review-explore` 已批准 `015` 的有界方向，要求本次固定具体宿主协议和失败落盘顺序。现有 host probe 只证明当前交互式 Agent/终端能维持进程并回交；不作为产品验收。设计涉及 CLI、文件副作用及跨会话，满足本 schema 创建 design 的条件。

## Goals / Non-Goals

目标是一个单 writer、单存活 Action 的交互接入。复用 existing Policy、ActionPackage、Result、Run 地址和安装定位，不引入新顶层 schema。跨会话指完成/明确失败后的事实续接；非正常终止的 partial occurrence 只诊断，不自动补写或重放。

非目标沿用 proposal：不实现模型调用、多宿主调度、认证平台、并发服务、自动恢复、Git 执行、Full Test 范围/执行或 Delivery 起止改造。用户真实终端宿主是信任边界；结构化 `role` 校验不是密码学身份认证，也不能证明同一 Author 自称 Reviewer 就是独立审查。

## Decisions

### CLI 请求与上下文

沿用 `flowkit <command> --input <path>`，请求文件只作为当前调用输入，不成为持久 current truth。doctor 的既有形态不变。

| 命令 | 必需字段 | 可选字段 |
| --- | --- | --- |
| status | repositoryRoot, flowkitHome | deliveryId, changeId |
| next | repositoryRoot, flowkitHome | deliveryId, changeId, ownerCorrection, checkpointAuthority |
| action | repositoryRoot, flowkitHome, actionId, role | deliveryId, changeId, ownerCorrection, ownerAuthority |

旧 `currentRunId`、`changeStartSequence` 和任何覆盖 state、manager root、Guidance 路径的字段均拒绝；不保留第二套可绕过新链校验的旧入口。ordinary Action 的 Owner authority 为 null；首次 Explore 消费 manifest 已存在的 activation，Owner 特殊 correction 消费既有 `OwnerAuthorityFact`。如请求 ownerAuthority 与 ownerCorrection.authority 同时存在必须一致，scope/目标由既有规则判定；不要求为每次普通 Action 另签批准。

target 必须与 exact OpenSpec 返回 root 一致。先读 Delivery manifest 的轻量 identity/changes，再在可选选择范围内定位唯一 active pair；没有 active 返回 idle，多个候选返回 identity 列表与 `context-ambiguous`，不顺序挑第一个。显式选择 planned/completed/cancelled 时按真实状态展示，缺 selected manifest/Change 是缺失而非 idle。孤立 OpenSpec active Change 无 coordination、active coordination 与已存在链/归档互相矛盾时报告 `context-inconsistent`。

首次已激活 Explore 可在尚无 OpenSpec scaffold 且无 Run 时进入，宿主依 OpenSpec mechanics 创建 Change；不能对已有 Run 的 Change 使用这个特例掩盖删除。completed + canonical archive terminal + OpenSpec active 列表已移除可报告 archived；不借此重演历史原始 proof。

只在选定 Delivery 下找精确匹配语义 Change 的受控 canonical Run group；从有效 group prefix 读回 changeStartSequence，而非 projectOrdinal。零 group 是候选空历史，必须确认不存在所选 Change 的 partial/未知形状历史；多个 group 是歧义。现有 semantic-name bootstrap group 通过明确 bootstrap 标识只供 `bootstrap-history` 展示；混合/未知格式不自动迁移、不能接入 canonical current。其他 Change 的历史不参与本次 Run/证据读取。

从选定 group 的所有 occurrences 读取现有 schema/地址验证后的记录。要求唯一根、唯一末端、无分叉/缺父/环/重复 sequence；根为初始 Explore，previousRunId 连接同一 Delivery/Change。sequence 只用于分配/展示，不用于选择 current。每条边还必须满足 Role、身份和既有 Policy：以父记录评估正常边；仅在子记录携带适用 Owner correction 且正常边不同的情况下使用现有 correction 入口复核。不要复制 transition table。archive 对应的 completed 状态只用于其完成后 Policy 判断，之前链边使用 active 执行语境；当前 activation/dependencies 仍用 trusted resolver。

新入口在现有结果 facts 容器中写入的 `invocationFailure` 表示已完整保存的 prepared 失败，不带 terminal facts；其后只接受同 Action 的明确新 invocation。未知 malformed/partial occurrence 阻止当前解析，不能因为它不是完整 Run 就忽略。纯拓扑正确不代表语义合法。

内部继续向现有 status/Policy/单次内核传 exact context。只读 status 不计算当前 next（resolver 可用 Policy 验证历史链边）；next 和 action 复用既有 Policy。next 返回 legal boundary 不自动调用 action。

### 一个实际支持的宿主协议

选用 Explore 实际验证过的“当前交互式 Agent/终端 + 存活 CLI stdin/stdout”模式，不新建模型进程。manager 是 ActionPackage 提供者和结果接纳者，宿主用自身已有文件/终端能力执行 OpenSpec、检查和审查。

一次 invocation 的 JSON Lines 往返固定如下；所有帧 closed，错误顺序、重复帧和非 JSON 都拒绝。诊断走 stderr；宿主调用的其他工具输出自行保存到 proof，不写进 manager 协议 stdout。

| 方向 | 帧形态 | 含义 |
| --- | --- | --- |
| manager → host | `{kind:"prepare", actionPackage, handoff}` | 同一 package 的只读准备；handoff 给解析后的目标、当前事实与必要引用 |
| host → manager | `{kind:"prepared", runId, outcome:"ready"或"blocked", reason:string或null}` | 宿主实际执行准备，blocked 时 reason 必须非空 |
| manager → host | `{kind:"execute", actionPackage, proofRoot}` | 仅 ready 且占用目录成功后派发，package 与 prepare 完全相同 |
| host → manager | `{kind:"result", runId, result}` | 一次现有 RunResultRecord，身份和 Role slots 必须匹配 |
| manager → host | `{kind:"action", status:"terminal", runId, result, nextBoundary}` 或 error envelope | 持久化读回后的最终结果或阶段/保存状态诊断，随后退出 |

保留既有 JSON 大小/结构限制用于相关 payload，不开放任意反序列化或命令字符串执行。request 的 actionId/role 与已解析合法边、existing expected role 一致才形成 package。host 读取 manager 的 exact Guidance，校验其 content hash；target 同名 Skill 无效。prepare 不修改 OpenSpec/源码，archive readiness 同样在这里执行，不要求第二次 Owner archive 批准。

action error envelope 固定为 `{kind:"error",error:{kind,stage,runId,persistence}}`：stage 为 `context|preparation|reservation|execution|evidence|admission|persistence`，未分配 runId 为 null，persistence 为 `none|complete|incomplete|unconfirmed`。预期调用失败 exit 2，未分类内部故障 exit 3；正常 terminal（含真实业务失败/changes-requested）exit 0，但保留原业务 verdict。成功前已收到的重复/额外帧拒绝；terminal 后关闭输入并退出，迟到输入不能撤销已完成事实或触发下一 Action。

handoff 是本次可重建视图，不新增 authority-bearing package 字段，包含 `repositoryRoot`、`deliveryId`、`changeId`、`changeState`、`currentRun`（exact ref 或 null）、`openSpec`（本次 observation）、`ownerDecisions`（当前相关已有事实/来源）、`guidanceFile`（manager 解析的绝对只读位置）及 `evidenceRefs`（前一结果为本次明确交接的已验证引用）。guidanceFile 只用于让分根宿主找到文件，不持久化为身份；Guidance 仍由原 ActionPackage.guidanceRef 唯一绑定。宿主需补充本次相关 Owner 材料决定时，保存其真实 sourceRef 与简要内容到本次结果 handoff，不抄整段聊天，不从文字推导新批准。

manager 自身不执行生成代码/模型工作，也不接受 caller 任意 executable。两次不同角色的 Action 必须由实际 Author 与独立 Reviewer 分别调用；宿主未完成任务或 Reviewer 未审查时不能填 PASS/approved。future acceptance 要保留真实角色交接而非编写伪造 verdict 的测试驱动器。

### Run 占用、写入与失败顺序

选择最小的“原 occurrence 目录预占、三文件一次写完”方案，不使用可重写的 prepared Result，不引入第四文件。准备成功之前不占用新 Run；同一 invokeSingleAction 的 prepare callback 先完成只读宿主准备，再执行持久占用。

1. 解析目标/链、检查合法 Role/Action、准备 exact context 和 package。新 Change canonical group 的起始 sequence 为 1；后续 occurrence 从该受控 Change group 已占用 sequence 的 max + 1 分配。这只分配地址，绝不决定 current；projectOrdinal 仍由 Explore HOW 独立分配。
2. host preparation ready 后，仅创建受控 occurrence 目录及一次写入的简洁 `action.md`。目录创建/descriptor 写入失败不派发 execute。创建中形成的 partial 也保留并报告，不借删除伪装可重新开始。
3. 只有成功占用才发送 execute。prepared current 在存活 invocation 内保留，尚不制造完整 durable Run。崩溃时目录证明存在未完整记录的尝试，不能从仅有 prose 推断完整 prepared/terminal。
4. host 回交后校验必要 proof 和 handoff refs、exact Result admission、结果与现有 Policy 一致性。随后写最终 `context.json`（terminal）再写 `result.json`，均 `wx`；action.md 不改写。读回三文件并比对本次 identity/内容，成功后才向宿主发送 terminal。
5. 派发后 EOF/协议拒绝/证据拒绝，若存储可用则同一目录写 prepared context 与真实失败 Result：四个 conclusion/verdict/next 槽全部 null，`facts.invocationFailure={kind,stage}`。这不是接纳被拒绝的 candidateResult，也不是新增 lifecycle。宿主返回的非法原文不复制到正式 result，不收集无关秘密。
6. 若任一机器文件写入或读回失败，不补造、不覆盖、不清理 partial；返回 exact runId、失败 stage 和 `persistence:"incomplete"`。文件已完整但读回失败则 `persistence:"unconfirmed"`，只能后续只读核对。原 live invocation 持有内部 reservation handle；没有向外开放按已有目录继续写入的命令。

| 失败点 | 可见事实 | 后续行为 |
| --- | --- | --- |
| 输入/Policy/Guidance/preparation blocked | 原 current 未变，无 execution | 修正条件后按原合法边明确调用，无 prepare Run |
| 占用未完成 | exact partial 目录或无目录，未派发 | 如有 partial 明确报告；不自动清理或接管 |
| execution EOF/拒绝且失败记录完整 | prepared + 实际 failure 三文件 | 新会话读出失败；明确再次执行同一 Action才分配新 occurrence |
| 强制终止/必要写入失败 | partial/incomplete | 阻止依赖当前链的操作，人工核对实际副作用；不自动恢复 |
| terminal 三文件完整，响应丢失 | durable terminal | 新会话使用真实末端，不因响应丢失重试 |

分配、占用、完成写入作为现有 Run persistence 的内部接缝；不改变 public complete-record round-trip 用法。不能继续对已派发的路径使用原 writer 的 catch-rm 清理行为。既有完整历史保持 immutable，底层字段、MAX_RUN_SEQUENCE、三文件和 Result admission 的 Role 分离保持。

Policy 一致性不要求所有 Action 业务结论必须 PASS：例如真实 Author FAIL 可保存 terminal，但 next 为 blocked、宿主 nextBoundary 必须 null；Reviewer changes-requested 对应现有 revise 边。错误 `reported-boundary-conflict`、非法身份/结果形状不可接纳。archive 的宿主 mechanics 必须完成原有 canonical sync/归档/coordination 更新，随后以真实 completed 读回验收；本项不更改 Archive 的正常语义。

### 必要 proof 与有限交接

新入口的 producer 用现有 Result `facts` 承载三个有界键，不修改 closed 顶层 schema：

- `proofRefs`：本次产生的必要文件列表；每项 `{path, bytes, sha256, deliveryId, changeId, runId, purpose}`。path 是 target-relative，必须在本次 exact proofRoot；purpose 是简短用途，不用于执行代码。
- `handoff`：`{summary, ownerDecisions, evidenceRefs}`；summary 只含后续当前判断所需事实，ownerDecisions 每项 `{sourceRef, summary}`；evidenceRefs 以 `{sourceRunId, path}` 明确声明要交给下一 Actor 的必要 proof。sourceRunId 为本次时从 candidate proofRefs 解析，为前序时从同 Change 真实源 Run 声明解析；不复制全部结果。
- `invocationFailure`：仅入口自行记录真实失败时使用 `{kind,stage}`；host 不得提供该保留键冒充入口事实。

新入口正常回交必须有 proofRefs 和 handoff；没有必要新 proof 时 proofRefs 为 []，不创建空 artifacts 目录。evidenceRefs 不默认等于全部 proofRefs，也不自动从所有祖先累积；下一阶段按自己的判断重新声明后续真正必要的引用。既有 canonical Run 未含这些新键仍可读取；本次确需消费其证据时不得凭默认空列表声称已验证。其他已有受支持 facts 保持，不截断/替换 Verification facts。列表及正文合计遵守现有 MAX_RUN_FACTS_JSON_BYTES，不新建索引文件或结果数据库。

producer 在执行时直接把必要原始流写到 exact proofRoot，其他工具产生的必要材料须在回交前可靠落地，不能仅保存 `.tmp` 链接。禁止覆盖旧文件，原始流保留 Buffer bytes；命令、时间、真实退出状态和必要环境限制以文本摘要保存，secret 不收集。外部命令的当前 stdout/stderr 与其语义结论由真实 host 提供，hash 只验证一致性。

接纳器在 target realpath 下逐项检查相关路径：拒绝 absolute、`..`、非规范相对路径、symlink/junction 逃逸、非 regular file、重复冲突路径、size/hash/identity 不符；检查父目录实际归属，不只比较字符串前缀。已有相关 evidenceRefs 从其 sourceRunId 的原声明读回，并按原归属校验，不允许把别的 Change 的同 hash 文件归到本次。历史引用不改写源记录。本项只需同 Change 前序引用，跨 Change 决策通过 canonical 文档/依赖事实传递，不建立跨项目 proof API。

当前链检验只读取 Run 记录，不递归读所有 proof；只有本次 handoff 声明的相关证据需要内容读回。新增无关历史文件不使 Action 阻断，也不使代码测试结论失效。旧材料真实缺失只阻止实际依赖它的判断，不重建旧 bytes。已批准 Explore 的结论和批准引用足以支撑 Proposal 时不默认读取全部原始实验。

### 原始流文本边界与 HOW

仓库 `.gitattributes` 在 Apply 一次性以四条 `.flowkit/artifacts/**/{stdout.txt,stderr.txt,*.stdout.txt,*.stderr.txt}` 对应独立模式 `-text -whitespace` 替代当前八条逐 Change 模式；保留其他 attributes 不变。这里的花括号只是设计表示，Git 文件中必须写四条实际模式，不使用不支持的 brace expansion。

不对整个 artifacts/Run 目录关闭格式检查。仅 raw stream 使用这些名字，脚本、Run JSON、command metadata、人工摘要不能改名伪装原始流来逃避检查。不更改历史 bytes，不执行全仓 renormalize；Git 仍独立检查本次授权范围，修复不新增审批。其他 target 的 Git 配置仍由项目控制，普通 action 不会自动注入本仓库规则。

产品 10 个 `skills/actions/<action>/SKILL.md` 中直接涉及执行回交、必要 proof 和角色交接的条款在各自 canonical 文件内独立更新，不建立公共 normative graph。bootstrap 7 个 Author HOW 与 3 个 Reviewer HOW 中只同步材料/原始流/交接边界，不改为调用产品 action；OpenSpec vendor mechanics 不改。AGENTS 更新当前 CLI/目录/文本说明及独立 bootstrap 边界，不能把历史 D01/D04 描述当现行产品禁令。

### 追溯与验收

| 来源 | 本设计落点 | 必须验证 |
| --- | --- | --- |
| Explore 上下文缺口、016 第 2 条 carry-forward | CLI 请求、唯一链、旧输入拒绝 | 不填 Run 续接、idle/歧义/partial/bootstrap、非法 Policy 边 |
| Explore 实际 transport、016 第 1 条 | JSONL 单次协议、占用与完成顺序 | prepare blocked、EOF、错帧/Role/next、执行后写失败、响应丢失 |
| Owner 项目内保留决定 | proofRefs/handoff 与 target 路径检查 | `.tmp` 消失、缺失/损坏/归属错误/逃逸/覆盖拒绝 |
| Owner 本项修复 attributes、016 第 3 条 | 四条通用 raw-stream 模式 | 两 Delivery/两 Change 与 Full Test 形态的命名，raw bytes 保真，结构化文本负向控制 |
| 原有单次/角色/650 行约束 | 内核复用和有界文件拆分 | domain regression、结构/依赖/可达性、真实宿主两 Change + Review + revise |

## Risks / Trade-offs

- [宿主中断后的实际副作用可能无法自动确认] → 明确保留 partial/failure 和 STOP；不以轻量流程为由假成功，也不建设恢复平台。人工处理受损事实须另有明确范围，不能让 action 命令自动接管。
- [真实模型/Reviewer 验收无法由合成 callback 覆盖] → Apply 通过实际安装和隔离目标执行，保留真实交接；若实际独立 Reviewer/宿主不可用则该验收未完成，不勾选任务。
- [所选 Change 的长 Run 链需要读取记录] → 仅限定 Change，读小型三文件，不遍历全项目原始 proof；暂不增加缓存/索引。
- [终端转义或工具输出混入 JSONL] → 专用 stdin/stdout 协议，工具流进 proof；在 Windows 原生终端和 Linux fixture 分别验证，不能把 simulation 当原生 PASS。
- [文本规则误覆盖结构化材料] → 固定 raw-stream 命名及负向回归；不扩大目录豁免，不关联 .gitignore。

## Migration Plan

先更新新请求/上下文路径与其测试，再接预占/完成写入和宿主执行，最后收敛 proof/文本/HOW 和实际发行验收。每个小任务保持类型/相关回归可运行；中间提交资格不由本计划创造。

旧 CLI 请求明确报迁移诊断，内部 exact APIs 按直接消费者需要保留。历史 canonical Run 保持可读，历史 bootstrap 只展示不转换。本仓库 D05 仍通过独立 bootstrap 完成本 Change。无需数据迁移、外部 runtime 安装/卸载或历史重写；本轮不执行发布/Git 回滚。若实现未获批准，保留现有安装和项目历史，不用破坏性降级清理数据。

没有影响合同方向的待定问题；内部文件名可按真实职责细化，协议、失败顺序、输入域与验收不得留到 Apply 自行决定。
