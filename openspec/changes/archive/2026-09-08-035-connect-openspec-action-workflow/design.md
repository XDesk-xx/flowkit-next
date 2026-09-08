## Context

动机见 proposal.md。当前事实与取舍由 021-revise-explore、022-review-explore approved 支撑：CLI 的读取/Policy 路径可脱离 action transport；既有 Run schema 不含进程或会话身份。当前候选仍包含旧协议，计划修订不意味着它已经被移除。

本设计涉及读取与执行的职责、三文件保存顺序和 HOW 的直接消费者，属于需明确设计的跨文件修改。历史内核和源码安装自定位已有归属，不因本轮纠偏整体重写。

## Goals / Non-Goals

采用顺序 Agent 执行与文件交接：CLI 查询结束即退出，Agent 用已有工具完成一个明确 Action；下一会话读取真实 Runs。单 writer 不等于一个 Node 进程必须从准备一直活到完成。

不提供 action、prepare/submit、通用宿主 adapter、守护进程、锁服务、恢复状态或 target 专用胶水工程。不自动判断人是否真正独立、不承诺文件记录能证明全部工作真实性；独立 Reviewer 仍承担实际审查。

## Decisions

### 1. 保留三命令与有界上下文读取

沿用 `flowkit <command> --input <path>`，请求文件不是持久 current truth。

| 命令 | 必需字段 | 可选字段 |
| --- | --- | --- |
| status | repositoryRoot, flowkitHome | deliveryId, changeId |
| next | repositoryRoot, flowkitHome | deliveryId, changeId, ownerCorrection, checkpointAuthority |
| doctor | repositoryRoot, flowkitHome | 保持原请求合同 |

拒绝旧 currentRunId/changeStartSequence 与任意 state/manager-root/Guidance-path 覆盖。未知命令按既有输入错误处理，包括未发布的 action；不保留其 transport 错误帧。Policy blocked 和 checkpoint unauthorized 仍是正式结果，不作为工具故障。

target 与 exact OpenSpec 返回 root 必须一致。复用 trusted coordination 解析唯一目标，多个候选报告列表，用户只需明确 Delivery/Change 而非 Run。无 active 返回 idle；显式 planned/completed/cancelled 保持真实状态；缺选定 manifest/Change、孤立 active OpenSpec 或冲突事实报告具体诊断。

首次已激活 Explore 可无 scaffold 且无历史，Agent 随后依 OpenSpec mechanics 创建 Change；已有历史时不能以此掩盖删除。canonical archived 必须由 completed coordination、archive terminal 与 OpenSpec active 中已移除共同支持；历史 bootstrap 只展示，不追溯改写。

读取仅限选定 Change 的受控 Run group。由 group prefix 解析既有 changeStartSequence；canonical 地址仍为 `.flowkit/runs/<delivery-id>/<change-sequence>-<change-id>/<run-occurrence>/`。projectOrdinal 不替代 group prefix。semantic bootstrap group 保持 bootstrap-history；混合、损坏或 partial 单独诊断，不能当空历史或转换为 canonical。

current 来自唯一有效 previousRunId 链：唯一 Explore 根、唯一末端、同目标、无分叉/缺父/环/重复 sequence。Role、结果槽和历史边通过既有校验/Policy 核对，不复制转换表。sequence 仅用于地址分配和稳定展示，不能 max 选成功。prepared 记录不要求协议专属 facts.invocationFailure；四个 outcome/next 槽为空，next 不传 terminal facts。已完成业务 FAIL、changes-requested 使用真实字段，不能回退旧 PASS。

### 2. Agent 使用既有合同，不等待 CLI

产品 HOW 说明已选定 Action 对应 manager 中的 canonical Skill、Run 地址与字段。Agent 使用已有终端/文件能力；可以直接调用已发行 domain 校验函数，不要求 target 复制 Flowkit 源码、安装开发依赖、编写 callback 或保存专用胶水脚本。

开始前明确实际 Role、合法 Action、target、previousRunId 与新 occurrence，复用既有地址、Guidance、package 形成及校验合同。ActionPackage 是本次执行上下文，不是新 Run 文件或通信会话。Agent preparation 与实际工作使用同一 exact package/Guidance；Guidance 不可由 target 同名文件替代。ordinary Action 不增加 Owner 审批，correction/activation 依现有 authority。

