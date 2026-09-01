## 1. Closed Input And Identity Contracts

- [x] 1.1 Add closed validators/types for approved applicable-check plan declarations that contain only required-check declarations and reject caller-supplied repository root, candidate/check/execution identities, duplicate checks, duplicate material refs, and incomplete declarations; verify focused validator tests cover all rejection cases.
- [x] 1.2 Implement deterministic check identity derivation from checkId, exact program, ordered argv, and canonical config/tool/environment ref sets; verify identical declarations are stable and command/config/tool/environment changes produce different checkRefs.
- [x] 1.3 Implement the closed resolved execution-input contract that binds the exact ActionPackage identity, current candidateRef, and complete resolved check set into one executionInputRef; verify add/remove/change/duplicate declaration counterexamples fail or change identity as specified.

## 2. Trusted Candidate Identity

- [x] 2.1 Implement one-shot candidate manifest enumeration from the host-owned canonical repository root covering tracked paths, non-ignored untracked regular/symlink paths, and tracked-deleted paths while excluding only `.flowkit/runs/**`; verify disposable Git fixtures show ignored untracked material is absent, caller root override is rejected, and Run-only changes do not change candidateRef.
- [x] 2.2 Include canonical path, kind, Git-visible mode, and bytes/link-target/missing identity in candidate hashing, including `100644`, `100755`, `120000`, and tracked deletion; verify same-byte `100755→100644`, symlink-target change, content change, and tracked deletion each change candidateRef.
- [x] 2.3 Fail candidate derivation closed on unsupported/ambiguous path kinds or unreadable material and verify focused negative fixtures do not produce a reusable candidateRef.

## 3. Exact Mechanical Execution And Facts

- [x] 3.1 Implement exact repository-root check execution using declared program + ordered argv with `shell=false`; verify disposable success, non-zero failure, and abnormal process-outcome fixtures produce truthful mechanical statuses.
- [x] 3.2 Add the compact reserved applicable-check structure under existing RunResult facts, bound to executionInputRef, candidateRef, checkId, and checkRef without adding a new top-level Result field or fourth Run artifact; verify existing RunResult validation remains compatible when the reserved fact set is absent.
- [x] 3.3 Implement current fact construction for newly executed checks and explicit eligible reused success, ensuring failed/process-failed facts cannot be represented as reused success; verify focused fact-validation tests.

## 4. Admission And Reuse

- [x] 4.1 Implement applicable-check Result admission against the same resolved execution input, re-derive current candidateRef at admission, and reject candidate drift, executionInputRef mismatch, candidateRef mismatch, missing facts, duplicate facts, unexpected facts, or checkRef mismatch; verify each fail-closed counterexample independently.
- [x] 4.2 Implement explicit prior-success reuse eligibility requiring exact current Flowkit-derived candidateRef + current derived checkRef equality and successful prior status; verify exact matches reuse while source/mode/config/tool/environment drift and prior failures force execution.
- [x] 4.3 Verify reuse performs no automatic `.flowkit/runs` history scan, cache lookup, timestamp freshness, or best-match selection and that the current Result still contains an explicit current `reused-passed` fact.

## 5. Integration And Regression

- [x] 5.1 Integrate the applicable-check execution seam with the existing ActionPackage/RunResult boundary without changing Reviewer, Verification, Owner, Policy, or next-Action authority; verify mechanical success alone cannot create those verdicts or advance lifecycle.
- [x] 5.2 Run focused candidate/check/execution/admission/reuse tests plus the existing ActionPackage, Run/Result, Policy/coordination, domain, typecheck, build, lightweight gate, dependency-health, entropy, and strict OpenSpec validations; verify the full selected regression set passes with no new dependency, registry, planner, evidence/cache/history, or candidate-snapshot subsystem.
