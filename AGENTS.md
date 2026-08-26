# AGENTS.md

> 仓库级 Agent 长期操作约束。
> 当前状态：**Project Initialization / pre-OpenSpec lifecycle**。
> 本文件只定义从第一次打开仓库起必须成立的稳定行为与 authority boundary；不创建 Policy、Owner authority、OpenSpec Change 或当前 Action。

## 1. 初始化状态

当前明确不存在：

```text
active Delivery
active OpenSpec Change
formal current Action / Run
formal Review Verdict / Verification Result
implemented stable flowkit lifecycle CLI
```

因此 Foundation lifecycle 正式建立前：

- 不假设 `flowkit status / next / doctor` 已经可用。
- 不伪造 Policy、Run、Result、Review、Verification。
- 不因为仓库里已有 OpenSpec/Archify Skill 就自动进入任何 lifecycle。
- 初始化工作只按 Owner 当前明确授权范围执行。

## 2. Authority

长期事实归属固定为：

```text
OpenSpec      → Change requirement / proposal / design / specs / tasks / archive
Git           → repository bytes / diff / branch / commit / history
Runtime       → Role / Action execution / Run / Result / Policy-derived next boundary
Owner         → explicit authorization / scope decisions
Author        → Author-owned artifacts / implementation
Reviewer      → independent verdict / findings
Verification  → test / check evidence
Skills        → HOW to execute an already-decided Action
Archify       → derived architecture validation / rendering / visualization
```

禁止建立第二份 durable truth。聊天、Memory、临时笔记、Skill prose、Architecture view 或 AI 推断都不能替代正式 authority。

## 3. 输出语言

- 面向 Owner / Author / Reviewer 的自然语言正文默认简体中文。
- CLI、code identifier、schema key、enum、Action id、path、SHA、package name、error code 保持 exact literal。
- 不为了统一中文改写 machine contract。

## 4. Skills

Canonical、Git-tracked Skill root：

```text
skills/
├─ vendors/       # vendored upstream, toolchain upgrade 时才更新
├─ tools/         # project-owned tool adapters
├─ actions/       # project-owned Action Skills；当前初始化期不提前冻结内容
└─ engineering/   # project-owned engineering guidance
```

禁止把 `.agents/skills/`、`.codex/skills/` 或用户 home 下 Skill 目录当 source of truth。

外部 Skill 必须先 vendor/adapt 到本项目 `skills/` 再分发。

Skill 可以改善 HOW，但不得：

```text
decide next Action
switch Role
create Owner authority
replace OpenSpec contract / Reviewer verdict / Verification
auto-run next
auto-commit / push / merge / tag
orchestrate the whole workflow
```

## 5. Toolchain 与 runtime

Exact identity 读取：

```text
config/tools/toolchain.lock.json
```

当前锁定：

```text
Node      22.23.2
pnpm      11.22.0
OpenSpec  1.10.0
Archify   2.15.0
```

不得因本机 PATH 有其他版本就静默使用；不得在无关任务里自动升级或下载 `latest`。

Executable runtime 放在外部：

```text
FLOWKIT_HOME/
└─ tools/
   ├─ openspec/1.10.0/
   └─ archify/2.15.0/
```

Git repository 保存 Skills 和 manifests，不保存：

```text
OpenSpec/Archify executable runtime
node_modules
pnpm store
platform runtime archives
temporary unpacked tool distributions
```

**Skills 进入 Git；CLI/runtime 不进入 Git。**

如果 exact runtime 不匹配或缺失且当前工作必须使用它：

```text
STOP
→ 报告 expected / actual / missing
```

## 6. 开始工作时读取事实

初始化阶段至少读取：

```text
AGENTS.md
FOUNDATION-INIT.md
config/tools/toolchain.lock.json
git branch --show-current
git rev-parse HEAD
git status --short
```

再读取当前任务相关 Skills、source、tests、Owner instruction。

只有未来 stable lifecycle CLI 已真实存在且可验证后，才增加：

```text
flowkit status
flowkit next
flowkit doctor
```

并读取 applicable Run / OpenSpec / Owner / Reviewer / Verification facts。

## 7. Role / Owner boundary

长期至少区分：

```text
Owner
Author
Reviewer
Verification
```

- Author 不自审，不伪造 Reviewer verdict。
- Reviewer 必须独立审查，不修改 Author artifacts、production code 或 Author tests。
- Verification 只提供 correctness evidence，不决定 mutation permission 或 next。
- 新 Owner authority 只能来自 Owner 独立明确输入。

以下都不自动产生 Owner authority：

```text
讨论 / 倾向 / 问题 / 反问
历史聊天推测
Review approved
Run terminal
tests PASS
```

需要 authority 但缺失时，精确报告并 `STOP`。

