# Explore：Delivery 内容连续性修正

## 1. 当前授权与结论

日期：2026-09-07；Role：Author；Delivery：`20260902-04-delivery-continuity-stable-core-closure`。

Owner 明确输入：`flowkit-architecture-decoupling-final-plan.md owner 授权 激活 修复 change，并进入 proof explore`。

本次激活 `correct-delivery-content-continuity`，`projectOrdinal: 32`。序号取所有 Delivery coordination 中已持久化、有效且唯一的 21–31 的最大值加一，不从目录、Run 或 archive 数量推算。该 Change 是 D04 第七个执行分组，语义身份不依赖 `007`。

Author Explore 结论：**PASS，问题与最小修正边界已具备提交 review-explore 的证据；不是 Reviewer approved，不是实现验收 PASS。** 下一个边界为 `review-explore`，本轮 STOP。

本次只进行激活、事实核对、隔离实验和 Explore 记录；没有生成 Proposal/design/tasks/delta specs，没有修改生产源码或正式测试，没有执行 D04 Full Test、Architecture Finalization、Delivery Final 或项目 Git mutation。

## 2. 输入事实与问题

- 源码基线：`b0b2d918c41212fe80e1ad5e58bc14dcd7217c1d`；branch：`delivery/20260902-04-delivery-continuity-stable-core-closure`。
- [最终方案](../../../flowkit-architecture-decoupling-final-plan.md) SHA-256：`0f84a89c7be69d7d55dd13ec46c1ac5505e4ef25ecf77e2156f452a569274541`。文档本身不是 authority；上面的本次 Owner 输入授权激活与 Explore。
- 前一已保留 Run 是 Change 006 的 `20260907-067-archive`；六个既有 Change 均 completed。本 Change active；Delivery 仍 `active / pending / pending`。
- 已删除的 `20260907-068-delivery-full-test` 不存在，不恢复、不作为 PASS/续接依据。新的 `20260907-068-explore` 记录本次真实 Explore，不是 Full Test Run。
- D04 使用独立 `.agents/skills` bootstrap HOW；没有调用外部 Stable manager，也没有用 candidate CLI/DeliveryOperationPackage 管理同一 D04。仅使用 `FLOWKIT_HOME/tools/openspec/1.10.0` 的 OpenSpec scaffold/observation/validation。
- Node `22.23.2`、repository pnpm `11.22.0`，managed OpenSpec `1.10.0`、Archify `2.15.0`。Linux proof 使用本地既有 `node:22.23.2` 镜像，network none、repository readonly，不共享 Windows node_modules。
- 现存根目录方案文档、下一 Delivery 规划、non-ignored bundle 原样保留；它们仍是 candidate 材料。本轮新增 Explore/proof 文档同样没有特殊排除。

真实问题不是“HEAD 每变一次 candidate 就变”：旧 reader 已对同内容空 commit 保持相同 candidate。实际耦合在于 Memo 和删除暂存状态进入材料、locale 排序、Start 缺少不依赖专属 commit 的可核验完成事实，以及 Integration 以通用历史形状/完整 tree 代替内容连续性。

## 3. 决策级 proof

可复核脚本：[material model](proof/continuity-proof-model.mjs)、[probe](proof/continuity-proof.mjs)；真实命令、原始输出、exit code 和限制：[execution.json](proof/execution.json)。脚本只在自建临时 Git repository 内写 fixture/commit，结束清理；不是产品实现。需在记录的源码基线、repository root 运行；未来修正后旧行为反例断言应失效，不能将它们接入永久成功测试清单。

