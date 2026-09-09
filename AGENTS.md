# AGENTS.md

> 仓库级 Agent 长期操作约束。
> Foundation Lifecycle Kernel 与 Delivery 02 Lightweight Incremental Engineering Quality 已完成 Delivery Final materialization；正式使用仍遵守 **external stable manager manages candidate** 的 authority boundary。
> 本文件是长期 repository guidance，不替代 OpenSpec、Git、Runtime、Reviewer、Verification 或 Owner authority。

## 1. 当前 Stable Core 状态

仓库已经具备并验证：

```text
canonical authority / identity contracts
Action lifecycle: prepared / terminal
single-current-Action invariant
Run / Result durable persistence + integrity validation
exact ActionPackage formation + Result admission
exactly-one Standard Action execution / terminal / STOP
Policy legal-boundary calculation
cross-Delivery Memo persistence
toolchain exact managed-runtime resolution
thin OpenSpec observation
minimal flowkit CLI: status / next / doctor
checkpoint authorization evaluation only
trusted Delivery-Change coordination-state binding
lightweight incremental engineering gate
structural dependency health
production-root reachability entropy hygiene
explicit applicable-check execution + exact real-PASS reuse boundary
portable OpenSpec abnormal-process classification
Linux x64 detached whole-manager acceptance
Windows compatibility simulation
```

Delivery `20260824-01-foundation-lifecycle-kernel` 已完成 Formal Full Test 与 Delivery Final materialization。

Delivery `20260829-02-lightweight-incremental-engineering-quality` 也已完成 Formal Full Test 与 Delivery Final materialization；D02 增加 lightweight gate、structural dependency health、production-root reachability entropy hygiene、explicit applicable-check execution，以及两项 bounded Foundation correction。D02 没有引入 Gate/Check Registry、Verification Planner、Evidence Platform、Quality Dashboard、candidate snapshot DB 或 automatic workflow。

Delivery Final 仍不自动创建 Git checkpoint authority。Detached closure 只准备 commit-ready repository snapshot；exact Delivery checkpoint 必须在本地仓库由 Owner 明确授权后形成。

历史 Delivery 01 **不得被 candidate 自己重演为 self-managed lifecycle**。后续 Delivery 的正式生命周期操作必须由上一 Delivery 的 Owner-authorized exact Delivery Final Git checkpoint 对应 Stable Flowkit manager 执行；target repository 内正在开发的 candidate CLI 不能因为“已经 build 出来”就自动取得当前 Delivery authority。

## 2. Authority

长期事实归属固定为：

```text
OpenSpec      → Change requirement / proposal / design / specs / tasks / archive
Git           → repository bytes / diff / branch / commit / history
Runtime       → Role / Action execution / Run / Result / Policy-derived next boundary
Owner         → explicit authorization / scope / checkpoint decisions
Author        → Author-owned artifacts / implementation
Reviewer      → independent verdict / findings
Verification  → test / check evidence
Skills        → HOW to execute an already-decided Action
Archify       → derived architecture validation / rendering / visualization
Memo          → future cross-Delivery reconsideration only
```

禁止建立第二份 durable truth。聊天、Memory、临时笔记、Skill prose、Architecture view、Compare HTML 或 AI 推断都不能替代正式 authority。

## 3. 输出语言

- 面向 Owner / Author / Reviewer 的自然语言正文默认简体中文。
- CLI、code identifier、schema key、enum、Action id、path、SHA、package name、error code 保持 exact literal。
- 不为了统一中文改写 machine contract。

## 4. Stable manager / candidate boundary

D05 当前按 Owner 已授权的 independent-bootstrap 执行。新产品 `status / next / doctor` 在普通测试 target 验收，不接管 D05 自身；不恢复已卸载的外部 manager。以下历史 Stable/checkpoint 模型不构成 D05 的新 SHA 准入门槛，也不改写历史执行事实。

未来 Delivery 的正式关系固定为：

```text
Stable Flowkit N
(previous Delivery Owner-authorized exact Delivery Final Git checkpoint)
        │ formal lifecycle authority
        ▼
Candidate repository N+1
        │ source / OpenSpec / tests / derived architecture
        ▼
Delivery Final
        │ Owner explicit Git checkpoint authorization
        ▼
Exact Delivery Final Git checkpoint
        │
        └─ directly eligible as next Delivery stable base
```

在一个 Delivery 进行期间：

- formal `status / next / doctor / Action lifecycle` 应绑定外部 exact Stable manager；
- target repository 的 `dist` / built CLI 是当前 Delivery 的 candidate artifact 与测试对象；
- candidate 不得中途替换管理自己的 Stable manager；
- candidate 在当前 Delivery 中不得中途自我接管；Delivery Final 本身不产生 Git 权限。Owner 明确授权并形成 exact Delivery Final Git checkpoint 后，该 checkpoint 直接具备作为下一 Delivery stable base 的资格。

