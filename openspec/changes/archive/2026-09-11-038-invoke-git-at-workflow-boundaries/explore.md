# Explore：在约定节点调用 Git

## 本轮结论与权限

Owner 已授权激活 `invoke-git-at-workflow-boundaries` 并开展 proof Explore。D05 最后一个 Change，projectOrdinal 为 38；独立 bootstrap Run 为 20260909-054-explore，物理组为 006-invoke-git-at-workflow-boundaries。项目序号来自已赋 ordinal 最大值 37 + 1，不来自物理组或 Run 号。

结论：PASS（有界 Explore 已完成，可交独立 review-explore）。这不是 Proposal 批准、实现完成、产品验收或实际 D05 Full Test PASS。本轮不修改生产代码、测试、Skills 或主规范，不执行当前项目 commit/push/PR/merge。

## 真实用例与已接受边界

Owner 需要 Flowkit 作为流程管理软件：OpenSpec Action 严格，Delivery 轻量，Git 在明确节点调用即可。最后一个 Change 不负责再造 Git、远端接受平台或无人值守工作流。

当前基线为 a0edb690d7208a3b81855e30a31dbc175f060a93；前一 Change 已由 052-review-apply 接受、053-archive 归档并 checkpoint。SHA 只定位此次研究代码，不成为普通项目 Start/安装准入条件。前一 Change 已解决最小 Final record、confirmationRef 与历史 Full Test/证据遍历耦合，本轮保留这些收敛结果。

材料边界遵循 D05 当前 Owner 决策：必要 proof 留 target `.flowkit/artifacts/`，`.tmp` 仅可丢弃 fixture。历史材料的空白诊断不阻断普通 checkpoint，也不为过检查改写历史或逐 Change 添加 attributes。现有 open Memo 不自动纳入本 Change。

## 已核对的事实

- 规划：flowkit-next-delivery-change-plan.md「在约定节点调用 Git」，要求明确操作/范围、已有 Git/远端工具、有限人工交接；不无条件规定额外固定点或 parent/count。
- 当前主规范 repository-integration-and-next-base-continuity 仍规定 create-new 恰好一个普通 commit、bound parent/count=1 和 clean poststate；复用也要求 clean。这是当前正式合同，不在 Explore 中绕过或直接删除。
- `src/domain/delivery-repository-integration-execution.ts` 按当前合同硬编码 parent/count 与全仓 clean；Git callback 前后仍正确核对 Final confirmation。
- `src/internal/delivery-repository-integration-git.ts` 的 clean 查询使用所有 tracked/untracked 状态；普通 Git 读取失败返回 null，没有凭据/网络恢复框架。
- `src/internal/delivery-repository-integration-source.ts` 通过既有可信宿主读取授权/接受来源，核对字段一致性；它不是原生 PR 客户端或自动验证所有 merge 策略的系统。
- `DeliveryCheckpointOperation` 当前只区分 create-new/reuse-existing，不表达本次文件范围或按需提交形状约束。范围应在实际执行宿主明确并核对，不能把 callback 被信任等同于调用示例已证明不夹带文件。
- `src/cli/checkpoint-authorization.ts` 只评估权限；CLI 合同仍只有 status/next/doctor。Git mutation 不应塞进 next，也不需要另造 Action 或 Git Run。
- `skills/delivery/repository-integration/SKILL.md` 当前与旧 parent/count/clean 合同一致，需随本 Change 的批准合同同步；未用它管理 D05 自身。

## Proof 与决定影响

必要证据根：
`.flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/invoke-git-at-workflow-boundaries/proof/20260909-054-explore/`

`probe.mjs` 调用当前生产 Integration，复用现有测试 fixture，实际 Git 操作仅在本仓库 `.tmp/d05-054-git-explore/` 下生成的隔离仓库执行。Final、Owner 和 acceptance source 均为显式合成 fixture，不声称真实独立 Review/Full Test/provider 接受。

| 实验 | 当前真实观察 | 对最小合同的影响 |
| --- | --- | --- |
| clean | 单次 callback 提交并更新 fixture main，terminal | 保留已有正向路径，不重写整个 integration |
| unrelated-untracked | 合同内文件已 commit，因无关 untracked 文件返回 final-commit-rejected，provider 未调用 | 全仓 clean 并不等于提交范围正确；改为本次目标/范围及实际冲突核对 |
| reuse-dirty | exact checkpoint 可读，但无关文件导致拒绝；未新建 commit | 复用不应要求额外提交或清空无关工作 |
| two-commits | callback 产生两个真实提交后被 parent/count 规则拒绝 | 证明限制确实执行；不是当前合同实现 bug。未来只有明确授权匹配时才接受相应提交形状，不能无条件放行多提交 |
| out-of-scope-staged | callback 只 add 指定路径，原有 unrelated 暂存仍被普通 commit 带入，当前返回 terminal | 实际宿主必须在 commit 前核对整个待提交 index 与 Owner 范围；仅限定 git add 参数不足 |
| commit-response-lost | commit 后 callback 抛错；结果 failed，gitEffects 读回真实 HEAD，provider 0 次 | 既有只读失败确认可复用；不自动再次 commit，不宣称无副作用 |
| provider-pending | commit 已形成，provider 的 pending 不被当成功，返回 repository-acceptance-rejected | 当前不会伪造成功，但需交接“已提交，远端步骤未完成”，不强迫机器立即闭合 PR/merge |
| no-authority | package-formation-rejected，0 mutation callbacks，HEAD 不变 | 保留明确权限边界，Review/Final 不产生 Git 权限 |

详细原始结果为 `observations.json` 与 `probe-02/`。8 个断言通过表示当前行为被复现，不表示发现的问题已修复。首次 `probe-01` 因 sandbox spawn EPERM 未执行完毕；未改 probe，获准后重试，原始失败流保留。