| 风险 / 问题 | 本轮证据 | 决策影响与证明边界 |
| --- | --- | --- |
| Memo 是否污染产品材料 | Windows/Linux：写入 exact Memo 文件改变旧 candidate，原型不变；同名目录被原型拒绝 | 只隔离 exact 文件内容；fixture 不证明 Memo schema 合法，schema 继续归 Memo reader |
| 删除的暂存状态是否产生伪差异 | Windows/Linux：删除后未暂存与暂存的旧 candidate 不同；新原型在未暂存、暂存、commit 三点相同 | 确认缺席不生成 record；不能用过滤所有错误实现缺席 |
| object reader 能否复用同一材料模型 | Windows/Linux：binary、尾部空白/CRLF 原 bytes 与 object projection 相同；Linux 另含 symlink | 支持二进制 reader 可行；未证明全部 mode/filter/race 组合，Windows symlink 未测 |
| 会不会漏掉真实产品差异 | non-ignored untracked 文件和 binary 追加空格均使 worktree 与 object 不同 | 不排除未提交产品材料、不 trim blob、不做文本归一化 |
| Git SHA 是不是产品身份 | 两平台空 commit 前后旧/新 candidate 均不变 | 保留 exact locator 和授权；无需新建“去 HEAD hash”机制 |
| 默认 locale 是否影响材料摘要 | Linux 两个独立 Node 默认 locale，旧 candidate 不同，新原型相同；含非 BMP 路径 | 无序集合共享 UTF-8 byte comparator；不能仅用 JS 默认 UTF-16 sort |
| 新旧算法能否误共享 check 身份 | 同一简单 ASCII check 输入仅换 domain 即得到不同 checkRef，argv 调换仍改变新 checkRef | 冻结 v2 domains；这是摘要原型 proof，旧 PASS 的真实拒绝还须实现测试 |
| 排除 Runs 后是否仍能证明 acceptance | 删除已固定为必需的 fixture Run 文件并 commit，产品 projection 相同，exact object 存在性检查拒绝 | 内容相同不足够；必须绑定完整必需证据集合。当前只是 text fixture，不是完整可信 Run admission |
| Start 没有 Git authority 时实际怎样 | 既有 focused test：successful validation 后 `stopped-before-commit`，无 Git mutation | 补内容完成证明，不能把这个状态换名充当完成 |
| Integration 是否强制一种提交形状 | 既有 focused test：zero/multiple/candidate-changing final commits 均拒绝 | 按具体 Owner 操作分别约束；复用 exact checkpoint 不应再要求新 commit |
| 写失败是否一定意味着无副作用 | 既有 Final staging/replace/readback 注入测试 PASS；readback 失败可能已经写成 completed | terminal verdict 与实际 effects 分开；不能盲重试 |

Focused 命令共 3 个顶层测试、含子测试共 **6 PASS / 0 FAIL / 0 SKIP**。OpenSpec canonical `validate --specs --strict` 为 **22 PASS / 0 FAIL**，只证明既有 spec 结构，不证明新 Change 完整或新合同语义正确。

Linux locale 的决定性摘要：旧 en-US 为 `9bb15e24a344604395d07ef2567d46b8125afea9a4be727d26ed02ec27237b51`，旧 sv-SE 为 `687a5d98cb6cfff17944e745c4e9039efbf067a692f9e8ba850e02f6fe0d7ac3`；新原型两者同为 `fa07140b98dd560818b4a03557905bbca3c20752508a3a058f79dfd8381b5c76`。三者均省略同一个 `candidate:sha256:` 前缀。Windows/Linux fixture 材料集合因 Linux symlink 不同，不能直接比较两平台整包 hash。

最初 native probe 在沙箱内 `spawnSync git EPERM`；原脚本不改、在获准的沙箱外重跑成功。它是执行环境限制，不是产品缺陷或跳过 Windows 的理由。持久化后的同一 probe 在两平台再次 exit 0；输出中的 required.txt missing 是预期负例。

## 4. 最小修正方向与既有 owner

### 4.1 共享材料合同，不建第二身份系统

沿用 applicable-check 内部接缝：worktree 与 exact object 两个 reader 产生同一种 record，复用排序、JSON 序列化和摘要。

- 保留 tracked + non-ignored untracked 语义、原始可解码 UTF-8 path、mode、kind、实际 bytes；支持 `100644 / 100755 / 120000`，symlink 读取 target bytes，不解引用。
- exact commit 固定后使用 NUL 路径枚举和 Buffer blob；不复用 `.trim()` 的文本 Git helper。只支持 SHA-1 Git，相关 validator 一致拒绝其他格式，不能接受任意 40–64 位 OID。
- 缺席与读取失败分开；`EACCES`、`EPERM`、unmerged、异常 mode、无法确认的 read race 必须 fail closed。原型过滤旧 `tracked-missing` 只证明算法关系，不是充分实现。
- 在既有 `.flowkit/runs/**` 排除之外，仅隔离 `.flowkit/memos.json` 内容；路径/type 校验保留，Memo schema 归其 reader。`.flowkit/project.json`、其他文件及根目录文档不得顺带排除。
- 实际消费 Memo 或 Git 历史的 check 绑定对应实际材料；缺失不等同于合法空 bytes。Memo-only 可保持产品 candidate，而 Git clean 和 Memo-consuming check 仍独立变化。
- 无序 paths/refs 和 Action check 派生/admission 使用同一个窄 UTF-8 byte comparator；不做 case folding 或 Unicode normalization。不声称 ASCII checkId 已被证明存在 locale 漂移。Full Test 显式 check 顺序及 argv 保留。
- 固定 `flowkit-applicable-check-candidate-v2`、`flowkit-applicable-check-v2`，沿用 NUL + JSON 与 ref 外形；不引入算法 Registry/选择器。旧 PASS 不迁移、不重新签成功，历史 bytes 不重写。

