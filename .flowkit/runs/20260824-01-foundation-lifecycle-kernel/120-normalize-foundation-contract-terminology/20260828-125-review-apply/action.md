# Action — Review Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `normalize-foundation-contract-terminology`
- Action: `review-apply`
- Logical Run id: `20260828-125-review-apply`
- Role: `reviewer`
- Input Run: `20260828-124-apply`
- Review chain start: `20260828-120-explore`
- Checkpoint base: `246a653`

## Review boundary

Reviewer independently checked 124 against the approved 123 Proposal/Apply guidance and the retained review chain.

The approved Change has no runtime implementation mechanism. Its complete product correction is carried by exactly two OpenSpec deltas:

1. `openspec-thin-integration`: one requirement rename removing the internal `V1` qualifier from the heading;
2. `policy-and-next-boundary`: one complete modified requirement changing only `Policy V1 SHALL` to `Policy SHALL` while retaining all predicates and four scenarios.

Apply therefore should not directly edit canonical `openspec/specs/**`; Archive is the boundary that materializes those delta semantics into canonical specs.

## Independent payload-diff proof

Reviewer compared the exact accepted `123-review-propose.zip` input with 124.

Observed existing-artifact delta:

- `openspec/changes/normalize-foundation-contract-terminology/tasks.md`: only the five approved task checkboxes changed from `[ ]` to `[x]`;
- proposal: byte-identical;
- design: byte-identical;
- both delta specs: byte-identical;
- delivery-group manifest: byte-identical;
- Runs 120 through 123: byte-identical;
- new durable material: Run 124 only.

No source, tests, package/build, skills, memo, repository-guidance, canonical-spec, archive-history or prior-Run path is present as an Apply mutation in the handoff.

## Independent OpenSpec proof

Using managed OpenSpec `1.10.0`, reviewer independently checked the supplied Change:

- `openspec validate normalize-foundation-contract-terminology --strict`: PASS;
- parsed delta count: `2`;
- parsed operations: exactly `1 RENAMED + 1 MODIFIED`;
- renamed requirement target: `V1 exposes only two closed read-only observations` → `Exposes only two closed read-only observations`;
- modified Owner-correction requirement contains the normalized `Policy SHALL` wording and all four previously approved scenarios;
- `openspec status --change normalize-foundation-contract-terminology --json`: planning complete and Apply complete.

This independently confirms that Apply did not mutate or broaden the approved Change representation while marking the five bounded tasks complete.

## Scope/convergence review

124 remains inside the 123 hard boundary:

- no new capability;
- no behavior/API/runtime implementation;
- no replacement V2/V3 hierarchy;
- no `skip_specs` bypass;
- no Full Test correction/finalization semantics;
- no memo mutation;
- no canonical direct edit before Archive;
- no archive/checkpoint/Delivery Full Test/Archify Final/Delivery Final/Owner promotion performed.

The Author explicitly stops at `review-apply`, as required.

## Reviewer limitation

The exact full checkpoint repository `246a653` is not embedded in this delta handoff. Reviewer therefore did not independently rerun the Author-recorded `pnpm typecheck`, format, build, `116/116` domain suite, or a full canonical archive simulation against that exact repository in this turn.

This is non-blocking for Apply approval because:

- 121 already independently proved the executable candidate and exact two-token semantic-preserving transform;
- 123 independently validated the Proposal delta shape;
- 124's exact handoff diff from accepted 123 changes no implementation or approved delta content, only completion state plus the new Apply Run;
- reviewer independently revalidated the current Change with the actual OpenSpec `1.10.0` parser.

## Verdict

`approved`

No blocking Apply finding remains. The Change is ready for the normal Owner-authorized OpenSpec Archive boundary.

## Archive boundary guidance

Archive MUST:

1. materialize exactly the approved `1 RENAMED + 1 MODIFIED` delta into canonical specs;
2. preserve every requirement predicate/scenario except the two approved internal `V1` qualifiers;
3. validate canonical specs strictly after archive;
4. leave the separate Full Test memo and Full Test semantics untouched;
5. only after successful archive proceed to the normal checkpoint boundary;
6. keep formal Delivery Full Test deferred until the archived corrective Change has a new exact checkpoint candidate and explicit Owner authorization.

## Non-claims

- Reviewer did not edit Author Apply artifacts or canonical specs.
- No Archive, checkpoint, formal Delivery Full Test, Verification PASS, Archify Final, Delivery Final or Owner promotion was performed.
