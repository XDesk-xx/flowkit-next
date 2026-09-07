# Review Apply 076 — 内容连续性实现审查

Owner 请求：`根据最新 run，review-apply`。目标为 `20260907-075-apply`，批准计划为 `20260907-074-review-propose`；Change `correct-delivery-content-continuity`，`projectOrdinal: 32`。

结论：`changes-requested`。发现 7 项已批准合同内的实现缺口（4 项 P1、3 项 P2），交回 `revise-apply`；本轮不修代码、不重做 Proposal、不归档、不操作项目 Git。

## 输入、独立性与范围

使用独立 `.agents/skills/review-apply/SKILL.md`，以 debugging-and-error-recovery 的实际反例和 security-and-hardening 的授权/回调信任边界方法核验。未以 candidate Review Apply Guidance 自证、未调用 candidate CLI 管理 D04。外部 `flowkit` 不可用；本 Run 明确是独立 bootstrap Reviewer 事实，不冒充 canonical Runtime admission。

075 的 11 项 artifact hash 全部匹配；074 批准的 proposal/design、原七份 delta specs 未变，tasks 仅由未勾选改为已勾选。当前 candidate 和全部受保护文件的精确绑定见 context，不以 HEAD 替代 dirty worktree bytes。

Owner 已明确授权原始 Explore proof 移到 `.tmp` 且不长期保留；本轮不重开已撤回 finding、不要求恢复旧材料，不将历史 proof 当当前实现 PASS。八项阶段 HOW 修改符合该授权，bootstrap/product 各自在自己的 bytes 中收敛，没有扩展 Runtime/Policy/Registry。

## 阻断 findings

### D04-RA007-001 [P1] Start 回调可改写随后使用的 checkpoint authority

位置：`src/domain/delivery-start-execution.ts:244`；关联 `src/domain/delivery-start-execution.ts:263`、`tests/unit/domain/delivery-start-execution.test.ts:229`。

事实：executeSurface 收到内部原 package；回调向其 scope 追加 single-delivery-start-fixed-point-commit 后，原始 Owner 输入仍仅 delivery-start，commit callback 却真实被调用 1 次。反例回调未实际提交，随后仅因返回无效 SHA 失败；事后失败不能撤销已经发生的越权调用。

合同影响：Agent 输出能改变 Git mutation permission，违背独立 Owner authority 与 defensive isolation。 依据：design D3；tasks 3.3。

最小修正：保留独立不可变的授权/package 基准，回调只接收 defensive copy；mutation 前重验原授权和 exact prestate。补零未授权 commit 调用及嵌套 package mutation 负例，移除共享对象身份的错误测试断言。

### D04-RA007-002 [P1] Start 的 validation 仍是未经核验的自填引用

位置：`src/internal/delivery-start-content.ts:142`。

事实：仅检查 validation 字段形状并原样复制 sourceRef/artifact hash/bytes。四槽均为 {}、validation/nonexistent.json 不存在且未执行工具校验的隔离 fixture 仍返回 terminal；没有把真实校验源与 project/Delivery/base/planning/四槽输出绑定。

合同影响：contentCompletion 可以把未校验的输出报告为已验证内容完成。 依据：Start delta: Delivery Start 在内容完成边界返回可核验记录；design D3；tasks 3.1。

最小修正：实现已批准的窄可信 validation 读取/核验接缝，由 host 取回并核对本次完整真实检查与输入输出；拒绝未知/缺失/错绑定来源及自签引用，不新增证据平台。

### D04-RA007-003 [P1] Final 必要证据读取未验证 accepted execution 来源与完整 outcome

位置：`src/internal/delivery-required-evidence-source.ts:125`；关联 `src/internal/delivery-required-evidence-source.ts:236`、`src/domain/delivery-final-execution.ts:280`。

事实：archive 只要求 authorConclusion 非 null；Full Test/Architecture 材料只做非空 bytes 的 hash。隔离反例把 archive 改为 FAIL，并把两份 source bytes 换成与实际 outcome 无关文本，derive 仍成功；进一步使用既有受控 fixture 的执行 outcomes 调用实际 invokeDeliveryFinalOperation，也返回 terminal。Run 材料由 fixture 手工构造且未持久化，没有真实 admission 来源。当前遍历仅依赖 caller 给出的 previousRunId/null，未建立合同要求的可信 anchors/链终点。

合同影响：来源缺失、失败 archive 或无关外部材料可被绑定成完整 Final requiredEvidence；内容 hash 自洽被错误提升为 accepted execution 证明。 依据：Final delta: requiredEvidence 是有限完整性快照；design D4；tasks 4.2；tasks 4.3；tasks 7.1。

最小修正：从既有可信 owner 取得并验证 accepted archive/review anchors、实际 admission 和必要完整性链；核对完整 Full Test/Architecture 原 outcome 与实际 source bytes 的绑定。以真实执行并持久化的 canonical Run、完整输出及失败/缩减/错来源反例验收，勿只增强任意字符串/JSON shape。

### D04-RA007-004 [P1] Integration 缺少独立 Owner 操作与 repository acceptance 来源绑定

位置：`src/domain/delivery-repository-integration-execution.ts:238`；关联 `src/domain/delivery-repository-integration-execution.ts:523`。

