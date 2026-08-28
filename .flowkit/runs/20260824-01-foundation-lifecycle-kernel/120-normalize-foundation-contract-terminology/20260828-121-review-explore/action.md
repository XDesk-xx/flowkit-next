# Action — Review Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `normalize-foundation-contract-terminology`
- Action: `review-explore`
- Logical Run id: `20260828-121-review-explore`
- Role: `reviewer`
- Input Run: `20260828-120-explore`
- Review chain start: `20260828-120-explore`

## Review boundary

Reviewer independently checked 120 under the repository `review-explore` discipline.

The review verified:

- `normalize-foundation-contract-terminology` is the only active required Change after the preceding cross-platform acceptance Change is completed;
- the Owner `activate-change` authority fact is structurally coherent for this Change;
- 120 mutates only Delivery activation, the Change scaffold/Explore artifact, and its durable Run;
- 120 does not mutate production source, tests, package/build configuration, canonical specs, `.agents/**`, repository guidance, or `.flowkit/memos.json`;
- the separately recorded Full Test correction/finalization memo remains outside this Change;
- archived Change artifacts and prior `.flowkit/runs` are historical evidence and are explicitly excluded from terminology rewriting;
- legitimate external/runtime/schema versions remain out of scope.

## Verdict

`approved`

No blocking Explore finding remains. The Change is ready for Proposal.

## Independent canonical replay

The exact checkpoint archive `246a653` named by 120 was not supplied in this review turn. Reviewer therefore independently reconstructed the current canonical specification state from the retained full checkpoint and accepted Change material, replaying actual OpenSpec `1.10.0` archive semantics in historical order:

1. accepted Cross-Delivery Memo archive;
2. accepted Managed Toolchain archive;
3. accepted OpenSpec Thin Integration archive;
4. accepted Foundation CLI archive using the Owner-authorized 110/111 terminology-cleaned CLI planning;
5. accepted cross-platform acceptance archive with `--skip-specs`.

Result:

- canonical capability count: `10`;
- OpenSpec `validate --all --strict`: `10/10 PASS`.

This replay matters because raw Change delta specs are not canonical main-spec files; reviewer used real archive semantics rather than copying delta files directly.

## Independent terminology scan

Against the correctly replayed canonical `openspec/specs/**`, exactly two remaining Flowkit-internal V-number occurrences exist:

1. `openspec-thin-integration`
   - `### Requirement: V1 exposes only two closed read-only observations`

2. `policy-and-next-boundary`
   - `Policy V1 SHALL 仅识别 decision == "revise-action" ...`

No third canonical Flowkit-internal `V1/V2/V3` occurrence remains.

Reviewer specifically checked the historical Foundation CLI case: the older Apply spec contained `Foundation V1`, but that wording was already removed by the Owner-authorized 110/111 terminology cleanup before CLI archive and therefore is not present in the current canonical CLI spec.

## Independent semantic-preservation proof

Reviewer applied only the two proposed textual transforms to a copy of the canonical specs:

- `Requirement: V1 exposes only two closed read-only observations`
  → `Requirement: Exposes only two closed read-only observations`;

- `Policy V1 SHALL 仅识别`
  → `Policy SHALL 仅识别`.

Observed diff:

- exactly one requirement heading line changed in `openspec-thin-integration`;
- exactly one sentence token changed in `policy-and-next-boundary`;
- all requirement bodies, normative SHALL/MUST predicates, action/decision literals, blocked reasons and scenarios otherwise remain unchanged.

After those two changes:

- residual canonical internal V-number scan: NONE;
- OpenSpec `validate --all --strict`: `10/10 PASS`.

## Correct OpenSpec delta mechanism proof

Reviewer additionally proved the Proposal can represent the correction using supported OpenSpec `1.10.0` delta semantics without inventing behavior changes.

### Heading-only correction

For `openspec-thin-integration`, use:

```text
## RENAMED Requirements

FROM: Requirement: V1 exposes only two closed read-only observations
TO:   Requirement: Exposes only two closed read-only observations
```

This is a name-only requirement rename.

### Requirement-body correction

For `policy-and-next-boundary`, use:

```text
## MODIFIED Requirements
```

and include the full existing `Owner correction is bounded, explicit and revise-only` requirement with the single `Policy V1` → `Policy` wording change and all existing scenarios preserved.

Reviewer created exactly those two deltas and independently ran:

- Change strict validation: PASS;
- parsed delta count: `2`;
- operations: `1 RENAMED + 1 MODIFIED`;
- archive: PASS;
- post-archive canonical strict validation: `10/10 PASS`.

Therefore no broader terminology migration or product implementation is necessary.

## Independent production/regression check

Reviewer reconstructed the accepted executable candidate and verified:

- production/test scan contains no Flowkit product `V1/V2/V3` behavior branch tied to these phrases;
- Node proof fixture: `22.23.2`;
- typecheck: PASS;
- format check: PASS;
- production build: PASS;
- complete domain suite: `116/116 PASS`.

This supports the Explore claim that the correction is canonical-spec wording only.

## Proposal hard boundaries

1. Modify exactly two existing canonical capabilities through delta specs:
   - `openspec-thin-integration`;
   - `policy-and-next-boundary`.

2. Use the correct delta operations:
   - requirement heading change → `RENAMED Requirements`;
   - sentence/body change → `MODIFIED Requirements` with the complete existing requirement and scenarios.

3. Do NOT set `skip_specs: true`; this Change intentionally changes canonical spec wording.

4. Plan no mutation to:
   - `src/**`;
   - `tests/**`;
   - package/build configuration;
   - `.agents/**`;
   - `.flowkit/memos.json`;
   - repository guidance;
   - Full Test execution semantics.

5. Do not rewrite:
   - archived Change artifacts;
   - prior `.flowkit/runs`;
   - historical reviewer/author wording.

6. Preserve legitimate version facts:
   - OpenSpec `1.10.0`;
   - Archify `2.15.0`;
   - Node `22.23.2` fixture/compatibility facts;
   - Memo `formatVersion`;
   - package/schema/serialization/vendor versions.

7. Do not create a replacement V2/V3 hierarchy or a new product/API version model.

8. If Proposal discovers any actual behavior or requirement-predicate change beyond removing these two qualifiers, STOP and re-scope rather than expanding this corrective Change.

9. Formal Full Test remains deferred until:
   `this corrective Change archive → new exact checkpoint candidate → explicit Owner Full Test authorization`.

## Review limitation

The exact checkpoint archive `flowkit-next-delivery-20260824-01-foundation-lifecycle-kernel-246a653.zip` and the separately referenced `memo-full-test-correction.zip` were not supplied in this review turn, so their exact archive SHA/Git revision/memo-document SHA were not independently re-hashed.

This is non-blocking to Proposal readiness because:

- 120 carries no memo mutation;
- the material canonical spec state was independently reconstructed using real OpenSpec archive semantics;
- the exact two terminology occurrences, semantic-preserving transforms, supported delta operations and executable candidate regression were independently reproduced.

## Non-claims

- Reviewer did not modify Author Explore artifacts or canonical specs.
- No Proposal/spec delta, Apply, Archive, checkpoint, formal Full Test, Verification PASS, Archify Final, Delivery Final or Owner promotion was performed.
