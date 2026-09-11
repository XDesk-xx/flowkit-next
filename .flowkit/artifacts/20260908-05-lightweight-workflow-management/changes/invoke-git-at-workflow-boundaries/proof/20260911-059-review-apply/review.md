# 059 review-apply — invoke-git-at-workflow-boundaries

结论：changes-requested。被审对象为 20260911-058-apply，对照 056 Proposal / 057 approved。独立复现 2 个 P1 授权操作范围问题和 1 个 P2 交接缺口；均属于已批准合同内的实现修正，不是 Proposal blocker，也不要求新建 Change。

## Findings

### D05-RA038-001 / P1：限定分支的 push 仍会隐式发布未授权 tag

位置：src/domain/git-workflow-host.ts:232–244（runPush 的实际命令与读回）。

Owner fixture 仅授权 localCommit → origin/refs/heads/main。仓库已有 annotated tag，且本地 push.followTags=true；runPush 使用 push --no-force 和显式 refspec，却没有抑制该配置。真实本地 bare remote 从空 refs 变为 refs/heads/main + refs/tags/not-authorized，宿主仍返回 completed / confirmed。它只读回目标分支，因此看不到已发生的范围外发布。

合同影响：违背“具体操作/remote/ref 与权限绑定”和 design §2 单目标普通 push；显式 refspec 本身不能证明只写了该 ref。相关任务 3.2/3.3、5.2 尚未完整验收。

最小修正：在受支持薄 push 路径中显式约束会扩大本次发布范围的 Git 行为，至少排除 followTags 的隐式 tag 推送；不得改用户持久配置、自动删除远端 tag 或建立 provider 平台。加入本地 bare 回归：同一配置下请求分支正确发布、未授权 tag 不出现、源配置/无关 index 不变。保留非强制与真实读回。

证据 case：push-follow-tags-expands-ref-scope。

### D05-RA038-002 / P1：普通 checkpoint 会继续完成未获本次授权的 pending merge

位置：src/internal/git-checkpoint-execution.ts:90–124（写前检查至 commit），以及 git-checkpoint-scope.ts 的 Git 状态/对象检查。

真实 fixture 已执行无冲突的 merge --no-commit，MERGE_HEAD 存在；index 只涉及本次授权 a.txt。请求仅是普通 create-new checkpoint、commitShape=null，没有 merge 操作授权。现实现只看 HEAD/branch/index/文件范围，随后普通 git commit 消耗 MERGE_HEAD，形成两个 parent 的 merge commit，返回 completed，MERGE_HEAD 已消失。

合同影响：design §3 明确薄宿主默认一次普通 commit，null 只取消额外形状门槛、不授权其他操作。文件范围正确不等于 Git 操作正确；“没有未合并条目”也不等于没有待续 merge。相关任务 2.2/3.2/5.2 缺少这一前置状态覆盖。

最小修正：普通宿主写前识别会改变本次操作含义的待续 Git 状态；未获本次明确授权的 pending merge 应在 add/commit 前停止并交接，不替用户继续/取消 merge。增加该 fixture 的零写入回归，保持 HEAD/index/MERGE_HEAD；不要恢复全仓 clean 或给所有 Integration callback 重新施加固定 parent/count。

证据 case：ordinary-checkpoint-completes-pending-merge。

### D05-RA038-003 / P2：复用对象已经核验，acceptance 前失败却丢失 checkpoint

位置：src/domain/delivery-repository-integration-execution.ts:462–494；src/domain/git-workflow-integration-host.ts:92–101。

reuse-existing 已从 Git 核验 exact checkpoint。前两次来源核对正常，第三次即 acceptance 前授权来源不可用；正确地未调用 acceptance，但复用路径尚未设置 mutation，failure 没有携带已知对象，薄宿主的 checkpoint 变量又仅在新建 callback 中赋值。实际 HEAD 仍为已核验 checkpoint，outcome 却返回 phase=preflight、checkpointCommit=null 和笼统 preparation 提醒。

合同影响：design §5 / Git partial effects requirement 要求区分已确认对象与未完成步骤；失去后续权限不应抹掉已有观察，也不能冒充此前完全未进入此阶段。相关任务 2.4/3.4 的 pending 正向用例没有覆盖 provider 调用前的失败。

最小修正：保留已核验对象与实际失败阶段，独立于“本次是否执行过 mutation”以及 callback 是否进入；复用后来源/Final/prestate 重验失败仍交接 known checkpoint 和准确 remaining。保持拒绝继续执行，不把保留对象当作权限或 acceptance 成功。补同一失败点回归；不新增结果库或生命周期状态。

证据 case：reused-checkpoint-lost-before-acceptance。

## 审查与证据边界

- 当前链为 054 Explore → 055 approved → 056 Proposal → 057 approved → 058 Apply；ordinal 38 active，D05 Full Test/Final 仍 pending。158 个相关输入引用与 38 个 payload 文件 bytes/摘要核对通过；已批准计划仅 tasks 的 17 个 checkbox 变为完成。
- 核对 Author 双平台 18 条检查的原始流/元数据。Linux 181 个输入与当前配置选集和本地 bytes 一致；其 Windows/Linux domain 320、acceptance 7、entropy 7 的记录均为真实 exit 0 / fail 0。此处是核对 Author 证据，不冒称 Reviewer 重跑了 Linux 或 Formal Full Test。
- Reviewer 独立重跑六个 focused 文件，12 tests / 12 pass / 0 fail。它们证明已有场景仍通过，但没有覆盖三个反例；不能据此否定新 finding。
- Reviewer adversarial-proof.mjs 直接调用当前 source，独立生成三个隔离 fixture；32 条显式 Git 命令的原始 Buffer/时间/退出码和实际 outcomes 已保留。实验完成 exit 0 表示复现完成，不表示合同满足。没有使用旧 Explore PASS 作为本次实现结论。
- 所有 Git mutation 只在本轮 .tmp/d05-059-review-git-* fixture 和本地 bare remote；没有网络、实际仓库 Git 或 D05 生命周期写入。合成 Owner/Final 明确标注，不宣称真实项目授权。
- 无关生产/HOW/主规范/历史不由 Reviewer 修改；必要 proof 留本轮 artifacts，.tmp fixture 可丢弃。批准链和历史原始材料不重写。

## 必要评估与交接

当前步骤：review-apply，核对已批准 Git 解耦合同的真实实现与验收，而非重新设计流程。

复杂度/最小性：薄入口、共用 Git 范围/helper、完整 operation/ref/source 以及分根发行方向合理；修正应限于实际操作收敛和既有失败事实交接，无需 Registry、Git Action、远端平台或自动恢复。

new-content / scope drift：NONE。三个问题均为已批准范围内的漏检/交接缺口，不要求扩大到全部 Git 策略或所有 provider。

方案仍是普通 checkpoint、push、Integration 分开，按 Owner 明确权限/路径/对象执行；只让 Integration 消费确认后的 Final，CLI 只读。需在现有设计下补齐上述安全边界，不能以笼统 clean、固定 SHA/parent/count 或反复豁免代替。

下一边界：revise-apply，完成最小修正与当前回归后重新交独立 review-apply。本轮按 review-apply Skill 保持 Reviewer mutation-free；debugging-and-error-recovery 仅用于复现、保留证据和根因定位，修正留 Author 执行。未执行 revise/apply/archive、实际项目 Git、Full Test 或 Final，保存 Result 并读回后 STOP。