既有 invokeSingleAction 保留为调用它的程序的有界组合 API，其 callbacks/内存状态语义不变。Agent 不必把实际长时工作塞进这个 callback；可以按同一 package/Role/result 合同使用既有细粒度工具完成工作与接纳。不是绕过 exact admission，而是不把一个存活 invocation 实现当成唯一执行宿主。

产品 HOW 必须给出可实际采用的字段填写和校验示例，定位 manager 发行中的现有 JavaScript 模块；不得只有“调用旧 writer”一句话。示例只说明受控地址、package/context/result、校验和文件读写，不新增 CLI、公共协议或长期 helper 文件。示例中的结果由真实工作提供，合成值明确标为测试。

### 3. 真实开始、完成与未完成的最小记录顺序

选择 Agent 持有本次执行上下文、按三文件约定写入；不复用 action-run-reservation 的 live closure/进程所有权，不另建 begin/finish 服务。实际负责写入的是 Agent 的文件工具或短命令，不是查询 CLI。

1. 只读 preparation 尚未通过时不创建 execution Run，不改变前一完整 current。通过后，Agent 为本次新 occurrence 创建受控目录并以 create-once 写 action.md；descriptor 记录实际开始、目标/Role、前序、occurrence 与本次 package/Guidance 的识别信息。开始记录写失败则不开始业务修改。
2. action.md 单独存在仅证明一次未完整记录的尝试，不是机器 prepared/terminal。执行期间不把缺 context/result 伪装为成功；此时从另一查询进程读到 incomplete 是真实诊断，不要求额外的“准备 Action”或 STOP。
3. 同一次实际 Action 的 Agent 完成工作、必要材料保存及既有 exact Result admission，确认既有 terminal transition 合法后，生成最终 canonical context/result；先 context 后 result，均只创建缺少文件。terminal context 与结果必须同一 identity/occurrence/Role；context/result 不增加字段、不更改已存在 bytes。
4. 同一次执行的匹配依据是此前受控 descriptor/持有的 exact 执行上下文及实际工作，而不是 PID、PTY 或存活对象。只有目录存在不足以获准填结果；后续会话不得从遗留 partial 自动推断完成或接管旧执行。
5. 实际执行失败但可形成合法业务结论时，记录真实 FAIL/changes-requested；不能接纳结论时，只在能如实形成既有 prepared context 和 null outcome Result 时记录有界失败原因，否则保留 partial。prepared 未终结与 terminal 业务失败分开。
6. 写入或必要读回失败保留已写部分并报告 exact 位置，不调用 catch-rm 清掉执行痕迹，不重复业务工作、不回用旧 PASS。所有三文件及必要引用读回一致后才报告 durable completion，随后 STOP。
7. 已有 terminal 不覆盖；前次失败后的合法再次执行使用新 occurrence。partial 的实际副作用需人工核对，当前 Change 不增加修复/恢复协议。

现有 writeDurableRun 保留“输入完整记录、拒绝已有目录”的用法，不作为已开始 occurrence 的完成器。其新建文件失败后清理部分目录的直接缺口改为保留部分并报错；这是本 capability 的有限保存语义修正，不扩展为事务。Agent 的分次记录由 HOW 用 create-once 文件操作完成；不强迫旧 writer 接管任意目录。

### 4. 材料核对在实际相关边界，不在每个查询中

必要 proof 路径为 target `.flowkit/artifacts/<delivery-id>/changes/<change-id>/proof/<run-id>/`，默认长期保留。producer 保存真实方法、原始 Buffer 流、退出结果、必要限制；不收集 secret。无新必要材料时不建空目录，.tmp 不承载必要的唯一副本。

沿用 Result facts 容器中的有界 proofRefs/handoff 说明，不增加顶层 schema：
- proofRefs 用 path、bytes、sha256、deliveryId、changeId、runId、purpose 描述本次必要文件。
- handoff 用 summary、ownerDecisions（sourceRef/summary）、evidenceRefs（sourceRunId/path）声明下一步确需材料。
- 失败原因可放在既有 facts，不保留“只有 CLI 能写”的 invocationFailure 协议键，不将新增资料键追溯设为全部历史 Run 的强制字段。

Agent 产生/接纳当前材料、Reviewer 及后续实际消费时核对来源、target 内真实路径、归属、regular/readable、size/hash 与结论一致；拒绝路径逃逸/符号链接逃逸和冲突引用。hash 不能证明审查真实；同 hash 不能转移材料归属。