事实：preparation 直接采用 caller 的 checkpointOperation，同一 Owner fact 下 create-new 与 caller 改为 reuse-existing 均可形成 package；没有独立读取 Owner 原始操作或 checkpoint 已授权来源。acceptance 后只查 target 产品投影/requiredEvidence，隔离 provider 把 main 指向同 tree 的无 parent 新根 commit，仅返回 repository-acceptance-complete、未提供独立 acceptance 来源，也得到 terminal。

合同影响：内容等价可以掩盖未证明获授权的 checkpoint 选择及 target 历史替换；本 finding 不要求恢复通用 ancestry gate。 依据：Integration delta: explicit checkpointOperation and accepted object continuity；design D6；tasks 5.1；tasks 5.3；tasks 5.4。

最小修正：按已批准窄 host 接缝，从独立 Owner 输入绑定操作、target/prestate 及 reuse checkpoint 来源；由可信 acceptance 来源核验本次操作与原 target 的关系，再做内容/必要证据验收。明确授权的不同历史仍可合法通过，不能将 provider success/opaque sourceRef 当授权。

### D04-RA007-005 [P2] create-new 未核验唯一普通 parent

位置：`src/domain/delivery-repository-integration-execution.ts:480`；关联 `src/domain/delivery-start-execution.ts:291`。

事实：只查 first parent 和 rev-list count=1。隔离 fixture 创建 parents=[preIntegrationHead,已在其历史内的 acceptedBase] 的双 parent commit，count 仍为 1，Integration 返回 terminal；Start 使用同样不足的 parent/count 条件。

合同影响：要求一个普通单 parent commit 的操作接受了 merge commit。 依据：Integration delta: Integration 按明确操作创建或复用 checkpoint；design D3/D6；tasks 3.3；tasks 5.2。

最小修正：从 Git 读取完整 parent 列表并要求恰好一个且等于 bound prestate；Start/Integration 同步补已可达第二 parent 的真实 Git 反例。

### D04-RA007-006 [P2] Final requiredEvidence 未进入固定字段投影

位置：`src/domain/delivery-final-execution.ts:386`；关联 `src/internal/delivery-required-evidence.ts:181`。

事实：hashMaterial 直接嵌入原 requiredEvidence，clone 也是 JSON parse/stringify。只反转 requiredEvidence 对象属性插入顺序、所有值和有序数组不变，两个合法 package 派生出不同非 null Final refs。

合同影响：同一事实经反序列化/重建属性后改变 closure 身份或 admission 结果，违反固定语义投影。 依据：Final delta: fixed Final projection and requiredEvidence shape/order；design D4/D5；tasks 4.4。

最小修正：逐层按合同明确构造 requiredEvidence/closure/run/artifact 的固定投影，clone、derive、revalidation/admission 一致；补完整嵌套 property reorder golden test，不改 ordered arrays。

### D04-RA007-007 [P2] reuse-existing 仍要求无用 commit callback，Guidance 保留强制新建指令

位置：`src/domain/delivery-repository-integration-execution.ts:418`；关联 `skills/delivery/repository-integration/SKILL.md:11`。

事实：顶层无条件要求 typeof commitFinal===function。相同 clean/exact reuse fixture 不传 callback 即 package-formation-rejected，只补一个永不执行的 callback 即 terminal。Guidance 新段允许 reuse，但原第 11 行仍无条件要求 Create exactly one ordinary Delivery Final commit。

合同影响：合法复用路径被迫提供不需要的 Git 能力，且执行 HOW 与已移除的 mandatory-new-commit 语义未收敛。 依据：design D6: 复用分支不要求新建 callback；tasks 5.3；tasks 6.2；tasks 6.4。

最小修正：只在 create-new 分支要求 commit callback，reuse 可不提供且保证零调用；将无条件新建 Guidance 改为与两个 variants 一致的当前说明，并补对应负例/一致性测试。

## 实际验证与限制

独立执行：Node 22.23.2、pnpm 11.22.0；typecheck、format、diff check 通过；native Windows domain 257/257、acceptance 5/5、零 skip。domain 首次因沙箱 spawn EPERM 无法执行，在沙箱外原命令重跑通过。exact managed OpenSpec 1.10.0 当前 Change strict 通过，仅证明结构。

独立反例命令为 `node --import tsx .tmp/review-apply-076-proof.mjs`，最终脚本 exit 0 表示 10 个反例观察断言均成立，不表示产品验收 PASS。决定性输入/观察已落在上述 findings 与 context；临时脚本/隔离 fixtures 不建立新永久 proof 义务。所有 Git 写操作仅发生于新建隔离测试仓库，项目 HEAD/index 未修改。Final 反例复用既有受控工具 fixture，不声称实际 OpenSpec/Archify 或当前 D04 Full Test 成功。

本轮未重跑 Linux、build、dependency/entropy 全门禁；075 的相关结论保留为 Author 报告，不冒充本轮独立 PASS。现有测试通过与上述反例并存，因而不能支持 35/35 tasks 全部满足的结论；Reviewer 未修改 tasks。

## 本步、最小性与交接

本步是实现对已批准合同的独立验收。整体 helper 拆分及阶段 HOW 增量属计划内，`scope drift: NONE`；关键问题不是需要更多架构，而是既定防御隔离、可信来源、固定投影及 Git variants 的实现/验收缺失。

要求 Author 在同一 Change 内按以上 exact findings 最小修正并补真实正反例，再交独立 review-apply。当前没有发现必须返回 Proposal 的合同缺陷。此交接不产生新的 Owner/Git authority，不执行下一 Action。

STOP。
