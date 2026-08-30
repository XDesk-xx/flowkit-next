## 1. Selected lint baseline

- [x] 1.1 新增 `eslint.config.mjs`，只实现 Reviewer 批准的 recommended + exact overrides + `src/**/*.ts` `max-lines=650` surface，并验证在 cleanup 前当前仓库只剩 Explore 已证明的 6 个 `no-unused-vars` errors。
- [x] 1.2 仅删除 Explore 已证明的 6 个 unused imports/types/declarations，并验证 selected ESLint PASS、`pnpm typecheck` PASS、`pnpm test:domain` 124/124 PASS；不得顺手清理其它历史代码。

## 2. Forbidden tracked-artifact boundary

- [x] 2.1 新增 `scripts/check-forbidden-tracked-artifacts.mjs`，实现 exact matcher：任意 `node_modules/dist/coverage/.tmp` segment、root-only `tools/runtime`、任意位置的 `*.node-modules.tar.gz` / `*.pnpm-store.tar.gz`；验证当前 repository tracked paths PASS。
- [x] 2.2 在 disposable Git fixture 中验证 `runtime/probe.txt` / generated path / environment archive counterexamples FAIL，同时 `config/tools/**` 与 `skills/tools/**` legal nested paths PASS；不得把 matcher 扩成通用 path policy。

## 3. Stable Gate command and bounded formatting

- [x] 3.1 更新 `format` / `format:check`，保留既有 bounded source/test/config surface 并仅增加 `eslint.config.mjs` 与 Gate-owned script；验证 `pnpm format:check` PASS 且命令未扩成 `prettier --check .`。
- [x] 3.2 在 `package.json` 新增稳定 `lint` 与 `quality:gate` scripts，使 `quality:gate` 仅组合 `git diff --check HEAD`、bounded formatting、selected lint 与 forbidden tracked-artifact check；验证正常 repository `pnpm quality:gate` 退出 `0`。
- [x] 3.3 用 disposable counterexamples 验证 Gate 对 tracked whitespace、651-line production source、forbidden TS suppression 与 forbidden tracked artifact 至少各自 fail-closed，并确认 650-line production source满足 source-size boundary。

## 4. Scope and integration verification

- [x] 4.1 验证 `quality:gate` script 不调用 typecheck、build、domain/acceptance tests、OpenSpec、Archify、dependency-cruiser、Knip 或 Formal Full Test，并确认未新增 baseline/waiver/registry/evidence persistence。
- [x] 4.2 在最终 candidate 上运行 `pnpm quality:gate`、`pnpm typecheck`、`pnpm build`、`pnpm test:domain`、`pnpm test:acceptance`；Gate 与既有 correctness checks 均须 PASS，但 correctness checks 只作为 Apply verification，不进入 Gate command。
- [x] 4.3 运行 OpenSpec change/all strict validation 与 `git diff --check HEAD`，确认 proposal/spec/design/tasks 与实现边界一致且无超范围 Foundation/Verification/architecture mutation。
