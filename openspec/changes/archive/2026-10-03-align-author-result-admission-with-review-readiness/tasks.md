## 1. Successful Result admission

- [x] 1.1 Add managed planning-complete and exact `proposal.md` / `design.md` / `tasks.md` hash-presence checks to new terminal Author `PASS` Propose/Revise Propose finish; verify focused CLI tests reject incomplete planning or a missing required key before either terminal machine file is written.
- [x] 1.2 Reuse the existing generic candidate hash checker for new terminal Author `PASS` Apply/Revise Apply finish; verify focused tests reject empty, malformed, linked, missing, and drifted candidate identities before terminal writes.

## 2. Preserve handoff boundaries

- [x] 2.1 Verify complete Propose and Apply Results can finish and their corresponding Reviewer start still rereads current files; verify post-finish drift blocks Review and an already confirmed legacy Propose Result retains its current read rule.
- [x] 2.2 Verify genuine Author `FAIL`, nonterminal outcomes, and exact duplicate-finish readback do not acquire a fabricated successful-candidate requirement or rewrite existing Run bytes.

## 3. Convergence and verification

- [x] 3.1 Run focused regression tests, typecheck, formatting/lint checks, and strict OpenSpec validation; record the actual results without treating them as Reviewer approval or a Formal Full Test.
- [x] 3.2 Inspect the final diff and Git status to confirm the pre-existing Delivery Run sequence edits and historical Runs remain outside this Change; verify no package installation or Git checkpoint occurred during Apply.

## Apply verification (2026-10-03)

- Focused Node tests: `action-command-cli.test.ts` and `action-planning-hashes.test.ts`, 6/6 PASS.
- `pnpm typecheck`, `pnpm format:check`, `pnpm lint`, and managed OpenSpec 1.10.0 `validate align-author-result-admission-with-review-readiness --strict`: PASS.
- `git diff --check`: PASS. Final Git status shows no historical `.flowkit/runs/**` edits. Pre-existing Delivery Run sequence changes in `action-commands.ts` / `current-run-chain.ts` and `delivery-run-sequence.test.ts` remain outside this Change. No package installation or Git mutation was performed during Apply.
- These checks are Author verification only; no independent Reviewer verdict or Formal Full Test is claimed.
