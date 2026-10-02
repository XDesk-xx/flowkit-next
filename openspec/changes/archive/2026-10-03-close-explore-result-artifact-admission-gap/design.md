## Context

See `proposal.md` and `explore.md`. The existing Result record accepts Action-specific `facts` as JSON. `action finish` currently validates planning hashes for Propose but does not validate successful Explore's two dedicated fields; `review-explore` reads those fields directly. MenDi's already-confirmed Run has only the exact Explore entry in `artifactHashes`, and the saved Run cannot be rewritten. Three unrelated Delivery Run sequence edits are already present in the working tree and must be preserved.

## Goals / Non-Goals

**Goals:** Make success-result admission and next Review readiness agree on the exact Explore file; recover the bounded legacy shape by checking existing bytes at read time.

**Non-Goals:** Change the general Run schema, scan unrelated historical Runs, migrate MenDi, infer Reviewer approval, install a new manager, or alter Delivery sequence behavior.

## Decisions

1. **One narrow identity validator, two modes.** Place the Explore path and SHA validation next to existing artifact-hash checks. The write mode requires both dedicated fields and validates them before the first machine-file write. The read mode first uses a complete dedicated pair; only when both fields are absent on an already-confirmed terminal successful Explore predecessor does it inspect `artifactHashes`. If a complete dedicated pair and an `artifactHashes` Explore entry coexist, they must identify the same exact file and SHA. Sharing the exact-file check prevents the two entry points from drifting again. A broad Result schema change would reject the already-confirmed legacy record before Review can reach the compatibility rule.
2. **Exact semantic Change path.** Construct `openspec/changes/<changeId>/explore.md` from the trusted current target/Result identity. When `artifactHashes` supplies Explore entries, count every key ending in `/explore.md`; require exactly one and exact equality with that constructed path. Validate its hash and actual file through the existing no-link, regular-file, SHA checker. Other hash entries remain inert for this specific Review decision. Accepting any basename match or choosing the first map entry would let another Change's Explore file authorize Review.
3. **No retrospective write.** `review-explore` resolves identity only in memory, then performs its existing proof checks. `action finish` never uses the fallback. This preserves create-once Run bytes and ensures future successful Authors supply the explicit handoff fields. A migration would introduce unnecessary write authority over confirmed history.
4. **Keep the diff apart from sequence work.** Modify only the Explore-specific checks in `action-commands.ts` and `action-readiness.ts`, plus the narrow helper and tests. Apply must retain and inspect the unrelated existing diff rather than reset or overwrite it.

## Risks / Trade-offs

- **Historical file drift or link substitution** → Read-time validation refuses Review; it does not silently trust a stored hash or rewrite history.
- **A legacy Result with a different undocumented shape** → Compatibility deliberately rejects it. Only the proven MenDi-shaped input is in scope.
- **Concurrent working-tree edits** → Keep the pre-existing three-file diff intact and verify the final diff by path and hunk before Review.

## Migration Plan

After Apply review, package and verify the candidate separately, then update the fixed local manager only under a distinct installation instruction. Retry MenDi `review-explore` under its current independent Reviewer boundary; the manager must reread the preserved Result and current file. No target file migration or automatic Review execution is part of this Change's Apply.