补充原生 Git 实验 `native-git-proof.mjs`：

- 在无 Flowkit 开发布局的隔离 target，仅暂存 owned.txt，实际提交未夹带 unrelated.txt；后者仍 untracked 且 bytes 不变。
- 对明确不存在的本地 remote push 得到真实失败；只读 HEAD 未变化、commit 已保留。
- 对另一个已创建的本地 bare remote 执行 push 并 ls-remote，SHA 与实际本地 commit 一致；提交总数仍为 1。不是对不明副作用盲目重试，也没有“记录 SHA → 再 commit”。
- 暂存 unrelated.txt 后，git diff --cached --name-only 能直接发现范围外条目；实验不继续 commit、不擅自 unstage，HEAD 不变。
- 原始逐命令 Buffer、时间、退出码和 hash 在 native-*.stdout.txt / stderr.txt 与 native-git-observations.json；外层命令记录位于 native-git-01/。

这证明既有 Git 命令足以承载有界节点，不证明产品宿主接入已经完成，也不证明真实 GitHub PR、凭据或 merge PASS。

## 最小 Proposal 方向（待独立审查，不是批准合同）

### 1. 沿用已有所有者，不增设管理层

Git 查询/对象核对继续复用现有 helper；动作由已获授权的 Agent/宿主显式调用 Git 或既有远端工具。CLI 仍只读，checkpoint evaluator 仍只评估权限。

区分 Start 后普通 Git 节点、Change checkpoint 与 Delivery repository integration：前两者不需要 Final record；只有本来属于 Integration 的操作消费已确认 Final。普通 commit/push 不为满足 Integration package 被强行捆绑 PR/merge，不重新验证 Full Test 日志。

### 2. 用本次授权范围替代全仓 clean

宿主必须明确 target repository、操作、分支/远端/ref、提交路径或明确复用对象，并从真实 Owner 输入取得权限。不把猜测或发现的全部 dirty 文件自动升级为授权范围。

提交前核对实际 index；存在范围外暂存内容时，不夹带、不擅自清空，报告具体文件并交 Owner 选择范围/处理方式。无关未暂存/未跟踪文件保留，不是统一 blocker。真实冲突、目标漂移、覆盖风险和必要 Git 来源仍需检查。检查比例限于本次操作，不恢复全仓产品摘要或历史 proof 扫描。

不用 Git 空白诊断充当统一 gate；源码验收仍由适用质量检查提供，不因 Git 放行宣称代码 PASS。

### 3. 提交形状按 Owner 指定，不产生隐含权限

移除默认“恰好一个普通 commit / 固定 parent/count / 全仓 clean”要求。新建须有实际提交结果，复用须是授权的可读 exact 对象；没有真实 commit 的 callback success 仍不能成功。

Owner 明确要求单个普通提交、non-squash merge 或其他既有工具支持的形状时，宿主按该具体操作核对；未授权的 squash/rebase/多提交仍不能凭“放宽规则”执行。具体最小参数表达及直接类型/ref/validator 消费者由 Propose 固定，不新增通用策略 DSL 或 Provider Registry。

### 4. 真实结果读回与失败交接

成功必须有本次实际对象/目标接受来源，不能只靠 callback status、PR id 或任意相同内容 SHA。复用现有授权/接受来源能力，不用另一个自签结果库替换真实来源。

commit、publication、PR/merge 可能分段完成；结果应明确已确认步骤、已有 commit/分支/远端事实、未完成步骤与不可确认部分。失败后只做可用的只读确认，再 STOP；不自动 commit/PR/merge 重试、回滚、rebase 或撤销已完成 Final。不从响应失败推断 Git 未发生，也不从 local target ref 推断真实远端已接受。

采用已有工具/人工交接完成 PR/merge；不承诺所有 provider/凭据/merge 策略原生支持。新的后续调用先核对已发生效果、现有操作与权限，不能拿旧 partial 结果冒充完成。

### 5. 必要同步范围

核心候选范围为 integration execution / operation / source / Git helper、直接 record/ref/validator 消费者、对应 focused tests 和现有 Git/Delivery HOW。checkpoint/只读 CLI 只在直接合同确需时补说明或接入验证，不新增 Git 写命令。

规范至少核对 repository-integration-and-next-base-continuity；如果已批准 facts/record 形状变化，同步 delivery-operation-execution-and-start-continuity 的相关条款。foundation-cli-surface 的只读与权限评估边界保留。其他前五个 Change 合同不重做。

验收需要当前实现的新证据：无权限无写入、无关 dirty 保留、范围外 staged 不夹带、新建/复用、按明确形状核对、真实 target 读回、部分成功/响应丢失后不盲重试、CLI 不写 Git，以及分离 manager/target 的实际宿主调用示例。可复用本次实验场景但不得复用 Explore PASS 代替实现验收。

## 收敛、限制与 STOP

已解决的关键未知：无条件 clean/parent/count 的具体落点，范围缺口归属实际宿主，既有 Git 足以有界执行，失败读回能力可以复用。没有必要因此建立统一 Git 平台、原生全 provider、自动执行循环或新的 lifecycle/schema。

仍未验证：Linux 下本轮新增 probe、真实网络/凭据/PR/merge、本 Change 新实现和最终 D05 Full Test。本轮 Windows 原生 Git fixture 证据只覆盖列明场景，不扩写为全平台验收。公开发行、迁移已有其他项目历史、自动安装/升级、绘图以及证据清理都不属于本 Change。

Explore 到此收敛。下一步为独立 review-explore；通过后才可按授权进入 Propose。本轮不自动审查、不生成 proposal/design/tasks/delta specs，不提交 Git。
