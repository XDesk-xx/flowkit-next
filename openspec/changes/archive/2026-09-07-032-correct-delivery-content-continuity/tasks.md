## 1. 共享 v2 材料与读取边界

- [x] 1.1 按 design D1 拆出共享 record/UTF-8 comparator/hash 窄 helper，接入 candidate/check 派生与 Action 排序/admission；用 golden vectors 验证两个 exact v2 domain、JSON 字段顺序、非 BMP 顺序、输入 property order 与 argv/Full Test 有序数组不被改排。
- [x] 1.2 在 worktree reader 实现稳定缺席无 record；用真实 Git fixture 验证删除未暂存→暂存→commit 候选相同、与删除前不同，tracked/non-ignored untracked 材料真实变化仍改变候选。
- [x] 1.3 实现 exact Memo 内容隔离及类型/边界检查；用 Memo 缺失、合法空集合、内容改变、同名目录/symlink/附加文件和 project.json/根目录文件反例验证只隔离指定内容，Memo schema 与 Git dirty 仍独立生效。
- [x] 1.4 实现 read 前后状态/index/可见性重验与失败分类；在 tracked/untracked 真实 read-denial、unmerged index、unsupported mode、受控读取竞争/替换、ignore 可见性变化 fixture 中验证失败不变成删除，无法证明一致读取时拒绝。
- [x] 1.5 新增 exact object 的二进制 reader 并复用同一编码；用 binary/尾空白/CRLF、mode、symlink、未提交材料、checkout filter fixture 验证同材料双入口相等、真实差异不等，且不 trim、不解引用 link。
- [x] 1.6 统一本合同 Git SHA-1 format/40 位 OID 校验；用 SHA-256 repository、异常长度/type、submodule 与非法 UTF-8 path 负例验证 reader 和直接 validator 一致拒绝，正常 SHA-1 fixture 通过。

## 2. 检查复用与阶段来源

依赖：第 1 组。每项同时更新对应 closed validator 和测试，不保留产品 v1 fallback。

- [x] 2.1 接入实际 Memo/Git-consuming checks 的材料绑定；执行小型真实 check 验证 Memo-only 下产品 candidate 不变，但消费它的 check identity 变化；不消费它的 check 可保留有效 PASS，missing 与合法空文档不合并。
- [x] 2.2 验证 Action 与 Full Test 的 v2 复用/admission；用同序 ASCII 材料生成旧算法真实 prior fact，证明不能复用为 v2；测试 v2 exact PASS 可复用、旧失败不可复用、candidate/check drift 拒绝以及 Full Test 顺序不变。
- [x] 2.3 收敛 Full Test correction 与 Architecture 的 v2/来源消费；定点测试同候选外部 correction、产品 correction STOP、来源缺失拒绝、合法六槽改变候选与无关修改拒绝，保持既有六槽/compare/closure golden vectors。

## 3. Start 内容完成

依赖：第 1–2 组；对应 design D3 与 Start delta。

- [x] 3.1 建立 contentCompletion 的 closed shape 与可信输出/validation 读取接缝；用真实四槽文件及真实校验输出验证 project/Delivery/base/planning/output/candidate 绑定，拒绝裸 validated、自签来源、任意路径与缺失/漂移输出。
- [x] 3.2 接入 Start terminal 与消费者，无 checkpoint 请求/权限时返回完整内容记录及 null fixedPointCommit；测试 Git callback 调用次数为零、后续通过已核验内容而非虚构 SHA 续接，且既有 state-first/clean-start 仍成立。
- [x] 3.3 保持 Start exact prestate 与独立 checkpoint 分支；测试 same-content HEAD/planning 漂移拒绝、callback defensive isolation、明确授权普通 commit 的真实 Git parent/count/clean/content 核验以及失败不谎报 commit 成功。

## 4. Final 必要证据与完整 closure

依赖：第 1–2 组；按 design D4–D5，先证明真实前置来源，再接入闭合。

