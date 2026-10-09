# 完整 prepared Author Run 的同阶段续跑：Explore

## 授权与阶段

Owner 明确要求在 flowkit-next 窄修复 prepared Author 的多轮续跑，并在本轮指定“直接使用 OpenSpec explore”。本 Change 使用 managed OpenSpec 1.10.0 原生创建，不建立 Delivery coordination 或 Flowkit Run，也不让 candidate 管理自身。当前只做问题探索与证据捕获；本文件是补充 Explore 材料，不是 spec-driven schema 的 proposal/design/specs/tasks，不宣称规划已完成或取得 Reviewer verdict。

Change：allow-prepared-author-same-stage-continuation。
源码基线：main / 0e0d8106d2cdf632e9aacbc61311cbe6e6d762db。
固定 manager：D:/tools/flowkit-manager/node_modules/flowkit-next，1.0.0，安装来源 flowkit-next-1.0.0-0e0d8106d2cd.tgz。
精确 OpenSpec runtime：C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js。

## 问题与真实输入

LearningPlatform 的 source-resource-preparation-and-package-production 已从 Run 014 的 prepared apply 进入 Run 015 的 prepared revise-apply。Run 015 已完整保存 action.md/context.json/result.json，Author/Reviewer/Verification/next 四个槽均为 null。它是已记录的未终结工作，不是缺失 Result 或已完成 Apply。

固定 manager 只读查询结果：

- status：current / active，currentRun=20261008-015-revise-apply，prepared/author，直接前序为 20261008-014-apply。
- next：ready-action(revise-apply)。这是现有 prepared Action 的阶段展示/复用边界，不意味着可以另建 occurrence。
- action inspect：complete、actualEffect=prepared、remaining=[]、canContinue=false。
- 当前 Result 为 203,879 bytes，声明 337 个 proofRefs；逐一读回 regular/non-linked 文件，bytes/SHA-256 全部匹配，总计 3,083,257 bytes。该检查仅证明引用的字节身份，不证明题目正确、教师接受或 Apply 完成。
- 原三文件在本轮只读探针前后 SHA-256 一致。原项目、旧 Run、Proof、课程材料与导入结果未写入。

完整观测及原件三文件 hash 保存于 evidence/baseline-observation.json。此次 337 refs 是当前实际记录；此前容量问题的 254-file fixture 或 126,881-byte 记录不能替代当前事实。容量修复已安装，本 Change 不再次扩容。

## E01：同 identity prepared correction 被两层拒绝

src/domain/action-lifecycle.ts 的 supersedePreparedAction 要求同 Delivery/Change 的 revise target，同时明确拒绝 sameActionIdentity(current.identity, target)。

src/domain/policy-and-next-boundary.ts 的 isStructurallyEnterable 对 prepared same identity 返回 !corrected：无 correction 可展示当前 Action；有 exact Owner correction 反而不可进入。preparedFactsMatch 已具备 exact current Run/context/result linkage、prepared/author、四槽 null 校验；既有 revise-action authority 核对和 reached-stage matrix 均可复用。

对六个 Author Action × 三个 revise target 的 18 个内存探针：

| 当前 prepared Author | 同阶段 target | 当前 Policy | 当前结构 |
| --- | --- | --- | --- |
| explore | revise-explore | ready-action | 可进入 |
| propose | revise-propose | ready-action | 可进入 |
| apply | revise-apply | ready-action | 可进入 |
| revise-explore | revise-explore | blocked(action-boundary-not-enterable) | null |
| revise-propose | revise-propose | blocked(action-boundary-not-enterable) | null |
| revise-apply | revise-apply | blocked(action-boundary-not-enterable) | null |

已合法的回到更早阶段继续成立，forward skip 仍由 Policy 拒绝。结构函数自身不拥有 reached-stage 或 Owner eligibility，探针中的裸 READY 不构成授权。

这不是仅删掉一个 if 的问题：只放宽结构仍被 Policy 阻断；只发 READY 仍在 start/inspect/finish 重建时失败。

## E02：历史链把 prepared reuse 当作新 occurrence 的授权

src/cli/current-run-chain.ts 的 resolveRunChain 当前先用不带 Owner correction 的 Policy 判断父子 edge。prepared parent 无 correction 时返回自身 actionId；child 恰为同名 revise 时，默认 boundary 已匹配，后续 Owner 检查被跳过。

内存构造一条阶段合法的链，先通过现有带 Owner 的普通 Author → revise prepared supersession，再增加一个同名 revise child。三个 revise 阶段分别用以下 child authority 探测：