### 4.2 Start 完成事实仍由 Start 承担

当前 `delivery-start-execution.ts` 的 surface 只返回 `validated`，不是实际 outputs 与验证来源的可核验记录。最小方向是补齐 exact accepted base、planning 输入、实际输出材料及真实验证 provenance，让内容完成无需强制再制造专属 Start commit。

保留 clean-start、exact base observation、mutation 前 package 重验。新的合法 preparation 可以重新绑定经验证的 accepted object；同一个 package 不能用内容相同掩盖 HEAD 漂移。Git checkpoint 是另一个明确授权要求，不由内容完成产生。后续 Change 消费被验证的 Start 输出，不消费虚构 SHA。

### 4.3 Integration 必须同时收敛必要证据的直接前置合同

源码缺口：当前 Integration preparation 仅接收 `deliveryFinalOutcome` 等输入；Final 从 coordination 取得 completed required Change IDs，却不携带这些 Change 的可信 archive/review 记录集合。`trustedFinalOutcome` 的自洽 hash 与 full tree equality 不能替代“记录由谁、针对何输入真实产生”。因此**只增加 object projection 比较或让 caller 传可裁剪 refs 都不够**。

最小边界落在既有 Final prerequisite/record 与 Integration consumer：从 canonical required Change identities、绑定的 archive/review、Verification、Architecture、Final 前置事实及既有完整性链接确定必须覆盖的证据，再交给 Integration 重验。覆盖不能由 caller 随意缩小；缺少可验证来源则拒绝。精确字段在 Proposal 冻结，不在 Explore 发明新 schema。

已有 durable Run reader（`run-result-persistence.ts` 的 `readDurableRun`）可承担其原本的地址/结构/Result 完整性检查；可信执行来源仍来自既有授权执行与 admission owner，hash 本身不是来源。D04 的 bootstrap 自定义 Run 格式不能自动当作该 reader 的 canonical Run 输入；不迁移历史，也不把未来 host 的 durable outcome 平台提前搬入本 Change。

Integration 分别验收：exact accepted object 的共享产品 projection、Owner 明确指定的具体 Git 操作和 prestate、必要证据可取得且完整且来源正确。普通新 commit 操作保留该操作的形状约束；已获授权的 exact checkpoint 复用不强制重复 commit。不能用内容相等自动放行 squash/rebase/merge，也不能丢弃 accepted-base provenance。

必要反例：产品相同，但必需 Run/Result 缺失、损坏、错误 project/Delivery 或 caller 缩小集合，整体 acceptance 拒绝；无关历史追加可接受。外部证据若被使用，需真实保存/取回及来源核验，不能只给 hash。保留 `verified → architecture-materialized → finalized` 的真实内容 lineage，不要求三个阶段 candidateRef 相等。accepted-main SHA 仍是 next-base locator，Stable manager checkpoint 身份另行保持。

## 5. 四个失败窗口与 D04 闭合约束

| 窗口 | 当前证据强度 | 对本 Change / D04 的影响 |
| --- | --- | --- |
| final commit 成功、acceptance callback 失败 | 源码顺序确认，未注入该完整窗口 | checkpoint 复用合同必须容纳已发生效果；重接入要重验实际 commit/原授权，不自动再 commit |
| target 已接受、响应丢失 | callback 边界静态风险，未证明恢复 | 只读观察 ref/content 和 acceptance 来源；来源未知则 STOP，不自动 push/merge |
| Architecture 部分输出写成 | 六个输出顺序写入的源码事实，未注入该窗口 | 保留原已验证输入/预期 outputs；不能将任意已有文件或旧 candidate 当作成功；真实故障出现时单独判定修复权限 |
| Final rename 成功、readback 失败 | 本轮运行既有注入测试确认 | 已写成不等于返回成功；应依据保留原 package/实际 bytes/closure facts 核验，不按 active/pending 前置条件盲写 |

