# Action — Revise Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-managed-toolchain-resolution`
- Action: `revise-apply`
- Logical Run id: `20260827-088-revise-apply`
- Role: `author`
- Input Run: `20260827-087-review-apply`
- Review finding: `RA-087-001`

## Revision basis

Run 087 returned `changes-requested` because the Apply implementation eagerly validated both managed-tool lock entries before selecting the requested tool. That violated the already-approved on-demand requirement: an absent or malformed peer lock entry must not block resolution of a valid requested managed tool.

This is an implementation defect, not an approved-contract defect, so revision remains inside `revise-apply`.

Skills used:

- `.agents/skills/revise-apply/SKILL.md`
- `.agents/skills/implementation-convergence/SKILL.md`

## Minimum correction

The revision keeps the existing small resolver and closed lock-root schema, but changes entry validation order:

```text
read lock JSON
→ validate closed root/schemaVersion/generatedFor
→ select requested toolId
→ fully validate only requested entry
→ resolve/validate only requested runtime
```

The peer entry is not parsed for the current resolution request. It may therefore be absent or internally malformed without blocking the requested tool.

No lazy registry, cache, migration, repair behavior, environment manager, installer/downloader/updater, PATH fallback, tool invocation or new abstraction was added.

## Focused tests

Added one focused adversarial test covering all four request-scoped peer cases:

- request OpenSpec while Archify lock entry is malformed;
- request Archify while OpenSpec lock entry is malformed;
- request OpenSpec while Archify lock entry is absent;
- request Archify while OpenSpec lock entry is absent.

All four succeed when the requested entry/runtime is valid.

## Code gate

The repository's existing file-size gate was treated as a zero-regression constraint.

Current Change TypeScript surface against the pre-086 base:

- `src/domain/index.ts`: 12 lines;
- `src/domain/managed-tool-resolution.ts`: 430 lines;
- `tests/unit/domain/managed-tool-resolution.test.ts`: 355 lines;
- new/modified TypeScript files over 500 lines: none.

The pre-existing oversized baseline file `src/domain/run-result-persistence.ts` remains byte-identical at 588 lines. `src/domain/policy-and-next-boundary.ts` also remains byte-identical. No auxiliary refactor Change is required because this revision introduces no gate regression.

## Verification

- OpenSpec Apply state: `8/8 all_done`
- Focused managed-tool tests: `12/12 PASS`
- Complete domain tests: `91/91 PASS`
- TypeScript typecheck: PASS
- Repository format check: PASS
- OpenSpec Change strict validation: PASS
- OpenSpec validate all strict: `8/8 PASS`
- Real OpenSpec fixture resolution: PASS
- Real Archify fixture resolution: PASS
- On-demand OpenSpec-only fixture: PASS
- On-demand Archify-only fixture: PASS
- `package.json` / `pnpm-lock.yaml`: byte-identical to 086 Apply

## Boundary

`RA-087-001` is corrected with no Proposal/spec/design/task semantic change.

STOP at `review-apply` for independent re-review. No archive, checkpoint, Owner authority or Git authority is claimed.
