## Context

见 `proposal.md`。当前 Foundation Manager 已具有真实 build/bin、Single Action execution、durable Run/Result、Policy、checkpoint authorization、managed OpenSpec/Archify resolution 和 `status/next/doctor` CLI。113/114 已分别证明并复核这些能力可以在 detached Linux 中组合工作，且没有发现需要新增产品 contract 的 blocker。

本 Change 只需要把 proof 变成 repository 中可重复执行的 acceptance surface，并把同一套可执行 gate 冻结为后续 Owner-authorized Delivery Full Test contract。Delivery 01 仍由外部 authority 管理；bootstrap `.flowkit/runs` 不能作为 candidate self-management evidence。

## Goals / Non-Goals

**Goals:**

- 提供一个 focused、deterministic 的 whole-manager acceptance harness，真正执行 built `dist/**` 和 real managed tools。
- 在同一 acceptance surface 中执行 bounded `windows-compatibility-simulation`，覆盖当前真实 portability contract，同时保持 claims 准确。
- 让 acceptance 使用 disposable candidate-generated OpenSpec/Run fixtures，不修改真实 Delivery lifecycle target，也不依赖 bootstrap history。
- 冻结一个 literal、当前即可执行的 Delivery Full Test environment + gate sequence，供 final Change archive + checkpoint 后的 formal Verification 直接复用。
- 保持 candidate mutation/evidence 失效规则简单：影响 acceptance 的 implementation/config 一旦变化，相关 acceptance 必须重跑。

**Non-Goals:**

- 修改 `src/**` 或 canonical product specs。
- Windows Native execution、`cmd.exe`、PowerShell、NTFS ACL/junction/file-lock/antivirus、package-manager `.cmd` shim native proof。
- generic gate registry、Verification database/evidence store、test orchestration framework、background runner 或新的 Full Test state machine。
- 新增 lint policy/configuration。
- Flowkit self-hosting、Delivery 01 self-management、自动 Author/Reviewer loop、自动 next Action execution。
- Git execution、OpenSpec product mutation、Archify materialization、Delivery Final、formal Full Test PASS 或 Owner promotion。

## Decisions

### 1. 使用一个 focused acceptance test surface，而不是新测试框架

新增一个 `tests/acceptance/foundation-manager.acceptance.test.ts`（必要时可拆为少量同目录 focused helpers，但不引入通用 harness framework），由 Node test runner/tsx 执行。

它的 decisive path 必须消费先前 `pnpm build` 产生的 `dist/**`：

- 通过 emitted domain API 创建 Single Action terminal state 和 canonical durable Run；
- 通过 emitted CLI entrypoint 子进程执行 `status` / `next` / `doctor`；
- 使用 exact Owner authority + emitted Policy/checkpoint seam 验证 authorization-only checkpoint；
- 使用 disposable repository，禁止读取 Delivery 01 bootstrap Runs 作为 current/runtime authority。

**原因：** 当前需要的是可重复验收，不是新的产品或测试平台。直接使用现有 Node test runner 足够，并能把 executable proof 保持在 repository 内。

**未采用：** generic acceptance runner、gate registry、Verification service/database。它们没有 Owner/Explore 需求，也会把最后一个 acceptance Change 扩成新架构。

### 2. Real detached acceptance 依赖显式、预恢复环境

Acceptance command 的环境前置条件固定为：

- compatible Node，产品 authority 仍为 `>=22.20.0`；当前 deterministic proof fixture 为 `22.23.2`；
- repository dependencies 已恢复；当前 reproducibility fixture 使用 pnpm `11.22.0`；
- `FLOWKIT_HOME` 显式设置；
- `FLOWKIT_HOME` 中存在与 repository lock 完全匹配的 managed OpenSpec `1.10.0` 和 Archify `2.15.0`；
- acceptance 不执行 install/update/download/network 操作。

Harness 对缺失/错误环境 fail closed，不回退 PATH/global tools。

**原因：** managed tool identity 已是产品 contract；验收应证明它，而不是隐藏恢复过程或依赖宿主全局环境。

### 3. Disposable fixture 由 candidate 自己产生 canonical Run facts

Harness 在临时目录创建最小 OpenSpec repository fixture，然后通过 emitted Foundation API 完成至少以下链路：

```text
invokeSingleAction(apply)
→ terminal
→ writeDurableRun / exact readDurableRun
→ flowkit status exact Run
→ flowkit next exact terminal Apply Run
→ ready-action(review-apply)
```

并单独验证：

```text
flowkit next + explicit currentRunId:null
→ ready-action(explore)
```

以及 terminal Archive fixture + exact `authorize-checkpoint` Owner authority：

```text
Policy → ready-checkpoint-evaluation
checkpoint.authorized → true
```

临时 fixture 不需要 `.git`，且 checkpoint evaluation 前后都不得创建 Git repository。

**原因：** 这证明 candidate 的真实 composition，同时避免把外部 orchestrator 生成的 Delivery 01 历史误当成 self-hosting evidence。

