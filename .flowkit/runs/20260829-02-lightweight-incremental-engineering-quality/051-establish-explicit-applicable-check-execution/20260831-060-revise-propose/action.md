# 060 Revise Propose — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `revise-propose`
- Run: `20260831-060-revise-propose`
- Role: `author`
- Corrected Reviewer input Run: `20260831-058-review-propose`
- Corrected Reviewer input archive SHA-256: `e98c928d237d6c65c1d2e2d1879c5a2ef00074a5eeee7795ef1d3215c0744760`
- Provenance-correction review Run: `20260831-059-review-propose`
- Provenance-correction review archive SHA-256: `733bca9318cef331c4e8cd9d30dc46eda2683730f0daeba5eff2dc58de33ff23`
- Git checkpoint claim: `d9399c7ee23cffe0ee3926236489135f87ffdd95`

## Skill used

```text
revise-propose
```

## RP-059-001 — durable review-chain provenance corrected

The Proposal bytes were already semantically approved by Reviewer 059. This run changes no Proposal/design/spec/tasks semantics.

The prior Author revise-propose Run incorrectly claimed that no Reviewer finding package had been supplied and referenced `20260831-057-propose` as its input. The actual Reviewer boundary that caused the revision was:

```text
20260831-058-review-propose
archive SHA-256:
e98c928d237d6c65c1d2e2d1879c5a2ef00074a5eeee7795ef1d3215c0744760
```

This run records that provenance explicitly. Reviewer 059 is retained separately as the review that detected and required this provenance correction.

## Actual Reviewer finding resolution

```text
RP-058-001
→ RESOLVED
→ tasks.md incorrectly included ignored paths in candidate material
```

The preserved corrected contract is:

```text
tracked paths
+
non-ignored untracked regular/symlink paths
+
tracked-deleted paths
-
.flowkit/runs/**
```

Ignored untracked material is absent from candidate identity.

## Bounded Author self-audit correction

Repository-root ownership is recorded separately from Reviewer finding numbering:

```text
ApplicableCheckPlanInput
→ required check declarations only

trusted Flowkit Action host
→ owns canonical repositoryRoot
→ candidate derivation
→ exact check execution cwd
```

This was accepted by Reviewer 059 and is not labeled `RP-058-001`.

## Proposal artifact preservation

The already-correct planning artifacts are preserved byte-for-byte:

```text
proposal.md
2827edbcd4f80180a5bea35a281e7ba42d7bec7844c685862410b961b5093f5a

design.md
09bec4535b20b7aa1a2bc7ad23db31cb5037e005715c54f163f520d540d05ece

spec.md
f46cff5eb1f26ab591f441c496beaf4ad98fdd0425be610820676dabc814df18

tasks.md
ceae2f3b1aabf26067dd392d6b211eb7b69a4c42418271b88c0ddd97656bd8d5
```

## Scope preservation

Unchanged:

- Flowkit host derives candidate identity; caller cannot supply reusable candidate/check/execution identity.
- Candidate identity includes path, kind, Git-visible mode, content/link target, and tracked deletion.
- `environmentRefs` remain part of `checkRef`.
- One closed `ApplicableCheckExecutionInput` / `executionInputRef` binds execution and admission.
- Reuse remains explicit prior-success only with exact `candidateRef + checkRef` equality.
- No Registry, Planner, Evidence Platform, cache/history scan, snapshot DB, temp Git index, or new authority surface.

## Validation

```text
Proposal/design/spec/tasks semantic bytes → UNCHANGED
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

No Apply, archive, next-Change activation, Delivery Formal Full Test, Git checkpoint, commit, push, or merge was performed.
