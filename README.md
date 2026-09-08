# flowkit-next

`flowkit-next` has completed Delivery `20260829-02-lightweight-incremental-engineering-quality` Delivery Final materialization on top of the Foundation Lifecycle Kernel.

The D02 implementation candidate passed the authorized Formal Full Test on exact Git candidate:

```text
d78acb135d5317145f52c7559393a3d1c0ff42eb
```

After that PASS, Delivery Final materialized repository guidance and derived Archify assets only. It did **not** modify verified production implementation, tests, canonical OpenSpec specifications, or package/lock truth.

## Current Stable Core capabilities

The repository now contains the D01 Foundation plus the D02 lightweight engineering-quality slice:

- Owner / Author / Reviewer / Verification authority separation;
- Delivery / Change / Action identity and minimal trusted coordination-state binding;
- prepared / terminal Action lifecycle with a single current Action;
- durable Run / Result persistence and exact ActionPackage / Result admission;
- deterministic Policy legal-boundary calculation without automatic next execution;
- cross-Delivery Memo persistence;
- exact managed OpenSpec `1.10.0` runtime resolution;
- thin, portable OpenSpec observation;
- minimal `flowkit` CLI surface: `status`, `next`, `doctor`;
- lightweight incremental engineering gate;
- structural dependency-health checks for selected high-confidence bad edges;
- production-root reachability entropy hygiene;
- exact execution of already-required applicable checks with candidate/check-bound Result facts and bounded exact PASS reuse.

D02 intentionally does **not** introduce Gate/Check Registries, a Verification Planner, Evidence Platform, Quality Dashboard, candidate snapshot database, smart test selection, or automatic Author/Reviewer workflow.

## Verification and detached environment

Formal Full Test keeps the frozen six-gate Delivery-level contract:

```text
pnpm typecheck
pnpm format:check
pnpm build
pnpm test:domain
exact managed OpenSpec 1.10.0 validate --all --strict
pnpm test:acceptance
```

The final detached Linux dependency artifact is external to Git and is validated for Node `22.23.2` / pnpm `11.22.0`. It restores `yaml@2.9.0` correctly, does not contain the rejected Knip experiment, and requires no manual `node_modules` repair before the repository checks run.

## Stable manager boundary

A repository build is not automatically the lifecycle authority for its own active Delivery.

Formal future Delivery execution uses the **previous Delivery Owner-authorized exact Delivery Final Git checkpoint** as the Stable manager. Delivery Final itself does not execute commit, push, merge, or tag and does not create Git checkpoint authority.

This detached D02 closure is commit-ready. The exact Delivery Git checkpoint is formed later in the local repository only after explicit Owner authorization.

## Repository truth boundaries

```text
OpenSpec      → Change/specification authority
Git           → repository bytes/history
Runtime       → Run/Result/current Action facts
Policy        → legal boundary calculation
Reviewer      → independent review verdict
Verification  → test/check evidence
Owner         → explicit authorization and checkpoint decisions
Archify       → derived architecture projection only
Memo          → future cross-Delivery reconsideration only
```

## Managed environment

Manager 安装与 target 项目分根：安装包自有 `package.json` name/version、`dist/`、系统 `skills/actions/` / `skills/delivery/`、OpenSpec HOW/vendor 静态文件及 `config/tools/toolchain.lock.json`；安装来源从自身模块位置确定，不使用 cwd、target package 或上一 Delivery SHA 定位。

CLI `status / next / doctor --input <request.json>` 中的 `repositoryRoot` 仅表示 target；不新增 JSON root override。target 保存自己的 OpenSpec、代码、Run、证据和测试配置，无需复制 Flowkit Skills/lock/scripts。`GuidanceRef.path` 相对 manager，内容身份在安装移位后不变。开发此软件的本仓库同时含源码与项目事实，不意味着用户 target 也要保存系统资产。

`pnpm pack` 的 prepack 清理本仓库可丢弃的 `dist` 后重新编译，发行仅包含 files allowlist 和 package 元数据/README；运行依赖由 manager 安装承担，target 不需要本仓库 devDependencies。`FLOWKIT_HOME/tools` 单独提供 exact OpenSpec executable，不随包携带。CLI 不调用模型或执行 Action；D05 继续使用已授权独立 bootstrap，安装包验收不接管本仓库生命周期。

### 单次 Action

status/next 请求使用 repositoryRoot、flowkitHome，可选 deliveryId/changeId；current 来自选定 Change 的唯一有效 Run 链，不再接受 currentRunId/changeStartSequence。没有唯一 active 时明确报告 idle/歧义，bootstrap 历史只供展示。

Agent 读取已安装 manager 的 exact Guidance，按既有 package/Role/admission 完成真实工作和 canonical 三文件记录；CLI 查询结束即退出。准备通过后先 create-once 保存 action.md，工作与材料核对完成后只创建 context/result 并读回；不要求存活进程、callback 或 target helper。产品各 Action HOW 提供现有发行模块与文件工具的分段示例。Author 与独立 Reviewer 分别记录真实结论。

本 Change 验收使用一个有界真实 Author 工作及同一 build 的独立查询进程，review/revise 负向用例明确标为合成。无需第二套安装、两个真人 Change 或制造 finding；适用安装/分根及 Windows/Linux 回归保留。这些检查不是 Formal Delivery Full Test。

必要 proof 在 target 的 `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，以 Result facts.proofRefs/handoff 交接当前需要的引用；`.tmp` 仅用于可丢弃工作。失败后的 partial 保留并诊断，不自动删除、接管或回用旧 PASS。原始 stdout/stderr 保留 bytes；四条通用 attributes 规则不等于 `.gitignore` 或 Full Test 配置。

Exact managed tool identities are defined in:

```text
config/tools/toolchain.lock.json
```

Current identities:

```text
OpenSpec 1.10.0
```

Executable managed runtimes live under external `FLOWKIT_HOME`, not in Git. Repository Node compatibility is `>=22.20.0`; deterministic fixture is Node `22.23.2`; package manager identity is `pnpm@11.22.0`.

## Independent architecture descriptions

Archify is independent of the Flowkit Delivery workflow. Start, Full Test, Final and repository integration require no diagrams, rendering, Architecture outcome, or skip proof. Historical `architecture/**` assets remain readable derived descriptions; they are not new Delivery prerequisites or code facts. Existing history is not converted or rewritten.

## Historical initialization snapshot

`FOUNDATION-INIT.md` is retained only as the historical bootstrap snapshot that preceded the Foundation lifecycle implementation. It is not a statement of current repository capability.
