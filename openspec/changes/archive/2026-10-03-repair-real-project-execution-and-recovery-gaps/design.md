## Context

动机、七项范围和证据见 [proposal.md](proposal.md) 与 [explore.md](explore.md) A–G。固定入口已经具备 descriptor、Policy、candidate hash、Archive scratch 和 scoped checkpoint；缺口集中在这些既有能力之间。当前编号草案对历史区间要求过严，尚未被安装产品采用。

本次是 Owner 授权的直接 OpenSpec 规划，未创建 Flowkit Run/Delivery。下述合同描述修复后的产品操作，不追认本次为 canonical Action，也不授予 Apply、Reviewer 或 Git 权限。

## Goals / Non-Goals

**Goals:** 所有新写入在对应消费合同下可读；历史 Run 原 bytes 不变；失败时用户能够分辨执行效果和剩余合法步骤；候选到 Git 的字节身份可以独立复核。

**Non-Goals:** 任意 terminal 字段修改、多次 correction 链、历史批量迁移、任意脚本沙箱、依赖自动安装、多 writer 锁、自动 retry/next、新的 lifecycle state，以及消费项目升级。

## Decisions

### 1. 在既有 readiness/admission 中共用候选校验

Review finish 必须声明 `facts.reviewedRunId`，与 descriptor 的 `previousRunId` 和真实 terminal Author 相等。已有 `reviewedAuthorRunId` 若声明也须相等。Reviewer 的候选 map 若声明，须与 Author effective `artifactHashes` 精确一致；不能用口头 candidate 摘要替代。适用范围为三个 review 阶段，阶段产物沿用既有专用身份合同；review-apply 的绑定由 Archive 复用。

对于新的 Author apply/revise-apply PASS，在现有 raw SHA-256 校验后对 map 中的现存 regular paths 计算 raw 和 Git-filtered object ID，不同即拒绝。Reviewer start/finish 独立再核对当前候选。propose/explore 的现有产物身份规则保持；其进入受管理 checkpoint 时同样经过 Git guard。不要求所有历史 Result 回填新字段，旧完整 Review 可被读取；但后续新 mutation 消费缺失 binding 时必须通过本 Change 的 correction 或新的真实 revise/review。

候选没有删除表示时，不往 `artifactHashes` 填假 hash。checkpoint 对授权 deletion paths 核对其 HEAD/index 删除状态；本 Change 不扩张为新候选 diff 格式。

### 2. Delivery 分配与 Change 链分开

枚举该 Delivery 已知 Run 分组；按 coordination 精确匹配 Change，不以目录排序或 projectOrdinal 推算序号。完整 canonical 分组先通过各自链校验；合法新格式 partial 只能贡献已占用序号，且 unresolved partial 阻断新的不相关开始。旧 bootstrap 分组维持只读展示，不改成 canonical 分配事实；若参与本次分配的历史无法证明占用上界，明确阻断，不猜 1。

新 Change 从 canonical 已占用最大序号 +1 开始，无历史时为 1。旧跨 Change 重号/缺口不要求修复或全局连续，输出有界 warning；同 Change 内重复、断链和非法值仍拒绝。非初始 Run 用本 Change 前序 +1，并检查该值在其他 Change 的占用；冲突时阻断，不能跨 Change 改父链或静默跳号。first sequence 写进 start descriptor/group，finish 按 exact 保存值和占用事实复核，不重新用其他 Change 的最新最大值冒充该 Run 的初始身份。保留现有 sequence 数值范围及耗尽拒绝。

不采用现有草案的“全历史相邻 +1”校验，不新建 counter/Registry。MenDi 样本的新 Change 从 23 开始；旧分组及旧 runId 的定位始终包含 Delivery/Change。

### 3. Archive 选择独立依赖快照

