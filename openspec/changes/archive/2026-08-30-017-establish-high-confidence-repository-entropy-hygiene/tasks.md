## 1. Reachability Checker

- [x] 1.1 Add a small repository-local production reachability checker that consumes dependency-cruiser JSON, validates the exact roots `src/cli/entrypoint.ts` and `src/domain/index.ts`, traverses resolved local `src` edges, and verify the current repository reports 18/18 reachable with exit 0.
- [x] 1.2 Make the checker report deterministic sorted unreachable `src` paths and fail closed for missing/invalid roots or malformed graph input; verify focused checker tests cover successful and invalid-input behavior.

## 2. Counterexample Coverage

- [x] 2.1 Add a focused isolated-unreachable-source fixture/test and verify the entropy check exits non-zero and identifies that source.
- [x] 2.2 Add an internally connected unreachable-subgraph fixture/test and verify every module in the dead subgraph is reported even though the modules reference each other.
- [x] 2.3 Add a production source referenced only by tests/specs and verify it remains unreachable from the production roots and still causes failure.

## 3. Stable Repository Command

- [x] 3.1 Add independent `quality:entropy` package script using the existing `dependency-cruiser 18.2.0` graph extraction plus the bounded reachability checker; verify `pnpm quality:entropy` passes on the accepted repository baseline.
- [x] 3.2 Verify this Change does not add Knip or any other dependency, does not mutate `pnpm-lock.yaml` for tool adoption, and does not change the meanings of `quality:gate` or `quality:dependency-health`.

## 4. Integration Verification

- [x] 4.1 Run the focused entropy tests and all four required counterexample/baseline cases, verifying healthy baseline passes and each unreachable-production case fails for the intended reason.
- [x] 4.2 Run `pnpm quality:gate`, `pnpm quality:dependency-health`, `pnpm typecheck`, and `pnpm build`, and verify all remain PASS after the bounded entropy implementation.
- [x] 4.3 Run OpenSpec strict validation for this Change and `openspec validate --all --strict`, then run `git diff --check HEAD`; verify there is no baseline/waiver/cache/changed-file planner, automatic cleanup, unused-package scanner, registry/platform, or lifecycle-state expansion in the final diff.