## 8. Git boundary

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
```

未来正式 commit message 使用 deterministic contract，例如：

```text
change(<change-id>): <short semantic summary>
delivery(<delivery-id>): finalize <short semantic summary>
```

当前建议 branch：

```text
main                    → accepted stable history
delivery/<delivery-id>  → Delivery working branch
```

默认不为每个 Change 再建立 nested branch，除非正式 contract 后续明确要求。

## 9. OpenSpec / Archify boundary

OpenSpec 是 Change contract authority。项目只做 thin integration，不重建 proposal/design/tasks/archive state machine。

当前初始化期 `openspec/` 只是 canonical 路径；Owner 正式启动第一个 Foundation Change 前，不自动 `new / propose / apply / archive`。

Archify 只负责 derived architecture validation / rendering / visualization。Architecture asset 或 Archify output 不得决定 Apply、Policy、Review、Verification、Git 或 Owner authority。

## 10. Verification ≠ mutation authority

长期固定：

```text
approved Change / contract
→ mutation authority

Verification
→ proof of correctness
```

禁止重新建立：

```text
changed path
→ verification module mapping
→ mutation permission
```

授权但未映射的 path 不等于非法修改；未来 verification routing 无精确匹配时应使用 bounded deterministic fallback。

Regression 至少区分：

```text
baseline PASS → candidate FAIL       = regression / blocker
baseline FAIL → candidate same FAIL  = pre-existing debt, not automatic blocker
baseline FAIL → candidate worse/new  = regression / blocker
baseline FAIL → candidate PASS       = improvement
```

## 11. `.flowkit/` 与 Run integrity

`.flowkit/` 保持极薄：

```text
.flowkit/
├─ project.json
└─ runs/
```

只用于 project runtime identity 和 durable Run state，不放 Skills、OpenSpec truth copy、Architecture truth copy、managed binaries 或 verification registry。

未来 Run 必须来自真实执行：

```text
real execution → real Run / Result / evidence
description only → NOT a Run
```

禁止手写“成功 result”、模拟 CLI PASS、伪造 Review approved 或 Verification PASS。

如果真实执行失败，报告 exact environment / command / reason，不制造假 artifact 继续流程。

## 12. Single-Action boundary

当前 canonical Action lifecycle 仍包含 `prepared / resumed / terminal`，直到后续正式 Change 修改该 contract。仓库级指导不得提前把 `resumed` 解释成 crash recovery、进程中断恢复或必须实现的执行机制。

当前 Foundation 的最小 single-Action 目标边界是一次完整的 Standard Action invocation：

```text
legal Standard Action 已确定
↓
[Core 内部] establish CurrentAction/prepared
[Core 内部] form exact ActionPackage
↓
execute exactly one Standard Action
↓
[Core 内部] exact Result admission
[Core 内部] terminal exact current Action
↓
report continuation fact
↓
STOP
```

`prepare` 只允许作为内部 structural lifecycle event / Core seam，用于建立唯一的 `CurrentAction/prepared`；它不得成为 `StandardActionId`、独立 Run/Result、Owner/Reviewer boundary、普通用户可见阶段或独立 STOP 点。

计划中的 `establish-single-action-execution-terminal-boundary` 必须 proof `resumed` 是否存在真实必要性；若无必要，应通过正式 OpenSpec Change 收缩既有 lifecycle contract，而不是由本文件静默删除。

不得因为 internal prepare/package formation 完成就提前 STOP，不得因为 non-terminal state 提前宣称 Action 完成，也不得 terminal 后自动执行下一 Action。Policy 负责后续 legal next-boundary 判断。

## 13. Platform / text

Canonical development：

```text
Windows Native
```

Required detached acceptance：

```text
Linux x64 glibc
```

Windows/Linux 的 `node_modules` 不互用。Dependency truth 是 `package.json + pnpm-lock.yaml`；platform bundles 只是 derived environment artifacts。

核心实现优先 Node/TypeScript API 与 Node `path` API；`.cmd/.ps1/.sh` 只做 thin launcher/setup boundary。

文本默认：

```text
UTF-8
LF
no trailing whitespace
EOF exactly one newline
```

Git boundary 前执行：

```text
git diff --check
```

staging 后再需要时执行：

```text
git diff --cached --check
```

## 14. 代码探索与过度设计

第一阶段默认：

```text
Git → rg / targeted search → exact source → tests
```

CodeGraph 不作为 canonical dependency，也不作为 detached acceptance prerequisite。

Foundation / Kernel 默认不建立：

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

新增 abstraction 必须由当前真实 requirement / acceptance 证明需要。

## 15. STOP 条件

以下情况不得猜测继续：

```text
缺 Owner authority
Role / formal target 不明确
需要猜 lifecycle next
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

## 16. 初始化进入正式 Foundation

推荐切换边界：

```text
physical project initialization accepted
→ initial repository materialization
→ exact external toolchain restored
→ Windows toolchain validation
→ Owner explicitly starts first Foundation Change
→ OpenSpec becomes active formal Change authority
```

此前：

```text
初始化文档 ≠ OpenSpec Proposal
目录骨架 ≠ active Change
Skill presence ≠ Action authorization
```

## 17. Short Rule

```text
Read facts first.
Do not guess authority, lifecycle, or Git boundary.

OpenSpec owns Change contract.
Git owns repository truth.
Runtime owns durable execution state.
Policy decides legal boundary.
Skills improve HOW only.
Reviewer reviews independently.
Verification proves correctness only.
Archify visualizes derived architecture only.

Skills stay in Git.
Executable tool runtimes stay in FLOWKIT_HOME.

One current Action at a time.
No fake artifacts.
No hidden auto-continue.
No surprise commit / push / merge / tag.
```