Delivery 01 的 bootstrap/orchestrator `.flowkit/runs/**` 是历史执行事实，不得被解释成 candidate 自己管理了 Delivery 01。

## 5. Skills

仓库内存在两类 Skill 资产：

```text
skills/         → repository-managed tool/vendor/project guidance assets
.agents/skills/ → repository-managed Agent execution aids used during bootstrap/development
```

它们都只能改善 HOW，不能取得 lifecycle authority。

Skill 不得：

```text
decide next Action
switch Role
create Owner authority
replace OpenSpec contract / Reviewer verdict / Verification
auto-run next
auto-commit / push / merge / tag
orchestrate an automatic Author/Reviewer loop
```

生产 `src/**` 当前不读取或执行 `.agents/skills/**`。

## 6. Toolchain 与 runtime

D05 当前产品实现分离 manager 安装根与 target repositoryRoot：系统 Guidance、必要静态引用及 lock 从 manager 自身模块位置定位，package name/version 来自安装自身元数据；绝对安装路径不成为持久身份，不以 target metadata/cwd/previous Delivery SHA 选择安装。GuidanceRef 的相对路径在 manager 下解释，项目事实与所有项目写入仍归 target。FLOWKIT_HOME/tools 只提供 exact executable runtime。target 无需复制 Flowkit Skills、scripts 或 lock；同名 target 文件不得接管或作为缺失回退。此安装定位不是 lifecycle authority；D05 仍沿用 Owner 已授权的独立 bootstrap，不自动恢复外部管理或让 candidate 自我接管。

Managed external-tool exact identity 读取：

```text
config/tools/toolchain.lock.json
```

当前 managed tools：

```text
OpenSpec  1.10.0
```

Host/runtime truth 分离：

```text
package.json#engines.node   → Node host compatibility (>=22.20.0)
package.json#packageManager → repository pnpm identity (pnpm@11.22.0)
.node-version               → deterministic Node fixture (22.23.2)
```

Executable managed runtime 位于外部 `FLOWKIT_HOME`，例如：

```text
FLOWKIT_HOME/
└─ tools/
   └─ openspec/1.10.0/
```

Git repository 不保存：

```text
OpenSpec/Archify executable runtime
node_modules
pnpm store
platform runtime archives
temporary unpacked tool distributions
generated Archify HTML
```

Managed OpenSpec 不得静默使用 PATH/global 其他版本，也不得在正式执行里自动 install/update/download `latest`。

如果 exact runtime 不匹配或缺失且当前操作依赖它：

```text
STOP
→ 报告 expected / actual / missing
```

## 7. 开始工作时读取事实

至少读取：

```text
AGENTS.md
config/tools/toolchain.lock.json
git branch --show-current
git rev-parse HEAD
git status --short
```

再按当前任务读取：

```text
openspec/delivery-groups/**
openspec/specs/**
applicable openspec/changes/**
.flowkit/project.json
.flowkit/memos.json
applicable .flowkit/runs/**
relevant source / tests / Skills
Owner instruction
```

当 exact Stable manager 已可用时，再使用其：

```text
flowkit status
flowkit next
flowkit doctor
```

不得用 target candidate CLI 代替当前 Stable manager，仅为了让流程继续。

## 8. Role / Owner boundary

长期至少区分：

```text
Owner
Author
Reviewer
Verification
```

- Author 不自审，不伪造 Reviewer verdict。
- Reviewer 独立审查，不修改 Author production artifacts/tests。
- Verification 只提供 correctness evidence，不决定 mutation permission 或 Git permission。
- 新 Owner authority 只能来自 Owner 独立明确输入。

以下都不自动产生 Owner authority：

```text
讨论 / 倾向 / 问题 / 反问
历史聊天推测
Review approved
Run terminal
Archive completed
tests PASS
Formal Full Test PASS
Delivery Final
```

需要 authority 但缺失时，精确报告并 `STOP`。

## 9. Git boundary

Git 是 repository truth owner，Agent 不猜 Git boundary。

没有明确合法 boundary / Owner authorization 时，不自行：

```text
git add
git commit
git tag
git push
git merge
git rebase
git reset --hard
git clean
branch delete
history rewrite
```

硬规则：

```text
Action completed  ≠ Commit authorization
Run terminal       ≠ Commit authorization
Review approved    ≠ Commit authorization
Archive completed  ≠ Commit authorization
Full Test PASS      ≠ Commit authorization
Delivery Final      ≠ Git checkpoint authorization
```

正式 commit message 使用 deterministic contract：

```text
change(<change-id>): <short semantic summary>
delivery(<delivery-id>): finalize <short semantic summary>
```

