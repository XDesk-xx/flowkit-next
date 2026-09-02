## 1. Repository dependency adoption

- [x] 1.1 使用 repository package manager 将 `dependency-cruiser 18.2.0` 作为 devDependency 正常写入 `package.json` / `pnpm-lock.yaml`，验证 lockfile 成功解析该 adopted identity，并确认未同时加入 Knip 或其它未批准 quality dependency。

## 2. Explicit structural dependency rules

- [x] 2.1 新增 `dependency-cruiser.config.mjs`，只实现 design 冻结的五条 `severity:error` selected rules 与 exact TypeScript/resolution options，并通过当前 `src + tests` whole-graph run 验证 zero violations。
- [x] 2.2 用 disposable fixture 验证 unresolved import 必须 FAIL，并确认诊断明确标识 `no-unresolved-imports`。
- [x] 2.3 用 disposable fixture 同时验证 runtime-only cycle 必须 FAIL、包含 type-only edge 的 circular path 不得被 `no-runtime-circular-dependencies` 误判；不得把 rule 简化为 blanket `circular:true`。
- [x] 2.4 用 disposable fixture 验证 production → test/spec 必须 FAIL，而 test/spec → production 在无其它 violation 时允许。
- [x] 2.5 用 disposable fixture 验证 production runtime → `devDependencies` 必须 FAIL，同时 production type-only → `devDependencies` 与 test/spec → `devDependencies` 在无其它 violation 时允许。
- [x] 2.6 用 disposable fixture 验证 undeclared external package use 必须 FAIL，并确认 declared-but-unused package 不由本 capability 单独判为 violation。

## 3. Stable command and performance boundary

- [x] 3.1 在 `package.json` 新增独立 `quality:dependency-health` script，执行 semantics 等价于 `depcruise --config dependency-cruiser.config.mjs --output-type err src tests`；验证命令在健康 repository 退出 `0` 并记录 elapsed time。
- [x] 3.2 验证现有 `quality:gate` command 未加入 dependency health，且新命令未使用 `--affected`、changed-file/merge-base planning、known-violation baseline/cache、waiver file 或 broader recommended bundle。

## 4. Scope and integration verification

- [x] 4.1 运行 `pnpm quality:gate`、`pnpm quality:dependency-health`、`pnpm typecheck` 与 `pnpm build` 并全部 PASS；确认本 Change 未修改 production behavior、Foundation lifecycle/authority、Run/Result、Policy、Formal Full Test 或 architecture-layering contract。
- [x] 4.2 运行 OpenSpec current-change strict validation、`openspec validate --all --strict` 与 `git diff --check HEAD`，确认 proposal/spec/design/tasks 与实现一致，并确认无 Knip/orphan/unused dependency ownership、Registry、Planner、Verification 或新 lifecycle state 泄漏。
- [x] 4.3 记录 dependency graph 已因 package truth 变化而改变；如后续需要新的 Linux `node_modules` archive，将其作为 repository 外 execution-environment preparation 单独生成，不把 archive 纳入本 Change durable artifacts。
