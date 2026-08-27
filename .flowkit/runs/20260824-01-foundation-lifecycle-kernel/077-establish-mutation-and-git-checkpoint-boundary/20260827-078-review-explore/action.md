# Action — Review Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-mutation-and-git-checkpoint-boundary`
- Action: `review-explore`
- Logical Run id: `20260827-078-review-explore`
- Role: `reviewer`
- Input Run: `20260827-077-explore`

## Review boundary

Reviewer executed the repository `review-explore` skill and independently checked:

- 077 activation authority and Change state;
- current accepted source baseline reconstructed from the available checkpoint/materialized Apply chain;
- Node 22.23.2 typecheck, complete domain tests and repository format;
- OpenSpec 1.10.0 canonical specs after replaying the immediately preceding Memo archive;
- repository-path and Git-observation decisions from 077;
- checkpoint composition across multiple real Standard Action Runs in one Change.

## Verdict

`changes-requested`

One blocking Explore finding remains.

### RE-078-001 — per-Run MutationDeclaration is not yet composable into a Change checkpoint

077 proposes:

- one sorted unique exact-path `MutationDeclaration`;
- bound to one exact Standard Action Run occurrence;
- checkpoint scope evaluation by comparing observed Git candidate paths against the exact declaration.

That is sufficient for one Action's local mutation scope, but it is not sufficient for the actual checkpoint boundary.

A Git checkpoint observes the accumulated working-tree mutation since the previous checkpoint, while one Change is executed through multiple Run occurrences:

`explore → review-explore → propose → review-propose → apply → review-apply → archive`

Reviewer replayed the real preceding Memo Change (`070` through `075`) from a clean checkpoint base.

Observed facts:

- final Git candidate paths after 070→075: `32`;
- files introduced by the final `075-review-apply` Run itself: `3`;
- paths that would be falsely out-of-scope if checkpoint used only the current Run declaration: `29`.

Therefore a checkpoint cannot safely validate the accumulated Change diff against only the current/archive Run's declaration.

The opposite shortcut is also unsafe:

`observe final Git diff → let the archive Run declare every observed path`

because that makes the declaration retroactive and lets observed mutation expand its own allowed scope.

#### Required revise-explore boundary

Keep the existing exact-file/per-Run model, but decide the minimum lifecycle needed to make it real:

1. A mutation declaration MUST be fixed before the mutation it scopes; it MUST NOT be inferred or expanded from post-mutation Git observation.
2. The declaration must remain recoverable/durable enough for the later checkpoint boundary; an ephemeral in-memory declaration is insufficient across Author/Reviewer handoff and archive.
3. Checkpoint mutation-scope evaluation must cover the accumulated candidate set since the previous checkpoint by:
   - the deterministic union of the relevant pre-fixed per-Run declarations for the exact Change, or
   - an equivalent bounded pre-authorized Change/checkpoint scope that cannot be created retroactively.
4. Any observed candidate path not covered by the applicable pre-fixed scope remains fail closed.

Do not add glob/regex selectors, WAL, locks, database, rollback, scheduler, multi-Agent coordination or a Git wrapper.

The exact durable representation may be chosen in Proposal after Explore fixes the lifecycle/trust boundary; Reviewer is not prescribing a fourth stable Run file.

## Non-blocking confirmed decisions

- Canonical repository paths may allow legitimate root dotfiles and hidden project paths while rejecting `.git`, traversal, absolute paths, backslashes and obvious Windows-invalid names.
- V1 exact file paths are sufficient; no selector/glob subsystem is required.
- `git status --porcelain=v1 -z --untracked-files=all` can observe modified/deleted/untracked worktree candidates without `git add`.
- Existing Policy `ready-checkpoint-evaluation` should be reused rather than duplicating Archive ordering.
- Checkpoint eligibility, Owner authorization and actual Git execution are distinct.
- Existing `OwnerAuthorityFact` is sufficient structurally; checkpoint permission requires an exact semantic `authorize-checkpoint` match.
- Verification/check facts may contribute eligibility but never mint Git authority.
- Actual Git add/commit remains a later host/CLI integration responsibility.

## Non-claims

- Reviewer did not modify Author Explore artifacts.
- No Proposal/spec/design/tasks or production implementation was created.
- No Git operation was executed on the project repository.
- No Verification PASS, checkpoint authorization or Owner authority is created by this review.
