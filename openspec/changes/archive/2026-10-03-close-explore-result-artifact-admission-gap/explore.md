# Explore: close the Explore Result artifact admission gap

## Real use and authority boundary

Owner requests an independent manager Change. MenDi's completed `20261002-012-explore` Run is immutable input: do not edit its `action.md`, `context.json`, `result.json`, or proof. The manager must let a later `review-explore` read that Result only when its existing `artifactHashes` proves the exact Explore artifact, and must reject future incomplete successful Explore Results at `action finish`. Review retry follows a verified manager release and the target's separate Reviewer boundary.

This independent OpenSpec Change has no Delivery identity or canonical Flowkit Action. This document is bounded investigation, not a fabricated Flowkit Run or Reviewer verdict. The pre-existing uncommitted Delivery sequence edits in `src/cli/action-commands.ts`, `src/cli/current-run-chain.ts`, and `tests/unit/domain/delivery-run-sequence.test.ts` belong to separate work and must be preserved.

## Decisive facts

- MenDi's `D:\Projects\MenDi\.flowkit\runs\20261002-01-engineering-foundation-and-trusted-workflow-core\012-establish-identity-role-and-authorization-contract\20261002-012-explore\result.json` is a terminal Author `PASS` with `nextBoundary: "review-explore"`. Its observed SHA-256 is `5d37fe28f39107c9b4947174482466b6552837720ac1607ebe98d737531ecf3c`.
- `facts.exploreArtifact` and `facts.exploreSha256` are both absent. `facts.artifactHashes` has exactly one key ending in `/explore.md`: `openspec/changes/establish-identity-role-and-authorization-contract/explore.md`. Its declared SHA-256 `a40f8f2b323548d5b9a9b653f9dcaae5a8dcff68f287764dd9fd5e8b04563244` matches the current regular file bytes. Other keys identify the Change metadata and Delivery manifest.
- `src/domain/run-result-persistence.ts` admits structurally valid, JSON-compatible `facts` without Action-specific Explore fields. `src/cli/action-commands.ts` checks the Explore `projectOrdinal`, generic admission, planning results, and proof closure before its create-once terminal write, but has no Explore artifact identity check. `src/cli/action-readiness.ts` requires the two dedicated fields only when `review-explore` starts. Thus an incomplete terminal Result can be confirmed and then block its next legal Review.
- Existing CLI fixtures provide both dedicated fields, so they do not exercise this missing-field boundary. `action finish` and `review-explore` must be covered together by a focused counterexample and acceptance test during Apply.

## Contract questions resolved for Proposal

1. **Legacy read:** Only a terminal successful `explore` or `revise-explore` Result lacking both dedicated fields may use the compatibility path. Derive the exact expected project-root-relative path from the Result's own semantic `changeId`; require a single Explore-path entry in `artifactHashes`, exact path equality, a valid SHA-256, and current regular, non-linked bytes matching that SHA through the existing artifact checker. Conflicting or partial dedicated fields, ambiguous Explore entries, wrong Change/path, missing file, and hash drift fail closed. The saved Result bytes remain untouched; this is a read-time resolution for Review, not a migration or a fresh Author Result.
2. **New write:** A future terminal `PASS` for `explore` or `revise-explore` must provide `exploreArtifact` and `exploreSha256`, match the current semantic Change's exact `openspec/changes/<changeId>/explore.md`, and pass the same file/hash check before `action finish` creates `context.json` or `result.json`. A generic `artifactHashes` entry cannot substitute on this write path. Real `FAIL` and nonterminal outcomes retain their existing contracts.
3. **Later Review:** `review-explore` uses the dedicated identity when valid, or the strictly verified legacy identity above. It still checks the predecessor's declared proof references and all existing role, Run, Policy, and package constraints. Compatibility does not infer Reviewer approval.

## Boundary and limitations

The minimum change belongs to existing `action finish` admission and `review-explore` readiness, with a shared narrow Explore artifact identity checker, OpenSpec delta, and focused regression tests. No Run schema rewrite, migration, generic artifact registry, retroactive validation of every historical Result, or target-project mutation is authorized. The current MenDi artifact matches its recorded hash at investigation time; later Review must recheck current bytes. A passing local test does not update the fixed manager installation or authorize the MenDi Review invocation.

**Explore conclusion: PASS for Proposal readiness.** Source and the immutable real Result establish the admission gap and a bounded compatibility rule. Implementation correctness and release compatibility remain for Apply and independent Review.
