## 1. Normalize Historical Archive Identity

- [x] 1.1 Verify the seven date-only source archives exist, the mapped `014..020` target archives do not already exist, and the mapping exactly matches approved Explore/Review Explore evidence before any rename proceeds.
- [x] 1.2 Rename exactly the seven historical archive directories to their approved ordinal-bearing names (`014..020`) and verify no already-numbered archive (`001..013`, `021`, `022`, current `023`) is renamed or renumbered.
- [x] 1.3 Update exactly the corresponding 21 durable archive-Run path references in `action.md`, `context.json`, and `result.json`; verify an exact-string search finds no remaining durable Run reference to any of the seven old paths.

## 2. Converge Ordinal Tests to Durable Semantics

- [x] 2.1 Replace the two date-only archive path assertions in `tests/unit/domain/author-action-guidance.test.ts` with immutable assertions for the normalized `014..020` archive paths and verify all seven old archive names are absent from the focused test.
- [x] 2.2 Remove permanent assertions that require named Changes to remain `active`/`planned` or require `next === 23`; retain or strengthen synthetic fixture coverage for positive/unique assigned ordinals, planned-no-reservation, cancelled-slot consumption, `max + 1`, and malformed/duplicate fail-closed behavior, then verify the focused test passes after legal current Delivery state is read.

## 3. Verify Bounded Convergence

- [x] 3.1 Search the tracked repository for each of the seven old archive paths and verify zero references remain; separately verify the seven normalized `014..020` archive paths and their exact durable references exist.
- [x] 3.2 Run the focused ordinal/Author Guidance test and the relevant domain test surface directly through the restored detached runtime/dependencies; verify the pre-existing transient-state failure is gone and no new repository failure is introduced.
- [x] 3.3 Run strict OpenSpec validation for this `skip_specs` Change plus applicable canonical/archive validation and `git diff --check`; verify no product spec delta, dependency-resolution input change, Core/Product Guidance/architecture mutation, or Reviewer Guidance convergence has been introduced.
- [x] 3.4 Produce the bounded Author apply handoff with real verification facts and STOP at `review-apply`; do not activate `converge-reviewer-action-guidance`.