保留现有 scratch convergence，但将 target 可用依赖复制到 scratch，取消指向原 target 的顶层 junction。普通依赖文件复制为独立文件或文件系统 copy-on-write，不创建可写共享 hardlink。复制保留相对依赖 symlink；绝对 link 若可证明指向 target 已复制范围，则重定位到对应 scratch 路径。任何 link 最终逃出 scratch、未知外部 virtual store、复制缺失/不完整或循环无法安全观察时拒绝，不自动下载/安装。pnpm store 的普通硬链接文件以独立 copy materialize，避免 scratch 写入影响原依赖。

对 pnpm 11，复制之前在原 target 用有界只读依赖 preflight：选定目标 pnpm、`--config.verify-deps-before-run=error exec -- <当前 Node absolute path> --version`。它只允许依赖状态核对和固定 version 子进程，不能执行 install；依赖不一致即阻断。复制后在隔离检查进程设置 `pnpm_config_verify_deps_before_run=false`，仅避免因迁移目录导致的 pnpm pre-run 同步，不覆盖项目 check 的真实执行与退出码。npm/其他已支持 runner 沿用既有固定执行合同；不推广新的包管理器支持。

源preflight的子进程环境移除继承的该pnpm override，保证error模式真正执行依赖核对；不修改宿主环境。snapshot还须处理pnpm生成的.bin shims：本仓库Windows tsx.cmd中有source绝对NODE_PATH，原样复制会回读source。仅对可识别的已生成shim重定位其target-root路径到scratch，保持wrapper语义/换行和映射记录；未知外部绝对引用则拒绝。scratch子进程不继承指向source dependencies的NODE_PATH，其他进程env保持必要既有合同。只改副本的已生成工具资产，不改target源码/依赖或任意脚本。

source package、lock、workspace config 和依赖 metadata 在复制前后绑定 hash；校验与执行间漂移阻断。`action start` 和 `change archive` 共用该策略，各自做必要当前事实复核，不用上次 PASS 跳过新的检查。依赖复制成本是当前真实安全边界的代价；不采用共享 junction + 单一环境变量作为正式隔离。

项目声明的 check 是可信已有执行入口，不能保证任意恶意脚本没有 absolute-path 副作用；本合同保证 manager 自身不把 source dependencies 暴露为 scratch 可写目标、不自动安装/删除，并对真实验收检查确认 source 未变，不引入通用 sandbox。

### 4. 诊断与恢复只保存必要实际观察

Archive 诊断保存在 target `.flowkit/artifacts/<delivery>/changes/<run-group>/archive-diagnostics/<attemptId>/`。`attemptId` 为 manager 生成 UUID v4，start 前已由受控初始序号确定 group；材料指明 target/Change、trigger=start|archive、nullable runId、candidate/package/Guidance identity。无 Run 的失败不伪造 Run，目录也不成为 current authority。

每个实际子命令保存 create-once `command.json`、`stdout.txt`、`stderr.txt`。raw 流按 Buffer bytes 收集，不 decode/重排；最多每流 16 MiB，超限停止子进程、保留实际已收前缀并标 `truncated=true`，分类 process-failed，不能声称日志完整或测试 PASS。沿用现有 120s OpenSpec、300s check timeout；保存 exitCode、signal、spawnError、timeout、truncation 和 cwd/argv，错误包含文件 refs。敏感 env 不持久化；command 只记录固定入口及项目预先配置参数。诊断写入失败也阻断，输出实际保存位置与 unconfirmed 状态，不因清理 scratch 丢失全部可诊断事实。

同 Run archive 的恢复观察保存在该 group 的 `archive-effects/<runId>/`，仍位于 artifacts，不增加第四个 Run 文件。create-once 的 `prestate.json` 记录 source Change、对应 archive path、受影响 canonical spec 的前后预期 hashes（后态来自真实隔离 convergence）、原候选和 descriptor 身份；后续 `openspec-intent.json`、`openspec-observed.json`、`rename-observed.json`、`coordination-observed.json` 仅保存真实调用或只读观察。只记录本次 affected specs 和 archive bytes，不复制全仓 truth，不把 phases 当新 Action lifecycle。

