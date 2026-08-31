# 055 Revise Explore — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `revise-explore`
- Run: `20260831-055-revise-explore`
- Role: `author`
- Input reviewer Run: `20260831-054-review-explore`
- Base checkpoint: `d9399c7ee23cffe0ee3926236489135f87ffdd95`

## Revision scope

This revision addresses only:

```text
RE-054-001
→ candidate identity must include materially Git-visible executable/file mode
```

Reviewer 054's accepted 053 decisions remain frozen.

## Revised candidate material

The one-shot candidate manifest now includes canonical Git-visible mode/kind
identity in addition to path and content/link-target digest.

For the bounded D02 contract, the mode material must distinguish at least:

```text
100644
100755
120000
tracked deletion
```

Tracked files use staged Git mode plus any Git-visible worktree mode override,
so an unstaged executable-bit change is not hidden by reading the index alone.
Untracked regular files derive canonical `100644/100755` from their worktree
executable bit; unsupported mode/kind/read failures fail closed.

No temp index, candidate snapshot DB, history store, registry, or Git-authority
subsystem is introduced.

## Decisive counterexample

Disposable Git repository with `core.filemode=true`:

```text
check.sh bytes unchanged
100755 → 100644

git diff --summary
→ mode change 100755 => 100644 check.sh

candidateRef before = 50c1e8fbb02fcfa13f2278edfd78e92374670e175d593cf3c8e1b3b52e1153f4
candidateRef after  = d33654cd7ac0c9f35a7b6d7d5f6d1608ef3afe785837754edb6075f6348678f4

candidateRef changed = true
prior same-check PASS reusable = false
```

This closes the remaining material-identity gap without reopening
`environmentRefs`, `executionInputRef`, runner, Result facts, or authority
separation.

## Verification

- targeted Foundation ActionPackage/RunResult/single-action tests: `28/28 PASS`
- canonical OpenSpec specs strict: `13/13 PASS`
- current Change remains Explore-only; Proposal/spec/design/tasks are absent
- production/package/lock mutation: `NONE`
- `git diff --check`: `PASS`

## Result

```text
PASS
→ review-explore
```

No Proposal or Apply was performed.
