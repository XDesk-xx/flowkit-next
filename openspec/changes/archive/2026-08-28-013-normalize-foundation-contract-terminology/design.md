## Context

See `proposal.md`. Reviewer 121 independently proved that the current canonical spec set contains exactly two Flowkit-internal V-number qualifiers and that OpenSpec `1.10.0` can archive the correction using one requirement rename plus one full modified requirement without changing behavior.

## Goals / Non-Goals

**Goals:**
- express the correction with the smallest OpenSpec delta supported by the existing canonical capabilities;
- preserve every normative predicate and scenario except the two unnecessary internal-version qualifiers;
- make the post-archive canonical contracts no longer imply a V1/V2/V3 product/API hierarchy.

**Non-Goals:**
- production source/test/package/build changes;
- Full Test correction/finalization semantics or memo promotion;
- repository guidance cleanup;
- rewriting archived Changes, prior Runs, or historical wording;
- changing legitimate external/runtime/schema/package version facts.

## Decisions

1. **Use `RENAMED Requirements` for the OpenSpec observation heading.**
   The only change is the requirement name, so a rename is more precise than copying the entire unchanged requirement as MODIFIED. Alternative rejected: broad MODIFIED delta, because it would create unnecessary archive churn.

2. **Use `MODIFIED Requirements` for the Policy sentence.**
   The requirement name is unchanged but its normative body contains `Policy V1`; OpenSpec requires the complete existing requirement and all scenarios under MODIFIED. Alternative rejected: direct canonical edit, because canonical OpenSpec truth must change through the active Change lifecycle.

3. **Do not normalize historical or legitimate version facts.**
   The target is only the two current canonical internal-version qualifiers. History remains immutable evidence; external/tool/schema/package versions remain factual identity data.

4. **No implementation mechanism is required.**
   Explore and Reviewer proof found no runtime branch, API discriminator, or compatibility behavior tied to these phrases. Apply therefore consists only of the two delta-spec wording changes plus normal Change history.

## Risks / Trade-offs

- **Risk: a partial MODIFIED requirement could drop scenarios during archive.** → Copy the complete existing Owner-correction requirement block and verify strict OpenSpec validation before review.
- **Risk: broad search-and-replace could alter historical or legitimate versions.** → Limit Apply to the two approved delta operations and verify `src/**`, tests, memo and historical archives remain unchanged.
- **Risk: terminology cleanup is mistaken for a behavior change.** → Diff post-archive semantics and run existing regression gates; any predicate or scenario change beyond the two qualifiers requires stop/re-scope.
