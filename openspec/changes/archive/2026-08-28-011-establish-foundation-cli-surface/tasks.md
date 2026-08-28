## 1. Build and package surface

- [x] 1.1 Add a minimal production TypeScript emit config plus `build` script and verify `pnpm run typecheck` remains no-emit while the production build creates the expected `dist` tree.
- [x] 1.2 Add one package `bin.flowkit` entrypoint with Node shebang and verify the emitted CLI starts under the detached Node 22.23.2 fixture without making `22.23.2` an exact product runtime requirement.

## 2. Explicit CLI request and exact Run selection

- [x] 2.1 Implement closed `status | next | doctor` command/request parsing using required `--input <path>` JSON documents and verify unknown commands, unknown fields and malformed request shapes fail closed with machine-distinguishable errors.
- [x] 2.2 Implement explicit current-Run choice for `next`: exact caller-supplied runId uses existing occurrence parsing + `readDurableRun(...)`, while explicit `currentRunId:null` performs no Run read and maps to `currentAction=null` with null terminal facts; verify a disconnected higher-sequence Run remains present but cannot influence either branch.
- [x] 2.3 Verify omitted/undefined or malformed runId, and selected Run identity mismatch, fail closed; verify only the explicit JSON `null` form accepted by `next` represents no current Run, and neither branch invokes `listChangeRunHistory(...)` or any implicit latest-selection heuristic.

## 3. Thin command composition

- [x] 3.1 Implement `status` as a read-only projection of explicit structural facts, exact selected Run and approved OpenSpec observations; verify the command does not prepare/execute Actions or mutate lifecycle/OpenSpec/Memo/Archify/Git state.
- [x] 3.2 Implement `next` by reconstructing Policy facts from the explicit current-Run choice and delegating only to `evaluatePolicyAndNextBoundary(...)`; verify terminal Runs use their exact linked context/result, prepared Runs pass null terminal facts, explicit `currentRunId:null` yields `currentAction=null`/null terminal facts and reaches the canonical active-Change `ready-action(explore)` branch, and Policy `blocked` remains a formal machine outcome.
- [x] 3.3 Implement the pure checkpoint-authorization evaluator and verify authorization requires `ready-checkpoint-evaluation` plus exact matching Owner `authorize-checkpoint` authority with `scope=[checkpoint]`; verify wrong/missing authority is not authorized and no Git operation is executed.
- [x] 3.4 Implement `doctor` by composing existing managed OpenSpec/Archify resolution and exact-root OpenSpec observation; verify fake PATH/global tools do not take over, root mismatch fails closed, Archify is resolved but never invoked, and Node remains host compatibility rather than exact managed identity.

## 4. Machine output, regression and scope gates

- [x] 4.1 Implement deterministic JSON stdout plus closed non-zero CLI failure envelopes; verify valid Policy blocked, doctor diagnostic and `authorized=false` remain formal results while malformed input/Run/integration failures use non-zero exit.
- [x] 4.2 Add focused CLI/build tests and run the complete domain regression, typecheck, format check and strict OpenSpec validation; verify existing Policy/Run/OpenSpec/managed-tool contracts remain unchanged and all tests pass.
- [x] 4.3 Run the emitted CLI against real detached managed OpenSpec 1.10.0 and Archify 2.15.0 fixtures for representative `status`, `next` and `doctor` cases, recording proof without performing final Windows/Linux acceptance or Delivery Full Test.
- [x] 4.4 Enforce the repository code gate by verifying every new/modified TypeScript file in this Change is below 500 lines and the historical >500-line Run persistence file is not modified merely for CLI convenience.
