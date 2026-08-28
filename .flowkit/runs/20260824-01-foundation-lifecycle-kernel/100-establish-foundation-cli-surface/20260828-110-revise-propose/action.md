# Action — Revise Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Action: `revise-propose`
- Logical Run id: `20260828-110-revise-propose`
- Role: `author`
- Input Run: `20260828-109-review-apply`

## Owner-authorized correction

After 109 independently approved the implementation and returned `nextBoundary=archive`, Owner authorized a narrow pre-archive contract cleanup before canonicalization.

The correction removes unnecessary numbered/versioned CLI terminology from the current OpenSpec Change artifacts while preserving the already-approved functional behavior and implementation boundary.

No internal product/API version hierarchy is introduced. Future capability evolution remains ordinary OpenSpec Change evolution of the canonical contract.

## Artifact corrections

Updated only current OpenSpec Change documentation/specification wording:

- `explore.md`
- `proposal.md`
- `design.md`
- `specs/foundation-cli-surface/spec.md`

`tasks.md` remains behaviorally and textually unchanged because it contained no affected terminology.

The wording now describes the current approved Foundation CLI surface/boundary directly, without numbered product/API version labels.

## Preserved behavior

The correction does not change:

- `flowkit status | next | doctor` command set;
- explicit `currentRunId` exact-or-null authority model;
- prohibition on history-order current-Run inference;
- canonical Policy delegation;
- authorization-only checkpoint evaluator;
- managed OpenSpec/Archify diagnostics boundary;
- prohibition on Archify materialization, Git execution, Skill runtime dependency or self-hosting;
- build/bin surface or machine result semantics.

All production source, tests, package metadata and build configuration are byte-identical to the 109-approved implementation.

## Historical evidence

Runs 100–109 are preserved unchanged, including 109 `review-apply` approval. This correction does not rewrite earlier historical wording.

## Verification

- OpenSpec planning: `4/4 complete`
- Apply tasks: `13/13 all_done`
- current Change strict: PASS
- OpenSpec all strict: `10/10 PASS`
- typecheck: PASS
- domain tests: `116/116 PASS`
- production build: PASS
- format check: PASS
- production implementation hash comparison vs 109-approved implementation: IDENTICAL
- current Change artifacts contain no numbered/versioned CLI terminology: PASS

## Next boundary

`review-propose`

Independent review MUST confirm the wording cleanup did not change the approved behavior and that the existing implementation still conforms before archive.