### 4. Managed-tool proof 必须包含 fake PATH takeover probe

Harness 创建 fake `openspec` / `archify` PATH executables/markers，然后执行 emitted `flowkit doctor`。通过条件是：

- machine result 精确报告 managed OpenSpec `1.10.0` / Archify `2.15.0`；
- exact OpenSpec root 检查通过；
- fake PATH marker 均未被触发。

Archify 仍只 resolve identity，不执行 architecture materialization。

### 5. Windows 只做 bounded compatibility simulation

同一 acceptance suite 使用 `path.win32` 和 Windows fixture values 验证当前真实 portability surface：

- repository / `FLOWKIT_HOME` 路径包含 spaces；
- Run/Memo path composition；
- portable managed-tool entrypoint `bin/openspec.js` 在 Windows path 下的 resolution；
- mixed-case same-drive containment；
- cross-drive path 被识别为 outside；
- CLI request file 使用 CRLF 且 argv path 可包含 spaces；
- production contract 不依赖 `shell: true`、`path.posix`、`cmd.exe` 或 PowerShell。

Machine/test naming 必须使用 `windows-compatibility-simulation`。不得输出或文档化为 `Windows Native PASS`。

**原因：** detached 是 Owner 明确的主开发/验收环境；当前 Foundation 也没有 Windows-specific shell/service/installer contract。模拟覆盖真正的 portability invariant，同时避免虚假 native claim。

### 6. Package wiring 只增加一个 acceptance command

如果现有 scripts 无法直接重复执行 harness，增加：

```text
pnpm test:acceptance
```

它只运行 focused acceptance tests。同步把 `tests/acceptance` 纳入 Prettier scope；不新增通用 `test` orchestrator，也不新增 lint script/config。

### 7. 冻结 literal Delivery Full Test contract，但 formal execution 继续 deferred

Apply 将 Delivery verification section 从“exact contract 尚未冻结”更新为已冻结的环境前置条件和 gate sequence：

1. `pnpm typecheck`
2. `pnpm format:check`
3. `pnpm build`
4. `pnpm test:domain`
5. exact managed OpenSpec `1.10.0` 执行 `validate --all --strict`
6. `pnpm test:acceptance`（同时包含 detached real whole-manager acceptance 与 `windows-compatibility-simulation`）

正式 Delivery Full Test 仍保持 `execution.state: deferred`，reason 改为：contract 已冻结，但等待 final Change archive → exact checkpoint candidate → explicit Owner Full Test authorization。

`delivery.fullTestStatus` 在本 Change 内仍为 `not-ready`。

**原因：** 最后一个 Change 负责把可执行验收 contract 固化，不拥有 formal Verification authority。这样后续 Full Test 不需要重新发明命令，也不会提前宣称 PASS。

### 8. 不发明 lint gate

虽然 devDependencies 中存在 ESLint packages，但当前没有 `eslint.config.*` 和 `package.json#scripts.lint`，直接 `eslint src` 不能作为 executable repository gate。

因此 frozen Full Test 不包含 lint，本 Change 也不创建 lint configuration。若未来需要 lint policy，必须通过单独 authority/Change 建立。

### 9. Production defect 触发 stop/replan，而不是 acceptance scope 内静默修复

Apply 默认允许的 production mutation 为 `none`。如果 repository-persisted acceptance 暴露需要修改 `src/**` 或 canonical requirement 的真实缺陷：

```text
STOP
→ 保留失败 evidence
→ revise Proposal / Owner reauthorization
→ 必要时取消 skip_specs
```

不得在本 Change 的 acceptance/tooling scope 中直接修产品行为。

## Risks / Trade-offs

- **[Risk] Windows simulation 被误读为 native evidence** → 固定 machine/test 名称 `windows-compatibility-simulation`，并在 Delivery contract 明确列出未覆盖的 native Windows surfaces。
- **[Risk] acceptance harness 变成第二套 lifecycle/test authority** → harness 只调用现有 emitted APIs/CLI 并断言结果；不保存新的 durable lifecycle state，不创建 registry/database/state machine。
- **[Risk] 外部 managed runtime 缺失导致环境相关失败** → 明确 `FLOWKIT_HOME` 前置条件并 fail closed；不从 PATH 或网络补救。
- **[Risk] acceptance 误用真实 Delivery 01 Runs** → 所有 lifecycle fixture 使用 disposable repository + candidate-generated canonical Runs。
- **[Risk] Change 内 mutation 使既有 evidence 失效** → 任何影响 harness/candidate/config 的变更后重跑 relevant acceptance；reviewer 只接受最新 candidate evidence。
- **[Risk] Full Test 和 Change acceptance 重复** → 两者复用同一个 `test:acceptance` contract；Change 阶段运行属于 author/reviewer evidence，archive+checkpoint+Owner authorization 后的同命令运行才属于 formal Delivery Verification。
