# Action — Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `normalize-foundation-contract-terminology`
- Action: `apply`
- Logical Run id: `20260828-124-apply`
- Role: `author`
- Input Run: `20260828-123-review-propose`
- Review chain start: `20260828-120-explore`
- Checkpoint base: `246a653`

## Approved boundary

Applied the 123-approved terminology-only Proposal using `openspec-apply-change` plus `implementation-convergence`.

This Change intentionally has no runtime implementation mechanism. The approved correction is already expressed by exactly two OpenSpec deltas:

1. `openspec-thin-integration`: one `RENAMED Requirements` operation removing the internal `V1` qualifier from the requirement heading;
2. `policy-and-next-boundary`: one complete `MODIFIED Requirements` operation changing only `Policy V1 SHALL` to `Policy SHALL` while preserving all predicates and four scenarios.

Apply does **not** directly edit canonical `openspec/specs/**`; canonical truth is materialized only by the later OpenSpec Archive boundary. Direct canonical editing here would duplicate the delta and violate the approved lifecycle. Instead, Apply used a disposable repository copy to run real OpenSpec `1.10.0` archive semantics and verify the exact future canonical result.

## Archive-semantics proof

Disposable archive simulation using real OpenSpec `1.10.0` produced:

- added: `0`;
- modified: `1`;
- removed: `0`;
- renamed: `1`;
- post-archive canonical strict validation: `10/10 PASS`;
- post-archive internal Flowkit `V1/V2/V3` terminology scan: `0` occurrences.

The renamed `openspec-thin-integration` requirement body plus its three scenarios is byte-identical after heading normalization. OpenSpec materializes renamed requirements at the end of the canonical file; that ordering movement is OpenSpec archive behavior and does not alter requirement content or semantics.

The `policy-and-next-boundary` Owner-correction requirement after simulation is exactly equal to the previous complete requirement after the single substitution `Policy V1 SHALL` → `Policy SHALL`; all other predicates and all four scenarios are unchanged.

## Boundary verification

No mutation was made to:

- `src/**`;
- `tests/**`;
- `package.json` / build configuration;
- `.agents/**`;
- `.flowkit/memos.json`;
- repository guidance;
- archived Change artifacts;
- prior `.flowkit/runs`.

Legitimate version facts such as OpenSpec `1.10.0`, Archify `2.15.0`, Node `22.23.2`, schema/package/serialization versions remain untouched. The separate future Full Test correction-model memo remains unchanged and is not part of this Change.

## Apply verification

- OpenSpec Apply progress: `5/5`, `all_done`;
- `pnpm typecheck`: PASS;
- `pnpm format:check`: PASS;
- `pnpm build`: PASS;
- domain tests: `116/116 PASS`;
- current Change strict validation: PASS;
- OpenSpec `validate --all --strict`: `11/11 PASS`;
- disposable post-archive canonical strict validation: `10/10 PASS`;
- product behavior change: NONE.

These are Author/Change Apply facts only. Formal Delivery Full Test remains deferred until this corrective Change is reviewed, archived, checkpointed, and separately authorized by Owner.

## Stop boundary

This Action stops at `review-apply`. No Archive, checkpoint, formal Delivery Full Test, Archify Final, Delivery Final, or Owner promotion is performed.