- [x] 4.1 实现 requiredEvidence 的有限 closed 形状、稳定排序与受控 artifact 定位；用 schema/golden fixtures 验证 exact 字段、manifest-order Change 覆盖、重复/未知字段及任意路径拒绝，不创建 evidence Registry 或新的 durable 文件。
- [x] 4.2 从已接受 archive/review anchors 读取现有 canonical Run 链；用真实执行并持久化的 Run 验证地址/三文件/linkage/role/verdict/admission 来源，覆盖 A/B 漏项、断链、循环、caller 截断、错误项目/Delivery/Change、自签 forged Run 与无关历史追加。
- [x] 4.3 接入 Full Test/Architecture 的完整实际 outcome 与 source 材料读取；用独立 fixture source 保存/取回真实输出，验证无法取回、错误来源、hash 自洽但非原执行、材料缩减、路径重定向和 mismatch 拒绝，且不将 D04 bootstrap Run 当 canonical product Run。
- [x] 4.4 在 Final preparation/clone/admission/record projection 中绑定 requiredEvidence；用新的 Final golden vectors 验证 object property reorder 稳定、必要材料或 manifest-order IDs 改变 ref、旧缺字段 closure 拒绝及三阶段 candidate lineage 完整。
- [x] 4.5 验证 Final writer 仍只做既有窄 coordination closure；运行 presentation-sensitive whole-file equality 与 staging/rename/readback 故障测试，证明非目标 bytes/顺序保持、失败不返回成功、不提前依赖 fullTestStatus=passed、不自动 Git/恢复。

## 5. Integration 具体操作与 accepted object 验收

依赖：第 1–4 组；对应 design D6 与 Integration delta。

- [x] 5.1 增加 checkpointOperation 两个 closed variants 并贯通 package/clone/ref/record validator；用 golden/authority tests 验证字段顺序与内容绑定、旧 record 拒绝、相同 scope 不能由 caller 切换 Owner 未授权操作。
- [x] 5.2 保留 create-new 的普通单 commit 路径；真实隔离 Git fixture 验证唯一 parent/count=1/clean/v2 内容，以及零个、多于一个、错误 parent、候选变化拒绝。
- [x] 5.3 实现 reuse-existing 的 exact checkpoint 来源/object/prestate 核验；测试已授权 checkpoint 可等于 preIntegrationHead、不会调用 commit callback、无需第二 commit，未授权/内容不同/dirty/旧 prestate 均拒绝。
- [x] 5.4 用 accepted object 的共享产品 projection 替换通用 tree/ancestry 内容判断；真实 Git fixture 验证经明确授权的等内容不同历史可接受、额外产品 bytes 拒绝、same-content HEAD/target drift 使原 package 失效，callback SHA 不代替 Git。
- [x] 5.5 将 Final 的必要证据验收接到 accepted object/已验证外部来源；测试“产品相同且本地证据完整、但 accepted object 必需 Run 缺失/损坏”拒绝、错误来源/项目拒绝、caller 缩小集合拒绝、仅追加无关历史可通过。
- [x] 5.6 验证部分成功窗口的当前 STOP 语义：commit 成功后 acceptance 失败不自动补交；新的合法 reuse invocation 经重验可复用；target 已变而响应丢失不自动再 mutation；保留原 package/实际效果供核对，不实现跨会话恢复平台。

## 6. 当前合同与 Guidance 收敛

依赖：第 1–5 组。以下是当前交付物的一致性检查，不是 archive 后的补做任务。

- [x] 6.1 更新当前 Start/Full Test/Architecture 三个直接 product Delivery Guidance，验证它们描述真实内容完成、v2/来源和阶段 lineage，未新增 optional/skip、旧 PASS 兼容或自动 next；不得把这些 candidate Skills 用作管理同一 D04 的 authority。
- [x] 6.2 更新 Final/Integration Guidance 及其他实际引用旧语义的直接消费者说明；通过 targeted search 和逐条 delta 对照验证必需证据、checkpoint variants、Git/来源/内容分工一致，不扩展 manager roots/host 持久化。
- [x] 6.3 仅收敛当前 D04 manifest 的 prospective scope/acceptance 中 mandatory Start checkpoint 表述；用 before/after 精确 diff 验证历史 Change/Owner 决定、projectOrdinal、Delivery active/pending/pending、已存在 architecture 输入及历史 Runs 原样保留。
- [x] 6.4 在隔离 spec 投影中核对七个 delta 合并后的完整 requirements/scenarios 与当前 Guidance 无矛盾，并完成 OpenSpec strict validation；当前 canonical spec 正式 sync 仍留在其授权边界，不提前 archive 或改写 archived Changes。
- [x] 6.5 更新独立 bootstrap `.agents/skills/{explore-proof-based,proposal-convergence,revise-propose}/SKILL.md`：Author handoff 只携带影响后续判断的相关 Owner 决定及材料处理/保留边界，不复制全部聊天；区分 Explore 实验、已接受决策依据和当前实现验收证据，明确历史 proof 不得冒充当前实现 PASS，且不建立统一 proof 存储或永久保留义务。
- [x] 6.6 更新独立 bootstrap `.agents/skills/review-propose/SKILL.md`：材料路径变化或授权背景缺失时先核对当前事实、相关 Owner/Run 与合同依赖；只有能指出 exact claim 和具体合同影响时才阻断，不能从“未收到授权说明”推导“未授权”。用本 Change 已授权 `.tmp` 材料迁移作为判断反例，但不把历史聊天或 proof 复制进 Skill。
- [x] 6.7 在 product `skills/actions/{explore,propose,revise-propose,review-propose}/SKILL.md` 的各自 canonical bytes 中独立收敛 6.5–6.6 的等价 HOW，并以 targeted Guidance tests/inspection 验证两组路径不互相引用、candidate product Skill 不管理同一 D04；不新增 Registry、Runtime/Policy/Run schema 或新的 top-level Guidance identity。

