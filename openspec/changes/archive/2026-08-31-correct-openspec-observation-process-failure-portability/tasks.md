## 1. Portable OpenSpec process-outcome boundary

- [x] 1.1 Extract the existing `code === null || signal !== null` close-outcome decision into the smallest internal pure classification seam needed for deterministic tests, while preserving current runtime behavior and keeping the seam out of `src/domain/index.ts`; verify focused tests prove the public OpenSpec observation API and diagnostic taxonomy are unchanged.
- [x] 1.2 Replace the universal child self-`SIGKILL` contract assertion with deterministic host-observable abnormal-outcome coverage for `code=null` and/or `signal!=null`; verify both cases classify as `openspec-process-failed` without any `process.platform`, exit-code, stdout, or stderr heuristic.
- [x] 1.3 Add/retain a real numeric-close fixture with malformed or empty required stdout; verify it classifies as `malformed-machine-output` on the current host and cannot be reclassified from hidden OS cause.
- [x] 1.4 Preserve the valid machine JSON + numeric non-zero fixture; verify it remains `openspec-formal-outcome` and no free-text OpenSpec lifecycle inference is introduced.

## 2. Scope and regression closure

- [x] 2.1 Verify the production diff contains no Windows/exit-code special case, no generic process supervisor/runtime abstraction, no new dependency, and no package/lock mutation; if the existing observable behavior cannot be preserved with the bounded internal seam, STOP and return to Proposal review rather than broaden Apply.
- [x] 2.2 Run the focused `openspec-observation-boundary` suite on Linux and, when a Windows execution environment is available, on Windows; verify the former Windows-only red case is replaced by portable deterministic coverage and all focused cases pass without platform skips.
- [x] 2.3 Run the complete domain suite, typecheck, `quality:gate`, `quality:dependency-health`, `quality:entropy`, build, `git diff --check`, current Change strict validation, and `openspec validate --all --strict`; verify all required checks pass with no unrelated repository mutation.