默认 branch 模型：

```text
main                    → accepted stable history
delivery/<delivery-id>  → Delivery working branch
```

## 10. OpenSpec boundary

OpenSpec 是 formal Change/specification authority。Flowkit 只做 thin integration，不重建 OpenSpec proposal/design/tasks/archive state machine。

当前 candidate 的 OpenSpec observation 仍只读；CLI 不提供 action/prepare/submit 写命令。OpenSpec mutation 由 Agent 依已确定 Action 和上游 mechanics 执行，复用既有 Policy/package/admission 与文件能力记录真实三文件 Run，不调用模型 API、不自动下一 Action。

`flowkit <status|next|doctor> --input <path>` 从 manager 自身定位资产。status/next 从 target、可选 deliveryId/changeId 及唯一有效 Run 链解析上下文，拒绝 caller 手填 currentRunId/changeStartSequence。Agent 准备通过后先保存真实开始，工作后按同一 package/Role 接纳结果、create-once 保存并读回后 STOP；未完成记录不清理、不自动接管。bootstrap-history 只读展示，不转换成 canonical current。普通 Action 不新增 Owner 审批；D05 继续独立 bootstrap。

候选验收以一个有界真实 Author 工作及同一 build 的独立查询读回为实际示例；review/revise 合成 fixtures 不声称独立 Review。不强制第二套安装、两个真人 Change 或制造 finding，仍运行适用平台/安装回归；不是 Formal Full Test。

历史 archived Change 不因后续 guidance convergence 而重写。

## 11. 独立 Archify / Architecture boundary

Archify 仅作为独立的派生架构描述、校验和可视化工具，不属于 Flowkit managed tool 或 Delivery operation。

Delivery Start、Full Test、Final 和 repository integration 不要求 Current/Planned/Actual、compare、render、Architecture outcome 或 skip 证明；Previous Actual 不是下一 Delivery Start 的前置条件。

历史 `architecture/**`、Delivery manifest、archive 与 Runs 按原始 bytes 保留并可读取，不迁移、不补图、不重新解释为新的执行输入。图与 HTML 不得替代 OpenSpec、Git 或 Verification 事实。

不删除用户外部 Archify runtime 或独立 Skill。产品 Guidance 不读取 `.agents/skills/**`。

## 12. Verification ≠ mutation authority

长期固定：

```text
approved Change / contract
→ semantic mutation authority

Verification
→ proof of correctness
```

Formal Delivery Full Test 也是 Verification；它不自动创建 Git checkpoint，也不产生 Delivery Final mutation 之外的产品修改权。

Regression 至少区分：

```text
baseline PASS → candidate FAIL       = regression / blocker
baseline FAIL → candidate same FAIL  = pre-existing debt, not automatic blocker
baseline FAIL → candidate worse/new  = regression / blocker
baseline FAIL → candidate PASS       = improvement
```

## 13. `.flowkit/` 与 durable execution integrity

`.flowkit/` 保持极薄：

```text
.flowkit/
├─ project.json
├─ memos.json
├─ runs/
└─ artifacts/
```

含义：

- `project.json`：project/runtime identity；
- `memos.json`：cross-Delivery durable memo；
- `runs/`：真实执行产生的 durable Run/Result/bootstrap-orchestrator history。
- `artifacts/`：target 自有必要执行材料，默认长期保留；Action proof 使用 `<delivery>/changes/<change>/proof/<run-id>/`，不扩张三文件 Run，也不复制 OpenSpec/Verification authority。

`.tmp` 仅用于可丢弃工作文件。必要材料生成、接纳及相关消费时核对来源、归属、可读性与完整性；只消费当前判断明确需要的引用，不遍历所有历史 proof。保留不等于有效，旧 PASS 不代替当前实现验收。材料处理的 Owner 决定以真实 sourceRef 和简要边界交接，不复制聊天；未收到授权说明不等于未授权。

不得在 `.flowkit/` 中复制 OpenSpec truth、Architecture truth、managed binaries 或构造 generic verification registry。

Run 必须来自真实执行：

```text
real execution → real Run / Result
prose description only → NOT a Run
```

禁止手写“成功 result”、模拟 CLI PASS、伪造 Review approved / Verification PASS / Owner authority。

## 14. Single-Action boundary

Canonical Action lifecycle 当前为：

```text
prepared / terminal
```

`resumed` 已由正式 archived Change 移除，仓库 guidance 不得重新引入 crash-recovery lifecycle state。

一次 Standard Action invocation：

```text
legal Standard Action 已确定
↓
[Core] establish CurrentAction/prepared
[Core] form exact ActionPackage
↓
execute exactly one Standard Action
↓
[Core] exact Result admission
[Core] terminal exact current Action
↓
report continuation fact
↓
STOP
```

