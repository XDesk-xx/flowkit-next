# 058 Revise Propose — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `revise-propose`
- Run: `20260831-058-revise-propose`
- Role: `author`
- Input: `20260831-057-propose`
- Input archive SHA-256: `eb319bfdc2308749b9907dec83598c8c412165633cb227c3b1ab2a13e2d5b833`
- Git checkpoint claim: `d9399c7ee23cffe0ee3926236489135f87ffdd95`

## Skill used

```text
revise-propose
```

## Self-revision findings

No Reviewer finding package was supplied. Author performed a bounded Proposal self-audit against the approved 056 Explore model and found two contract inconsistencies.

### RP-058-001 — repository root ownership was ambiguous

057 design said the raw `ApplicableCheckPlanInput` accepted `repositoryRoot`, while the approved Explore also states that the canonical repository root is already owned by the trusted Flowkit Action execution host.

Allowing a plan-level root would reopen a trust ambiguity:

```text
structurally valid plan
+
caller-selected repositoryRoot
→ candidate/check execution could be redirected away from the current repository
```

Correction:

```text
ApplicableCheckPlanInput
→ required check declarations only

trusted Flowkit Action host
→ owns canonical repositoryRoot
→ candidate derivation
→ repository-root cwd for exact execution
```

The spec now explicitly rejects caller/formal-plan repository-root override.

### RP-058-002 — ignored-path task wording contradicted the spec

057 task 2.1 said candidate enumeration covered `ignored` paths while the same task expected ignored material to be absent. The approved spec/design require tracked paths plus non-ignored untracked material.

Correction:

```text
tracked paths
+
non-ignored untracked regular/symlink paths
+
tracked deletion
-
.flowkit/runs/**
```

Ignored untracked material remains absent.

## Scope preservation

Unchanged from 056/057:

- Flowkit derives current candidate identity; caller cannot supply reusable candidate/check/execution identity.
- Candidate identity includes path, kind, Git-visible mode, content/link target, and tracked deletion.
- `environmentRefs` remain in check identity.
- One closed `ApplicableCheckExecutionInput` / `executionInputRef` binds execution and admission.
- Reuse remains explicit prior-success only with exact candidateRef + checkRef equality.
- No Registry, Planner, Evidence Platform, cache/history scan, snapshot DB, temp Git index, or new authority surface.

## Validation

```text
OpenSpec current Change strict → PASS
OpenSpec --all --strict → PASS 14/14
git diff --check HEAD → PASS
production mutation → NONE
package/lock mutation → NONE
Apply → NOT STARTED
```

## Conclusion

```text
PASS
→ review-propose
```

No Apply, archive, next-Change activation, Delivery Full Test, Git checkpoint, commit, push, or merge was performed.