## 7. 跨模块验收与交付检查点

依赖：前六组全部通过。本组是跨任务验收，不形成 Git checkpoint authority。

- [x] 7.1 用受控真实执行链串起新 Start 内容事实、v2 Full Test、六槽 Architecture、Final 必要证据与两条 Integration 分支；证明完整来源下合法阶段候选变化成功、任何阶段旧/缺失/错来源拒绝、没有隐含下一操作。
- [x] 7.2 在 Linux x64 glibc 上执行完整新材料/locale/symlink/mode/read-denial 矩阵；在 native Windows 执行同一支持语义的材料与真实 read-denial 检查，记录工具/环境/命令/输出，不用 Linux chmod 假定 NTFS 行为，不用 skip/弱化断言替代义务；复用现有平台 fixture，确有限制就报告未完成。
- [x] 7.3 执行 `pnpm typecheck`、`pnpm build`、`pnpm test:domain`、`pnpm test:acceptance`，保留本次真实输出与 exact 输入；同时复核跨文件类型/clone/closed validator 的负例，不能把 Explore 历史反例脚本当新产品 PASS。
- [x] 7.4 执行 `pnpm quality:gate`、`pnpm quality:dependency-health`、`pnpm test:entropy`、`pnpm quality:entropy` 与 `git diff --check`；若 src 文件超过 650 行（含注释/空行）按真实职责拆分后重验，禁止 waiver、移到免检目录或无关重构。
- [x] 7.5 交付中文实现/验证汇总与正常 Apply Run，逐项关联本文件和七个 delta 的证据，并携带影响后续判断的相关 Owner 决定、材料处理/保留边界及当前证据分类；核对旧 Run/archived Change/Memo/既有文件未被意外改写，不复制全部聊天或把历史 Explore proof 记作实现 PASS；交给独立 review-apply 后 STOP，不执行 archive、真实 D04 Full Test 或 Git commit。

## 8. 合同溯源与明确不纳入的后续操作

| 已接受依据 | 计划位置 | 可观测交付 |
| --- | --- | --- |
| Explore 4.1、Review 069 的 reader/v2 要求 | 1、2 | 双 reader、缺席/Memo/locale/error proof、旧 PASS 拒绝 |
| Explore 4.2、Review 069 的 Start 完成要求 | 3 | 完整内容记录、零隐含 Git mutation、stale 拒绝 |
| Explore 4.3、Review 069 的证据覆盖/来源要求 | 4、5.5 | Final 完整前置快照、accepted object 必需 Run 负例 |
| Explore 4.3、最终方案 4.5 的 Git 操作边界 | 5 | 新建/复用分别验收、内容与 acceptance 来源分离 |
| Explore 5、Review 069 的故障强度限制 | 4.5、5.6、7.1 | 当前失败/实际效果/STOP，不声称通用恢复完成 |
| Explore 6、Owner gate 要求 | 6、7 | 七项直接合同一致、650 行 gate、当前验收不后移 |
| Owner 2026-09-07 阶段 HOW 决定、Review 072 的授权/材料核对结论 | 6.5–6.7、7.5 | decision-relevant Owner handoff、三类证据分离、Reviewer 先核对且仅按具体合同影响阻断 |

不将以下内容混入 Apply checkbox：真实 D04 外部 Full Test 证据位置选择与跨会话交接、Delivery Full Test/Architecture Finalization/Final/Integration 操作、archive/spec sync、Git checkpoint，以及下一 Delivery roots/host 接入。它们保留各自未来明确 authority/STOP；其中外部证据保存取回 proof 是下一次真实 Full Test 前的硬前置项，不因本 Change 完成被标为 PASS。当前产品对该读取接缝的完整性/来源测试已在 4.3、5.5、7.1 内，不能以此后续边界省略。