这些既有材料同时支持归档后的候选核对：绑定 exact Author→approved Review→Archive 链、source/最终 ordinal archive 路径、迁移文件的完整相对路径集合与原始 hash、受影响 spec 的前后态（不存在用 null 表示），以及 coordination 文件前后 hash 和仅当前 Change state 从 active 到 completed 的字段差异。生产端在真实归档前后核对：迁移只替换当前 Change 的路径前缀且保持内容，spec 后态等于已检查的隔离收敛结果，coordination 无其他字段变化。Archive finish 的真实 terminal Result 以 exact 路径、bytes、SHA-256 绑定所需既有材料；业务命令返回 completed、phase 文件存在或自填映射均不能替代已接纳的 Archive Result。尚未确认时只服务诊断/恢复，不提供 checkpoint 转换依据。

`action inspect` 是只读封闭请求：共同 target、runId；返回 descriptor/机器文件完整性、原三文件身份（若存在）、校验后的 actual effect、diagnostic refs、remaining steps 和 `canContinue`。只有 descriptor、Guidance、前序链、candidate 与实际 OpenSpec/coordination 一致才给可继续；caller 报过 effect 或存在 phase 文件都不足以授权。正常 status/next 对 incomplete 仍严格阻断，并给 exact inspect 定位。

| 实际可证后态 | `change archive` 下一次明确 invocation 的处理 |
| --- | --- |
| source/prestate 全部匹配，archive target 不存在 | 可重新做隔离预检，再执行一次真实 archive |
| source 已移走，default archive 和 affected specs 与预期后态匹配 | 只做 ordinal rename、coordination 和观察记录，不重执行 OpenSpec archive |
| exact ordinal archive 与 specs 匹配，coordination active | 只写 active→completed 并读回 |
| exact archive、specs、completed coordination 匹配 | 只读确认业务完成，交给同 Run `action finish` |
| mixed/unknown/drift/其他 Run 已消费 | 阻断并报告，不能自动 replay 或新建 Run |

状态即使因丢失子进程响应没有 success marker，也须重新对照已保存 pre/postcondition；无法证明完整 prestate 或完整 poststate就 unknown。恢复前后复核原 context/result 尚未部分写入、无 successor/fork、同 Run/current package；部分 machine 写入不由 Archive 或 inspect 补造。普通相同 archive 重投读回实际效果，不把“先前失败”解释成没有副作用。

### 5. terminal correction 是一次有证据的缺失字段补齐

新增 `action correct` 数据请求：共同 target、runId、实际 `role`、`ownerAuthority`、`expectedRunHashes`（三文件 SHA-256）、`additions` 和 nullable `candidateEvidenceRef`。可见目标与 JSON 一致。Owner fact 固定 `decision=correct-run-metadata`、same Delivery/Change、`scope=["correct-run-metadata"]`；源引用由受信宿主对应真实 Owner 输入，CLI 不认证聊天，也不因结构合格制造权限。

只接受 active、完整 terminal canonical Run，允许该 Change 当前 tip 的 Author 或其最近 Review 的直接 Author；Reviewer correction 只针对当前 terminal Review。已 archived/Final 的 Change、未知 bootstrap、已有 successor 对本次修改存在不一致消费、linked paths 和 missing original bytes 均拒绝。角色必须等于原 Run role。

允许的 additions 仅为：

- Author apply/revise-apply PASS 的缺失/空 `facts.artifactHashes`。须有原 Result 已声明的、校验通过的本 Run candidate manifest proof（JSON 的 `artifactHashes` map），其 raw bytes/归属/hash 能证明原执行候选。新增 map 必须等于该 manifest，现存候选再通过 raw/hash/filter 核对；没有该证据转入真实 revise/review，不能只读当前工作树回填历史。
- Reviewer 的缺失 `facts.reviewedRunId`、缺失 `facts.reviewedAuthorRunId`。值必须等于唯一 direct Author predecessor；已有 alias/candidate 声明必须一致。不能替换任何已存在非空值。

`additions` 不接受任意 JSON path，不能改 outcome、verdict、nextBoundary、role、occurrence、previousRunId、Proof refs 或候选 bytes。旧合法 identity 缺失补齐不意味着旧结果获得新的 reviewer/verification 权限。

