# Action: archive

- Run: `20260827-090-archive`
- Physical Run path: `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/082-establish-managed-toolchain-resolution/20260827-090-archive`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-managed-toolchain-resolution`
- Role: `author`
- Input: `20260827-089-review-apply`
- Execution mode: `detached-linux-direct-openspec-archive-no-flowkit-lifecycle`
- Skills: `.agents/skills/openspec-archive-change/SKILL.md` + `.agents/skills/openspec-sync-specs/SKILL.md`

## Archive boundary

Reviewer 089 approved the revised Apply and reported `nextBoundary = archive`. The user explicitly requested Archive. OpenSpec 1.10.0 synchronized the new `managed-toolchain-resolution` capability into canonical main specs, then the archived Change was materialized using the Delivery Change ordinal naming convention `009`.

## Stable output boundary

- archived Change: `openspec/changes/archive/2026-08-27-009-establish-managed-toolchain-resolution/`
- added canonical spec: `openspec/specs/managed-toolchain-resolution/spec.md`
- Delivery-group Change state: `completed`
- durable Run 090 archive record
- Archive Closure Snapshot for local checkpoint handoff

## Preserved contract

- exact managed runtime identity is limited to `openspec` and `archify`;
- managed runtime resolution is `FLOWKIT_HOME`-confined and fail-closed;
- no PATH/global fallback;
- Node remains host compatibility via `package.json#engines.node`, not exact managed-tool authority;
- pnpm remains repository package-manager identity, not a managed runtime target;
- resolution does not install, download, update, invoke, or interpret tool lifecycle output.

## Non-claims

- Archive success is not Delivery Full Test Verification PASS.
- `verificationVerdict = null` remains correct.
- This Run does not perform or authorize a Git checkpoint.
- The next planned Change is not activated by this Archive Run.
