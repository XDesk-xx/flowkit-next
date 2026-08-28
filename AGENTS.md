# AGENTS.md

> 仓库级 Agent 长期操作约束。
> Foundation Lifecycle Kernel 已完成 Delivery Final；正式使用仍遵守 **external stable manager manages candidate** 的 authority boundary。
> 本文件是长期 repository guidance，不替代 OpenSpec、Git、Runtime、Reviewer、Verification 或 Owner authority。

## 1. 当前 Foundation 状态

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
Linux x64 detached whole-manager acceptance
Windows compatibility simulation
```

Delivery `20260824-01-foundation-lifecycle-kernel` 已完成 Formal Full Test 与 Delivery Final materialization。

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

Managed external-tool exact identity 读取：

```text
config/tools/toolchain.lock.json
```

当前 managed tools：

```text
OpenSpec  1.10.0
Archify   2.15.0
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
   ├─ openspec/1.10.0/
   └─ archify/2.15.0/
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

Managed OpenSpec/Archify 不得静默使用 PATH/global 其他版本，也不得在正式执行里自动 install/update/download `latest`。

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

当前 candidate 的 OpenSpec integration 是 read-only/observation-oriented thin boundary；不要因为 CLI 能读取 OpenSpec 就扩展成自动 propose/apply/archive。

历史 archived Change 不因后续 guidance convergence 而重写。

## 11. Archify / Architecture boundary

Archify 只负责 derived architecture description validation / rendering / visualization。

Durable Delivery architecture assets：

```text
architecture/<delivery-id>/json/
├─ current.architecture.json
├─ planned.architecture.json
├─ actual.architecture.json
├─ current-to-planned.compare.json
├─ current-to-actual.compare.json
└─ planned-to-actual.compare.json
```

规则：

```text
OpenSpec / repository facts / Verification
→ Architecture Description JSON
→ disposable HTML presentation
```

Compare 必须保持 thin、ref-based；不复制左右 Architecture JSON。HTML 不进 Git，也不是 truth。

正常 continuity：

```text
Accepted Actual(n)
→ 下一 Delivery Current(n+1) 的事实输入
```

但下一 Delivery 的 Current 仍需结合 exact repository revision 与 OpenSpec facts 重新确认，不能把 Actual 自身升级为真相源。

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
└─ runs/
```

含义：

- `project.json`：project/runtime identity；
- `memos.json`：cross-Delivery durable memo；
- `runs/`：真实执行产生的 durable Run/Result/bootstrap-orchestrator history。

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

Git checkpoint 前执行：

```text
git diff --check
```

staging 后执行：

```text
git diff --cached --check
```

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