`prepare` 是内部 structural event，不是 Standard Action、独立 Run、Owner/Reviewer boundary 或单独 STOP 点。

terminal 后不得自动执行下一 Action。Policy 只计算合法 boundary，实际调用仍需相应 authority/host boundary。

## 15. Policy / checkpoint boundary

Policy 必须产生：

```text
one deterministic legal boundary
OR
one deterministic blocked diagnosis
```

不得 auto-execute next。

Checkpoint surface 当前仅做 authorization evaluation：

```text
Policy readiness
+
exact Owner authorization fact
→ checkpoint authorized / not authorized
```

Candidate CLI 不执行 `git add` / `git commit` / push / merge / tag。

## 16. Cross-Delivery Memo

Memo：

```text
≠ blocker
≠ requirement
≠ current Delivery backlog
≠ next-boundary authority
```

Open Memo 主要在未来 Delivery Start 暴露给 Owner，由 Owner 决定：

```text
include in new Delivery
continue deferring
dismiss
```

Memo 本身永远不自动变成 OpenSpec Change/spec。

## 17. Platform / text / acceptance

Primary detached acceptance：

```text
Linux x64 glibc
```

Windows coverage 当前是：

```text
windows-compatibility-simulation
```

它不声称 native `cmd.exe` / PowerShell / NTFS / `.cmd` shim execution PASS。

Windows/Linux `node_modules` 不互用。Dependency truth 是 `package.json + pnpm-lock.yaml`。

文本默认：

```text
UTF-8
LF
no trailing whitespace
EOF exactly one newline
```

原始 stdout/stderr 是例外：保留 Buffer bytes，使用 `stdout.txt`、`stderr.txt`、`*.stdout.txt`、`*.stderr.txt`，由 `.flowkit/artifacts/**` 下四条通用 attributes 模式处理，不逐 Change 添加例外。不对全部 artifacts/Run 放宽；脚本、Run JSON、命令元数据、摘要仍是结构化文本，不得改名冒充日志。此规则独立于 `.gitignore` 和 Full Test 选取范围，不自动注入其他 target。

Git checkpoint 的空白诊断（不是统一提交阻断）：

```text
git diff --check
```

staging 后执行：

```text
git diff --cached --check
```

源码 quality:gate 只聚合 bounded formatting 与 lint/既有行数要求；禁止入库内容使用独立 check:forbidden-tracked-artifacts。Git 节点核对授权范围、真实冲突和提交结果，不仅因历史 proof/测试输入/原始日志空白阻断正常 checkpoint，不要求重复豁免，不重写历史、不逐 Change 追加 attributes。原始 bytes 仍须真实保留，不伪造代码 PASS。

Full Test 配置固定为 target config/verification/full-test.json，独立于 .gitignore/index/HEAD；当前结果由 Delivery fullTestAttempt 关联 target artifacts/full-test 材料。新失败/partial 不回用旧 PASS，代码输入与必要材料完整性分开核对。bootstrap/history 自检用 test:bootstrap，不属于代码 Full Test。

## 18. 代码探索与过度设计

默认：

```text
Git → rg / targeted search → exact source → tests
```

CodeGraph 不是 canonical dependency，也不是 detached acceptance prerequisite。

除非新 formal requirement 明确需要，否则不建立：

```text
Agent Registry
Provider Registry
Skill Registry
Tool Registry
Gate Registry
Evidence platform
dynamic workflow engine
automatic Author/Reviewer loop
automatic next
automatic Owner decisions
generic rollback/migration platform
CodeGraph mandatory integration
```

## 19. STOP 条件

以下情况不得猜测继续：

```text
缺 Owner authority
Role / formal target 不明确
需要猜 lifecycle next
current Stable manager identity 不明确
toolchain exact identity 不匹配
required managed runtime 缺失
Git/source facts 与说明冲突
expected Run/Result/Review/Verification 不存在
继续需要伪造成功 artifact
```

报告：

```text
Known facts
Missing fact / authority / runtime
Blocked operation
Required boundary/input
```

## 20. Short Rule

```text
Read facts first.
Do not guess authority, lifecycle, Stable identity, or Git boundary.

OpenSpec owns Change/spec contract.
Git owns repository truth.
Runtime owns durable execution state.
Policy decides legal boundary only.
Skills improve HOW only.
Reviewer reviews independently.
Verification proves correctness only.
Archify visualizes derived architecture only.
Memo preserves future reconsideration only.
Owner alone supplies explicit authorization and checkpoint authority.

Use the previous Delivery Owner-authorized exact Delivery Final Git checkpoint as the Stable manager for the next candidate Delivery.
One current Action at a time.
No fake artifacts.
No hidden auto-continue.
No surprise commit / push / merge / tag.
```
