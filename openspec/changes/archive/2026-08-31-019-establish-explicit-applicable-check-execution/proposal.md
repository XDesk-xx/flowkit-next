## Why

Flowkit currently has durable Run/Result facts but no bounded machine contract that proves an explicitly required check was executed against the exact current repository candidate with the exact declared command, config, tool, and environment identity. Without that binding, a PASS-shaped fact can be structurally present without being safe to admit or reuse for the current Action.

## What Changes

- Add an explicit applicable-check execution capability for checks that are already required by approved formal execution input; Flowkit does not infer which checks apply.
- Derive the current candidate identity inside the trusted Flowkit Action host from the host-owned canonical repository root and actual Git-visible worktree, excluding only `.flowkit/runs/**` so current Run persistence cannot self-invalidate the candidate; the applicable-check plan cannot select or override the repository root.
- Bind each required check to an exact identity covering ordered program/argv plus material config, tool, and environment refs.
- Form one closed execution input bound to the exact ActionPackage, derived candidate, and complete declared-check set; execution and Result admission consume the same identity.
- Record compact mechanical execution facts under the existing Result facts surface and admit them only when the current candidate and declared fact set still match exactly.
- Permit explicit prior-success reuse only when the Flowkit-derived candidate identity and exact check identity both match; otherwise rerun.
- Keep applicable-check facts separate from Formal Verification, Reviewer verdicts, Owner authority, Policy decisions, and lifecycle progression.

## Capabilities

### New Capabilities
- `applicable-check-execution`: Bounded execution, admission, and exact same-candidate reuse of explicitly required mechanical checks.

### Modified Capabilities

## Impact

- Adds a small Foundation domain/execution surface for applicable-check plan validation, candidate/check/input identity derivation, exact shell-free execution, compact Result facts, admission, and reuse eligibility.
- Reuses the existing ActionPackage and RunResult facts surfaces rather than adding a fourth Run artifact or evidence platform.
- Uses Git-visible worktree facts for candidate identity but does not add Git authority, candidate snapshots, history scans, registries, planners, caches, or background execution.
- No new external dependency is expected.
