# Action: archive

- Run: `20260828-112-archive`
- Physical Run path: `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/100-establish-foundation-cli-surface/20260828-112-archive`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Role: `author`
- Input: `20260828-111-review-propose`
- Implementation review evidence: `20260828-109-review-apply`
- Execution mode: `detached-linux-direct-openspec-archive-no-flowkit-lifecycle`
- Skills: `.agents/skills/openspec-archive-change/SKILL.md` + `.agents/skills/openspec-sync-specs/SKILL.md`

## Archive boundary

Reviewer 109 independently approved the implementation. Owner then authorized a narrow pre-archive `revise-propose` cleanup to remove unnecessary numbered/versioned CLI terminology. Run 110 changed only OpenSpec planning wording; Run 111 independently approved that cleanup, confirmed the 109-approved implementation remained byte-identical and conformant, and reported `nextBoundary = archive`.

The user then explicitly requested Archive and a local-AI handoff. OpenSpec 1.10.0 archive guidance was consumed. The new `foundation-cli-surface` capability was synchronized into canonical main specs, and the Change was materialized under the Delivery ordinal naming convention `011`.

## Stable output boundary

- archived Change: `openspec/changes/archive/2026-08-28-011-establish-foundation-cli-surface/`
- added canonical spec: `openspec/specs/foundation-cli-surface/spec.md`
- Delivery-group Change state: `completed`
- durable Run 112 archive record
- Archive Closure Snapshot for local checkpoint handoff

## Preserved contract

- one real build/bin-backed `flowkit` surface exposing only `status`, `next`, and `doctor`;
- exact caller-selected current Run authority, plus explicit `currentRunId:null` for the canonical no-current-Run branch;
- Run history ordering remains reporting-only and never selects authority;
- `next` delegates lifecycle legality to canonical Policy and never auto-executes the returned boundary;
- checkpoint handling is authorization evaluation only and never performs Git mutation;
- `doctor` resolves exact managed OpenSpec/Archify identity and validates OpenSpec exact-root observation; it does not materialize Archify Delivery projections;
- production does not read or execute `.agents/skills/**` and does not introduce self-hosting;
- no internal V1/V2/V3 product/API version hierarchy is part of the canonical contract.

## Non-claims

- Archive success is not Delivery Full Test Verification PASS.
- `verificationVerdict = null` remains correct.
- This Run does not perform or authorize a Git checkpoint.
- The final planned Change is not activated by this Archive Run.
- Delivery Final, Archify Final materialization, and Owner promotion remain outside this Run.
