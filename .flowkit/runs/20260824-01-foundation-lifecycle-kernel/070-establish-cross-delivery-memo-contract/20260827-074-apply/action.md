# Action — Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-cross-delivery-memo-contract`
- Action: `apply`
- Logical Run id: `20260827-074-apply`
- Role: `author`
- Input Run: `20260827-073-review-propose`
- Checkpoint base: `2cc6a6c0cdcad771ed7d5503c1e7197ffee553d3`

## Execution

Reviewer approved the Proposal in Run 073 and the user explicitly requested Apply using the repository OpenSpec apply skill plus Flowkit `implementation-convergence`.

The implementation remains inside the approved bounded Memo contract:

- add a closed project Memo domain model with `open | promoted | dismissed`, exact state/resolution validation and optional null/Delivery/Change/Run provenance;
- reuse existing `SemanticId`, canonical Run occurrence parsing and a newly exported existing Owner-ref validator instead of duplicating identity/authority grammars;
- require structural-valid existing Owner authority with exact `create-memo | promote-memo | dismiss-memo` decision and exact single-Memo scope; promotion additionally binds exact authority Delivery/Change to the caller-supplied target;
- add fixed project persistence at `.flowkit/memos.json` with missing-as-empty reads, closed fail-closed validation, deterministic memoId ordering and same-directory temporary replacement;
- expose only create/get/list-open/promote/dismiss; no defer mutation, reopen, registry, database, index, WAL or locking framework;
- keep Memo outside StandardAction, CurrentAction, Run/Result, ActionPackage and Policy; Memo writes do not create Runs or STOP boundaries;
- promotion records only an already-established caller target and does not create or modify Delivery/OpenSpec artifacts.

## Convergence / size gate

- `src/domain/run-result-persistence.ts` remains byte-identical to base at 588 lines;
- `src/domain/policy-and-next-boundary.ts` remains byte-identical to base at 438 lines;
- new Memo domain module: 287 lines;
- new Memo persistence module: 154 lines;
- new focused test modules: 246 and 191 lines;
- no new/modified TypeScript file exceeds 500 lines;
- no auxiliary refactor Change was triggered because the approved Memo implementation does not require modifying either baseline-large module.

## Verification

- OpenSpec Apply tasks: `8/8 complete` / `all_done`
- TypeScript typecheck: PASS
- Domain tests: `79/79 PASS` (63 baseline + 16 new/extended checks)
- Repository format check: PASS
- Change strict validation: PASS
- OpenSpec validate all strict: `7/7 PASS`
- existing Policy and Run persistence responsibility: unchanged
- `package.json` / `pnpm-lock.yaml`: unchanged

## Boundary

Apply stops here. No Reviewer verdict, formal Verification PASS, Archive, checkpoint or Git authority is claimed.
