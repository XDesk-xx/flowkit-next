## 1. OpenSpec Observation Boundary

- [x] 1.1 Add the closed OpenSpec observation types/diagnostics and export surface for active Change set plus exact Change status; verify focused tests reject invalid inputs and expose no generic arbitrary-command API.
- [x] 1.2 Implement internal managed OpenSpec invocation using existing `resolveManagedTool("openspec")`, current host `process.execPath`, argument-array child process, and canonical requested cwd; verify tests prove fake/conflicting PATH OpenSpec is never selected and managed-resolution failures do not fallback.
- [x] 1.3 Implement JSON-first outcome classification and exact-root binding; verify focused tests distinguish valid non-zero OpenSpec formal outcomes from process/malformed-output failures and reject nearest-root/root-path mismatch.

## 2. Read-only Machine Observations

- [x] 2.1 Implement active Change observation over closed `list --json` invocation and project only canonical Change identifiers; verify tests reject malformed machine shape/invalid Change ids and do not expose task/timestamp/free-text list fields.
- [x] 2.2 Implement exact Change status observation over closed `status --change <id> --json` invocation and project only approved schema/planning/artifact fields; verify tests cover exact change identity, `ready|blocked|done|skipped`, `requires`/`missingDeps`, malformed status shape, and no filesystem/Markdown readiness inference.
- [x] 2.3 Keep observations transient and authority-neutral; verify tests show no `.flowkit` state mirror/write, no OpenSpec mutation, and no dependency on `.agents/skills/**`, Policy, Memo, Action lifecycle or Run/Result modules.

## 3. Verification

- [x] 3.1 Run focused observation tests plus the complete domain suite, typecheck, format check, and strict OpenSpec Change/all-spec validation; verify all pass without adding npm dependencies or modifying contracts outside this Change.
- [x] 3.2 Re-run observation proof against the real managed OpenSpec 1.10.0 fixture for exact-root `list/status`, missing-Change non-zero machine outcome, fake PATH isolation, and nested-root rejection; verify all approved V1 invariants hold.
- [x] 3.3 Run the repository TypeScript code gate on every new/modified TypeScript file; verify no file introduced or modified by this Change exceeds 500 lines and do not perform unrelated refactors of historical over-limit files.
