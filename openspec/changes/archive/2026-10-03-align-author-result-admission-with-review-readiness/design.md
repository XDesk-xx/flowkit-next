## Context

See `proposal.md` and the added `stable-action-command-execution` requirement. The fixed finish path admits the Result and checks candidate artifacts before create-once writing `context.json` and `result.json`. `review-propose` already observes planning completion and rechecks declared planning hashes; `review-apply` already rechecks generic candidate hashes. A started Run has only `action.md`, so a finish-side check must not depend on a query that requires this Run to be a complete canonical chain member.

## Goals / Non-Goals

**Goals:** Reject an incomplete new successful Propose or Apply candidate at the producer boundary, and retain the Review check on current bytes. Keep all checks before the first terminal machine-file write.

**Non-Goals:** Rewrite or migrate historical Results, require every delta spec file to appear in Propose hashes, constrain Apply to a new path allowlist, guarantee files remain unchanged after finish, or introduce an artifact registry, new lifecycle state, or automated Review.

## Decisions

### 1. Reuse narrow artifact validators at finish

Extend the existing finish artifact check for terminal Author `PASS` only. Apply and Revise Apply use the same `checkArtifactHashes` function as `review-apply`, including its nonempty map and byte checks. Propose and Revise Propose keep `checkPlanningArtifactHashes` for the declared allowlisted entries and add an exact presence check for the current Change's `proposal.md`, `design.md`, and `tasks.md` keys. The existing hash checker then proves these three files are regular, readable, non-linked, and unchanged. This avoids a second path interpreter.

An alternative is to tighten `checkPlanningArtifactHashes` for every caller. That would also change `review-propose` admission for immutable older Results, which this Change does not require. Keep the required-trio check on the new finish path while Review retains its current read contract.

### 2. Observe planning completeness without reading the prepared Run chain

Use `observeOpenSpecChangeStatus` with the exact target and installed manager to require `isPlanningComplete` during successful Propose finish. Pass the current `ManagerInstallation` into the finish-side check; do not call `resolveActionContext` from that check because it also resolves canonical Runs and may encounter the valid in-progress `action.md`. Managed-tool failure or incomplete planning prevents terminal writes. The three required hashes establish file readability, while Reviewer start retains its existing separate `readableFiles` and observation checks.

An alternative is to reuse all of `packageReadiness("review-propose")` during finish. That function also demands a completed Author predecessor and Reviewer context, which do not exist at this point, so its whole boundary is unsuitable for producer admission.

### 3. Preserve retry and historical semantics

Place the new checks after existing Result admission and before proof closure and the first terminal file write. Keep the complete same-value duplicate-finish readback path unchanged; it must not reclassify historical complete Runs using a new-write rule. Limit the checks to terminal Author `PASS`; existing Author `FAIL`, nonterminal outcomes, proof checks, Policy and create-once behavior remain intact. Reviewer start continues to detect later file or planning drift independently.

## Risks / Trade-offs

- **Additional managed OpenSpec call during successful Propose finish** → Use the installed exact runtime and the narrow status observation; failure is reported before terminal writes, leaving the prepared Run available for a legitimate retry.
- **The required Propose trio is stricter for new Results than historical Review input** → Keep Review's legacy read rule and immutable Result bytes unchanged; test both new-write rejection and old-read compatibility.
- **A valid Result can still become unreadable before Review through external mutation** → Retain Review rereads and report current drift; finish-time checks only establish acceptance at the time of writing.
- **Uncommitted Delivery Run sequence edits share `action-commands.ts`** → Keep the implementation hunk limited to the finish validation call and preserve those unrelated edits during Apply and any later checkpoint.

## Migration Plan

No Run migration. After Apply and independent review, a separately authorized package update can replace the installed manager; already confirmed Results remain byte-identical. Rollback, if needed, uses a previously known exact package rather than rewriting target Runs.
