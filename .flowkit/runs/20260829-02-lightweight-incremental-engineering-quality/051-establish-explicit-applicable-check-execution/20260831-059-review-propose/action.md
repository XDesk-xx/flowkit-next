# 059 Review Propose — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `review-propose`
- Run: `20260831-059-review-propose`
- Role: `reviewer`
- Input artifact: `d02-058-revise-propose-author.zip`
- Review chain start: `20260831-051-explore`

## Semantic Proposal review

The revised Proposal content is now converged.

The prior Reviewer finding:

```text
RP-058-001
→ tasks.md 2.1 incorrectly said ignored paths were candidate material
```

is semantically resolved.

The revised task now correctly requires:

```text
tracked paths
+
non-ignored untracked regular/symlink paths
+
tracked-deleted paths
-
.flowkit/runs/**
```

and explicitly verifies ignored untracked material is absent.

This matches:
- approved 055 Explore;
- approved 056 Review Explore;
- revised proposal.md;
- revised design.md;
- revised applicable-check-execution spec.

## Additional Author self-audit correction — ACCEPTED

Author also corrected a real ambiguity that already conflicted with the approved Explore:

```text
ApplicableCheckPlanInput
→ required check declarations only

trusted Flowkit Action host
→ owns canonical repositoryRoot
```

Reviewer accepts this correction.

It does not add a new capability or authority surface. It removes caller/formal-plan authority to redirect candidate derivation or exact check execution to another repository root.

The spec now correctly rejects caller repository-root override.

## Independent validation

Reviewer independently verified:

```text
artifact SHA claims
→ PASS

OpenSpec 1.10.0
current Change --strict
→ PASS

production mutation
→ NONE

package/lock mutation
→ NONE
```

No semantic Proposal blocker remains.

## Blocking workflow finding

### RP-059-001 — revise-propose Run does not consume the actual 058 Reviewer handoff

Although the revised Proposal content resolves the previous Reviewer issue, the durable Author Run records the wrong provenance.

The supplied Author Run states:

```text
inputRunId
→ 20260831-057-propose

inputArchiveSha256
→ eb319bfdc2308749b9907dec83598c8c412165633cb227c3b1ab2a13e2d5b833
```

That SHA is the 057 Author Proposal archive.

But the actual preceding lifecycle boundary is:

```text
20260831-058-review-propose
→ CHANGES REQUESTED
```

whose Reviewer archive SHA-256 is:

```text
e98c928d237d6c65c1d2e2d1879c5a2ef00074a5eeee7795ef1d3215c0744760
```

The Author action.md also states:

```text
"No Reviewer finding package was supplied."
```

which is false for the actual chain.

It then reuses Reviewer-style finding numbering for its self-audit:
- Author labels repository-root ambiguity `RP-058-001`;
- actual Reviewer `RP-058-001` is the ignored-path contradiction;
- Author labels the ignored-path correction `RP-058-002`.

This makes durable finding provenance ambiguous even though the resulting Proposal bytes are correct.

For Flowkit, Run/Result is the durable action handoff surface. A revise action must not silently sever the Reviewer input that caused the revision.

## Required smallest revise-propose

Do NOT change Proposal/design/spec/tasks semantics again unless needed only to preserve current bytes.

Create one clean subsequent Author `revise-propose` Run that:

1. Uses the actual prior Reviewer Run:
   ```text
   inputRunId = 20260831-058-review-propose
   ```
2. Records:
   ```text
   inputReviewerArchiveSha256 = e98c928d237d6c65c1d2e2d1879c5a2ef00074a5eeee7795ef1d3215c0744760
   ```
   or the canonical equivalent field already used by this project.
3. Records actual Reviewer finding:
   ```text
   RP-058-001
   → RESOLVED
   → ignored-path task contradiction
   ```
4. Records repository-root ownership correction separately as:
   ```text
   bounded Author self-audit correction
   ```
   without reusing `RP-058-001`.
5. Preserves the already-correct revised Proposal artifacts and hashes.
6. Uses the next unique Run number rather than reusing `58`.

No new Explore, Proposal redesign, Change, dependency, subsystem, or proof branch is required.

## Complexity assessment

```text
semantic capability complexity
→ unchanged

caller authority
→ reduced

new subsystem
→ none

new runtime state
→ none

new Registry / Planner / cache / history store
→ none
```

This review request is only about durable review-chain correctness.

## Verdict

```text
changes-requested
```

## Next boundary

```text
revise-propose
```

Reviewer did not Apply, mutate Proposal semantics, activate another Change, archive, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
