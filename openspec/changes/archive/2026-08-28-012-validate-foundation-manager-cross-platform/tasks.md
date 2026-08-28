## 1. Acceptance Wiring

- [x] 1.1 Add the minimal `test:acceptance` package script and include `tests/acceptance` in the existing Prettier scope; verify no generic test orchestrator, lint script/config, runtime dependency, or production command surface is introduced.
- [x] 1.2 Create the focused Foundation Manager acceptance test surface under `tests/acceptance/**`, keep every new/modified TypeScript file below 500 lines, and verify it fails closed when the explicit detached prerequisites (`FLOWKIT_HOME`, matching managed runtimes, built `dist/**`) are missing or inconsistent.

## 2. Detached Whole-Manager Acceptance

- [x] 2.1 Build a disposable repository/OpenSpec fixture and use emitted Foundation APIs to execute a Standard `apply` Action through terminal, persist/read the exact durable Run, and verify the round-trip without using Delivery 01 bootstrap Runs as candidate authority.
- [x] 2.2 Exercise the emitted CLI against the candidate-generated fixture and verify `status` reads the exact Run, `next` on terminal Apply returns `ready-action(review-apply)`, and explicit `currentRunId:null` returns `ready-action(explore)` without history/latest inference.
- [x] 2.3 Exercise terminal Archive + exact `authorize-checkpoint` Owner authority and verify Policy returns `ready-checkpoint-evaluation`, checkpoint evaluation returns `authorized=true`, and the disposable fixture has no `.git` creation or Git command dependency.
- [x] 2.4 Run emitted `flowkit doctor` with real managed OpenSpec `1.10.0` / Archify `2.15.0`, explicit `FLOWKIT_HOME`, and fake PATH executables; verify exact managed identities/root pass, fake PATH markers remain untouched, and Archify is resolved but not materialized.
- [x] 2.5 Verify the emitted CLI accepts CRLF request JSON and request-file paths containing spaces through argv without shell-specific quoting or `shell: true` behavior.

## 3. Windows Compatibility Simulation

- [x] 3.1 Add `windows-compatibility-simulation` cases using `path.win32` and Windows fixture paths with spaces; verify Run/Memo path composition and portable managed-tool entrypoint resolution remain inside the intended Windows roots.
- [x] 3.2 Verify mixed-case same-drive containment is accepted, cross-drive candidates are outside the managed parent, and the acceptance output/documentation never reports native Windows PASS or claims `cmd.exe`, PowerShell, NTFS-specific, `.cmd` shim, or native process coverage.

## 4. Freeze Delivery Full Test Contract

- [x] 4.1 Update the Delivery verification section to freeze the explicit detached environment prerequisites: compatible Node (`>=22.20.0`; deterministic fixture `22.23.2`), restored dependencies/pnpm fixture, explicit `FLOWKIT_HOME`, exact managed OpenSpec `1.10.0` / Archify `2.15.0`, and no install/update/download/network fallback; verify `delivery.fullTestStatus` remains `not-ready`.
- [x] 4.2 Freeze the literal gate sequence as `pnpm typecheck` → `pnpm format:check` → `pnpm build` → `pnpm test:domain` → exact managed OpenSpec `validate --all --strict` → `pnpm test:acceptance`; verify lint is absent and formal execution remains `deferred` until final Change archive → exact checkpoint candidate → explicit Owner Full Test authorization.

## 5. Convergence and Verification

- [x] 5.1 Run the focused acceptance suite with built `dist/**` and real managed runtimes, then run typecheck, format check, production build, full domain regression and OpenSpec `--all --strict`; verify all gates pass and the active Change remains a `skip_specs: true` acceptance/tooling Change with no canonical spec delta.
- [x] 5.2 Compare production source/canonical product specs against the approved pre-Apply candidate and verify `src/**` plus `openspec/specs/**` are unchanged; if a real product defect requires mutation, stop and return to Proposal/Owner reauthorization instead of silently fixing it in this Change.
- [x] 5.3 Record deterministic acceptance command/result/environment evidence in the Author Run handoff for reviewer replay, explicitly label it Change evidence rather than formal Delivery Verification, and stop at `review-apply` without Full Test PASS, Archify Final, Delivery Final, checkpoint, or Owner promotion.
