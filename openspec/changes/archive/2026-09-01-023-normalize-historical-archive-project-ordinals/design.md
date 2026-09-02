## Context

See `proposal.md` for motivation. The accepted Explore/Review Explore establishes four implementation facts that shape this design:

1. exactly seven date-only archives remain and their historical `projectOrdinal` mapping is already provable as `014..020`;
2. each old archive path has exactly three durable archive-Run references (`action.md`, `context.json`, `result.json`), for 21 durable references total;
3. two additional old-path assertions exist in `tests/unit/domain/author-action-guidance.test.ts`;
4. the same test file also contains one lifecycle-transient test that hard-codes named Change state and `next === 23`, while the stable ordinal helper tests already prove the durable allocation semantics.

The repository already has migration precedent in Git commit `985e9725bdd4656ce064083387b1817a5723a251`, which normalized earlier archive paths by exact rename plus exact durable-reference convergence.

## Goals / Non-Goals

**Goals:**

- normalize only the seven proven historical archive paths to their accepted ordinals `014..020`;
- preserve historical identity by updating only references that directly encode those paths;
- make the ordinal focused tests durable across legal lifecycle transitions;
- restore a clean test baseline before `converge-reviewer-action-guidance` begins.

**Non-Goals:**

- no renumbering of `021`, `022`, current `023`, or any already-numbered archive;
- no inference from Run sequence, physical Run-group prefix, array position, archive count, or `changeStartSequence`;
- no Core allocator/registry/migration subsystem;
- no Reviewer Guidance convergence;
- no Git history rewrite;
- no product spec or architecture change.

## Decisions

### 1. Use an explicit proven mapping, not runtime inference

Apply will use the already-proven immutable mapping:

```text
014 establish-trusted-change-coordination-state-binding
015 establish-lightweight-incremental-engineering-gate
016 establish-structural-dependency-health-fitness
017 establish-high-confidence-repository-entropy-hygiene
018 correct-openspec-observation-process-failure-portability
019 establish-explicit-applicable-check-execution
020 establish-action-guidance-execution-contract
```

Rationale: this is historical normalization, so the source of identity must be accepted durable history rather than a newly invented derivation algorithm.

Alternative rejected: derive ordinals from current directory ordering or Delivery array position. Those surfaces are not the ordinal authority and could silently rewrite historical identity.

### 2. Perform exact path rename plus exact reference convergence

For each of the seven targets:

```text
openspec/changes/archive/YYYY-MM-DD-<changeId>
→
openspec/changes/archive/YYYY-MM-DD-<ordinal>-<changeId>
```

Then update only the exact old-path strings in the corresponding archive Run `action.md`, `context.json`, and `result.json`, plus the two existing focused-test path assertions.

Rationale: Reviewer proof found no wider tracked dependency on the old paths, and the repository already uses this migration shape.

Alternative rejected: generic repository-wide migration/rewrite tooling. The bounded reference surface does not justify it.

### 3. Split durable ordinal semantics from repository-history assertions

The permanent unit test must not depend on which named Change is currently `active`, which future Change remains `planned`, or a hard-coded next ordinal tied to the current phase.

Keep stable semantic proof in synthetic fixtures, including:

```text
positive integer assigned ordinals
unique assigned ordinals
planned-only entries reserve nothing
cancelled-after-Explore entries keep their consumed ordinal
next assignment = max(durable assigned ordinals) + 1
malformed / duplicate facts fail closed
```

Repository-history assertions may separately prove immutable normalized facts such as the existence of `014..020` archive names and absence of their date-only predecessors.

Rationale: lifecycle transitions are expected behavior; durable unit invariants must survive them.

Alternative rejected: update the current test literals from `active` to `completed` or from `next === 23` to another current number. That would preserve the defect and fail again at the next legal transition.

### 4. Preserve current dependency environment

This Change does not modify dependency-resolution inputs. Apply and verification should reuse the supplied detached dependency snapshot and invoke direct local tools when the underlying command semantics permit it; no pnpm install/relink/repair is part of this Change.

## Risks / Trade-offs

- **[Risk] Incorrect historical mapping could rewrite archive identity.** → Mitigation: use only the approved `014..020` mapping and fail if source/target path preconditions differ from proof.
- **[Risk] A path reference could be missed.** → Mitigation: search exact old path strings before and after mutation; after convergence each old path must have zero tracked references.
- **[Risk] Test cleanup could accidentally weaken ordinal coverage.** → Mitigation: retain existing synthetic fail-closed/uniqueness/allocation cases and add immutable normalization assertions rather than deleting ordinal proof wholesale.
- **[Trade-off] Historical paths remain mutable repository bytes even though Git preserves prior names.** → Accepted: this is an explicit bounded normalization Change; Git retains the pre-normalization history and no product truth is derived from Archify or Run prose.

## Migration Plan

1. Verify the seven source directories exist and their seven ordinal-bearing target directories do not already exist.
2. Rename the seven archive directories using the approved `014..020` mapping.
3. Update exactly the 21 durable archive-Run path references.
4. Replace the two old-path test assertions with normalized historical assertions.
5. Replace the lifecycle-transient named-state/`next === 23` test with stable fixture-based proof while preserving existing ordinal coverage.
6. Search for all seven old path strings; require zero remaining tracked references.
7. Run focused ordinal tests, relevant domain checks, OpenSpec strict validation, and repository text-hygiene checks appropriate to the changed surface.
8. STOP for `review-apply`; do not activate Reviewer Guidance.

Rollback, if required before acceptance, is the exact inverse path rename plus reference reversion within this Change. No historical Git rewrite is needed.
