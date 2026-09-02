## 1. Atomic Action Preparation

- [x] 1.1 Refactor the existing single-Action invocation so a new prepared candidate is staged locally, one exact ActionPackage is formed, and a package-bound preparation callback can block before the staged current Action is externally committed; verify focused tests cover empty/terminal entry, same-prepared reuse, blocked preparation, ready preparation, and unchanged execution/admission/terminal behavior.
- [x] 1.2 Prove preparation and execution receive the same exact ActionPackage/Guidance identity and that Guidance/package resolution failure invokes neither callback; verify focused Action Guidance and ActionPackage tests pass without a new PreparationPackage/Run/Result/state.
- [x] 1.3 Verify a correction-requiring blocked archive preparation returns the prior terminal `review-apply` boundary so existing Owner-controlled `revise-apply` remains Policy-legal, while an already-prepared Action preserves existing retry semantics.

## 2. Author Guidance and Canonical Convergence

- [x] 2.1 Converge product/bootstrap archive Guidance to real package-bound readiness, `completion-transition readiness`, no second Owner archive execution authorization, STOP-before-mutation correction handling, and environment-only same-candidate retry; verify focused Author Guidance tests cover the normative semantics.
- [x] 2.2 Converge only the Author product/bootstrap entries that materially own handoff so continuation carries the latest delta plus all materially required uncommitted ancestor state and exact removals when needed; verify focused tests prove cumulative or exact-ancestor-reference reconstruction without introducing a registry/database.
- [x] 2.3 Add proportional concept-ownership/existing-mechanism and mutation/failure-ordering checks to canonical product Explore and independent proof-based Explore HOW; verify focused tests preserve bootstrap independence and do not require the checks for simple non-mutating work.
- [x] 2.4 Converge the current `author-action-guidance` canonical semantics through this Change delta by removing stale Change-2 transition literals while leaving archived OpenSpec Changes, historical Runs and Git history untouched; verify OpenSpec strict validation passes.

## 3. Cross-platform Proof Mechanics

- [x] 3.1 Replace the Windows-only unreadable canonical Guidance skip with a Linux-hosted semantic simulation that creates a real low-privilege `EACCES` against the real resolver; verify canonical Guidance resolution fails closed with no platform skip and explicitly avoid claiming native Windows ACL/`icacls` mechanics.
- [x] 3.2 Replace the Windows-only worktree-`chmod` executable-mode skip with a Linux-hosted Git-index simulation using `core.filemode=false` plus `git update-index --chmod=+x/-x`; verify identical bytes with Git-visible `100644` vs `100755` produce different candidate identities and the separate symlink host-capability guard remains unchanged.

## 4. Final Candidate Verification

- [x] 4.1 Run the relevant focused domain suites plus the full domain suite and confirm no regression in Policy/lifecycle/ActionPackage/Guidance/Applicable Check behavior.
- [x] 4.2 Run typecheck, build, lint/format, dependency-health, repository-entropy, forbidden-artifact, OpenSpec strict and `git diff --check` checks using the unchanged detached dependency snapshot when resolution inputs remain identical; verify no `src/**` expansion beyond the bounded single-action execution seam and no dependency/Policy/Archify/Memo-state drift.