status/next 读取必要 Run facts 和 Policy 输入，不为展示流程扫描 proof 内容。旧 canonical Run 没有新增材料键仍可读；某项判断确实依赖缺失材料时，只阻止那项判断。相关 handoff 不默认累积所有祖先，Owner 材料决定带真实 sourceRef；未收到说明不等于未授权。

撤出仅服务旧协议的 action-proof/action-target-files；有必要的核对逻辑只能按实际生产消费者复用，不保留无调用的库或为通过可达性 gate 造调用。HOW 示例可用既有文件/哈希工具完成核对。

### 5. 原始流与直接 HOW 收敛

保留四条 .flowkit/artifacts/** 下 stdout.txt、stderr.txt、*.stdout.txt、*.stderr.txt 的 -text -whitespace 规则，取消逐 Change 例外；其他文本照常检查。不改历史 bytes、不全仓 renormalize、不把结构化文件改名冒充日志。不联动 .gitignore 或 Full Test 配置，不自动修改其他 target Git 配置。

产品十个 Action HOW 各自去掉 JSONL 回交，纳入上述 canonical 记录、必要材料及角色交接；不新建公共规范图或自动审查循环。bootstrap 十个 HOW 独立保留真实三文件记录、必要材料及 Owner 交接，不调用产品入口、不将 D05 历史转换。OpenSpec vendor mechanics 不修改。

README/AGENTS 同步三命令、Agent 记录、源码/target 分根和真实验收边界。manifest 只在 Apply 窄改 scope.included 中本 Change 对应宿主说明、该 Change goal 和首项 output，使其不再暗示 CLI 托管；id/state/ordinal/dependencies/Owner facts 和其他 Change 不变。这是直接语义一致性，不是 Delivery coordination 实现。

### 6. 任务与验证对应

| 当前依据 | 落点 | 验收 |
| --- | --- | --- |
| 021/022：CLI 读取，Agent 执行 | 三命令、撤出 transport | 独立查询进程输出正确且不写项目、不执行 Action |
| 021/022：canonical 与 bootstrap 分开 | 受控地址/唯一链、HOW 字段示例 | Agent 记录的 canonical 文件可读；历史仅展示、不迁移 |
| 022：不能忽略真实开始/保存失败 | descriptor→最终 context/result；保留 partial | 有界失败注入、create-once、读回，不以 terminal JSON 代替工作 |
| Owner 必要材料与原始流决定 | producer/相关消费、通用 attributes | 原始 bytes 保真；必要引用错误只阻断依赖判断 |
| Owner 停止固定演练 | 一个有界实际记录示例及合成负向回归 | 不要求两个真人 Change、不制造 finding；独立正式 Review 不变 |

## Risks / Trade-offs

- [文件正确不等于执行真实] → Agent 提供实际来源，Reviewer 独立审查；测试中的 approved 只覆盖程序分支。
- [中断后副作用不明] → 留 partial 并给具体诊断；没有自动接管或回滚承诺。
- [HOW 与 schema 漂移] → 用发行模块的既有校验器验证 HOW 字段示例；不由 Skill 建第二套 machine schema。
- [旧候选协议仍有残留] → Apply 按实际 import/测试/文档消费者撤出，不整体重做原内核。
- [历史测试不适用于新候选] → 核对证据适用性；变更相关 Windows/Linux、类型、结构/可达性和 650 行 gate 重新验证。

## Migration Plan

先保留上下文需求、撤出 action 的直接消费，再收敛 Agent 记录/HOW 与有限保存缺口，最后更新直接文档和行为验收。未发布协议不提供兼容 transport；既有 canonical schema/内核 API 保持，旧用户 Run 选择输入给明确迁移诊断。

019 的部分实现和实验留作事实来源，不继续其真人验收、不补完成；021/022 是当前决策依据而非实现 PASS。现有任务中受影响项改为待完成，不把撤出要求记成实施成功。无需历史迁移、外部 manager 重装或 Git 操作；失败处理保留历史，不提供破坏性回滚。

无影响合同方向的待决问题。Apply 必须完成本计划的必要代码/测试/HOW 收敛，再交独立 review-apply；本次 revise-propose 只交 review-propose 并 STOP。