每 Run 至多一个 `.flowkit/artifacts/<delivery>/changes/<run-group>/corrections/<runId>/correction.json`，create-once 且 exact Git `-text`。保存固定 version、Run identity、original hashes、原 Role、Owner fact、additions、证据 ref 及 actual timestamp；不存自签 PASS 或自引用 content hash。相同请求在逐项只读一致后返回 confirmed，冲突或 partial 材料拒绝；本版本不提供 correction-of-correction。

raw persistence reader 仍返回原 record。相关消费者通过一个有界 resolver 返回 `{original, effectiveFacts, correctionRef}`，逐次验证原三文件、correction、证据和已消费直接后继的候选绑定；绝不覆盖旧 Result。Review readiness/finish、Archive、checkpoint 统一消费此 view，Policy outcome/context 始终取 original。不存在 correction 时路径保持原行为。

唯一直接已接纳 Reviewer 的候选 map/摘要和 Author corrected identity 相同，且 exact reviewed binding 可证时，缺字段补齐允许继承该原判定；任何冲突或原 Review 身份来源无法证明均阻断，要求新的 Owner revise + 独立 review。不能遍历全历史自动“修好”。Author 自己不能补 Reviewer correction；相关新 correction 进入 checkpoint 时独立验证 immutable original 和 index 中的 correction，不以 parent Result 的不可变 proofRefs 新增条目冒充普通 proof。

### 6. rejected 的记录与 Policy 续行分开

known `rejected` + `nextBoundary=null` 的 Reviewer terminal 可以 finish/读回；Policy 默认 `blocked(review-rejected)`，Run-chain 将它视为已识别 terminal stopped。非 null reported boundary仍 `reported-boundary-conflict`；未知 token仍 `unrecognized-reviewer-verdict`，不能把所有 blocked 都改成可接纳。

在 rejected exact current pair 已验证、Change active、Owner 明确 `revise-action` 且 same target/scope 时，只允许对应阶段 revise（review-explore→revise-explore，review-propose→revise-propose，review-apply→revise-apply）。沿用 structural-enterability，不改 ordinary approved/changes-requested matrix。终止/取消仍交给既有 Owner 治理，不新增自动取消。

fixed start 从“仅 prepared Author correction”扩展为既有合法 terminal correction及该 known rejection case；仍不能从 invalid chain、unknown verdict、Author FAIL 或 completed archive 用 Owner fact兜底续行。先前真实 rejected 不改字，新的 Author revise Run 保存同一 Owner fact并接原 Reviewer为 parent；后续独立 review。

### 7. checkpoint 核对候选 raw、index 与最终 blob

沿用 Owner exact path authorization、完整 pending index 和无范围外 staged 的 preflight。对所有授权 regular existing paths 检查 raw/filter ID 相等；对受管理已审候选，在可信相关 Run/effective view 中追溯原 raw SHA-256。尚未归档时核对原路径；已归档时只消费同 Change 已接纳 terminal Archive 及其绑定的第 4 节材料，计算有界预期后态：

- 当前 Change 目录内的文件，仅按已确认 source→ordinal archive 前缀替换定位，suffix 与 raw SHA-256 不变；原路径须已移除，不能把任意删除当成迁移。
- 此次受影响的 canonical specs 和 coordination 文件，使用已确认的转换后 hash；核对 spec 收敛来源及仅当前 Change active→completed 的协调变化，不能要求它们继续等于归档前 hash。
- 其他 reviewed candidate paths 仍在原位置与原 hash 一致；归档后对源码、归档内容、spec 或其他 coordination 字段的额外修改均不因 Archive 而获豁免。

转换只解释该 Archive 已执行的机械变化，不修改 Author/Reviewer Run、扩展 artifactHashes、追认任意 filter 映射或建立迁移 Registry。新准入缺少可验证 Archive 结果/材料、只有 worktree 证据、映射不唯一或后态漂移时明确阻断，不补造历史转换；不对旧已接受 Git 历史追溯重签。

