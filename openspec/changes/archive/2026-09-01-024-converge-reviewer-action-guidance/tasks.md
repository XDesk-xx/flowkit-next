## 1. Canonical Reviewer Product Guidance

- [x] 1.1 Add `skills/actions/review-explore/SKILL.md` with the approved independent truth/scope/proof/Proposal-readiness review contract, common Reviewer authority boundaries, required step/complexity/scope-drift reporting, invariant/literal challenge, concise handoff and terminal STOP; verify focused Guidance tests resolve it as the exact `review-explore` canonical entry.
- [x] 1.2 Add `skills/actions/review-propose/SKILL.md` with approved Explore traceability, minimal/testable contract review, review-chain discipline, common Reviewer boundaries/reporting and terminal STOP; verify focused Guidance tests resolve it as the exact `review-propose` canonical entry.
- [x] 1.3 Add `skills/actions/review-apply/SKILL.md` with approved-Proposal fidelity, implementation convergence/evidence review, mutation-free findings, common Reviewer boundaries/reporting and terminal STOP; verify focused Guidance tests resolve it as the exact `review-apply` canonical entry.

## 2. Independent Stable Core Bootstrap Reviewer Parity

- [x] 2.1 Converge `.agents/skills/review-explore/SKILL.md`, `.agents/skills/review-propose/SKILL.md`, and `.agents/skills/review-apply/SKILL.md` in place with the accepted common Reviewer disciplines while keeping each independently executable; verify focused tests/inspection prove none reads, invokes, delegates to, or becomes a thin pointer to candidate `skills/actions/review-*` Guidance.

## 3. Temporary Run-Bridge Retirement

- [x] 3.1 After canonical/bootstrap Reviewer coverage is present, remove the live `TEMPORARY-RUN-SURFACE-GUIDANCE.md` and its active `AGENTS.md` bridge reference, then update only live focused-test expectations that required the temporary document; verify historical `.flowkit/runs/**` and archived OpenSpec provenance are not rewritten for old mentions.

## 4. Reviewer Guidance Contract Tests

- [x] 4.1 Add or converge focused repository tests that prove exactly three canonical Reviewer entries, Action alignment/content ownership, mutation-free/authority/STOP boundaries, required step/complexity/scope-drift reporting, review-chain and invariant/literal disciplines, bootstrap independence, and temporary-bridge takeover; verify the focused Reviewer Guidance suite passes without modifying `src/**`.

## 5. Change Verification

- [x] 5.1 Run existing Action Guidance/Core focused tests plus the full domain suite and verify all tests pass with no Core contract regression.
- [x] 5.2 Run OpenSpec strict validation for `converge-reviewer-action-guidance` and canonical specs, plus repository typecheck/lint/format and `git diff --check`; verify no dependency/lockfile, Memo-state, architecture, Registry/Router/Planner/Runtime, or unrelated product mutation was introduced.
