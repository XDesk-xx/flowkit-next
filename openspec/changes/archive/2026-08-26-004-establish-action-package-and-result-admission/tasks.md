## 1. ActionPackage domain seam

- [x] 1.1 Add the minimal closed ActionPackage type/validator by reusing existing Run occurrence, ActionIdentity, execution-role, lifecycle-state, OwnerAuthorityFact and previousRunId contracts; verify focused unit tests accept structurally valid prepared/resumed packages and reject malformed or terminal package state.
- [x] 1.2 Add the smallest pure package-formation operation over already-validated exact `CurrentAction` + current `RunContextRecord` (or equivalent canonical facts); it SHALL copy the exact run/action/expected-role/state/authority/predecessor facts only after identity/state equality, `prepared | resumed`, and deterministic execution-role checks pass, and SHALL fail closed for terminal/null state, mismatched ActionIdentity/state, or role mismatch. Verify prepared and resumed formation success plus terminal/null/mismatch rejection; do not add persistence I/O, Policy, transport, new identity or replay machinery.
- [x] 1.3 Add the closed Standard Action → execution-role mapping without a dynamic registry; verify unit tests cover every canonical Standard Action and reject role mismatch at admission.

## 2. Exact Result admission

- [x] 2.1 Implement a pure fail-closed admission boundary over ActionPackage + exact current Action + exact current Run occurrence + candidate Result; verify tests reject ActionIdentity mismatch, lifecycle-state mismatch and stale same-Action Run occurrence while accepting exact prepared/resumed matches.
- [x] 2.2 Enforce exact candidate Result run/action linkage and Author/Reviewer outcome-slot ownership, with Standard Action verificationVerdict remaining inapplicable; verify positive Author/Reviewer cases and negative cross-slot/Verification-claim cases.
- [x] 2.3 Keep successful admission bounded to returning the admitted Result fact without persistence mutation, terminal transition or Policy interpretation; verify a valid reported nextBoundary is preserved as opaque data and no automatic lifecycle transition occurs.

## 3. Integration and regression verification

- [x] 3.1 Export the new domain seam through the existing domain index and verify TypeScript typecheck succeeds with no new dependency.
- [x] 3.2 Run focused/new domain tests plus the existing domain regression suite and verify all tests pass, including stale prepared→resumed and stale prior same-Action occurrence cases from Explore.
- [x] 3.3 Run repository format check and `openspec validate establish-action-package-and-result-admission --strict` plus `openspec validate --all --strict`; verify planning artifacts are valid and existing canonical capabilities remain valid.
