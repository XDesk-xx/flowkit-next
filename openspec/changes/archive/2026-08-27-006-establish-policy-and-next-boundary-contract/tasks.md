## 1. Policy Domain Surface

- [x] 1.1 Add `policy-and-next-boundary` domain types/constants for the closed `ready-action` / `ready-checkpoint-evaluation` / `blocked` decisions, exact terminal `RunContextRecord` + `RunResultRecord` input linkage and blocked-reason catalog, and verify focused runtime tests reject malformed/unknown Policy inputs without normalization.
- [x] 1.2 Export the new Policy domain surface from the existing domain index without adding dependencies, and verify TypeScript resolves the public types/functions through the index.

## 2. Deterministic Normal Boundary

- [x] 2.1 Implement exact completed-Archive precedence before the generic non-active guard, and verify tests cover completed archive PASS → checkpoint-evaluation, other non-active → `change-not-active`, and active archive PASS → `archive-completion-state-mismatch`.
- [x] 2.2 Implement active empty/prepared and the closed Author/Reviewer terminal normal matrix, and verify tests cover every Standard Action mapping plus blocked unknown/unsuccessful Author outcome and Reviewer verdict cases.
- [x] 2.3 Require exact current terminal `RunContextRecord` + `RunResultRecord` linkage before interpreting terminal outcomes by reusing existing `hasMatchingRunLinkage`; verify fresh current occurrence passes, stale previous occurrence of the same Standard Action is rejected, and wrong ActionIdentity/missing/mismatched terminal facts return `terminal-result-missing-or-mismatched`.

## 3. Handoff Consistency and Exceptional Owner Correction

- [x] 3.1 Validate non-null reported `nextBoundary` only against the deterministic normal boundary token before any correction overlay, and verify matching/null reports pass while conflicts return `reported-boundary-conflict` even when a correction request is present.
- [x] 3.2 Implement the single `revise-action` Owner correction eligibility contract and reached-stage revise-only sets, and verify proactive/current-or-earlier revisions pass only with exact current Delivery/Change and `scope=[requestedAction]` while missing/rejected authority, forward skip, prepared-slot switching and archive/completed reopening fail with the specified blocked reasons.
- [x] 3.3 Apply the final structural-enterability gate by reusing existing Action lifecycle/prepared-reuse behavior, and verify all normal READY candidates are enterable, valid Owner-corrected candidates remain enterable, and exact-same terminal `revise-*` candidates return `action-boundary-not-enterable`.

## 4. Convergence Verification

- [x] 4.1 Add focused exhaustive Policy tests for deterministic repeated decisions, the 12 normal terminal transitions, fresh-vs-stale repeated same-Action Run linkage, the 15 allowed Owner-correction combinations and the 3 exact-same terminal revise rejections; verify no test requires scheduler, automatic execution, retry/resume/reset, filesystem/OpenSpec I/O or Git/checkpoint authority.
- [x] 4.2 Run project typecheck, domain tests, repository format check and strict OpenSpec validation; verify all pass and no production mutation outside the bounded Policy module/index plus focused tests is introduced.