这四项不是“恢复已实现”。Owner 最终方案将可信 host 的保存与单次接续接入留给下一 Delivery。本轮已确认风险存在，但未发现必须在当前 Explore 引入通用恢复平台的证据。D04 实际闭合仍由独立 bootstrap 执行；发生上述窗口就 STOP、保存实际效果、只读核对，不能拿本表授权自动恢复。真实阻塞不能一律推给下一 Delivery。

在下一次真实 Full Test **之前**，独立 bootstrap/Verification 必须与 Owner 明确仓库外 durable evidence 位置、保存/取回方式和来源证明，并完成有限跨会话/接收端 handoff proof。该位置与 proof 当前 **UNKNOWN / 尚未建立**；它是后续 Full Test 的硬前置项，不是本次激活所需已存在的 PASS。本轮没有 Full Test authority，也没有建立新 Evidence Registry 或临时恢复已删除的 Run。

不得先写 `fullTestStatus: passed`；当前 Final prestate 明确要求 `active / pending / pending`，由 Final writer 完成合法转换。若独立 handoff proof 发现产品必经合同阻碍，报告最小修正与所需 Owner 决定，不能从聊天恢复验证。

## 6. Proposal 边界与剩余验收

同一个 Change 覆盖材料 reader/hash、Start、Full Test reuse、Architecture/Final lineage、Integration acceptance 及直接 canonical specs/Guidance/tests。现行 canonical specs 与 Delivery 中旧 fixed-point wording 是已接受的旧合同，不在 Explore 擅自改写；Proposal 必须明确其 prospective correction，Apply/后续同步时保持一致，archived Change 与旧 Run 原样保留。

直接事实入口：`src/internal/applicable-check-candidate.ts`、`applicable-check-identity.ts`、`src/domain/applicable-check-execution.ts`、`delivery-start-execution.ts`、`delivery-full-test-execution.ts`、`delivery-final-execution.ts`、`delivery-repository-integration-execution.ts`、`src/internal/delivery-final-coordination.ts`、`delivery-architecture-finalization-artifacts.ts`、`delivery-repository-integration-git.ts`、`src/domain/run-result-persistence.ts`。对应 canonical specs 为 `applicable-check-execution`、`cross-delivery-memo`、`delivery-operation-execution-and-start-continuity`、`formal-full-test-execution-and-correction`、`architecture-and-canonical-diagram-continuity`、`delivery-finalization`、`repository-integration-and-next-base-continuity`。

后续实现验收必须补齐：新 reader 的真实 unreadable/unmerged/unsupported mode/read-race 拒绝；Memo-consuming check；同序简单 candidate 的 domain 切换与旧 PASS 拒绝；mode/filter/ignore/symlink 变化；Start 完成来源与 stale package；已授权 checkpoint 复用；必要 Run 损坏/遗漏/来源/覆盖；完整 lineage。它们本轮不是 PASS，也不能在 tasks 写成 archive 后再验收。

现有 `src/**/*.ts` max-lines gate 为 650，包含注释/空行；Implementation 时若超过就按材料读取、排序/hash、操作前置/结果核验等真实职责拆分窄内部文件，禁止 waiver、挪去无 gate 路径或堆泛化框架。当前只保留拆分后的两个小型 proof 文件，没有更改 gate。

不包含：manager assets/target/FLOWKIT_HOME roots 重布线、trusted host 跨会话接入实现、D05 创建、SHA-256 Git/submodule 扩展、Evidence/Skill/Tool/Gate Registry、自动 loop/next/Git、WAL 或恢复平台。不把 OpenSpec/Archify/architecture 变成 optional，不增加 skip，不把整个 `.flowkit/` 隔离。

Explore 问题级 proof 已收敛；剩余实现验收与后续 Verification handoff 边界已明确。提交独立 Reviewer 审查后 STOP；本文件不形成 Proposal approved、任何 Git authority 或 Delivery completed。