| child authority | 当前历史链结果 | 新续跑合同需要 |
| --- | --- | --- |
| 缺失 | 接受为唯一 tip | 拒绝 |
| exact revise-action、同 target、单一匹配 scope | 接受为唯一 tip | 接受，且必须真正验证 correction |
| scope 指向另一 revise | 接受为唯一 tip | 拒绝 |

九个探针全部复现；保存于 evidence/policy-chain-probes.json。这些只是函数输入，没有把合成 Run/Result/Owner fact 写入 .flowkit，也没有用于真实执行、独立 Review 或产品验收。

历史链修复应只在本次新增的 prepared 同名 revise successor 上强制走 exact correction eligibility，不把 normal prepared reuse 的 READY 解释成新 occurrence 权限。现有 tests/unit/domain/current-run-chain.test.ts 还保留普通 prepared explore → explore 的历史读取 fixture；其兼容性应明确保留，不能顺带将所有旧 history 改造成新合同或迁移历史。固定 start 仍不新增普通 apply→apply/propose→propose/explore→explore 入口。

## E03：入口重建与不可变记录必须同步

现有实现已具备所需字段及有界入口，优先复用：

| 消费点 | 已有机制 | 本 Change 必须验证 |
| --- | --- | --- |
| action-commands.ts / prepared-owner-correction-start.ts | exact current、Owner、Policy、结构、编号与写前 current 重核对 | 三个同名 revise 可形成新 descriptor；拒绝不应产生新文件 |
| action-finish.ts | 恢复 descriptor 绑定的 Owner、exact parent、Policy/结构/package/Guidance；三文件 create-once | 新 occurrence 可保存 prepared 或真实 terminal；旧 Result 不可改写 |
| action-inspect.ts | 恢复同一 parent/Owner/Policy/package/Guidance | 新 descriptor 与完整新 tip 可读；保持既有 partial/tip 规则 |
| current-run-chain.ts | direct parent、连续序号、角色、唯一根/唯一后继、closed outcome | 历史中的同名 prepared revise successor 必须经过 Owner correction，而非默认 reuse |
| foundation status/next | 消费当前 canonical tip | 读到最新 occurrence，旧 prepared 不被显示为另一个 current |

action finish 对已经完整的 Run 只接受相同结果的幂等读回，修改结果会触发 duplicate-finish-conflict。保留该规则；不得重新 finish Run 015 为 PASS、删除机器文件、修改旧 parent，或改跑别的阶段绕开。

action inspect 目前按当前 tip 验证，不提供任意历史 Run 的续跑能力。本 Change 需要让新 occurrence 的 inspect 正确，以及旧三文件/Proof 可按原读取机制验证不变；不扩大为历史任意 Run 恢复接口。

## 最小合同方向

1. 仅对 active Change 的 exact current、完整且合法的 prepared Author Run开放；四槽必须为 null。目标是既有 revise-family，按原 reached-stage matrix；新增的 same identity 只涉及 revise-explore/revise-propose/revise-apply。
2. 每次新开始由受信宿主依据真实明确 Owner 输入提交既有 OwnerAuthorityFact：decision=revise-action、same Delivery/Change、scope=[requestedAction]。事实绑定新 package/descriptor/context，finish 与 chain 从记录恢复。不能仅因父 Run 携带 Owner fact，就推断新开始已有授权；既有有效授权可以作为来源，但必须覆盖当前续跑，不能让 CLI 生成权限或另建授权 registry。
3. 新 occurrence 采用既有序号与日期分配，不从聊天硬编码 Run 016；previousRunId 指向写前核实的 exact current tip。若原项目仍为 Run 015 且无其他 occupancy，后续原项目操作再核对 next sequence=16。
4. 旧完整 Run/Result/Proof 保持原字节和 prepared/null。新 descriptor-only occurrence 仍是 incomplete，不能伪称已接纳 current；新三文件成功保存、验证、读回后才报告新 tip。部分失败保留原件与 partial，STOP。
5. 对每条新增同名 prepared revise edge，在 start、finish、inspect、历史读回中使用同一 exact correction 合同，拒绝无授权、错误 scope、stale current、错 parent、竞争 child 和不完整前序。
6. 新 occurrence 可以仍以 prepared/null 如实记录本轮未完成，再由另一次合法显式开始形成下一 occurrence。真实 terminal Author PASS 仍需满足现有候选/材料/检查准入，随后进入独立 Review；旧 PASS 或旧 Review 不代替本轮验收。
7. 保留 prepared/terminal、single-current、create-once、普通 prepare 限制、terminal absorbing、Review/Archive 及所有现有 machine readiness。每次 invocation 只处理一个 Action并 STOP，不自动下一轮。