stage 前以当前 index 加本次授权路径的拟写入/删除形成预期候选树，避免把尚未 staged 的合法修改误判为漂移；stage 后再以实际 index 核对预期后态、原路径删除和完整必要证据。关联 Archive Run、转换材料、correction 及必要 proof 均须在该候选树内可验证。候选或其归档目标即使不在本次 paths 中，也只读核对候选树已有 bytes，不扩大 staged 范围；缺失、漂移或错 binding 阻断。

stage 后核对实际 index blobs，commit 后 readback 核对同一预期 tree/blob；异常报告确认 commit SHA 与剩余问题，不 reset/重写。普通不关联 Review 的 checkpoint不要求 fabrication reviewer receipt，但仍受 raw/filter及既有权限合同约束。reuse-existing/push 不改 index，不对旧接受历史追溯重签。

新增 correction 材料从候选树验证原 Run hashes、封闭 additions、角色/Owner/证据/直接消费及 raw Git bytes，与 regular Proof 的准入分开；诊断/effect材料保持原 bytes及明确归属，不把它们当 Verification PASS。

## Risks / Trade-offs

- 复制依赖耗时和磁盘增加 → 只在真实 Archive convergence 时复制，出错明确阻断；不为性能退回 source junction。
- workspace 依赖存在外部链接 → 只接纳能闭合到 scratch 的映射；其他布局明确 unsupported，不自动安装或引入链接迁移平台。
- 无原 candidate manifest 的历史遗漏不可补齐 → 通过新的真实 revise/review解决，不凭当前 bytes追认历史。
- correction 已被下游消费 → 只允许精确缺字段一致性补齐；冲突失去准入并请求重新工作，不覆盖旧 PASS。
- 进程在效果记录前崩溃 → 用持久 pre/postcondition 和真实目录/spec/coordination 再观察；混合后态保持 unknown。
- 任意项目脚本可能自己操作外部路径 → 不承诺通用安全沙箱；真实验收检查证明 source 不变，manager不创建外部可写依赖别名。
- strict validation只证明 OpenSpec结构 → 文档修订不代替独立 approval 或当前实现验收。

## Migration Plan

Apply 在源码与隔离 fixture 中实施并验证，不热改已安装 manager或消费项目。旧完整 Run、bootstrap、archive和Proof只读保留；新 writer执行更严格绑定/字节准入，新消费者明确处理旧缺字段和跨 Change 重号。发布/安装升级需要后续授权与实际包核对，完成规划不执行它们。

新增 rejected/correction 是旧 manager无法完整消费的新产品事实；升级后如已有这些事实，不将 target回退给旧 manager继续 mutation。失败的安装在触发新事实前可回用原固定安装；已发生新事实则保持 target bytes、停止写入并使用兼容版本修复，不自动删除新事实作为回滚。

验收结果各自记录范围：focused unit/fixed CLI、native Windows pnpm、现有适用 Linux/安装回归。未执行检查保持未执行；不因事故记录和旧 PASS宣称当前 candidate通过，不在本 Change 自动做 Formal Full Test/Final或 Git。

## Requirement Traceability

| Explore来源 | Delta合同 | 实施/验收任务 |
| --- | --- | --- |
| A / FKI-01 | Review finish exact binding | 2.1、2.2、8.1 |
| B / F-01 | Delivery occupancy与旧history读取 | 1.1–1.3、8.1 |
| C / FKI-03、F-02 | 独立依赖及真实checks | 4.1–4.3、8.2 |
| D / F-03 | raw诊断、inspect与同Run剩余步骤 | 4.4、5.1–5.3、8.3 |
| E / FKI-02 | 封闭correction及effective消费 | 3.1–3.4、6.2、8.1 |
| F / FKI-04 | raw/filter/index/blob一致 | 2.3、6.1、8.1 |
| G / FKI-05 | terminal rejected与explicit Owner revise | 2.4、2.5、7.1、8.1 |

所有任务均回到上述来源或保留的既有合同；HOW更新与适用回归属于这些行为的交付闭合，不构成额外治理平台。
