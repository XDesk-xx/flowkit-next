## Why

D03 finalization proof exposed a bounded set of correctness and continuity gaps in already-accepted execution mechanics: Action preparation currently commits `prepared` before package-bound readiness can fail correction-safely, two contract tests still skip on Windows, continuation Guidance does not yet state the full materially-required-uncommitted-state invariant, and canonical Author Guidance still carries superseded phase literals. These should converge before Formal Full Test so D03 closes on current, cross-platform, correction-safe semantics rather than carrying known defects into finalization.

## What Changes

- Make Action preparation atomic inside the existing single-Action invocation boundary: stage a structurally valid `prepared` candidate, form one exact ActionPackage, run a read-only package-bound preparation/readiness step, and expose/commit `prepared` only when preparation passes.
- Preserve the exact same ActionPackage / canonical Guidance identity across preparation and execution; preparation failure skips execution and returns the pre-invocation current Action unchanged so existing correction flow remains legal.
- Converge canonical/bootstrap `archive` HOW so archive readiness is a real self-check, `archiveAllowed` does not imply a second Owner archive authorization, and a blocker requiring accepted-byte correction stops before archive mutation.
- Replace exactly two Windows-only test skips with Linux-hosted semantic simulations of the same platform-agnostic contracts: real low-privilege host-read denial for unreadable Guidance, and Git-index executable-mode mutation under `core.filemode=false` for Windows-relevant worktree behavior.
- Converge Author handoff HOW to require the latest delta plus all materially required uncommitted ancestor state, while keeping cumulative packages or exact retrievable ancestor references as the bounded mechanisms.
- Remove superseded D03 phase literals from the current canonical Author Guidance spec while preserving historical Runs/OpenSpec archives as provenance.
- Strengthen product/bootstrap Explore HOW with proportional concept-ownership/existing-mechanism and mutation/failure-ordering checks.
- Do not add a new Action, lifecycle state, Policy transition, Owner archive authority, preparation identity family, Windows abstraction, payload registry, continuation database, or control plane.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `single-action-execution-terminal-boundary`: make package-bound preparation correction-safe and atomic with respect to committing the `prepared` current Action.
- `action-guidance-execution`: require preparation HOW and execution HOW to consume the same exact ActionPackage / canonical Guidance identity before any product Guidance HOW runs.
- `author-action-guidance`: converge archive readiness/correction HOW, continuation completeness, current-truth canonical wording, and the generic proof-Explore concept/mutation-order discipline.

## Impact

Expected implementation is bounded to the existing single-Action execution seam, focused domain tests, canonical/bootstrap Author Guidance, relevant Author Guidance tests, and two Linux-hosted cross-platform semantic-simulation tests. Native Windows execution is not an acceptance prerequisite. No dependency-resolution input, Policy table, Action identity set, lifecycle state set, ActionPackage identity model, Reviewer Guidance contract, Archify artifact, or Memo state is changed by this Change.