语义形态：

    R15 revise-apply / prepared / null
      └─ 明确匹配 Owner correction + 新 occurrence
           R16 revise-apply / prepared / null
             └─ 另一合法显式开始
                  R17 revise-apply / terminal / Author PASS
                    └─ 后续明确独立 Review

“一个 Action 多 Runs”指同一 semantic Action identity 的多次真实 occurrence，不能把一个 invocation 变成内部循环，也不能让多份 prepared 记录同时成为 current。

## 最小实施面与 Proposal 输入

优先延伸既有 prepared supersession 与 correction seam；不新增 lifecycle state、Standard Action、Owner decision enum、Run 字段、通用 retry engine 或第二套 resume API。

需修改或澄清的主 capability：

- action-lifecycle：single-current 和 prepared supersession 对同名 revise 的窄例外。
- policy-and-next-boundary：prepared reuse 与经 Owner correction 的新 occurrence 分开；保持 reached-stage 与完整 pair 校验。
- run-result-persistence：同名 prepared revise successor 的 exact Owner edge、唯一 tip、不可变旧记录和 partial 规则。
- stable-action-command-execution：start/finish/inspect/history 一致消费新边。

预计实现点为现有 action-lifecycle、Policy、current-run-chain 及已有入口消费者；不预设每个消费者都必须改代码。Foundation 查询按既有输出形状读回新 tip，不新增接口。测试优先扩展已有 lifecycle/Policy/chain/fixed-CLI fixtures。

特别兼容边界：旧 Run descriptor 绑定 Action Guidance 的 SHA。为让升级后的 manager 仍能 inspect 当前 Run 015，本窄修复应保留其依赖的现有产品 skills/actions Guidance bytes；不得仅为更新 prose 导致 package/Guidance drift。必要解释可放在主 specs 与 onboarding。若后续认为 Guidance 必须改变，应回到 Proposal 明确兼容性，而不加入临时绕过或 history migration。

## 验收与反例

Proposal 应明确以下验证，Apply 再执行，当前不声称已通过：

- 三个 revise 阶段：完整 prepared R1 → exact authorized同名 R2；继续 R2 → R3，验证不是只允许一次。
- 固定 CLI：start 产生 descriptor，独立 inspect；真实 fixture 工作后 finish(prepared)，独立 status/next/inspect，再合法下一轮 finish(terminal PASS)，独立 Review start仅绑定最新 Author。
- 每轮旧三文件和真实 Proof 的 before/after SHA-256一致；当前 337-ref 原项目只作为只读兼容输入，不复制真实业务或靠旧材料伪造新 PASS。
- 缺 Owner、wrong decision/scope/Delivery/Change、陈旧 parent、non-null prepared outcome、Reviewer、Archive、forward skip、普通同名 Author start：拒绝且无新增 Run。
- 无授权及错 scope 的同名 prepared revise 合成历史：改为拒绝；正确授权同名历史可读，旧合法不同 identity correction 仍可读。
- duplicate sequence、fork、partial parent/child、写前 current drift 与重复 finish冲突：保持 fail closed，旧 bytes 不变；原幂等 finish仍有效。
- 若新 Run未完整落盘，查询仍按既有 incomplete 诊断 STOP，不恢复旧 tip 冒充可继续。
- 普通 prepared reuse 查询、现有历史 fixture、terminal FAIL Owner correction、rejected Review correction、安全 failed Archive retry、Git evidence/Proof closure/容量边界保持原行为。
- manager 更新后对原 Run 015 的只读 status/next/inspect及 Guidance binding不回归；实际 Run 016与 B 开发属于原项目的后续边界。

## 不纳入与结论

不修改 LearningPlatform、创建其 Run 016、重做课程导入、实现 Storybook/Hub 审核；不自动执行下一 Action、Review、Archive、Git commit/push 或更新 manager。容量限制不在本 Change；terminal FAIL 和 Archive recovery 已有专门 seam，保持各自边界。

Explore 已收敛：真实输入、两层入口阻断和历史链授权缺口均有源码及只读/内存观测。无须新状态或新字段；可以进入 Propose，将上述窄 prepared 同名 revise continuation 固定为合同和验收任务。此结论是 Author 探索交接，不是独立 Reviewer 批准、实现 PASS 或正式 Flowkit Run。
