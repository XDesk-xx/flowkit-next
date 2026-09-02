## Context

See `proposal.md` for motivation. The current invocation commits a structural `prepared` Action before Run-context/Guidance/package validation and before any archive-specific readiness can block. The accepted Guidance contract requires product HOW to execute only under an exact ActionPackage whose canonical Guidance identity is already frozen. D03/D04 self-development also keeps `.agents/skills/**` independent from candidate product Guidance.

## Goals / Non-Goals

**Goals:**

- Preserve the existing Standard Action set and `prepared`/`terminal` lifecycle while making preparation capable of real, non-mutating package-bound readiness.
- Ensure a preparation blocker can leave the pre-invocation current Action unchanged and correction-capable.
- Keep preparation and execution under one exact ActionPackage/Guidance identity.
- Remove the two Windows-only proof gaps without changing production semantics.
- Converge Author Guidance/spec/handoff HOW to current truth with no new persistence subsystem.

**Non-Goals:**

- No `pre-archive`/Preparation Standard Action, lifecycle state, Run/Result/Package identity family, Policy transition, rollback lifecycle, Registry/Planner/Runtime, Windows filesystem abstraction, or Owner archive execution authorization.
- No cleanup of the separate host-capability symlink skip.
- No Memo-state mutation, Archify/finalization work, dependency change, or historical Run/OpenSpec rewrite.

## Decisions

### 1. Stage a prepared candidate inside the existing invocation and commit it only after package-bound preparation passes

For an empty/terminal current slot, `invokeSingleAction` will derive a structurally valid `prepared` candidate locally without exposing it as the returned/current state yet. Exact Run context and canonical GuidanceRef are validated against that staged identity and one exact ActionPackage is formed.

A bounded preparation callback receives that exact ActionPackage before the normal execution callback. Its outcome is intentionally small (`ready` vs `blocked`; thrown/rejected preparation is treated as blocked/failure). It is not persisted as a new Result or identity.

- `blocked`: do not call the execution callback; return the pre-invocation current Action unchanged.
- `ready`: continue with the exact staged/previously-prepared identity and the same ActionPackage through existing execution, admission and terminalization.

If the incoming current Action is already exact `A/prepared`, it remains the current Action on preparation failure because there is no new state to roll back; this preserves the existing retry semantics for already-prepared invocations.

**Why this over a host check before ActionPackage formation:** product Guidance HOW must not run before the exact Guidance identity is frozen into ActionPackage, and repository inspection found no existing production host seam that already owns such pre-package Guidance execution.

**Why this over a new lifecycle phase/state:** staging plus commit ordering provides the needed failure atomicity without changing lifecycle identity or Policy.

### 2. Keep one ActionPackage identity for preparation and execution

Preparation and execution consume the same exact package object/identity. No `PreparationPackage`, attempt id, resumed flag or second Guidance identity is introduced. Guidance resolution failure prevents both callbacks.

The smallest API change should preserve the existing `invokeSingleAction` role: add one bounded preparation callback to the invocation contract rather than a new manager/subsystem. Exact function signature may be adjusted for readability during Apply, but tests must prove the single-package identity and state-atomic outcomes rather than a particular parameter layout.

### 3. Archive readiness remains Guidance HOW, while Core only provides the package-bound atomic seam

Canonical/bootstrap archive HOW defines the readiness facts: exact accepted `review-apply` after `apply`/`revise-apply`, candidate continuity, active exact Change, persisted ordinal validity, OpenSpec/task/delta-sync readiness, archive target collision/identity, completion-transition readiness, handoff/removal readiness and known correction blockers.

The Core seam does not know these archive facts. It only guarantees that package-bound preparation may block before a newly staged `prepared` Action becomes externally committed.

A blocker requiring repository/canonical byte mutation stops before archive execution. Existing Owner-controlled `revise-apply` correction then applies, followed by a fresh `review-apply`. Environment-only failure with unchanged bytes may retry the same candidate.

### 4. Replace only the two Windows-specific proof skips with Linux-hosted semantic simulations

- **Unreadable canonical Guidance:** the production resolver has no Windows/POSIX behavior branch; its contract-relevant input is successful canonical-file read versus a real host read failure. Use the detached Linux environment to create a real low-privilege `EACCES` against the real resolver and assert fail-closed behavior. This simulates the Windows ACL-denial semantic at the product boundary; it does not claim to reproduce `icacls` mechanics and does not require native Windows execution.
- **Git executable mode:** use Git index semantics (`git update-index --chmod=+x/-x`) in a temporary Linux repository with `core.filemode=false`, prove file bytes stay identical while Git-visible mode changes `100644 ↔ 100755`, and assert the real candidate identity changes. This directly simulates the Windows-relevant worktree limitation while exercising the canonical Git-visible identity path.

The separate symlink host-capability guard is left untouched.

### 5. Converge handoff and Explore HOW without building shared execution identity graphs

Author product/bootstrap entries that already own continuation/handoff will state the invariant: latest delta plus all materially required uncommitted ancestor state, delivered cumulatively or by exact retrievable ancestor references; deletions carry exact removal information. Do not copy this text mechanically into Skills that do not own handoff.

Product `explore` and independent proof-based Explore add proportional checks for concept ownership/existing mechanisms and mutation/failure ordering. The reusable rule stays technology-neutral; Flowkit-specific terms are examples only.

### 6. Canonical spec cleanup changes current truth, not history

The active delta removes the obsolete Change-2 transition requirement and replaces named current-state ordinal examples with generic stable scenarios. Archived OpenSpec Changes, old Runs and Git history remain untouched.

## Risks / Trade-offs

- **[Preparation callback becomes a hidden second Action]** → Keep it inside one invocation, same ActionPackage, no separate Run/Result/state, and no Policy decision.
- **[Staged-state implementation accidentally leaks on blocked preparation]** → Focused tests must assert the exact pre-invocation current Action is returned and execution callback is not called.
- **[Already-prepared retry semantics regress]** → Preserve exact prepared Action reuse and test preparation failure on both newly staged and already-prepared inputs.
- **[Cross-platform proof accidentally tests host tooling instead of product semantics]** → Keep acceptance at the product boundary: real Linux host-read denial for resolver fail-closed behavior, and `core.filemode=false` + Git-index mode mutation for executable-bit identity. Do not claim native Windows ACL/tooling coverage and do not add a production platform seam.
- **[Handoff wording becomes repetitive]** → Update only Guidance entries that materially own continuation; test semantics rather than exact duplicated prose.

## Migration Plan

1. Implement and focused-test package-bound atomic preparation ordering.
2. Converge archive/explore/handoff product and bootstrap Guidance plus focused contract tests.
3. Replace the two Windows-only skip mechanics and run both approved Linux-hosted semantic simulations against the exact candidate bytes.
4. Run the full relevant domain/engineering/OpenSpec checks with unchanged dependency-resolution inputs.
5. Review exact diff; on approval, archive the Change so spec deltas converge into canonical current truth.

Rollback before archive is ordinary Git/worktree reversion of this Change candidate; no persistent migration or external data conversion is introduced.
